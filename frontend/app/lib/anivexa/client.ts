import "server-only";

export const ANIVEXA_BASE = process.env.ANIVEXA_BASE_URL || "https://anivexa.otakunaija.name.ng";
export type Episode = { id: string; audio?: string; number: number; title?: string; titleJapanese?: string; titleRomanji?: string; image?: string; airDate?: string; duration?: number; description?: string; score?: number; filler?: boolean; recap?: boolean; uncensored?: boolean; sourceNumber?: number };
export type ProviderEpisodes = { sub: Episode[]; dub: Episode[] };
export type ParsedEpisodes = { mappings: any; providers: Record<string, ProviderEpisodes>; hasAnyEpisode: boolean; isNotFound: boolean };
export class AnivexaTimeout extends Error { name = "AnivexaTimeout"; }
export class AnivexaHttpError extends Error { name = "AnivexaHttpError"; constructor(public status: number, message: string) { super(message); } }

async function request(path: string, timeoutMs = 45000): Promise<any> {
  let last: unknown;
  for (let attempt = 0; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${ANIVEXA_BASE}/${path}`, { cache: "no-store", signal: controller.signal, headers: { "User-Agent": "KumoriTV/2.8" } });
      clearTimeout(timer);
      if (response.ok) return response.json();
      if (response.status >= 400 && response.status < 500) throw new AnivexaHttpError(response.status, `AniVexa returned ${response.status}`);
      throw new AnivexaHttpError(response.status, `AniVexa server error ${response.status}`);
    } catch (error) {
      clearTimeout(timer); last = error;
      if (error instanceof AnivexaHttpError && error.status < 500) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw new AnivexaTimeout(`AniVexa timed out after ${timeoutMs}ms`);
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, [500, 1500][attempt] + Math.random() * 250));
    }
  }
  throw last;
}
export const getEpisodes = (anilistId: number, options: { timeoutMs?: number } = {}) => request(`episodes/${anilistId}`, options.timeoutMs).then(parseEpisodesResponse);
export const getMap = (anilistId: number, options: { timeoutMs?: number } = {}) => request(`map/${anilistId}`, options.timeoutMs);

export function parseEpisodesResponse(json: any): ParsedEpisodes {
  const mappings = json?.mappings ?? null; const providers: Record<string, ProviderEpisodes> = {};
  for (const [provider, value] of Object.entries(json || {})) {
    if (["mappings", "page", "type"].includes(provider) || !value || typeof value !== "object") continue;
    const episodes = (value as any).episodes;
    if ((value as any).error || !episodes) continue;
    const sub = Array.isArray(episodes.sub) ? episodes.sub.filter((ep: any) => ep && typeof ep.id === "string") : [];
    const dub = Array.isArray(episodes.dub) ? episodes.dub.filter((ep: any) => ep && typeof ep.id === "string") : [];
    if (sub.length || dub.length) providers[provider] = { sub, dub };
  }
  const hasAnyEpisode = Object.values(providers).some((p) => p.sub.length || p.dub.length);
  return { mappings, providers, hasAnyEpisode, isNotFound: mappings?.title == null && !hasAnyEpisode };
}
