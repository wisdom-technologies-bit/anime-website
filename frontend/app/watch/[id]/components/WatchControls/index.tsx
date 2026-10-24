"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./component.module.css";
import { useWatchState } from "../WatchState";
export default function WatchControls({
  anilistId,
  episode,
  audio,
  episodeCount,
}: {
  anilistId: number;
  episode: number;
  audio: "sub" | "dub";
  episodeCount?: number | null;
}) {
  const state = useWatchState();
  const [autoSkip, setAutoSkip] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  useEffect(() => {
    try {
      setAutoSkip(localStorage.getItem("autoSkip") === "true");
      setAutoNext(localStorage.getItem("autoNext") !== "false");
    } catch {}
  }, []);
  const languages = Array.from(
    new Map(state.subtitles.map((x: any) => [x.label || x.lang, x])).values(),
  );
  const setPref = (
    key: string,
    value: boolean,
    setter: (v: boolean) => void,
  ) => {
    setter(value);
    try {
      localStorage.setItem(key, String(value));
    } catch {}
  };
  const next = state.servers.find(
    (x) => x.id !== state.activeProvider && x.healthy !== false,
  );
  return (
    <div className={styles.wrapper} data-testid="watch-controls">
      {episode > 1 ? (
        <Link
          className={styles.button}
          data-testid="watch-prev"
          href={`/watch/${anilistId}?ep=${episode - 1}&audio=${audio}`}
        >
          ‹ Prev
        </Link>
      ) : (
        <button className={styles.button} disabled>
          ‹ Prev
        </button>
      )}
      {episodeCount && episode >= episodeCount ? (
        <button className={styles.button} disabled>
          Next ›
        </button>
      ) : (
        <Link
          className={styles.button}
          data-testid="watch-next"
          href={`/watch/${anilistId}?ep=${episode + 1}&audio=${audio}`}
        >
          Next ›
        </Link>
      )}
      <div className={styles.segment} role="group" aria-label="Audio">
        <button
          className={`${styles.button} ${audio === "sub" ? styles.selected : ""}`}
          aria-pressed={audio === "sub"}
          disabled={!state.availableAudio.sub}
          title={!state.availableAudio.sub ? "Subtitles unavailable" : undefined}
          onClick={() => { if (state.availableAudio.sub) window.location.href = `/watch/${anilistId}?ep=${episode}&audio=sub`; }}
        >
          SUB
        </button>
        <button
          className={`${styles.button} ${audio === "dub" ? styles.selected : ""}`}
          aria-pressed={audio === "dub"}
          disabled={!state.availableAudio.dub}
          title={!state.availableAudio.dub ? "Dub unavailable" : undefined}
          onClick={() => { if (state.availableAudio.dub) window.location.href = `/watch/${anilistId}?ep=${episode}&audio=dub`; }}
        >
          DUB
        </button>
      </div>
      <label className={styles.label}>
        Server
        <select
          className={styles.select}
          data-testid="watch-server-select"
          aria-label="Server selector"
          value={state.selectedServer}
          onChange={(e) => state.selectServer(e.target.value)}
        >
          <option value="auto">Auto</option>
          {state.servers.map((server: any) => (
            <option key={server.id} value={server.id}>
              {server.label || `Server ${server.id}`}
              {server.type === "embed" ? " (embed)" : ""}
              {server.healthy === false ? " (unstable)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.label}>
        Subtitles
        <select
          className={styles.select}
          aria-label="Subtitles"
          value={state.subtitleLanguage}
          onChange={(e) => state.setSubtitleLanguage(e.target.value)}
        >
          <option value="Off">Off</option>
          {languages.map((x: any) => (
            <option key={x.label || x.lang} value={x.label || x.lang}>
              {x.label || x.lang}
            </option>
          ))}
        </select>
      </label>
      <span className={styles.sync}>
        <span>Sync {state.offset.toFixed(1)}s</span>
        <button
          className={styles.button}
          onClick={() => state.setOffset(state.offset - 0.5)}
        >
          -0.5s
        </button>
        <button
          className={styles.button}
          onClick={() => state.setOffset(state.offset + 0.5)}
        >
          +0.5s
        </button>
      </span>
      <label className={styles.label}>
        <input
          className={styles.check}
          data-testid="watch-auto-skip"
          type="checkbox"
          checked={autoSkip}
          onChange={(e) => setPref("autoSkip", e.target.checked, setAutoSkip)}
        />
        Auto Skip
      </label>
      <label className={styles.label}>
        <input
          className={styles.check}
          data-testid="watch-auto-next"
          type="checkbox"
          checked={autoNext}
          onChange={(e) => setPref("autoNext", e.target.checked, setAutoNext)}
        />
        Auto Next
      </label>
      <button
        className={`${styles.button} ${styles.secondary}`}
        disabled={!next}
        onClick={() => state.tryNextServer("network")}
      >
        Try next server
      </button>
      {state.status === "error" && (
        <button className={styles.linkButton} onClick={state.retry}>
          Retry
        </button>
      )}
      <small className={styles.status}>
        {state.status === "loading"
          ? "Loading..."
          : state.status === "error"
            ? state.errorMessage
            : state.hardsub
              ? "Subtitles are built into this server"
              : `Server ${state.activeProvider || "Auto"}`}
      </small>
    </div>
  );
}
