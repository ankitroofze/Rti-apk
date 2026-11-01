const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, 'out');
const outZip = path.join(rootDir, 'out.zip');

console.log('[prepare-plesk-build] Starting Plesk build preparation...');

if (!fs.existsSync(distDir)) {
  console.error('[prepare-plesk-build] dist directory does not exist. Run npm run build first.');
  process.exit(1);
}

// 1. Clean & recreate out folder
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// 2. Copy dist -> out
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
copyRecursive(distDir, outDir);
console.log('[prepare-plesk-build] Copied dist files into out/');

// 2b. Ensure out/index.html has <base href="/" /> and root-absolute paths for deep route refreshes
const outIndexHtmlPath = path.join(outDir, 'index.html');
if (fs.existsSync(outIndexHtmlPath)) {
  let html = fs.readFileSync(outIndexHtmlPath, 'utf8');

  // Insert or update <base href="/" />
  const baseTag = '<base href="/" />';
  const baseMetaRe = /<base\s+[^>]*href=(["'])(.*?)\1[^>]*\/?>/i;
  if (baseMetaRe.test(html)) {
    html = html.replace(baseMetaRe, baseTag);
  } else {
    const charsetRe = /<meta\s+charset=(["']).*?\1\s*\/?>/i;
    if (charsetRe.test(html)) {
      html = html.replace(charsetRe, (tag) => `${tag}\n    ${baseTag}`);
    } else {
      html = html.replace(/<head(\s[^>]*)?>/i, (tag) => `${tag}\n    ${baseTag}`);
    }
  }

  // Enforce root-absolute asset paths
  html = html.replaceAll('"assets/', '"/assets/');
  html = html.replaceAll("'assets/", "'/assets/");
  html = html.replaceAll('"_expo/', '"/_expo/');
  html = html.replaceAll("'_expo/", "'/_expo/");
  html = html.replaceAll('"favicon.ico', '"/favicon.ico');
  html = html.replaceAll("'favicon.ico", "'/favicon.ico");
  html = html.replaceAll('src="./', 'src="/');
  html = html.replaceAll('href="./', 'href="/');
  html = html.replaceAll('"//_expo/', '"/_expo/');
  html = html.replaceAll('"//assets/', '"/assets/');

  fs.writeFileSync(outIndexHtmlPath, html, 'utf8');
  console.log('[prepare-plesk-build] Verified root-absolute paths and <base href="/" /> in out/index.html');
}

// 3. Write web.config for IIS Windows Plesk
const webConfigContent = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
        <add value="index.php" />
      </files>
    </defaultDocument>

    <rewrite>
      <rules>
        <!-- Rule 1: Forward API calls to PHP proxy (Bypasses CORS without needing IIS ARR server-level proxy) -->
        <rule name="ApiProxy" stopProcessing="true">
          <match url="^api-proxy(/.*)?$" />
          <action type="Rewrite" url="api-proxy.php?__proxy_endpoint={R:1}" appendQueryString="true" />
        </rule>

        <!-- Rule 2: Exclude physical files and directories from SPA rewrite -->
        <rule name="StaticFiles" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAny">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" />
          </conditions>
          <action type="None" />
        </rule>

        <!-- Rule 3: Single Page Application (SPA) routing fallback to root /index.html -->
        <rule name="SPARoutes" stopProcessing="true">
          <match url=".*" />
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>

    <staticContent>
      <!-- Ensure correct MIME types for modern web assets -->
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".woff" />
      <mimeMap fileExtension=".woff" mimeType="font/woff" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <remove fileExtension=".ttf" />
      <mimeMap fileExtension=".ttf" mimeType="font/ttf" />
      <remove fileExtension=".webp" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <remove fileExtension=".mp4" />
      <mimeMap fileExtension=".mp4" mimeType="video/mp4" />
      <remove fileExtension=".webm" />
      <mimeMap fileExtension=".webm" mimeType="video/webm" />
      <remove fileExtension=".m4a" />
      <mimeMap fileExtension=".m4a" mimeType="audio/mp4" />
      <remove fileExtension=".mp3" />
      <mimeMap fileExtension=".mp3" mimeType="audio/mpeg" />
    </staticContent>

    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
`;
fs.writeFileSync(path.join(outDir, 'web.config'), webConfigContent, 'utf8');

// 4. Write api-proxy.php
const apiProxyContent = `<?php
/**
 * RTI News - API Reverse Proxy for Windows Plesk (IIS)
 * Handles /api-proxy/* requests and forwards them to https://rtiapi.roofze.in/api/*
 * Solves CORS issues seamlessly without requiring IIS ARR server configuration.
 */

error_reporting(0);
ini_set('display_errors', '0');

$TARGET_BASE = 'https://rtiapi.roofze.in/api';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Requested-With, Origin");
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

$prefix = '/api-proxy';
$endpoint = '';

if (stripos($path, $prefix) === 0) {
    $endpoint = substr($path, strlen($prefix));
} elseif (isset($_GET['__proxy_endpoint'])) {
    $endpoint = $_GET['__proxy_endpoint'];
} else {
    $endpoint = $path;
}

$endpoint = ltrim($endpoint, '/');
$targetUrl = rtrim($TARGET_BASE, '/') . '/' . $endpoint;

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
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

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

$isMultipart = false;
foreach ($allHeaders as $name => $value) {
    $lower = strtolower($name);
    if (in_array($lower, ['host', 'content-length', 'expect'])) {
        continue;
    }
    if ($lower === 'content-type' && stripos($value, 'multipart/form-data') !== false) {
        $isMultipart = true;
        continue;
    }
    $requestHeaders[] = "{$name}: {$value}";
}

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

$headerContent = substr($response, 0, $headerSize);
$bodyContent = substr($response, $headerSize);

http_response_code($httpCode);

// 6. Forward Response Headers
$headersList = explode("\\r\\n", $headerContent);
foreach ($headersList as $hdr) {
    $hdrTrimmed = trim($hdr);
    if (empty($hdrTrimmed) || stripos($hdrTrimmed, 'HTTP/') === 0) continue;
    $lower = strtolower($hdrTrimmed);
    if (stripos($lower, 'transfer-encoding:') === 0) continue;
    if (stripos($lower, 'content-length:') === 0) continue;
    if (stripos($lower, 'connection:') === 0) continue;
    if (stripos($lower, 'access-control-') === 0) continue;
    header($hdrTrimmed, false);
}

echo $bodyContent;
`;
fs.writeFileSync(path.join(outDir, 'api-proxy.php'), apiProxyContent, 'utf8');

// 4b. Write .htaccess for Apache / Nginx proxy environments on Plesk
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Forward API calls to PHP proxy
  RewriteRule ^api-proxy(/.*)?$ api-proxy.php?__proxy_endpoint=$1 [QSA,L]

  # Exclude existing physical files and directories from SPA rewrite
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Single Page Application (SPA) routing fallback to root /index.html
  RewriteRule ^ /index.html [L]
</IfModule>
`;
fs.writeFileSync(path.join(outDir, '.htaccess'), htaccessContent, 'utf8');

// 5. Create out.zip using PowerShell
try {
  if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${outDir}\\\\*' -DestinationPath '${outZip}' -Force"`);
  console.log('[prepare-plesk-build] Created out.zip successfully.');
} catch (e) {
  console.warn('[prepare-plesk-build] Could not create zip archive automatically:', e.message);
}

console.log('[prepare-plesk-build] Finished successfully. Target folder: "out" and archive: "out.zip"');
