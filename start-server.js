#!/usr/bin/env node

/**
 * Production Server Startup Script
 * This script ensures the server starts cleanly with proper error handling
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting HMS API Server...\n');

// Check if build directory exists
const fs = require('fs');
const buildPath = path.join(__dirname, 'build', 'index.js');

if (!fs.existsSync(buildPath)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Start the server
const server = spawn('node', [buildPath], {
  stdio: 'inherit',
  env: { ...process.env },
  cwd: __dirname
});

// Handle server exit
server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Server exited with code ${code}`);
  }
});

// Handle errors
server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n📤 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n\n📤 Shutting down server...');
  server.kill('SIGTERM');
});