# AniVexa API Notes

- Base URL: `https://anivexa.otakunaija.name.ng`; optionally overridden by `ANIVEXA_BASE_URL`. No API key. Anime use AniList IDs.
- `GET /map/{anilistId}` returns `{ mappings: { id, title, type, format, episodes, malId, aniId, anidbId, imdbId, themoviedbId, thetvdbId, franchise, synonyms, ... } }` and typically takes about one second.
- `GET /episodes/{anilistId}` returns `{ page, type, mappings, <provider>: { episodes: { sub: Episode[], dub: Episode[] }, error?: string }, ... }`. Provider keys are object values other than `mappings`, `page`, and `type`; tolerate unknown providers. Known providers include `mkissa`, `reanime`, `anikoto`, `animegg`, `animenosub`, `anizone`, `aniwaves`, `senshi`, `kaa`, `animedunya`, `animeonsen`, `anipm`, and `anibd`.
- Providers with an error string or empty lists are skipped; one provider failure does not fail the import.
- Episode IDs are full paths such as `watch/reanime/154587/sub/reanime-1`; store exactly as returned and construct watch URLs as `BASE + "/" + id` only. Never rebuild IDs.
- Episode metadata may include `id`, `audio`, `number`, `title`, `titleJapanese`, `titleRomanji`, `image`, `airDate`, `duration`, `description`, `score`, `filler`, `recap`, `uncensored`, and `sourceNumber`. Replace backticks in titles with apostrophes.
- Duration is usually seconds, but values of 300 or less represent minutes for some movies; normalize those values to seconds.
- An unknown AniList ID may return HTTP 200 with `mappings.title = null` and no episodes. Treat that as not found. A present mapping with no episodes is no streams yet and should be retried later.
- Movies return one episode numbered 1 titled `Complete Movie`.
