import { verifyToken, ProxyNotConfiguredError } from "@/app/lib/proxy/signing";
import { safeFetch } from "@/app/lib/proxy/upstream";
import { classifyImage } from "@/app/lib/proxy/sniff";
export const runtime = "edge";
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t");
  if (!t) return new Response("invalid or expired token", { status: 403 });
  try {
    const p = await verifyToken(t);
    const range = req.headers.get("range");
    const r = await safeFetch(p.u, {
      headers: { ...p.h, ...(range ? { range } : {}) },
      timeoutMs: 4000,
    });
    if (!r.response.ok)
      return new Response("upstream status", {
        status: r.response.status === 416 ? 416 : 502,
      });
    const bytes = new Uint8Array(await r.response.arrayBuffer());
    const type = classifyImage(bytes);
    if (!type) return new Response("not an image", { status: 502 });
    return new Response(bytes, {
      status: r.response.status,
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=86400",
        "x-content-type-options": "nosniff",
        ...(r.response.headers.get("content-range")
          ? { "content-range": r.response.headers.get("content-range")! }
          : {}),
      },
    });
  } catch (e) {
    return new Response(
      e instanceof ProxyNotConfiguredError
        ? "proxy_not_configured"
        : "thumbnail fetch failed",
      { status: e instanceof ProxyNotConfiguredError ? 500 : 502 },
    );
  }
}
