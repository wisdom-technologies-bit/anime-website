"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Track } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import styles from "./component.module.css";
import {
  getProgress,
  saveProgress,
  shouldResume,
} from "@/app/lib/local-store/progress";
import { normalizeSubtitles } from "@/app/lib/watch/subtitles";
import { isSkipVisible } from "@/app/lib/watch/skip";

const HLS_CONFIG = {
  autoStartLoad: true,
  startFragPrefetch: true,
  capLevelToPlayerSize: true,
  startLevel: -1,
  maxBufferLength: 60,
  maxMaxBufferLength: 120,
  maxBufferHole: 0.5,
  backBufferLength: 30,
  enableWorker: true,
  lowLatencyMode: false,
  enableCEA708Captions: false,
  enableWebVTT: false,
  enableIMSC1: false,
  fragLoadPolicy: {
    default: {
      maxTimeToFirstByteMs: 4000,
      maxLoadTimeMs: 60000,
      timeoutRetry: { maxNumRetry: 0, retryDelayMs: 0, maxRetryDelayMs: 0 },
      errorRetry: { maxNumRetry: 1, retryDelayMs: 0, maxRetryDelayMs: 0 },
    },
  },
  playlistLoadPolicy: {
    default: {
      maxTimeToFirstByteMs: 10000,
      maxLoadTimeMs: 60000,
      timeoutRetry: { maxNumRetry: 4, retryDelayMs: 0, maxRetryDelayMs: 0 },
      errorRetry: { maxNumRetry: 4, retryDelayMs: 500, maxRetryDelayMs: 4000 },
    },
  },
  manifestLoadPolicy: {
    default: {
      maxTimeToFirstByteMs: 10000,
      maxLoadTimeMs: 60000,
      timeoutRetry: { maxNumRetry: 4, retryDelayMs: 0, maxRetryDelayMs: 0 },
      errorRetry: { maxNumRetry: 4, retryDelayMs: 500, maxRetryDelayMs: 4000 },
    },
  },
};
type Props = {
  anilistId: number;
  episode: number;
  audio: "sub" | "dub";
  subtitleLanguage: string;
  initialTime: number;
  title: string;
  provider?: string;
  onResolved?: (data: any) => void;
};

