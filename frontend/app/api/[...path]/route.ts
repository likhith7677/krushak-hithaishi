// Same-origin server-side proxy for FastAPI. Backend never needs to be exposed
// directly to browsers and can be changed at RUNTIME (not at build time).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_REQUEST_BYTES = 6 * 1024 * 1024;

function backendUrl(request: Request): string {
  const target = process.env.KH_BACKEND_HOSTPORT || process.env.KH_BACKEND_TARGET || 'localhost:8000';
  const origin = target.startsWith('http://') || target.startsWith('https://')
    ? target : `http://${target}`;
  const url = new URL(request.url);
  return origin.replace(/\/$/, '') + url.pathname + url.search;
}

async function proxy(request: Request): Promise<Response> {
  // Reject cross-origin mutations. Browsers cannot forge Host or Origin headers.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        if (new URL(origin).host !== request.headers.get('host')) {
          return Response.json({detail:'Cross-origin request blocked'},{status:403});
        }
      } catch { return Response.json({detail:'Invalid request origin'},{status:403}); }
    }
  }
  const headers = new Headers();
  for (const name of ['content-type', 'accept', 'cookie']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('X-KH-Request', 'web');
  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    const size = Number(request.headers.get('content-length') || 0);
    if (size > MAX_REQUEST_BYTES) return Response.json({detail:'Request too large'},{status:413});
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_REQUEST_BYTES) return Response.json({detail:'Request too large'},{status:413});
  }
  try {
    const upstream = await fetch(backendUrl(request), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(90000),
      redirect: 'manual',
    });
    const responseHeaders = new Headers();
    for (const name of ['content-type', 'cache-control', 'set-cookie', 'content-disposition']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('X-Content-Type-Options','nosniff');
    return new Response(upstream.body, {status:upstream.status, headers:responseHeaders});
  } catch {
    return Response.json({detail:'Server temporarily unavailable. Please try again.'},{status:503});
  }
}
export {proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE, proxy as PUT};
