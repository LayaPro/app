#!/usr/bin/env node

/**
 * Standalone Super Admin Portal Server
 * 
 * This is a minimal HTTP server that runs INDEPENDENTLY of the main API.
 * If your admin app goes down, this will still work.
 * 
 * Usage: node standalone-super-admin-server.js [port]
 * Default port: 5000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 5000;
const HTML_FILE = path.join(__dirname, 'super-admin-standalone.html');

// Check if HTML file exists
if (!fs.existsSync(HTML_FILE)) {
  console.error('❌ Error: super-admin-standalone.html not found!');
  console.error('   Expected at:', HTML_FILE);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // CORS headers to allow API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve the HTML file for any request
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(HTML_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading page');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🔐 SUPER ADMIN PORTAL - STANDALONE SERVER               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Status: ✅ Running independently');
  console.log(`  Port: ${PORT}`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log('');
  console.log('  💡 This server runs INDEPENDENTLY from your main API');
  console.log('     Even if admin app goes down, this stays up!');
  console.log('');
  console.log('  📝 Before logging in, configure API URL in the portal:');
  console.log('     Default: http://localhost:4000');
  console.log('');
  console.log('  🛑 Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
