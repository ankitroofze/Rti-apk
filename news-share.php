<?php
/**
 * RTI Voice — shareable news link: https://rtinews.in/news/<id>
 *
 * 1) WhatsApp / Facebook / Telegram crawlers receive full Open Graph meta tags
 *    (og:image, og:video, og:title, og:description) => rich card preview with image/video is displayed.
 *    When GD is available, og:image serves the news image with the RTI logo composited at top-left.
 * 2) Real users are served the SPA (index.html) => opens the news directly.
 * 3) Mobile devices with app installed open deep link.
 */
error_reporting(0);
ini_set('display_errors', '0');

$API   = 'https://189.72.144.238/api/api';
$SITE  = 'https://rtinews.in';
$index = __DIR__ . '/index.html';

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function fetch_url_bytes($url, $accept = '*/*', $timeout = 8) {
    if (empty($url)) return '';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: ' . $accept]);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($raw && $code >= 200 && $code < 400) return $raw;
    }
    $ctx = stream_context_create([
        'http' => ['timeout' => $timeout, 'header' => "Accept: {$accept}\r\n"],
        'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    return $raw ?: '';
}

function fetch_news_by_id($id, $api) {
    if ($id === '' || !ctype_digit($id)) return null;
    $raw = fetch_url_bytes($api . '/news/' . $id, 'application/json', 6);
    if (!$raw) return null;
    $j = json_decode($raw, true);
    if (!is_array($j)) return null;
    return $j['news'] ?? $j['data'] ?? (isset($j['id']) ? $j : null);
}

function resolve_share_media($url, $site) {
    $u = trim((string)$url);
    if (empty($u)) return '';
    if (preg_match('#^https?://#i', $u)) {
        // Rewrite raw IP storage url to public domain /storage-proxy/ so WhatsApp crawlers can access without SSL/CORS errors
        return preg_replace('#^https?://189\.72\.144\.238(?::\d+)?/storage/#i', rtrim($site, '/') . '/storage-proxy/', $u);
    }
    $clean = ltrim($u, '/');
    if (strpos($clean, 'storage/') === 0) {
        return rtrim($site, '/') . '/storage-proxy/' . substr($clean, 8);
    }
    return rtrim($site, '/') . '/storage-proxy/' . $clean;
}

function resolve_backend_media($url) {
    $u = trim((string)$url);
    if (empty($u)) return '';
    if (preg_match('#^https?://#i', $u)) return $u;
    $clean = ltrim($u, '/');
    if (strpos($clean, 'storage/') === 0) {
        return 'https://189.72.144.238/' . $clean;
    }
    return 'https://189.72.144.238/storage/' . $clean;
}

function draw_share_logo_gd($dst, $logoSrc) {
    $w = imagesx($dst);
    $h = imagesy($dst);
    if ($w <= 0 || $h <= 0) return;

    $size = max(36, (int)round($w * 0.095));
    if ($size > (int)round(min($w, $h) * 0.35)) {
        $size = max(24, (int)round(min($w, $h) * 0.22));
    }
    $pad = max(6, (int)round($w * 0.0125));
    $r = $size / 2.0;
    $cx = $pad + $r;
    $cy = $pad + $r;

    $white = imagecolorallocate($dst, 255, 255, 255);
    $border = imagecolorallocatealpha($dst, 0, 0, 0, 112);
    imagefilledellipse($dst, (int)round($cx), (int)round($cy), $size, $size, $white);
    imageellipse($dst, (int)round($cx), (int)round($cy), $size, $size, $border);

    $inner = $r - max(2.0, $size * 0.035);
    $lw = imagesx($logoSrc);
    $lh = imagesy($logoSrc);
    if ($lw <= 0 || $lh <= 0 || $inner <= 2) return;

    $s = min(($inner * 2.0) / $lw, ($inner * 2.0) / $lh);
    $dw = max(1, (int)round($lw * $s));
    $dh = max(1, (int)round($lh * $s));

    $scaled = imagecreatetruecolor($dw, $dh);
    imagefill($scaled, 0, 0, imagecolorallocate($scaled, 255, 255, 255));
    imagecopyresampled($scaled, $logoSrc, 0, 0, 0, 0, $dw, $dh, $lw, $lh);

    $lx = (int)round($cx - $dw / 2.0);
    $ly = (int)round($cy - $dh / 2.0);
    $ir = (int)floor($inner);
    $r2 = $inner * $inner;
    for ($dy = -$ir; $dy <= $ir; $dy++) {
        $py = (int)round($cy) + $dy;
        $sy = $py - $ly;
        if ($py < 0 || $py >= $h || $sy < 0 || $sy >= $dh) continue;
        $half = (int)floor(sqrt(max(0.0, $r2 - $dy * $dy)));
        $xStart = max(0, $lx, (int)round($cx) - $half);
        $xEnd = min($w - 1, $lx + $dw - 1, (int)round($cx) + $half);
        if ($xEnd >= $xStart) {
            imagecopy($dst, $scaled, $xStart, $py, $xStart - $lx, $sy, $xEnd - $xStart + 1, 1);
        }
    }
    imagedestroy($scaled);
}

$gdAvailable = function_exists('imagecreatefromstring') && function_exists('imagecreatetruecolor') && function_exists('imagejpeg');
$logoPath = __DIR__ . '/assets/images/certificate_logo.jpg';
$hasLogo = is_file($logoPath);

// Match /news/123 or /reel/123 (with optional query string)
$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
$id = '';
if (isset($_GET['id']) && ctype_digit((string)$_GET['id'])) {
    $id = (string)$_GET['id'];
} elseif (preg_match('#/(?:news|reel)/([^/?#]+)#i', $path, $m)) {
    $id = urldecode($m[1]);
}

$news = fetch_news_by_id($id, $API);

// ── Serve OG preview image with RTI logo at top-left corner ──────────────────
if (isset($_GET['og_img'])) {
    $rawImg = '';
    if (is_array($news)) {
        $rawImg = $news['image'] ?? ($news['images'][0] ?? ($news['media'] && !preg_match('#\.(mp4|webm|mov|3gp)$#i', $news['media']) ? $news['media'] : ''));
    }
    $publicImg = resolve_share_media($rawImg, $SITE);
    $backendImg = resolve_backend_media($rawImg);

    if (!$publicImg) {
        http_response_code(404);
        exit;
    }
    if (!$gdAvailable || !$hasLogo) {
        header('Location: ' . $publicImg, true, 302);
        exit;
    }

    $bytes = fetch_url_bytes($backendImg, 'image/*', 8);
    if (!$bytes && $publicImg !== $backendImg) {
        $bytes = fetch_url_bytes($publicImg, 'image/*', 8);
    }
    $dst = $bytes ? @imagecreatefromstring($bytes) : false;
    if (!$dst) {
        header('Location: ' . $publicImg, true, 302);
        exit;
    }

    if (function_exists('imagepalettetotruecolor')) {
        @imagepalettetotruecolor($dst);
    }
    if (function_exists('exif_read_data') && function_exists('imagerotate')) {
        $exif = @exif_read_data('data://image/jpeg;base64,' . base64_encode($bytes));
        $ori = (int)($exif['Orientation'] ?? 1);
        if ($ori === 3) $dst = imagerotate($dst, 180, 0);
        elseif ($ori === 6) $dst = imagerotate($dst, -90, 0);
        elseif ($ori === 8) $dst = imagerotate($dst, 90, 0);
    }

    $logoBytes = @file_get_contents($logoPath);
    $logoImg = $logoBytes ? @imagecreatefromstring($logoBytes) : false;
    if ($logoImg) {
        draw_share_logo_gd($dst, $logoImg);
        imagedestroy($logoImg);
    }

    header('Content-Type: image/jpeg');
    header('Cache-Control: public, max-age=86400');
    imagejpeg($dst, null, 90);
    imagedestroy($dst);
    exit;
}

$html = is_file($index) ? file_get_contents($index) : '<!doctype html><html><head></head><body></body></html>';

if (is_array($news)) {
    $title = trim((string)($news['title'] ?? $news['headline'] ?? $news['tittle'] ?? 'RTI Voice News'));
    $desc  = trim(strip_tags((string)($news['description'] ?? $news['excerpt'] ?? $news['subtitle'] ?? $news['sub_tittle'] ?? '')));
    $desc  = mb_substr($desc, 0, 200);

    // Image & Video
    $rawImg = $news['image'] ?? ($news['images'][0] ?? ($news['media'] && !preg_match('#\.(mp4|webm|mov|3gp)$#i', $news['media']) ? $news['media'] : ''));
    $rawVid = is_array($news['video'] ?? null)
        ? ($news['video']['uri'] ?? '')
        : ($news['branded_video'] ?? ($news['media'] && preg_match('#\.(mp4|webm|mov|3gp)$#i', $news['media']) ? $news['media'] : ($news['video'] ?? '')));

    $image = resolve_share_media($rawImg, $SITE);
    $ogImage = ($image && $gdAvailable && $hasLogo)
        ? ($SITE . '/news-share.php?og_img=1&id=' . rawurlencode($id) . '&v=2')
        : $image;
    $video = resolve_share_media($rawVid, $SITE);
    $url   = $SITE . '/news/' . rawurlencode($id);

    $tags  = "\n    <title>" . h($title) . " | RTI Voice</title>\n";
    $tags .= '    <meta property="og:site_name" content="RTI Voice" />' . "\n";
    $tags .= '    <meta property="og:type" content="' . ($video ? 'video.other' : 'article') . '" />' . "\n";
    $tags .= '    <meta property="og:title" content="' . h($title) . '" />' . "\n";
    $tags .= '    <meta property="og:description" content="' . h($desc) . '" />' . "\n";
    $tags .= '    <meta property="og:url" content="' . h($url) . '" />' . "\n";

    if ($ogImage) {
        $tags .= '    <meta property="og:image" content="' . h($ogImage) . '" />' . "\n";
        $tags .= '    <meta property="og:image:secure_url" content="' . h($ogImage) . '" />' . "\n";
        if ($ogImage === $image) {
            $tags .= '    <meta property="og:image:width" content="1200" />' . "\n";
            $tags .= '    <meta property="og:image:height" content="630" />' . "\n";
        }
        $tags .= '    <meta property="og:image:type" content="image/jpeg" />' . "\n";
        $tags .= '    <meta name="twitter:card" content="summary_large_image" />' . "\n";
        $tags .= '    <meta name="twitter:image" content="' . h($ogImage) . '" />' . "\n";
    }
    if ($video) {
        $tags .= '    <meta property="og:video" content="' . h($video) . '" />' . "\n";
        $tags .= '    <meta property="og:video:secure_url" content="' . h($video) . '" />' . "\n";
        $tags .= '    <meta property="og:video:type" content="video/mp4" />' . "\n";
        $tags .= '    <meta property="og:video:width" content="1280" />' . "\n";
        $tags .= '    <meta property="og:video:height" content="720" />' . "\n";
    }
    $tags .= '    <meta name="twitter:title" content="' . h($title) . '" />' . "\n";
    $tags .= '    <meta name="twitter:description" content="' . h($desc) . '" />' . "\n";

    $html = preg_replace('#<title>.*?</title>#is', '', $html);
    $html = preg_replace('#<meta[^>]+property=["\']og:[^>]*>\s*#i', '', $html);
    $html = preg_replace('#<meta[^>]+name=["\']twitter:[^>]*>\s*#i', '', $html);
    $html = preg_replace('#<head([^>]*)>#i', '<head$1>' . $tags, $html, 1);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=300');
echo $html;
