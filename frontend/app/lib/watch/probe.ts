import { classifyChunk } from "@/app/lib/proxy/sniff";

async function readAtMost(response: Response, signal: AbortSignal) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < 256) {
      const next = await reader.read();
      if (next.done) break;
      const part = next.value.slice(0, 256 - total);
      parts.push(part); total += part.byteLength;
      if (total >= 256) break;
    }
  } finally { await reader.cancel().catch(() => undefined); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return bytes;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

export async function probeStream(stream: any, headers: Record<string, string>, options: { timeoutMs?: number } = {}) {
  if (stream.type === "embed") return { ok: true, embedOnly: true };
  const totalCap = setTimeout(() => undefined, options.timeoutMs ?? 6000);
  try {
    if (stream.type === "mp4") {
      const response = await fetchWithTimeout(stream.url, { headers: { ...headers, range: "bytes=0-255" } }, 4000);
      const bytes = await readAtMost(response, new AbortController().signal);
      return response.ok && (response.status === 200 || response.status === 206) && classifyChunk(bytes) !== "html"
        ? { ok: true, finalUrl: response.url } : { ok: false, reason: "invalid_mp4" };
    }
    const response = await fetchWithTimeout(stream.url, { headers }, 4000);
    const text = response.ok ? await response.text() : "";
    if (!response.ok || !text.trimStart().startsWith("#EXTM3U")) return { ok: false, reason: "invalid_hls" };
    let media = text; let finalUrl = response.url;
    if (text.includes("#EXT-X-STREAM-INF")) {
      const line = text.split(/\r?\n/).find((x) => x && !x.startsWith("#"));
      if (!line) return { ok: false, reason: "no_variant" };
      finalUrl = new URL(line, response.url).toString();
      const variant = await fetchWithTimeout(finalUrl, { headers }, 4000);
      media = variant.ok ? await variant.text() : "";
      if (!variant.ok || !media.includes("#EXTINF")) return { ok: false, reason: "invalid_variant" };
    }
    const segments = media.split(/\r?\n/).map((x) => x.trim()).filter((x) => x && !x.startsWith("#"));
    if (!segments.length) return { ok: false, reason: "no_segment" };
    const indexes = Array.from(new Set([...Array(Math.min(8, segments.length)).keys(), Math.floor(segments.length * 0.25), Math.floor(segments.length * 0.6)])).slice(0, 10);
    const results = await Promise.all(indexes.map(async (index) => {
      try {
        const result = await fetchWithTimeout(new URL(segments[index], finalUrl).toString(), { headers: { ...headers, range: "bytes=0-255" } }, 4000);
        const bytes = await readAtMost(result, new AbortController().signal);
        const kind = classifyChunk(bytes);
        const pass = (result.status === 200 || result.status === 206) && (kind === "ts" || kind === "fmp4" || (kind === "unknown" && stream.type !== "hls"));
        return { index, pass, kind, contentType: result.headers.get("content-type") || "" };
      } catch { return { index, pass: false, kind: "unknown", contentType: "" }; }
    }));
    const failures = results.filter((result) => !result.pass).length;
    return { ok: failures === 0, healthy: failures === 0, unstable: failures >= 1 && failures <= 2, failures, segments: results, kind: "media" };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "network_error" };
  } finally { clearTimeout(totalCap); }
}
