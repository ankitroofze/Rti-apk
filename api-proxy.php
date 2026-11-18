<?php
/**
 * RTI News - API Reverse Proxy for Production (Plesk / IIS / Apache / Nginx)
 * Handles /api-proxy/* requests and forwards them to https://189.72.144.238/api/api/*
 * Solves CORS issues seamlessly without requiring IIS ARR or Nginx reverse proxy configuration.
 */

error_reporting(0);
ini_set('display_errors', '0');
ini_set('upload_max_filesize', '50M');
ini_set('post_max_size', '50M');
ini_set('memory_limit', '256M');
ini_set('max_execution_time', '300');

$TARGET_BASE = 'https://189.72.144.238/api/api';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With, Origin, X-HTTP-Method-Override");
header("Access-Control-Max-Age: 86400");

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (strtoupper($method) === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 1. Resolve Endpoint
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'] ?? '';
$queryString = $parsedUrl['query'] ?? '';

$endpoint = '';
if (isset($_GET['__proxy_endpoint']) && strlen(trim($_GET['__proxy_endpoint'])) > 0) {
    $endpoint = $_GET['__proxy_endpoint'];
} elseif (preg_match('#^/api-proxy(?:/(.*))?$#i', $path, $m)) {
    $endpoint = $m[1] ?? '';
} else {
    $endpoint = $path;
}

$endpoint = ltrim($endpoint, '/');
// Guard: prevent resolving to .php or api-proxy.php
if ($endpoint === '.php' || $endpoint === 'api-proxy.php') {
    $endpoint = '';
}
$targetUrl = rtrim($TARGET_BASE, '/') . ($endpoint !== '' ? '/' . $endpoint : '');

if (!empty($queryString)) {
    parse_str($queryString, $queryParams);
    unset($queryParams['__proxy_endpoint']);
    $rebuiltQuery = http_build_query($queryParams);
    if (!empty($rebuiltQuery)) {
        $targetUrl .= '?' . $rebuiltQuery;
    }
}

// 2. Init cURL
$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_TIMEOUT, 300);
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);

// 3. Forward Incoming Headers
$requestHeaders = [];
if (function_exists('getallheaders')) {
    $allHeaders = getallheaders();
} else {
    $allHeaders = [];
    foreach ($_SERVER as $key => $val) {
        if (substr($key, 0, 5) === 'HTTP_') {
            $headerName = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
            $allHeaders[$headerName] = $val;
        }
    }
}

// FastCGI / IIS Header Fixes:
if (!empty($_SERVER['CONTENT_TYPE']) && empty($allHeaders['Content-Type']) && empty($allHeaders['content-type'])) {
    $allHeaders['Content-Type'] = $_SERVER['CONTENT_TYPE'];
}
if (empty($allHeaders['Authorization']) && empty($allHeaders['authorization'])) {
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $allHeaders['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $allHeaders['Authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['AUTHORIZATION'])) {
        $allHeaders['Authorization'] = $_SERVER['AUTHORIZATION'];
    }
}

$isMultipart = false;
$hasContentType = false;
foreach ($allHeaders as $name => $value) {
    $lower = strtolower($name);
    if (in_array($lower, ['host', 'content-length', 'expect', 'connection', 'transfer-encoding'])) {
        continue;
    }
    if ($lower === 'content-type') {
        $hasContentType = true;
        if (stripos($value, 'multipart/form-data') !== false) {
            $isMultipart = true;
            continue; // let cURL handle boundary
        }
    }
    $requestHeaders[] = "{$name}: {$value}";
}
// Disable Expect: 100-continue which causes IIS / WAF to 417 / 403
$requestHeaders[] = 'Expect:';

// 4. Forward Request Body
if (!in_array($method, ['GET', 'HEAD', 'OPTIONS'])) {
    if ($isMultipart && (!empty($_POST) || !empty($_FILES))) {
        $postData = $_POST;
        foreach ($_FILES as $fileKey => $fileInfo) {
            if (is_array($fileInfo['name'])) {
                foreach ($fileInfo['name'] as $idx => $fname) {
                    if (!empty($fileInfo['tmp_name'][$idx])) {
                        $postData["{$fileKey}[{$idx}]"] = new CURLFile(
                            $fileInfo['tmp_name'][$idx],
                            $fileInfo['type'][$idx],
                            $fname
                        );
                    }
                }
            } else {
                if (!empty($fileInfo['tmp_name'])) {
                    $postData[$fileKey] = new CURLFile(
                        $fileInfo['tmp_name'],
                        $fileInfo['type'],
                        $fileInfo['name']
                    );
                }
            }
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    } else {
        $rawInput = file_get_contents('php://input');
        if ($rawInput !== false && strlen($rawInput) > 0) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $rawInput);
            $requestHeaders[] = 'Content-Length: ' . strlen($rawInput);
            if (!$hasContentType) {
                $requestHeaders[] = 'Content-Type: application/json';
            }
        }
    }
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);

// 5. Execute Request
$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Proxy Error',
        'message' => curl_error($ch),
        'target' => $targetUrl
    ]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($httpCode);

// Forward response headers
$headerLines = explode("\r\n", $rawHeaders);
foreach ($headerLines as $line) {
    if (empty($line) || stripos($line, 'HTTP/') === 0) continue;
    $lower = strtolower($line);
    if (stripos($lower, 'transfer-encoding:') === 0 ||
        stripos($lower, 'content-length:') === 0 ||
        stripos($lower, 'connection:') === 0 ||
        stripos($lower, 'access-control-') === 0 ||
        stripos($lower, 'cache-control:') === 0 ||
        stripos($lower, 'pragma:') === 0 ||
        stripos($lower, 'etag:') === 0) {
        continue;
    }
    header($line, false);
}

// Ensure browser never caches dynamic API responses
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

echo $body;

