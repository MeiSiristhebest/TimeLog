import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from './health+api';

describe('health+api route', () => {
  it('returns health payload with no-store cache headers', async () => {
    const response = GET();
    const data = (await response.json()) as {
      status: string;
      service: string;
      timestamp: string;
      uptimeMs: number;
      environment: string;
      build: {
        appVersion: string | null;
        gitCommit: string | null;
        easBuildId: string | null;
      };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('vary')).toBe('Origin');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');

    expect(data.status).toBe('ok');
    expect(data.service).toBe('TimeLog API');
    expect(typeof data.timestamp).toBe('string');
    expect(typeof data.uptimeMs).toBe('number');
    expect(typeof data.environment).toBe('string');
    expect(Object.prototype.hasOwnProperty.call(data.build, 'appVersion')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data.build, 'gitCommit')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(data.build, 'easBuildId')).toBe(true);
    expect(
      data.build.appVersion === null || typeof data.build.appVersion === 'string'
    ).toBe(true);
    expect(
      data.build.gitCommit === null || typeof data.build.gitCommit === 'string'
    ).toBe(true);
    expect(
      data.build.easBuildId === null || typeof data.build.easBuildId === 'string'
    ).toBe(true);
  });

  it('supports HEAD for probes without body', async () => {
    const response = HEAD();

    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-methods')).toBe('GET,HEAD,OPTIONS');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    await expect(response.text()).resolves.toBe('');
  });

  it('supports OPTIONS preflight for CORS', () => {
    const response = OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-max-age')).toBe('86400');
    expect(response.headers.get('access-control-allow-methods')).toBe('GET,HEAD,OPTIONS');
    expect(response.headers.get('access-control-allow-headers')).toContain('Authorization');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('rejects unsupported methods with 405 and Allow header', async () => {
    const responses = [POST(), PUT(), PATCH(), DELETE()];

    for (const response of responses) {
      const data = (await response.json()) as {
        error: {
          code: string;
          message: string;
          httpStatus: number;
        };
      };

      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('GET,HEAD,OPTIONS');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
      expect(data.error.httpStatus).toBe(405);
    }
  });
});
