import {
  verifyToken,
  ProxyNotConfiguredError,
  proxyUrl,
} from "@/app/lib/proxy/signing";
import { safeFetch } from "@/app/lib/proxy/upstream";
export const runtime = "edge";
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  if (!token) return new Response("invalid or expired token", { status: 403 });
  try {
    const p = await verifyToken(token);
    const r = await safeFetch(p.u, { headers: p.h, timeoutMs: 15000 });
    if (!r.response.ok)
      return new Response("upstream fetch failed", { status: 502 });
    const text = await r.response.text();
    if (text.length > 3000000)
      return new Response("thumbnail VTT too large", { status: 502 });
    const seen = new Map<string, string>();
    const out = await Promise.all(
      text.split(/\r?\n/).map(async (line) => {
        const m = line.match(/^(.+?)#xywh=(\d+,\d+,\d+,\d+)$/);
        if (!m) return line;
        const absolute = new URL(m[1], r.response.url || p.u).toString();
        let proxied = seen.get(absolute);
        if (!proxied) {
          proxied = await proxyUrl("thumbnail", { u: absolute, h: p.h });
          seen.set(absolute, proxied);
        }
        return `${proxied}#xywh=${m[2]}`;
      }),
    );
    return new Response(out.join("\n"), {
      headers: {
        "content-type": "text/vtt; charset=utf-8",
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(
      e instanceof ProxyNotConfiguredError
        ? "proxy_not_configured"
        : "upstream fetch failed",
      { status: e instanceof ProxyNotConfiguredError ? 500 : 502 },
    );
  }
}
