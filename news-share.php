<?php
/**
 * RTI News — shareable news link:  https://rtinews.in/news/<id>
 *
 *  1) WhatsApp / Facebook / Telegram crawler ko news ke OG tags milte hain
 *     (title, description, image, video) => link preview me news ki image / video dikhti hai.
 *  2) Insaan ko wahi SPA (index.html) milta hai => web par news seedha khulti hai.
 *  3) Mobile par app installed ho to Android App Link / iOS Universal Link app me seedha kholta hai
 *     (app.json intentFilters + .well-known/assetlinks.json — README me).
 *
 * Deploy: is file ko `rtinews.in` ke root (index.html ke saath) rakho, aur web.config me
 * `NewsShare` rule (neeche web.config.snippet.xml) add karo.
 */
error_reporting(0);
ini_set('display_errors', '0');

$API   = 'https://rtiapi.roofze.in/api';
$SITE  = 'https://rtinews.in';
$index = __DIR__ . '/index.html';

// /news/123  ya  /news/123?ref=CODE
$path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
if (!preg_match('#/news/([^/?#]+)#', $path, $m)) { $id = ''; } else { $id = urldecode($m[1]); }

$html = is_file($index) ? file_get_contents($index) : '<!doctype html><html><head></head><body></body></html>';

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

$news = null;
if ($id !== '' && ctype_digit($id)) {
    $ctx = stream_context_create(['http' => ['timeout' => 4, 'header' => "Accept: application/json\r\n"]]);
    $raw = @file_get_contents($API . '/news/' . $id, false, $ctx);   // public endpoint (token ki zaroorat nahi — agar token chahiye to isi ko apne public share endpoint se badlo)
    if ($raw) {
        $j = json_decode($raw, true);
        $news = $j['news'] ?? $j['data'] ?? (isset($j['id']) ? $j : null);
    }
}

if (is_array($news)) {
    $title = trim((string)($news['title'] ?? 'RTI News'));
    $desc  = trim(strip_tags((string)($news['description'] ?? $news['excerpt'] ?? $news['subtitle'] ?? '')));
    $desc  = mb_substr($desc, 0, 200);
    $image = $news['image'] ?? ($news['images'][0] ?? '');
    $video = is_array($news['video'] ?? null) ? ($news['video']['uri'] ?? '') : ($news['branded_video'] ?? $news['video'] ?? '');
    $url   = $SITE . '/news/' . rawurlencode($id);

    $tags  = "\n    <title>" . h($title) . " | RTI News</title>\n";
    $tags .= '    <meta property="og:site_name" content="RTI News" />' . "\n";
    $tags .= '    <meta property="og:type" content="' . ($video ? 'video.other' : 'article') . '" />' . "\n";
    $tags .= '    <meta property="og:title" content="' . h($title) . '" />' . "\n";
    $tags .= '    <meta property="og:description" content="' . h($desc) . '" />' . "\n";
    $tags .= '    <meta property="og:url" content="' . h($url) . '" />' . "\n";
    if ($image) {
        $tags .= '    <meta property="og:image" content="' . h($image) . '" />' . "\n";
        $tags .= '    <meta name="twitter:card" content="summary_large_image" />' . "\n";
        $tags .= '    <meta name="twitter:image" content="' . h($image) . '" />' . "\n";
    }
    if ($video && preg_match('#^https://#i', $video)) {
        $tags .= '    <meta property="og:video" content="' . h($video) . '" />' . "\n";
        $tags .= '    <meta property="og:video:secure_url" content="' . h($video) . '" />' . "\n";
        $tags .= '    <meta property="og:video:type" content="video/mp4" />' . "\n";
    }
    $tags .= '    <meta name="twitter:title" content="' . h($title) . '" />' . "\n";
    $tags .= '    <meta name="twitter:description" content="' . h($desc) . '" />' . "\n";

    // purane default title / og tags hatao, naye daalo
    $html = preg_replace('#<title>.*?</title>#is', '', $html);
    $html = preg_replace('#<meta[^>]+property=["\']og:[^>]*>\s*#i', '', $html);
    $html = preg_replace('#<meta[^>]+name=["\']twitter:[^>]*>\s*#i', '', $html);
    $html = preg_replace('#<head([^>]*)>#i', '<head$1>' . $tags, $html, 1);
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=300');
echo $html;