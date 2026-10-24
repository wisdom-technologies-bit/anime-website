import { getMediaInfo } from "@/app/lib/anilist/medias.server";
import { createAdminClient } from "@/app/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const hits = new Map<string, number[]>();
const empty = { intro: null, outro: null, recap: null };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
const range = (start: unknown, end: unknown) =>
  Number.isFinite(Number(start)) && Number(end) > Number(start)
    ? { start: Number(start), end: Number(end) }
    : null;

export async function GET(
  request: Request,
  { params }: { params: { anilistId: string; episode: string } },
) {
  const id = Number(params.anilistId);
  const episode = Number(params.episode);
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isInteger(episode) ||
    episode < 1 ||
    episode > 10000
  )
    return json(empty, 400);
  const ip = (request.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0]
    .trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 60000);
  if (recent.length >= 60) return json({ error: "rate_limited" }, 429);
  recent.push(now);
  hits.set(ip, recent);
  try {
    const db: any = createAdminClient();
    const media: any = await getMediaInfo({ id });
    const lookupEpisode = media?.format === "MOVIE" ? 1 : episode;
    const existing = db
      ? (
          await db
            .from("skip_times")
            .select("*")
            .eq("anilist_id", id)
            .eq("episode", lookupEpisode)
            .maybeSingle()
        ).data
      : null;
    const age = existing
      ? now - new Date(existing.fetched_at).getTime()
      : Infinity;
    if (existing && age < (existing.found ? 30 * 86400000 : 86400000))
      return json({
        intro: range(existing.op_start, existing.op_end),
        outro: range(existing.ed_start, existing.ed_end),
        recap: range(existing.recap_start, existing.recap_end),
      });
    if (!media?.idMal) return json(empty);
    const query = ["op", "ed", "mixed-op", "mixed-ed", "recap"]
      .map((type) => `types=${type}`)
      .join("&");
    const response = await fetch(
      `https://api.aniskip.com/v2/skip-times/${media.idMal}/${lookupEpisode}?${query}&episodeLength=0`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return json(empty);
    const payload: any = await response.json();
    const results = Array.isArray(payload?.results) ? payload.results : [];
    const best = (types: string[]) =>
      results
        .filter((item: any) => types.includes(item.skipType))
        .sort(
          (a: any, b: any) =>
            Number(b.interval?.endTime) -
            Number(b.interval?.startTime) -
            (Number(a.interval?.endTime) - Number(a.interval?.startTime)),
        )[0]?.interval;
    const op = best(["op", "mixed-op"]);
    const ed = best(["ed", "mixed-ed"]);
    const recap = best(["recap"]);
    const result = {
      intro: range(op?.startTime, op?.endTime),
      outro: range(ed?.startTime, ed?.endTime),
      recap: range(recap?.startTime, recap?.endTime),
    };
    if (db)
      await db.from("skip_times").upsert({
        anilist_id: id,
        episode: lookupEpisode,
        found: Boolean(op || ed || recap),
        op_start: result.intro?.start ?? null,
        op_end: result.intro?.end ?? null,
        ed_start: result.outro?.start ?? null,
        ed_end: result.outro?.end ?? null,
        recap_start: result.recap?.start ?? null,
        recap_end: result.recap?.end ?? null,
        episode_length: payload.episodeLength ?? null,
      });
    return json(result);
  } catch {
    return json(empty);
  }
}
