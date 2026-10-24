"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Track } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import styles from "./component.module.css";
import { getProgress, saveProgress, shouldResume } from "@/app/lib/local-store/progress";
import { normalizeSubtitles } from "@/app/lib/watch/subtitles";

const HLS_CONFIG = { capLevelToPlayerSize: true, startLevel: -1, abrEwmaDefaultEstimate: 500000, abrBandWidthFactor: 0.8, abrBandWidthUpFactor: 0.6, maxBufferLength: 40, maxMaxBufferLength: 90, backBufferLength: 30, fragLoadingMaxRetry: 6, fragLoadingRetryDelay: 1000, manifestLoadingMaxRetry: 4, levelLoadingMaxRetry: 4, enableWorker: true, lowLatencyMode: false };
type Props = { anilistId: number; episode: number; audio: "sub" | "dub"; subtitleLanguage: string; initialTime: number; title: string };

export default function VideoPlayer({ anilistId, episode, audio, subtitleLanguage, initialTime, title }: Props) {
  const playerRef = useRef<any>(null);
  const progressRef = useRef({ time: initialTime, duration: 0 });
  const resumeRef = useRef(false);
  const recoveryRef = useRef({ network: 0, media: 0, swapped: false, switched: false });
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    console.count("[kumori-player] /api/watch fetch");
    setData(null);
    fetch(`/api/watch/${anilistId}/${episode}?audio=${audio}&sublang=${encodeURIComponent(subtitleLanguage)}`, { signal: controller.signal })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "stream_error"); return body; })
      .then((body) => { if (!controller.signal.aborted) { setData(body); setError(""); } })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message || "Unable to load stream"); });
    return () => controller.abort();
  }, [anilistId, episode, audio, subtitleLanguage, retry]);

  useEffect(() => { console.count("[kumori-player] render"); });
  const stream = data?.stream || data?.source || data;
  const source = stream?.url || stream?.src;
  const sourceId = `${data?.provider || "provider"}:${source || ""}`;
  const tracks = useMemo(() => normalizeSubtitles(stream?.subtitles || data?.subtitles || [], data?.subtitles || [], subtitleLanguage.toLowerCase().slice(0, 2)), [sourceId, subtitleLanguage]);
  useEffect(() => { if (source) console.count(`[kumori-player] src change ${sourceId}`); }, [source, sourceId]);

  const persist = () => { const value = progressRef.current; if (value.time > 0) saveProgress(anilistId, { episode, time: value.time, duration: value.duration, audio, title }); };
  useEffect(() => { const hidden = () => { if (document.visibilityState === "hidden") persist(); }; const cleanup = () => persist(); document.addEventListener("visibilitychange", hidden); window.addEventListener("pagehide", cleanup); const timer = window.setInterval(persist, 10000); return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("pagehide", cleanup); persist(); }; }, [anilistId, episode, audio, title]);
  const canPlay = () => { if (resumeRef.current || !playerRef.current) return; resumeRef.current = true; const saved = getProgress(anilistId); const time = initialTime || (saved && shouldResume(saved.time, saved.duration) ? saved.time : 0); if (time > 0) playerRef.current.currentTime = time; };
  const providerChange = (provider: any) => { provider.library = () => import("hls.js"); provider.config = HLS_CONFIG; const hls = provider.instance; if (!hls?.on) return; hls.on("hlsError", (_: string, details: any) => { console.warn("[kumori-hls]", details?.type, details?.details, details?.response?.code); if (!details?.fatal) return; if (details.type === "networkError" && recoveryRef.current.network < 3) { recoveryRef.current.network++; setTimeout(() => hls.startLoad?.(), 1000); return; } if (details.type === "mediaError" && recoveryRef.current.media < 2) { recoveryRef.current.media++; hls.recoverMediaError?.(); return; } if (details.type === "mediaError" && !recoveryRef.current.swapped) { recoveryRef.current.swapped = true; hls.swapAudioCodec?.(); hls.recoverMediaError?.(); return; } if (!recoveryRef.current.switched) { recoveryRef.current.switched = true; setError("stream_recovery_exhausted"); } }); };

  return <div className={styles.container}><div style={{ position: "relative", aspectRatio: "16 / 9", background: "#000" }}>
    {!data && !error && <img src="/assets/Eclipse-1s-200px-custom-color.svg" alt="Loading video" style={{ position: "absolute", inset: 0, margin: "auto", width: 72, height: 72 }} />}
    {data && source && <MediaPlayer ref={playerRef} key={sourceId} src={{ src: source, type: stream?.type === "mp4" ? "video/mp4" : "application/x-mpegurl" }} title={`Ep. ${episode} - ${title}`} playsInline onCanPlay={canPlay} onTimeUpdate={(event: any) => { progressRef.current.time = event.currentTarget.currentTime; progressRef.current.duration = event.currentTarget.duration || 0; }} onDurationChange={(event: any) => { progressRef.current.duration = event.currentTarget.duration || 0; }} onPlay={() => { setPlaying(true); setWaiting(false); }} onPause={() => { setPlaying(false); persist(); }} onWaiting={() => setWaiting(true)} onStalled={() => setWaiting(true)} onPlaying={() => { setWaiting(false); setPlaying(true); }} onProviderChange={providerChange}>
      <MediaProvider>{tracks.map((track: any) => <Track key={track.id} src={track.upstreamUrl} kind="subtitles" label={track.label} language={track.lang} default={track.default} />)}</MediaProvider><DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>}
    {error && <div role="alert" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "white", background: "#000" }}><div><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Retry</button></div></div>}
    {waiting && <span className="sr-only" role="status">Buffering</span>}
    {!playing && !waiting && data && <span className="sr-only">Paused</span>}
  </div></div>;
}
