const DEFAULT_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  Vary: 'Origin',
} as const;

const DEFAULT_SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
} as const;

export function buildRouteHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    ...DEFAULT_CORS_HEADERS,
    ...DEFAULT_SECURITY_HEADERS,
    ...extra,
  };
}

export function noContentResponse(extraHeaders?: Record<string, string>): Response {
  return new Response(null, {
    status: 204,
    headers: buildRouteHeaders(extraHeaders),
  });
}

export function jsonResponse<TBody>(
  body: TBody,
  status = 200,
  extraHeaders?: Record<string, string>
): Response {
  return Response.json(body, {
    status,
    headers: buildRouteHeaders(extraHeaders),
  });
}

export function methodNotAllowedResponse(allowedMethods: readonly string[]): Response {
  const allowHeader = allowedMethods.join(',');
  return jsonResponse(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed',
        httpStatus: 405,
      },
    },
    405,
    {
      Allow: allowHeader,
    }
  );
}
