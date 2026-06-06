import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './dist/server/server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const CLIENT_DIR = join(__dirname, 'dist', 'client');
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000';
const API_PATH_PREFIXES = [
  '/ready-delivery',
  '/subscription-plans',
];

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
};

const server = createServer(async (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const url = new URL(req.url, `${protocol}://${host}`);

    if (API_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      return proxyApiRequest(req, res, url);
    }

    // 1. Try to serve static files from dist/client
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname !== '/') {
      const relativePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      const filePath = join(CLIENT_DIR, relativePath);
      
      try {
        const content = await readFile(filePath);
        const contentType = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
        
        console.log(`[Static] ${url.pathname} -> ${contentType}`);
        
        res.writeHead(200, { 
           'Content-Type': contentType,
           'Cache-Control': 'public, max-age=31536000, immutable' 
        });
        if (req.method === 'HEAD') {
          return res.end();
        }
        return res.end(content);
      } catch (e) {
        if (url.pathname.startsWith('/assets/')) {
          console.error(`[Static] 404 NOT FOUND: ${url.pathname}`);
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('Asset not found');
        }
        // Not found, fall through to SSR
      }
    }

    // 2. Fallback to TanStack Start SSR handler
    console.log(`[SSR] ${url.pathname}`);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Readable.toWeb(req),
      duplex: 'half'
    });

    const response = await handler.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    console.error('Server Error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

async function proxyApiRequest(req, res, url) {
  const targetUrl = new URL(`${url.pathname}${url.search}`, API_PROXY_TARGET);
  console.log(`[Proxy] ${req.method} ${url.pathname} -> ${targetUrl.origin}`);

  const headers = new Headers(req.headers);
  headers.set('host', targetUrl.host);

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Readable.toWeb(req),
    duplex: ['GET', 'HEAD'].includes(req.method) ? undefined : 'half',
  });

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body || req.method === 'HEAD') {
    return res.end();
  }

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📂 Serving static assets from: ${CLIENT_DIR}`);
  console.log(`🔁 Proxying API requests to: ${API_PROXY_TARGET}`);
});
