# Signed proxy

Proxy tokens contain base64url JSON `{u,h,e,f}` and an HMAC-SHA256 signature. `u` is restricted to HTTP(S) public targets; `h` is limited to referer, origin, user-agent, accept, and accept-language. Tokens expire after four hours.

The manifest route validates an HLS playlist and rewrites variants as manifest proxies and keys, maps, and segments as segment proxies. Segment responses stream through Vercel and preserve range responses, with a private one-hour cache. Subtitle responses are capped at 6 MB and normalized to WebVTT; ASS styles for signs, songs, karaoke, credits, titles, and typesetting are filtered, drawing cues are dropped, and output is capped at 6000 cues. Playlists are capped at 3 MB.

Redirects are followed manually for at most five hops and every destination is rechecked for private, loopback, link-local, and non-HTTP targets. Upstream HTML errors are never forwarded. Since media bytes transit the Vercel function, bandwidth and execution limits apply.
