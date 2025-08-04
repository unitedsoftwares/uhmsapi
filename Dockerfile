# Multi-stage Dockerfile for HMS API using Debian-slim

# 1. Builder stage: install all dependencies and compile TypeScript
FROM node:18-slim AS builder
WORKDIR /app

# Copy package manifest and install all deps (including dev)
COPY package*.json ./
RUN npm install

# Copy entire source and build
COPY . .
RUN npm run build

# 2. Production stage: install only production dependencies and serve compiled output
FROM node:18-slim AS production
WORKDIR /app

# Copy package manifest and install only production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy built application and helper
COPY --from=builder /app/build ./build
COPY --from=builder /app/start-server.js ./start-server.js

# Expose application port
EXPOSE 3001

# Command to run the application in production mode
CMD ["npm", "run", "start:prod"]
