const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});
const PORT = 8082;
const TARGET = 'https://rtiapi.roofze.in';

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  proxy.web(req, res, { target: TARGET, changeOrigin: true, secure: true }, (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ message: 'Proxy error', error: err.message }));
  });
}).listen(PORT, () => {
  console.log(`CORS dev proxy running -> http://localhost:${PORT}  (forwarding to ${TARGET})`);
});