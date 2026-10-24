export type ChunkKind = "ts" | "fmp4" | "html" | "unknown";

const FMP4_BRANDS = new Set(["ftyp", "styp", "moof", "sidx", "free", "mdat"]);

function ascii(bytes: Uint8Array, start: number, end: number) {
  let value = "";
  for (let i = start; i < Math.min(end, bytes.length); i++) value += String.fromCharCode(bytes[i]);
  return value;
}

export function classifyChunk(bytes: Uint8Array): ChunkKind {
  if (bytes.length > 0 && bytes[0] === 0x47 && (bytes.length < 189 || bytes[188] === 0x47)) return "ts";
  if (bytes.length >= 8 && FMP4_BRANDS.has(ascii(bytes, 4, 8))) return "fmp4";
  const text = new TextDecoder().decode(bytes);
  const withoutBom = text.slice(text.charCodeAt(0) === 0xfeff ? 1 : 0);
  const first = withoutBom.trimStart().toLowerCase();
  if (/^<(?:!doctype|html|head|body|\?xml|script)(?:\s|>|$)/.test(first)) return "html";
  if (bytes[0] !== 0x47 && bytes.length && text.slice(0, 512).toLowerCase().match(/<html|cloudflare|just a moment/)) return "html";
  return "unknown";
}

export function sniffContentType(kind: ChunkKind) {
  return kind === "ts" ? "video/mp2t" : kind === "fmp4" ? "video/mp4" : null;
}
