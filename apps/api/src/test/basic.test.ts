/**
 * Basic Integration Tests
 * Smoke tests to verify core functionality
 */

import request from 'supertest';
import app from '../index';

describe('Basic API Tests', () => {
  test('Health endpoint should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        status: 'healthy',
        version: '1.0.0'
      })
    });
  });

  test('API info endpoint should return application info', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        name: 'CounselFlow Neo API',
        version: '1.0.0',
        status: 'operational'
      })
    });
  });

  test('404 handler should work for unknown routes', async () => {
    const response = await request(app)
      .get('/nonexistent-route')
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Not Found',
      message: 'The requested resource was not found'
    });
  });

  test('Health check endpoints should be accessible', async () => {
    await request(app)
      .get('/api/health/health')
      .expect(200);

    await request(app)
      .get('/api/health/ready')
      .expect(200);

    await request(app)
      .get('/api/health/live')
      .expect(200);
  });
});

describe('Security Tests', () => {
  test('CORS headers should be present', async () => {
    const response = await request(app)
      .options('/api')
      .expect(204);

    // CORS headers should be set by the middleware
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('Security headers should be present', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    // Helmet security headers
    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-frame-options');
  });
});