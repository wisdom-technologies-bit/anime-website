# Local playback store

Guest playback is stored under `kumori_progress_v1` as a map keyed by AniList ID. Each value contains `episode`, `time`, `duration`, `audio`, `updatedAt`, optional `title`/`cover`, and a `watched` episode-number array. The store caps media at 100 most-recent records and exposes change subscriptions for UI updates.

Preferences use `autoSkip`, `autoNext`, `dubEpisodes`, and `subtitle_language`. This is intentionally device-local; Prompt 8/9 can merge these records into the signed-in Supabase account.
