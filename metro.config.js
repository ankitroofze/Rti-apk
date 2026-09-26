const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

// expo-sqlite web fix (yahi 500 error ki wajah thi)
config.resolver.assetExts.push('wasm');

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      if (req.url.startsWith('/api-proxy')) {
        return createProxyMiddleware({
          target: 'https://rtiapi.roofze.in',
          changeOrigin: true,
          secure: true,
          pathRewrite: { '^/api-proxy': '/api' },
          onError: (err, req2, res2) => {
            console.error('[PROXY ERROR]', req2.url, '->', err.code, err.message);
            res2.writeHead(502, { 'Content-Type': 'application/json' });
            res2.end(JSON.stringify({ message: 'Proxy failed', code: err.code }));
          },
        })(req, res, next);
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;