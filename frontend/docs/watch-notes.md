# Watch resolver notes

- Streams are fetched from `BASE + "/" + episodeId`, where episodeId is the stored full path in `episodes.sub_providers` / `dub_providers`.
- Responses may include streams, subtitles, intro/outro timing, thumbnails, embeds, and failed servers; providers may omit subtitles and timings.
- Stream types are hls, mp4, embed, and dash. `playlist_key` streams are XOR-encrypted and unsupported; skip them with `unsupported_encrypted`.
- Requests need a full browser User-Agent and the stream referer (or a referer derived from headers/embed origin) to avoid CDN 403 HTML responses.
- Frieren episode 1 findings: anikoto, aniwaves and kaa provide plain HLS; senshi is embed-only; animegg is redirected mp4; reanime uses unsupported playlist encryption. anikoto offers soft subtitles; aniwaves and kaa are commonly hard-subbed; reanime provides intro/outro and senshi provides intro.
- Subtitle formats include ass, srt, and vtt; labels include language plus signs/songs/forced and dubtitle variants.
