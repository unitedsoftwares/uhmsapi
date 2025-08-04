import express, { Application } from 'express';
import { createApp } from '../../app';
import { database } from '../../config/database';
import { TestDatabase } from './test-database';
import http from 'http';

export class TestServer {
  private static app: Application;
  private static server: http.Server;
  private static port: number;

  static async start(): Promise<number> {
    // Setup test database
    await TestDatabase.setup();
    await TestDatabase.seedTestData();

    // Disconnect any existing connection and reconnect
    await database.disconnect();
    await database.connect();

    // Create app
    this.app = createApp();
    
    // Find available port
    this.port = await this.findAvailablePort();
    
    // Start server
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        resolve(this.port);
      });
    });
  }

  static async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
    }
    
    await database.disconnect();
    await TestDatabase.cleanup();
  }

  static getApp(): Application {
    return this.app;
  }

  static getPort(): number {
    return this.port;
  }

  static getBaseUrl(): string {
    return `http://localhost:${this.port}/api/v1`;
  }

  private static async findAvailablePort(): Promise<number> {
    return new Promise((resolve) => {
      const server = express().listen(0, () => {
        const port = (server.address() as any).port;
        server.close(() => resolve(port));
      });
    });
  }

  static async resetDatabase(): Promise<void> {
    await TestDatabase.clearTables();
    await TestDatabase.seedTestData();
  }
}