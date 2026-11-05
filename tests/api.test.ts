import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('API', () => {
  it('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /deidentify redacts PII and returns the expected shape', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'email john@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.deidentifiedText).toBe('email [EMAIL]');
    expect(res.body.entitiesDetected).toEqual({ EMAIL: 1 });
  });

  it('POST /deidentify response contains exactly deidentifiedText and entitiesDetected', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'email john@example.com' });
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual([
      'deidentifiedText',
      'entitiesDetected',
    ]);
  });

  it('POST /deidentify counts repeated occurrences of one entity type', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'a@b.com and c@d.com' });
    expect(res.status).toBe(200);
    expect(res.body.deidentifiedText).toBe('[EMAIL] and [EMAIL]');
    expect(res.body.entitiesDetected).toEqual({ EMAIL: 2 });
  });

  it('POST /deidentify does not expose spans or raw PII values in the response', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'email john@example.com' });
    expect(res.body).not.toHaveProperty('spans');
    expect(JSON.stringify(res.body)).not.toContain('john@example.com');
  });

  it('POST /deidentify honors entity selection', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'john@example.com 123-45-6789', entities: ['SSN'] });

    expect(res.status).toBe(200);
    expect(res.body.deidentifiedText).toBe('john@example.com [SSN]');
    expect(res.body.entitiesDetected).toEqual({ SSN: 1 });
  });

  it('POST /deidentify returns 400 when text is missing', async () => {
    const res = await request(app).post('/deidentify').send({});
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('POST /deidentify returns 400 for unsupported entity types', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'x', entities: ['FOO'] });
    expect(res.status).toBe(400);
  });

  it('POST /deidentify returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/deidentify')
      .set('Content-Type', 'application/json')
      .send('{"text":');
    expect(res.status).toBe(400);
  });

  it('does not log raw PII from a malformed JSON body (CD1 regression)', async () => {
    const logged: string[] = [];
    const spy = jest
      .spyOn(console, 'error')
      .mockImplementation((...args: unknown[]) => {
        logged.push(args.map((a) => String(a)).join(' '));
      });
    try {
      const res = await request(app)
        .post('/deidentify')
        .set('Content-Type', 'application/json')
        .send('{"text": "SSN 123-45-6789" oops}');

      expect(res.status).toBe(400);
      const combined = logged.join('\n');
      expect(combined).not.toContain('123-45-6789');
      expect(combined).not.toContain('oops');
    } finally {
      // Always restore, even if an assertion above throws.
      spy.mockRestore();
    }
  });

  it('POST /deidentify returns 400 when text is null', async () => {
    const res = await request(app).post('/deidentify').send({ text: null });
    expect(res.status).toBe(400);
  });

  it('POST /deidentify returns 400 when text is a number', async () => {
    const res = await request(app).post('/deidentify').send({ text: 123 });
    expect(res.status).toBe(400);
  });

  it('POST /deidentify returns 400 when text is an empty string', async () => {
    const res = await request(app).post('/deidentify').send({ text: '' });
    expect(res.status).toBe(400);
  });

  it('POST /deidentify with empty entities array detects nothing', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'email john@example.com', entities: [] });
    expect(res.status).toBe(200);
    expect(res.body.deidentifiedText).toBe('email john@example.com');
    expect(res.body.entitiesDetected).toEqual({});
  });

  it('POST /deidentify returns 400 when entities is not an array', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'x', entities: 'EMAIL' });
    expect(res.status).toBe(400);
  });

  it('POST /deidentify returns 400 when entities contains a non-string', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'x', entities: [123] });
    expect(res.status).toBe(400);
  });

  it('POST /deidentify entity validation is case-sensitive', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'x', entities: ['email'] });
    expect(res.status).toBe(400);
  });

  it('POST /deidentify returns unchanged text when no PII is present', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'just plain text' });
    expect(res.status).toBe(200);
    expect(res.body.deidentifiedText).toBe('just plain text');
    expect(res.body.entitiesDetected).toEqual({});
  });

  it('POST /deidentify returns 400 when the Content-Type is not JSON', async () => {
    const res = await request(app)
      .post('/deidentify')
      .set('Content-Type', 'text/plain')
      .send('{"text":"john@example.com"}');
    expect(res.status).toBe(400);
  });
});
