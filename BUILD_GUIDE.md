# HMS API Build Configuration Guide

## Overview
This guide explains the build configuration and deployment process for the HMS API.

## Build Configuration

### TypeScript Configuration (`tsconfig.json`)
- **Target**: ES2020 for modern JavaScript features
- **Module**: CommonJS for Node.js compatibility
- **Output**: `./build` directory
- **Source**: `./src` directory
- **Strict Mode**: Enabled for type safety
- **Source Maps**: Enabled for debugging
- **Incremental Build**: Enabled for faster rebuilds

### Key Features:
- Declaration files generation for better TypeScript support
- Module resolution set to Node.js standard
- Decorator support for future extensibility

## Environment Configuration

### Development
```bash
NODE_ENV=development
PORT=3001
```

### Production
```bash
NODE_ENV=production
PORT=3001
```

## Build Commands

### Development
```bash
# Run in development mode with hot reload
npm run dev

# Check TypeScript compilation without building
npm run build:check
```

### Production Build
```bash
# Clean and build the project
npm run build

# Start the production server
npm start

# Alternative production start with NODE_ENV set
npm run start:prod
```

### Utility Commands
```bash
# Clean build artifacts
npm run clean

# Run linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Build Process

1. **Pre-build**: Cleans previous build artifacts
2. **TypeScript Compilation**: Compiles all `.ts` files to `.js`
3. **Post-build**: Confirms successful build
4. **Output**: Generated files in `./build` directory

## Deployment

### Local Deployment
```bash
# Build the project
npm run build

# Start the server
npm start
```

### Production Deployment
1. Set environment variables in `.env` or system
2. Build the project: `npm run build`
3. Start with: `NODE_ENV=production npm start`

### Using PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start build/index.js --name hms-api

# Save PM2 configuration
pm2 save
pm2 startup
```

## Troubleshooting

### Port Already in Use
If you get "Port 3001 is already in use":
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Build Failures
1. Clear all caches: `npm run clean`
2. Remove node_modules: `rm -rf node_modules`
3. Reinstall dependencies: `npm install`
4. Rebuild: `npm run build`

### Environment Variables Not Loading
- Ensure `.env` file exists in project root
- Check file permissions
- Verify no syntax errors in `.env`

## Performance Optimization

### Build Optimization
- TypeScript incremental compilation enabled
- Source maps included for debugging
- Comments preserved for documentation

### Runtime Optimization
- Connection pooling for database
- Rate limiting configured
- Helmet.js for security headers
- CORS properly configured

## Security Considerations

1. Never commit `.env` files
2. Use strong JWT secrets in production
3. Enable HTTPS in production
4. Set appropriate CORS origins
5. Use environment-specific configurations

## Monitoring

The API provides these endpoints for monitoring:
- `/` - Basic API info
- `/api/v1/health` - Health check with version info

## Version Information
- Node.js: 18.x or higher recommended
- TypeScript: 5.8.3
- MySQL: 8.x compatible

---

For more information, see the main README.md file.