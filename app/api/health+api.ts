import {
  jsonResponse,
  methodNotAllowedResponse,
  noContentResponse,
} from '@/lib/api/route-utils';

const ALLOWED_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const;

const STARTUP_AT_MS = Date.now();

type HealthResponse = {
  status: 'ok';
  service: 'TimeLog API';
  timestamp: string;
  uptimeMs: number;
  environment: string;
  build: {
    appVersion: string | null;
    gitCommit: string | null;
    easBuildId: string | null;
  };
};

function buildHealthResponse(): HealthResponse {
  return {
    status: 'ok',
    service: 'TimeLog API',
    timestamp: new Date().toISOString(),
    uptimeMs: Date.now() - STARTUP_AT_MS,
    environment: process.env.NODE_ENV ?? 'unknown',
    build: {
      appVersion: process.env.npm_package_version ?? null,
      gitCommit: process.env.EAS_BUILD_GIT_COMMIT_HASH ?? null,
      easBuildId: process.env.EAS_BUILD_ID ?? null,
    },
  };
}

export function OPTIONS(): Response {
  return noContentResponse({ 'Access-Control-Max-Age': '86400' });
}

export function HEAD(): Response {
  return noContentResponse();
}

export function GET(): Response {
  return jsonResponse(buildHealthResponse());
}

export function POST(): Response {
  return methodNotAllowedResponse(ALLOWED_METHODS);
}

export function PUT(): Response {
  return methodNotAllowedResponse(ALLOWED_METHODS);
}

export function PATCH(): Response {
  return methodNotAllowedResponse(ALLOWED_METHODS);
}

export function DELETE(): Response {
  return methodNotAllowedResponse(ALLOWED_METHODS);
}
