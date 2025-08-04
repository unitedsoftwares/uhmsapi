// Mock database module to prevent connection attempts during tests
jest.mock('./src/config/database', () => ({
  database: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    getPool: jest.fn().mockReturnValue({
      execute: jest.fn().mockResolvedValue([[], []]),
      query: jest.fn().mockResolvedValue([[], []]),
      getConnection: jest.fn().mockResolvedValue({
        execute: jest.fn().mockResolvedValue([[], []]),
        query: jest.fn().mockResolvedValue([[], []]),
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      }),
    }),
    isConnected: jest.fn().mockReturnValue(true),
    testConnection: jest.fn().mockResolvedValue(true),
  },
}));