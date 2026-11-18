<?php
/**
 * RTI Voice — shareable news link: https://rtinews.in/news/<id>
 *
 * 1) WhatsApp / Facebook / Telegram crawlers receive full Open Graph meta tags
 *    (og:image, og:video, og:title, og:description) => rich card preview with image/video is displayed.
 * 2) Real users are served the SPA (index.html) => opens the news directly.
 * 3) Mobile devices with app installed open deep link.
 */
error_reporting(0);
ini_set('display_errors', '0');

$API   = 'https://189.72.144.238/api/api';
$SITE  = 'https://rtinews.in';
$index = __DIR__ . '/index.html';

// Match /news/123 or /reel/123 (with optional query string)
$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
$id = '';
if (preg_match('#/(?:news|reel)/([^/?#]+)#i', $path, $m)) {
    $id = urldecode($m[1]);
}

$html = is_file($index) ? file_get_contents($index) : '<!doctype html><html><head></head><body></body></html>';

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

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

$news = null;
if ($id !== '' && ctype_digit($id)) {
    // 1. Try cURL with SSL verify false (handles IP self-signed SSL smoothly)
    if (function_exists('curl_init')) {
        $ch = curl_init($API . '/news/' . $id);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
        $raw = curl_exec($ch);
        curl_close($ch);
        if ($raw) {
            $j = json_decode($raw, true);
            $news = $j['news'] ?? $j['data'] ?? (isset($j['id']) ? $j : null);
        }
    }
    // 2. Fallback to stream context with SSL verify false
    if (!$news) {
        $ctx = stream_context_create([
            'http' => ['timeout' => 5, 'header' => "Accept: application/json\r\n"],
            'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
        ]);
        $raw = @file_get_contents($API . '/news/' . $id, false, $ctx);
        if ($raw) {
            $j = json_decode($raw, true);
            $news = $j['news'] ?? $j['data'] ?? (isset($j['id']) ? $j : null);
        }
    }
}

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
    $video = resolve_share_media($rawVid, $SITE);
    $url   = $SITE . '/news/' . rawurlencode($id);

    $tags  = "\n    <title>" . h($title) . " | RTI Voice</title>\n";
    $tags .= '    <meta property="og:site_name" content="RTI Voice" />' . "\n";
    $tags .= '    <meta property="og:type" content="' . ($video ? 'video.other' : 'article') . '" />' . "\n";
    $tags .= '    <meta property="og:title" content="' . h($title) . '" />' . "\n";
    $tags .= '    <meta property="og:description" content="' . h($desc) . '" />' . "\n";
    $tags .= '    <meta property="og:url" content="' . h($url) . '" />' . "\n";

    if ($image) {
        $tags .= '    <meta property="og:image" content="' . h($image) . '" />' . "\n";
        $tags .= '    <meta property="og:image:secure_url" content="' . h($image) . '" />' . "\n";
        $tags .= '    <meta property="og:image:width" content="1200" />' . "\n";
        $tags .= '    <meta property="og:image:height" content="630" />' . "\n";
        $tags .= '    <meta property="og:image:type" content="image/jpeg" />' . "\n";
        $tags .= '    <meta name="twitter:card" content="summary_large_image" />' . "\n";
        $tags .= '    <meta name="twitter:image" content="' . h($image) . '" />' . "\n";
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
