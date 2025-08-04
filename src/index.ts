import { config } from './config';
import appInstance from './app';
import logger from './utils/logger';
import net from 'net';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await appInstance.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await appInstance.close();
  process.exit(0);
});

// Function to check if port is available
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// Function to find an available port
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    logger.warn(`Port ${port} is already in use, trying next port...`);
  }
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

// Start server
async function startServer() {
  try {
    // Initialize app
    await appInstance.initialize();

    // Find available port
    const availablePort = await findAvailablePort(config.port);
    
    if (availablePort !== config.port) {
      logger.info(`Port ${config.port} is already in use, using port ${availablePort} instead`);
    }

    // Start listening
    const app = appInstance.getApp();
    const server = app.listen(availablePort, () => {
      // Clear console and show banner
      console.clear();
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 HMS API SERVER READY! 🚀`);
      console.log('='.repeat(60));
      console.log(`\n📍 API URL: http://localhost:${availablePort}/api`);
      console.log(`📍 Environment: ${config.env}`);
      console.log(`📍 Port: ${availablePort}${availablePort !== config.port ? ' (auto-selected)' : ''}`);
      console.log(`\n🔧 Quick Links:\n`);
      console.log(`   🧪 API Tester: http://localhost:${availablePort}/docs/auth-api-tester.html`);
      console.log(`   📖 API Docs: http://localhost:${availablePort}/docs/index.html`);
      console.log(`   🎓 Dev Guide: http://localhost:${availablePort}/docs/developer-onboarding.html`);
      console.log(`   ❤️  Health: http://localhost:${availablePort}/api/v1/health`);
      console.log('\n' + '='.repeat(60));
      console.log('Press Ctrl+C to stop the server\n');
      
      // Also log to file
      logger.info(`Server running on port ${availablePort} in ${config.env} mode`);
      logger.info(`API Base URL: http://localhost:${availablePort}/api`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${availablePort} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${availablePort} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();