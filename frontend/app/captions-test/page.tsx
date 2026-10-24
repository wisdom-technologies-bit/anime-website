"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  MediaPlayer,
  MediaProvider,
  Track,
  isHLSProvider,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

const clean = (value: unknown) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .slice(0, 40);

export default function CaptionsTest() {
  const [cfg, setCfg] = useState({ id: "21", ep: "1", audio: "sub", t: 0 });
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState("idle");
  const [vtt, setVtt] = useState<any>(null);
  const [subIndex, setSubIndex] = useState(0);
  const [mode, setMode] = useState<"none" | "native" | "vidstack">("none");
  const [log, setLog] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const ticks = useRef(0);
  const seeked = useRef(false);

  const add = (line: string) => setLog((all) => [...all.slice(-80), line]);
  const sub = data?.subtitles?.[subIndex];
  const subUrl: string | undefined = sub?.url;

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setCfg({
      id: q.get("id") || "21",
      ep: q.get("ep") || "1",
      audio: q.get("audio") === "dub" ? "dub" : "sub",
      t: Number(q.get("t") || 0),
    });
  }, []);

  async function load() {
    setStatus("loading");
    setData(null);
    setVtt(null);
    setMode("none");
    try {
      const r = await fetch(
        `/api/watch/${cfg.id}/${cfg.ep}?audio=${cfg.audio}`,
        { cache: "no-store" },
      );
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `status ${r.status}`);
      setData(body);
      const subs = body.subtitles || [];
      const en = subs.findIndex((s: any) => /english/i.test(s.label || ""));
      setSubIndex(en >= 0 ? en : 0);
      setStatus("ready");
      add(
        `watch ok: provider=${body.provider} server=${body.server} type=${body.type} subs=${subs.length}`,
      );
    } catch (e: any) {
      setStatus("error: " + e.message);
    }
  }

  async function checkVtt() {
    if (!subUrl) return;
    try {
      const r = await fetch(subUrl);
      const text = await r.text();
      const lines = text.split(/\r?\n/);
      const times = lines.filter((l) => l.includes("-->"));
      const toSec = (s: string) => {
        const p = s.trim().split(":").map(parseFloat);
        return p.length === 3
          ? p[0] * 3600 + p[1] * 60 + p[2]
          : p[0] * 60 + p[1];
      };
      let bad = 0,
        long = 0,
        back = 0,
        prev = -1;
      for (const t of times) {
        const [a, b] = t.split("-->");
        const s = toSec(a),
          e = toSec(b);
        if (!(e > s)) bad++;
        if (e - s > 12) long++;
        if (s < prev) back++;
        prev = s;
      }
      setVtt({
        status: r.status,
        type: r.headers.get("content-type"),
        bytes: text.length,
        header: lines[0],
        cues: times.length,
        endNotAfterStart: bad,
        longerThan12s: long,
        outOfOrder: back,
        sample: lines.slice(0, 10).join("\n"),
      });
    } catch (e: any) {
      setVtt({ error: e.message });
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(log.join("\n"));
      add("copied to clipboard");
    } catch {
      add("copy failed: select the log text by hand");
    }
  }

  // TEST A: native <video> + <track>, hls.js only for the stream
  useEffect(() => {
    if (mode !== "native" || !data?.url || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWebVTT: false,
        enableCEA708Captions: false,
        enableIMSC1: false,
      });
      hls.loadSource(data.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e: any, d: any) =>
        add(`hls error ${d.type}/${d.details} fatal=${d.fatal}`),
      );
    } else {
      video.src = data.url;
    }
    ticks.current = 0;
    const onTime = () => {
      ticks.current++;
    };
    const onSeek = () => add(`seeking to ${video.currentTime.toFixed(1)}`);
    const onMeta = () => {
      Array.from(video.textTracks).forEach((t) => (t.mode = "showing"));
      if (cfg.t > 0 && !seeked.current) {
        seeked.current = true;
        video.currentTime = cfg.t;
      }
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("seeking", onSeek);
    video.addEventListener("loadedmetadata", onMeta);
    const iv = setInterval(() => {
      const desc = Array.from(video.textTracks)
        .map((t, i) => {
          const act = t.activeCues
            ? Array.from(t.activeCues)
                .map((c: any) => clean(c.text))
                .join(" / ")
            : "";
          return `#${i}:${t.mode} cues=${t.cues ? t.cues.length : "null"} active="${act}"`;
        })
        .join(" ; ");
      add(
        `[A] t=${video.currentTime.toFixed(1)} timeupdates/s=${ticks.current} paused=${video.paused} ${desc}`,
      );
      ticks.current = 0;
    }, 1000);
    return () => {
      clearInterval(iv);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("seeking", onSeek);
      video.removeEventListener("loadedmetadata", onMeta);
      hls?.destroy();
    };
  }, [mode, data, subIndex]);

  // TEST B: Vidstack with the corrected Track setup
  useEffect(() => {
    if (mode !== "vidstack") return;
    ticks.current = 0;
    const iv = setInterval(() => {
      const pl = playerRef.current as any;
      if (!pl) return;
      let desc = "";
      try {
        const list = Array.from(pl.textTracks as any) as any[];
        desc = list
          .map((t, i) => {
            const act = Array.from(t.activeCues || [])
              .map((c: any) => clean(c.text))
              .join(" / ");
            return `#${i}:${t.mode} ready=${t.readyState} cues=${t.cues ? t.cues.length : "null"} active="${act}"`;
          })
          .join(" ; ");
      } catch (e: any) {
        desc = "tracks error " + e.message;
      }
      const capEl = document.querySelector("media-captions, .vds-captions");
      add(
        `[B] t=${Number(pl.state?.currentTime ?? 0).toFixed(1)} timeupdates/s=${ticks.current} paused=${pl.state?.paused} ${desc} | dom="${clean(capEl?.textContent)}"`,
      );
      ticks.current = 0;
    }, 1000);
    return () => clearInterval(iv);
  }, [mode]);

  return (
    <main
      style={{
        padding: 12,
        color: "#fff",
        fontFamily: "sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h2>Captions test</h2>
      <p style={{ fontSize: 12 }}>
        id={cfg.id} ep={cfg.ep} audio={cfg.audio} start={cfg.t}s | status:{" "}
        {status}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
        <button onClick={load}>1. Load stream</button>
        <button onClick={checkVtt} disabled={!subUrl}>
          2. Check subtitle file
        </button>
        <button
          onClick={() => {
            setLog([]);
            seeked.current = false;
            setMode("native");
          }}
          disabled={!data?.url}
        >
          3A. Native player
        </button>
        <button
          onClick={() => {
            setLog([]);
            seeked.current = false;
            setMode("vidstack");
          }}
          disabled={!data?.url}
        >
          3B. Vidstack player
        </button>
        <button onClick={copy}>Copy log</button>
      </div>

      {data && (
        <div style={{ fontSize: 12, margin: "8px 0" }}>
          <div>
            subtitle entries ({(data.subtitles || []).length}), keys of the
            selected one: {Object.keys(sub || {}).join(",")}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(data.subtitles || []).map((s: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setSubIndex(i);
                  setVtt(null);
                  setMode("none");
                }}
              >
                {i === subIndex ? "✓ " : ""}
                {s.label} [{s.lang}
                {s.default ? ", default" : ""}]
              </button>
            ))}
          </div>
        </div>
      )}

      {vtt && (
        <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", background: "#222", padding: 8 }}>
          {JSON.stringify({ ...vtt, sample: undefined }, null, 1)}
          {"\n--- first lines ---\n"}
          {vtt.sample}
        </pre>
      )}

      {mode === "native" && (
        <video
          key={`n${subIndex}`}
          ref={videoRef}
          controls
          playsInline
          style={{ width: "100%", background: "#000", aspectRatio: "16 / 9" }}
        >
          {subUrl && (
            <track
              kind="subtitles"
              src={subUrl}
              srcLang={sub?.lang || "en"}
              label={sub?.label || "Test"}
              default
            />
          )}
        </video>
      )}

      {mode === "vidstack" && data?.url && (
        <MediaPlayer
          key={`v${subIndex}`}
          ref={playerRef}
          src={{ src: data.url, type: "application/x-mpegurl" }}
          playsInline
          title="Captions test"
          onProviderChange={(p: any) => {
            if (isHLSProvider(p)) {
              p.library = () => import("hls.js");
              p.config = {
                enableWebVTT: false,
                enableCEA708Captions: false,
                enableIMSC1: false,
              };
            }
          }}
          onTimeUpdate={() => {
            ticks.current++;
          }}
          onSeeking={() => add("seeking")}
          onCanPlay={() => {
            if (cfg.t > 0 && !seeked.current && playerRef.current) {
              seeked.current = true;
              playerRef.current.currentTime = cfg.t;
            }
          }}
        >
          <MediaProvider>
            {subUrl && (
              <Track
                src={subUrl}
                kind="subtitles"
                type="vtt"
                label={sub?.label || "Test"}
                lang={sub?.lang || "en"}
                default
              />
            )}
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      )}

      <pre
        style={{
          fontSize: 11,
          whiteSpace: "pre-wrap",
          background: "#111",
          padding: 8,
          marginTop: 8,
          maxHeight: 320,
          overflow: "auto",
          userSelect: "text",
        }}
      >
        {log.join("\n") || "log is empty"}
      </pre>
    </main>
  );
}
