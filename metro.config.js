const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

// expo-sqlite web fix (yahi 500 error ki wajah thi)
config.resolver.assetExts.push('wasm');

const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Keep the native compiler untouched and use the same palette for every RN Web route.
  const origin = context.originModulePath.replace(/\\/g, '/');
  if (
    platform === 'web' &&
    /^\.\.?\/.*normalizeValueWithProperty$/.test(moduleName) &&
    origin.includes('/react-native-web/') &&
    origin.includes('/StyleSheet/')
  ) {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'theme', 'normalizeWebStyle.js') };
  }
  return (resolveRequest || context.resolveRequest)(context, moduleName, platform);
};

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      if (req.url.startsWith('/api-proxy')) {
        return createProxyMiddleware({
          target: process.env.EXPO_PUBLIC_API_ORIGIN || 'https://189.72.144.238',
          changeOrigin: true,
          secure: false,
          pathRewrite: { '^/api-proxy': '/api/api' },
          onProxyReq: (proxyReq) => {
            proxyReq.removeHeader('transfer-encoding');
          },
          onProxyRes: (proxyRes) => {
            proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, max-age=0';
            proxyRes.headers['pragma'] = 'no-cache';
            proxyRes.headers['expires'] = '0';
          },
          onError: (err, req2, res2) => {
            console.error('[PROXY ERROR]', req2.url, '->', err.code, err.message);
            res2.writeHead(502, { 'Content-Type': 'application/json' });
            res2.end(JSON.stringify({ message: 'Proxy failed', code: err.code }));
          },
        })(req, res, next);
      }
      if (req.url.startsWith('/storage-proxy')) {
        return createProxyMiddleware({
          target: process.env.EXPO_PUBLIC_API_ORIGIN || 'https://189.72.144.238',
          changeOrigin: true,
          secure: false,
          pathRewrite: { '^/storage-proxy': '/storage' },
          onProxyReq: (proxyReq) => {
            proxyReq.removeHeader('transfer-encoding');
          },
          onProxyRes: (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
          },
          onError: (err, req2, res2) => {
            console.error('[STORAGE PROXY ERROR]', req2.url, '->', err.code, err.message);
            res2.writeHead(502, { 'Content-Type': 'application/json' });
            res2.end(JSON.stringify({ message: 'Storage proxy failed', code: err.code }));
          },
        })(req, res, next);
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
