import type { ParsedEpisodes, Episode } from "./client";
export type EpisodeRow = { play_id: string; anilist_id: number; episode_number: number; title: string|null; title_japanese: string|null; title_romaji: string|null; description: string|null; image_url: string|null; air_date: string|null; duration: number|null; filler: boolean; recap: boolean; sub_providers: { provider:string; episodeId:string }[]; dub_providers: { provider:string; episodeId:string }[] };
const priority = ["reanime", "animegg", "anikoto", "kaa", "aniwaves", "senshi", "anipm", "mkissa"];
const clean = (value: any) => typeof value === "string" ? value.replaceAll("`", "'").trim() || null : value ?? null;
const duration = (value: any) => typeof value === "number" ? (value <= 300 ? value * 60 : value) : null;
export function mergeEpisodes(parsed: ParsedEpisodes, anilistId: number): EpisodeRow[] {
  const providers = Object.keys(parsed.providers); const order = [...priority.filter((p) => providers.includes(p)), ...providers.filter((p) => !priority.includes(p))];
  const numbers = new Set<number>(); for (const p of providers) for (const ep of [...parsed.providers[p].sub, ...parsed.providers[p].dub]) if (Number.isInteger(ep.number) && ep.number >= 1) numbers.add(ep.number);
  return [...numbers].sort((a,b)=>a-b).map((number) => {
    const first = (field: keyof Episode) => { for (const p of order) { const ep = [...parsed.providers[p].sub, ...parsed.providers[p].dub].find((e) => e.number === number); const value = ep?.[field]; if (value !== undefined && value !== null && value !== "") return value; } return null; };
    const bool = (field: "filler"|"recap") => { for (const p of order) { const ep = [...parsed.providers[p].sub, ...parsed.providers[p].dub].find((e) => e.number === number); if (typeof ep?.[field] === "boolean") return ep[field]; } return false; };
    const list = (audio: "sub"|"dub") => order.flatMap((provider) => parsed.providers[provider][audio].filter((ep) => ep.number === number).map((ep) => ({ provider, episodeId: ep.id })));
    return { play_id:`${anilistId}-${number}`, anilist_id:anilistId, episode_number:number, title:clean(first("title")), title_japanese:clean(first("titleJapanese")), title_romaji:clean(first("titleRomanji")), description:clean(first("description")), image_url:clean(first("image")), air_date:clean(first("airDate")), duration:duration(first("duration")), filler:bool("filler"), recap:bool("recap"), sub_providers:list("sub"), dub_providers:list("dub") };
  });
}