export default function VideoPlayer({
  anilistId,
  episode,
  audio,
  subtitleLanguage,
  initialTime,
  title,
  provider,
  onResolved,
}: Props) {
  const playerRef = useRef<any>(null);
  const progressRef = useRef({ time: initialTime, duration: 0 });
  const resumeRef = useRef(false);
  const recoveryRef = useRef({
    network: 0,
    media: 0,
    swapped: false,
    switched: false,
  });
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const excludedProvidersRef = useRef(new Set<string>());
  const [excludedProvider, setExcludedProvider] = useState("");
  const [skipRanges, setSkipRanges] = useState<any>(null);
  const [visibleSkip, setVisibleSkip] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    console.count("[kumori-player] /api/watch fetch");
    fetch(`/api/skip/${anilistId}/${episode}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!controller.signal.aborted) setSkipRanges(body);
      })
      .catch(() => undefined);
    setData(null);
    fetch(
      `/api/watch/${anilistId}/${episode}?audio=${audio}&sublang=${encodeURIComponent(subtitleLanguage)}${excludedProvidersRef.current.size ? `&exclude=${encodeURIComponent([...excludedProvidersRef.current].join(","))}` : ""}${provider ? `&provider=${encodeURIComponent(provider)}` : ""}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "stream_error");
        return body;
      })
      .then((body) => {
        if (!controller.signal.aborted) {
          setData(body);
          onResolved?.(body);
          setError("");
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause.message || "Unable to load stream");
      });
    return () => controller.abort();
  }, [
    anilistId,
    episode,
    audio,
    subtitleLanguage,
    retry,
    excludedProvider,
    provider,
  ]);

  useEffect(() => {
    console.count("[kumori-player] render");
  });
  const stream = data?.stream || data?.source || data;
  const source = stream?.url || stream?.src;
  const sourceId = `${data?.provider || "provider"}:${source || ""}`;
  const tracks = useMemo(
    () =>
      normalizeSubtitles(
        stream?.subtitles || data?.subtitles || [],
        data?.subtitles || [],
        subtitleLanguage.toLowerCase().slice(0, 2),
      ),
    [sourceId],
  );
  useEffect(() => {
    if (source) console.count(`[kumori-player] src change ${sourceId}`);
  }, [source, sourceId]);

  const persist = () => {
    const value = progressRef.current;
    if (value.time > 0)
      saveProgress(anilistId, {
        episode,
        time: value.time,
        duration: value.duration,
        audio,
        title,
      });
  };
  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState === "hidden") persist();
    };
    const cleanup = () => persist();
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", cleanup);
    const timer = window.setInterval(persist, 10000);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", cleanup);
      persist();
    };
  }, [anilistId, episode, audio, title]);
  const canPlay = () => {
    if (resumeRef.current || !playerRef.current) return;
    resumeRef.current = true;
    const saved = getProgress(anilistId);
    const time =
      initialTime ||
      (saved && shouldResume(saved.time, saved.duration) ? saved.time : 0);
    if (time > 0) playerRef.current.currentTime = time;
  };
  const providerSetup = (event: any) => {
    const provider = event.detail;
    if (provider?.type !== "hls") return;
    provider.library = () => import("hls.js");
    provider.config = HLS_CONFIG;
  };
  const providerChange = (provider: any) => {
    const hls = provider?.instance;
    if (!hls?.on) return;
    recoveryRef.current = {
      network: 0,
      media: 0,
      swapped: false,
      switched: false,
    };
    const handleError = (_: string, details: any) => {
      console.warn(
        "[kumori-hls]",
        details?.type,
        details?.details,
        details?.response?.code,
      );
      if (!details?.fatal) return;
      if (details.type === "networkError" && !recoveryRef.current.switched) {
        recoveryRef.current.switched = true;
        const failedProvider = data?.provider || "";
        if (failedProvider) excludedProvidersRef.current.add(failedProvider);
        void fetch("/api/watch/report", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            anilistId,
            episode,
            audio,
            provider: failedProvider,
            reason: "blocked",
          }),
        }).catch(() => undefined);
        setExcludedProvider(failedProvider);
        setWaiting(true);
        setRetry((value) => value + 1);
        return;
      }
      if (details.type === "mediaError" && recoveryRef.current.media < 3) {
        recoveryRef.current.media++;
        hls.recoverMediaError?.();
        return;
      }
      if (details.type === "mediaError" && !recoveryRef.current.swapped) {
        recoveryRef.current.swapped = true;
        hls.swapAudioCodec?.();
        hls.recoverMediaError?.();
        return;
      }
      if (!recoveryRef.current.switched) {
        recoveryRef.current.switched = true;
        const failedProvider = data?.provider || "";
        if (failedProvider) excludedProvidersRef.current.add(failedProvider);
        void fetch("/api/watch/report", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            anilistId,
            episode,
            audio,
            provider: failedProvider,
            reason: "blocked",
          }),
        }).catch(() => undefined);
        setExcludedProvider(failedProvider);
        setWaiting(true);
        setRetry((value) => value + 1);
        return;
      }
      setError("stream_recovery_exhausted");
    };
    hls.on("hlsError", handleError);
    return () => hls.off?.("hlsError", handleError);
  };

  return (
    <div className={styles.container}>
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          background: "#000",
        }}
      >
        {!data && !error && (
          <img
            src="/assets/Eclipse-1s-200px-custom-color.svg"
            alt="Loading video"
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 72,
              height: 72,
            }}
          />
        )}
        {data && source && (
          <MediaPlayer
            ref={playerRef}
            key={sourceId}
            src={{
              src: source,
              type:
                stream?.type === "mp4" ? "video/mp4" : "application/x-mpegurl",
            }}
            title={`Ep. ${episode} - ${title}`}
            playsInline
            load="eager"
            onProviderSetup={providerSetup}
            onCanPlay={canPlay}
            onTimeUpdate={(event: any) => {
              progressRef.current.time = event.currentTarget.currentTime;
              progressRef.current.duration = event.currentTarget.duration || 0;
              const current = event.currentTarget.currentTime;
              const range = ["intro", "recap", "outro"]
                .map((key) => ({ key, range: skipRanges?.[key] }))
                .find((item) => isSkipVisible(current, item.range));
              setVisibleSkip(range || null);
            }}
            onDurationChange={(event: any) => {
              progressRef.current.duration = event.currentTarget.duration || 0;
            }}
            onPlay={() => {
              setPlaying(true);
              setWaiting(false);
            }}
            onPause={() => {
              setPlaying(false);
              persist();
            }}
            onWaiting={() => setWaiting(true)}
            onStalled={() => setWaiting(true)}
            onPlaying={() => {
              setWaiting(false);
              setPlaying(true);
            }}
            onProviderChange={providerChange}
          >
            <MediaProvider>
              {(data?.subtitles ?? []).map((track: any) => (
                <Track
                  key={track.upstreamUrl}
                  src={track.upstreamUrl}
                  kind="subtitles"
                  label={track.label}
                  language={track.lang}
                  default={track.default}
                />
              ))}
            </MediaProvider>
            <DefaultVideoLayout
              icons={defaultLayoutIcons}
              thumbnails={data?.thumbnails?.url}
            />
          </MediaPlayer>
        )}
        {error && (
          <div
            role="alert"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "white",
              background: "#000",
            }}
          >
            <div>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {visibleSkip && (
          <button
            type="button"
            onClick={() => {
              if (playerRef.current && visibleSkip.range)
                playerRef.current.currentTime = visibleSkip.range.end;
              setVisibleSkip(null);
            }}
            style={{ position: "absolute", right: 16, bottom: 64, zIndex: 2 }}
          >
            Skip{" "}
            {visibleSkip.key === "intro"
              ? "Intro"
              : visibleSkip.key === "recap"
                ? "Recap"
                : "Ending"}
          </button>
        )}
        {waiting && (
          <span className="sr-only" role="status">
            Buffering
          </span>
        )}
        {!playing && !waiting && data && (
          <span className="sr-only">Paused</span>
        )}
      </div>
    </div>
  );
}
