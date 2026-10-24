import { createAdminClient } from "@/app/lib/supabase/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const hits = new Map<string, number[]>();
const reasons = new Set(["network", "stall", "media", "blocked"]);
export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0]
    .trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 60000);
  if (recent.length >= 20)
    return Response.json({ error: "rate_limited" }, { status: 429 });
  recent.push(now);
  hits.set(ip, recent);
  try {
    const body = await request.json();
    const id = Number(body.anilistId);
    const episode = Number(body.episode);
    if (
      !Number.isInteger(id) ||
      !Number.isInteger(episode) ||
      typeof body.audio !== "string" ||
      typeof body.provider !== "string" ||
      !reasons.has(body.reason)
    )
      return Response.json({ error: "invalid_report" }, { status: 400 });
    const db: any = createAdminClient();
    if (!db)
      return Response.json({ error: "database_unavailable" }, { status: 503 });
    const current = (
      await db
        .from("provider_health")
        .select("*")
        .eq("provider", body.provider)
        .maybeSingle()
    ).data;
    const expired =
      !current ||
      now - new Date(current.window_started_at).getTime() >= 1800000;
    await db
      .from("provider_health")
      .upsert({
        provider: body.provider,
        ok_count: expired ? 0 : current.ok_count,
        fail_count: (expired ? 0 : current.fail_count) + 1,
        window_started_at: expired
          ? new Date().toISOString()
          : current.window_started_at,
        last_fail_at: new Date().toISOString(),
        last_fail_reason: body.reason,
      });
    await db
      .from("episodes")
      .update({ resolved_provider: null })
      .eq("play_id", `${id}-${episode}`)
      .eq("resolved_provider", body.provider)
      .eq("resolved_audio", body.audio);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid_report" }, { status: 400 });
  }
}
