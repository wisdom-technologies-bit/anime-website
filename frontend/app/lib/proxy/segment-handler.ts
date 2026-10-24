import { safeFetch } from "@/app/lib/proxy/upstream";
import { classifyChunk, sniffContentType, type ChunkKind } from "@/app/lib/proxy/sniff";
import type { ProxyPayload } from "@/app/lib/proxy/signing";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const retryStatus = (status: number) => status === 403 || status === 429 || status >= 500;

async function readProbe(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const parts: Uint8Array[] = [];
  let total = 0;
  while (total < 192) {
    const next = await reader.read();
    if (next.done) break;
    parts.push(next.value);
    total += next.value.byteLength;
  }
  const first = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { first.set(part, offset); offset += part.byteLength; }
  return first;
}

function streamWithFirstChunk(reader: ReadableStreamDefaultReader<Uint8Array>, first: Uint8Array, bytes: { value: number }) {
  return new ReadableStream<Uint8Array>({
    start(controller) { if (first.byteLength) { controller.enqueue(first); bytes.value += first.byteLength; } },
    async pull(controller) { try { const next = await reader.read(); if (next.done) controller.close(); else { bytes.value += next.value.byteLength; controller.enqueue(next.value); } } catch { controller.close(); } },
    cancel(reason) { reader.cancel(reason).catch(() => undefined); },
  });
}

export async function handleSegment(req: Request, payload: ProxyPayload) {
  const range = req.headers.get("range") || undefined;
  let lastStatus = 502;
  let timedOut = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt === 2) await sleep(150);
    const started = Date.now();
    try {
      const upstream = await safeFetch(payload.u, { headers: payload.h || {}, range, timeoutMs: 1800 });
      const response = upstream.response;
      lastStatus = response.status;
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let first = new Uint8Array();
      if (response.body) { reader = response.body.getReader(); first = await readProbe(reader); }
      const kind: ChunkKind = classifyChunk(first);
      const retry = retryStatus(response.status) || kind === "html";
      if (retry && attempt < 2) { await reader?.cancel(); continue; }
      if (retry) { await reader?.cancel(); continue; }
      const headers = new Headers({
        "cache-control": "private, max-age=0, must-revalidate",
        "x-content-type-options": "nosniff",
        "x-proxy-attempts": String(attempt),
        "x-proxy-upstream-status": String(response.status),
      });
      const detected = sniffContentType(kind);
      const contentType = detected || (payload.f === "mp4" ? "video/mp4" : "application/octet-stream");
      headers.set("content-type", contentType);
      for (const name of ["content-range", "accept-ranges"]) if (response.headers.has(name)) headers.set(name, response.headers.get(name)!);
      console.log(`[proxy-segment] host=${new URL(upstream.finalUrl).host} attempt=${attempt} status=${response.status} kind=${kind} ttfb=${Date.now() - started}`);
      return new Response(reader ? streamWithFirstChunk(reader, first, { value: 0 }) : null, { status: response.status === 404 ? 502 : response.status, headers });
    } catch (error) {
      timedOut = error instanceof Error && (error.name === "AbortError" || /abort|timeout/i.test(error.message));
      lastStatus = 502;
      if (attempt < 2) continue;
    }
  }
  return new Response(timedOut ? "upstream timeout" : "upstream blocked the request", { status: 502, headers: { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff", "x-proxy-attempts": "2", "x-proxy-upstream-status": String(lastStatus) } });
}
