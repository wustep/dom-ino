import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function fetchProxyPlugin(): Plugin {
  return {
    name: 'fetch-proxy',
    configureServer(server) {
      server.middlewares.use('/api/fetch-page', async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get('url');

        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
          return;
        }

        // Validate URL: only allow http/https protocols
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(targetUrl);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid URL' }));
          return;
        }

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Only http and https URLs are allowed' }));
          return;
        }

        // Block requests to private/internal networks
        const hostname = parsedUrl.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
          || hostname === '0.0.0.0' || hostname.endsWith('.local')
          || hostname.startsWith('10.') || hostname.startsWith('192.168.')
          || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Requests to private networks are not allowed' }));
          return;
        }

        try {
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(15000),
          });

          const html = await response.text();
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(html);
        } catch {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch the requested URL' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), fetchProxyPlugin()],
  server: { port: 5173 },
})
