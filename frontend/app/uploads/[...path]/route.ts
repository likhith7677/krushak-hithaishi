// A public image is served from the backend's persistent disk via the same
// website origin. Avoid exposing Render's backend hostname to the browser.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (!/^\/uploads\/[a-f0-9]{32}\.webp$/.test(pathname)) {
    return new Response('Not found',{status:404});
  }
  const target = process.env.KH_BACKEND_HOSTPORT || process.env.KH_BACKEND_TARGET || 'localhost:8000';
  const origin = target.startsWith('http://') || target.startsWith('https://') ? target : `http://${target}`;
  try {
    const upstream=await fetch(origin.replace(/\/$/,'')+pathname, {
      cache:'no-store', signal:AbortSignal.timeout(20000)
    });
    if (!upstream.ok) return new Response('Not found',{status:404});
    return new Response(upstream.body,{status:200,headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
  } catch {return new Response('Image unavailable',{status:503});}
}
