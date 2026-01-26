export function GET(request: Request) {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TimeLog API',
  });
}
