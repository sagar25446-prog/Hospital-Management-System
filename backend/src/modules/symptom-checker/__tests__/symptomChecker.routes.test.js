const request = require('supertest');

// This route needs no DB, so we can exercise the real Express app directly.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
delete process.env.ANTHROPIC_API_KEY; // force the keyword-matcher fallback path for deterministic tests

const app = require('../../../app');

describe('POST /api/v1/symptom-checker/analyze', () => {
  it('returns a specialist suggestion for a valid description', async () => {
    const res = await request(app)
      .post('/api/v1/symptom-checker/analyze')
      .send({ text: 'I have a bad toothache and swollen gums' });
    expect(res.status).toBe(200);
    expect(res.body.specialist).toBe('Dentist');
    expect(res.body.source).toBe('keyword');
  });

  it('rejects an empty description with 400', async () => {
    const res = await request(app).post('/api/v1/symptom-checker/analyze').send({ text: '' });
    expect(res.status).toBe(400);
  });

  it('rejects a missing text field with 400', async () => {
    const res = await request(app).post('/api/v1/symptom-checker/analyze').send({});
    expect(res.status).toBe(400);
  });

  it('rejects an overly long description with 400', async () => {
    const res = await request(app)
      .post('/api/v1/symptom-checker/analyze')
      .send({ text: 'a'.repeat(2001) });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/symptom-checker/status', () => {
  it('reports whether AI is configured', async () => {
    const res = await request(app).get('/api/v1/symptom-checker/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('aiConfigured', false);
  });
});
