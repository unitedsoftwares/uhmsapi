const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const API_PORT = process.argv[2] || '3001';

const server = http.createServer((req, res) => {
  // Parse URL
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = '.' + url.pathname;
  
  // Default to auth-api-tester with port parameter
  if (filePath === './') {
    res.writeHead(302, { 'Location': `/auth-api-tester.html?port=${API_PORT}` });
    res.end();
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`
🚀 Auth API Tester Server Running!
====================================
📍 URL: http://localhost:${PORT}
🔌 API Port: ${API_PORT} (auto-configured)

📄 Quick Links:
   - Auth API Tester: http://localhost:${PORT}/auth-api-tester.html?port=${API_PORT}
   - API Docs: http://localhost:${PORT}/index.html
   - Dev Guide: http://localhost:${PORT}/developer-onboarding.html

✨ The API Base URL is automatically set to: http://localhost:${API_PORT}/api

Press Ctrl+C to stop the server
  `);
});