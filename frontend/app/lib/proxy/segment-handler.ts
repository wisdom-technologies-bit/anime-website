import { safeFetch } from "@/app/lib/proxy/upstream";
import type { ProxyPayload } from "@/app/lib/proxy/signing";

const RETRY_STATUSES = new Set([403, 408, 425, 429]);
const isRetryStatus = (status: number) => RETRY_STATUSES.has(status) || status >= 500;
const isBlockChunk = (chunk: Uint8Array) => {
  const text = new TextDecoder().decode(chunk).trimStart();
  return text.startsWith("<!") || text.startsWith("<html") || text.startsWith("<HTML") ||
    (chunk.length >= 4 && chunk[0] === 0xff && chunk[1] === 0xd8 && chunk[2] === 0xff) ||
    (chunk.length >= 8 && chunk[0] === 0x89 && chunk[1] === 0x50 && chunk[2] === 0x4e && chunk[3] === 0x47) ||
    (chunk.length >= 4 && chunk[0] === 0x47 && chunk[1] === 0x49 && chunk[2] === 0x46 && chunk[3] === 0x38);
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function streamWithFirstChunk(reader: ReadableStreamDefaultReader<Uint8Array>, first: Uint8Array, bytes: { value: number }) {
  return new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(first); bytes.value += first.byteLength; },
    async pull(controller) { try { const next = await reader.read(); if (next.done) controller.close(); else { bytes.value += next.value.byteLength; controller.enqueue(next.value); } } catch { controller.close(); } },
    cancel(reason) { reader.cancel(reason).catch(() => undefined); },
  });
}

export async function handleSegment(req: Request, payload: ProxyPayload) {
  const range = req.headers.get("range") || undefined;
  let lastStatus = 502;
  let lastTimeout = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await sleep(attempt === 2 ? 150 : 400);
    const headers = { ...(payload.h || {}) };
    if (attempt === 3) { delete headers.origin; headers["accept-encoding"] = "identity"; }
    const started = Date.now();
    let upstream: { response: Response; finalUrl: string };
    try {
      upstream = await safeFetch(payload.u, { headers, range, timeoutMs: 8000 });
    } catch (error) {
      lastTimeout = error instanceof Error && (error.name === "AbortError" || /abort|timeout/i.test(error.message));
      lastStatus = 502;
      console.log(`[proxy-segment] host=${new URL(payload.u).host} attempt=${attempt} status=502 ct= ttfb=${Date.now() - started} bytes=0`);
      continue;
    }
    const response = upstream.response;
    const ct = response.headers.get("content-type") || "";
    lastStatus = response.status;
    let first: Uint8Array | undefined;
    if (response.body) { const reader = response.body.getReader(); const next = await reader.read(); if (!next.done) first = next.value; else reader.releaseLock(); if (first && (ct.toLowerCase().includes("text/html") || isBlockChunk(first))) { await reader.cancel(); console.log(`[proxy-segment] host=${new URL(upstream.finalUrl).host} attempt=${attempt} status=${response.status} ct=${ct} ttfb=${Date.now() - started} bytes=${first.byteLength}`); continue; } if (isRetryStatus(response.status)) { await reader.cancel(); console.log(`[proxy-segment] host=${new URL(upstream.finalUrl).host} attempt=${attempt} status=${response.status} ct=${ct} ttfb=${Date.now() - started} bytes=${first?.byteLength || 0}`); continue; }
      const bytes = { value: 0 }; const headersOut = new Headers(); for (const name of ["content-type", "content-range", "accept-ranges"]) if (response.headers.has(name)) headersOut.set(name, response.headers.get(name)!); if (!headersOut.has("content-type")) headersOut.set("content-type", /\.(ts|m4s|key)(\?|$)/i.test(upstream.finalUrl) ? "video/mp2t" : "application/octet-stream"); headersOut.set("cache-control", "private, max-age=0, must-revalidate"); headersOut.set("x-proxy-attempts", String(attempt)); headersOut.set("x-proxy-upstream-status", String(response.status)); console.log(`[proxy-segment] host=${new URL(upstream.finalUrl).host} attempt=${attempt} status=${response.status} ct=${ct} ttfb=${Date.now() - started} bytes=${response.headers.get("content-length") || first?.byteLength || 0}`); return new Response(first ? streamWithFirstChunk(reader, first, bytes) : null, { status: response.status === 404 ? 502 : response.status, headers: headersOut });
    }
    console.log(`[proxy-segment] host=${new URL(upstream.finalUrl).host} attempt=${attempt} status=${response.status} ct=${ct} ttfb=${Date.now() - started} bytes=0`);
    if (isRetryStatus(response.status) || ct.toLowerCase().includes("text/html")) continue;
    const headersOut = new Headers({ "cache-control": "private, max-age=0, must-revalidate", "x-proxy-attempts": String(attempt), "x-proxy-upstream-status": String(response.status) });
    return new Response(response.body, { status: response.status === 404 ? 502 : response.status, headers: headersOut });
  }
  const headers = new Headers({ "content-type": "text/plain; charset=utf-8", "x-proxy-attempts": "3", "x-proxy-upstream-status": String(lastStatus) });
  return new Response(lastTimeout ? "upstream timeout" : "upstream blocked the request", { status: 502, headers });
}
