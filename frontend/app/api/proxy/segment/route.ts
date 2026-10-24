import { verifyToken, ProxyNotConfiguredError } from "@/app/lib/proxy/signing";
import { safeFetch } from "@/app/lib/proxy/upstream";

export const runtime = "edge";

function safeBody(body: ReadableStream<Uint8Array> | null, onBytes: (bytes: number) => void) {
  if (!body) return null;
  const reader = body.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try { const next = await reader.read(); if (next.done) { controller.close(); return; } onBytes(next.value.byteLength); controller.enqueue(next.value); }
      catch { controller.close(); }
    },
    cancel(reason) { reader.cancel(reason).catch(() => undefined); },
  });
}

export async function GET(req: Request) {
  const started = Date.now();
  const token = new URL(req.url).searchParams.get("t");
  if (!token) return new Response("invalid or expired token", { status: 403 });
  let payload: any;
  try { payload = await verifyToken(token); }
  catch (error) { const configured = !(error instanceof ProxyNotConfiguredError); return new Response(configured ? "invalid or expired token" : "proxy_not_configured", { status: configured ? 403 : 500 }); }
  try {
    const upstream = await safeFetch(payload.u, { headers: payload.h, range: req.headers.get("range") || undefined, timeoutMs: 20000 });
    const status = upstream.response.status;
    if (![200, 206, 416].includes(status)) return new Response(`upstream status ${status}`, { status: 502 });
    if ((upstream.response.headers.get("content-type") || "").toLowerCase().includes("text/html")) return new Response("upstream blocked the request", { status: 502 });
    const headers = new Headers();
    for (const name of ["content-type", "content-range", "accept-ranges"]) if (upstream.response.headers.has(name)) headers.set(name, upstream.response.headers.get(name)!);
    if (!headers.has("content-type")) headers.set("content-type", /\.(ts|m4s|key)(\?|$)/i.test(upstream.finalUrl) ? "video/mp2t" : "application/octet-stream");
    headers.set("cache-control", "private, max-age=0, must-revalidate");
    let bytes = 0;
    const response = new Response(safeBody(upstream.response.body, (value) => { bytes += value; }) , { status, headers });
    console.log(`[kumori-segment] host=${new URL(upstream.finalUrl).host} status=${status} bytes=${upstream.response.headers.get("content-length") || bytes} ms=${Date.now() - started}`);
    return response;
  } catch (error) { console.warn(`[kumori-segment] status=502 bytes=0 ms=${Date.now() - started} error=${error instanceof Error ? error.message : "upstream_fetch_failed"}`); return new Response("upstream fetch failed", { status: 502 }); }
}

export function OPTIONS() { return new Response(null, { status: 204 }); }
