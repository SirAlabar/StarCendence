// Connection integration tests
import WebSocket from 'ws';
import * as jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { connectionPool } from '../connections/ConnectionPool';
import { ConnectionManager } from '../connections/ConnectionManager';
import { getJwtSecret } from '../config/securityConfig';

describe('WebSocket Connection Tests', () =>
{
  let app: any;
  let server: any;
  const PORT = 3999; // Use different port for testing
  const WS_URL = `ws://localhost:${PORT}/ws`;

  beforeAll(async () =>
  {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-for-websocket-testing';
    process.env.PORT = String(PORT);
    process.env.NODE_ENV = 'test';

    app = await createApp();
    server = await app.listen({ port: PORT, host: '0.0.0.0' });
  });

  afterAll(async () =>
  {
    // Clean up
    connectionPool.clear();
    if (server)
    {
      await app.close();
    }
  });

  afterEach(() =>
  {
    // Clear connection pool after each test
    connectionPool.clear();
  });

  describe('Connection with valid token', () =>
  {
    it('should connect successfully with valid JWT token', (done) =>
    {
      // Create a valid JWT token
      const jwtSecret = getJwtSecret();
      const token = jwt.sign(
        {
          sub: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          type: 'access',
        },
        jwtSecret,
        { expiresIn: '15m', issuer: 'transcendence-auth' }
      );

      const ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.on('open', () =>
      {
        expect(connectionPool.size()).toBeGreaterThan(0);
      });

      ws.on('message', (data: Buffer) =>
      {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('connection.ack');
        expect(message.payload.userId).toBe('test-user-id');
        expect(message.payload.connectionId).toBeDefined();

        // Verify connection is in pool
        const connectionId = message.payload.connectionId;
        const connection = connectionPool.get(connectionId);
        expect(connection).toBeDefined();
        expect(connection?.userId).toBe('test-user-id');

        ws.close();
      });

      ws.on('close', () =>
      {
        done();
      });

      ws.on('error', (error) =>
      {
        done(error);
      });
    });

    it('should store connection in pool with correct user ID mapping', (done) =>
    {
      const jwtSecret = getJwtSecret();
      const token = jwt.sign(
        {
          sub: 'user-123',
          email: 'user@example.com',
          username: 'testuser',
          type: 'access',
        },
        jwtSecret,
        { expiresIn: '15m', issuer: 'transcendence-auth' }
      );

      const ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.on('message', (data: Buffer) =>
      {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection.ack')
        {
          const connectionId = message.payload.connectionId;
          
          // Check connection exists
          const connection = connectionPool.get(connectionId);
          expect(connection).toBeDefined();
          
          // Check user ID mapping
          const userConnections = connectionPool.getByUserId('user-123');
          expect(userConnections.has(connectionId)).toBe(true);
          
          ws.close();
        }
      });

      ws.on('close', () =>
      {
        done();
      });

      ws.on('error', (error) =>
      {
        done(error);
      });
    });
  });

  describe('Connection with invalid token', () =>
  {
    it('should reject connection with missing token', (done) =>
    {
      const ws = new WebSocket(WS_URL);

      ws.on('open', () =>
      {
        done(new Error('Should not have opened connection without token'));
      });

      ws.on('message', (data: Buffer) =>
      {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('system.error');
        expect(message.payload.message).toContain('Missing authentication token');
      });

      ws.on('close', (code: number) =>
      {
        expect(code).toBe(1008); // Policy violation
        expect(connectionPool.size()).toBe(0);
        done();
      });

      ws.on('error', () =>
      {
        // Error is expected
      });
    });

    it('should reject connection with invalid token', (done) =>
    {
      const ws = new WebSocket(`${WS_URL}?token=invalid-token`);

      ws.on('open', () =>
      {
        done(new Error('Should not have opened connection with invalid token'));
      });

      ws.on('message', (data: Buffer) =>
      {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('system.error');
        expect(message.payload.message).toContain('Invalid');
      });

      ws.on('close', (code: number) =>
      {
        expect(code).toBe(1008); // Policy violation
        expect(connectionPool.size()).toBe(0);
        done();
      });

      ws.on('error', () =>
      {
        // Error is expected
      });
    });

    it('should reject connection with expired token', (done) =>
    {
      const jwtSecret = getJwtSecret();
      const expiredToken = jwt.sign(
        {
          sub: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          type: 'access',
        },
        jwtSecret,
        { expiresIn: '-1h', issuer: 'transcendence-auth' } // Already expired
      );

      const ws = new WebSocket(`${WS_URL}?token=${expiredToken}`);

      ws.on('open', () =>
      {
        done(new Error('Should not have opened connection with expired token'));
      });

      ws.on('close', (code: number) =>
      {
        expect(code).toBe(1008); // Policy violation
        expect(connectionPool.size()).toBe(0);
        done();
      });

      ws.on('error', () =>
      {
        // Error is expected
      });
    });
  });

  describe('Connection lifecycle', () =>
  {
    it('should remove connection from pool on disconnect', (done) =>
    {
      const jwtSecret = getJwtSecret();
      const token = jwt.sign(
        {
          sub: 'user-456',
          email: 'user@example.com',
          username: 'testuser',
          type: 'access',
        },
        jwtSecret,
        { expiresIn: '15m', issuer: 'transcendence-auth' }
      );

      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      let connectionId: string;

      ws.on('message', (data: Buffer) =>
      {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection.ack')
        {
          connectionId = message.payload.connectionId;
          
          // Verify connection is in pool
          expect(connectionPool.get(connectionId)).toBeDefined();
          
          // Close connection
          ws.close();
        }
      });

      ws.on('close', () =>
      {
        // Wait a bit for cleanup
        setTimeout(() =>
        {
          // Verify connection is removed from pool
          expect(connectionPool.get(connectionId!)).toBeUndefined();
          expect(connectionPool.size()).toBe(0);
          done();
        }, 100);
      });

      ws.on('error', (error) =>
      {
        done(error);
      });
    });
  });
});

