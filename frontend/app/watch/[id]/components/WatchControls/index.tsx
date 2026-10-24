"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  anilistId: number;
  episode: number;
  audio: "sub" | "dub";
  episodeCount?: number | null;
  availableAudio?: { sub?: boolean; dub?: boolean };
  servers?: Array<{
    id: string;
    label: string;
    type: string;
    healthy: boolean;
    hardsub: boolean;
  }>;
  onProviderChange?: (provider: string) => void;
};

export default function WatchControls({
  anilistId,
  episode,
  audio,
  episodeCount,
  availableAudio = { sub: true, dub: true },
  servers = [],
  onProviderChange,
}: Props) {
  const [autoSkip, setAutoSkip] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [provider, setProvider] = useState("auto");
  const [availableServers, setAvailableServers] = useState(servers);
  const [status, setStatus] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/watch/${anilistId}/${episode}?audio=${audio}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled && Array.isArray(body?.servers))
          setAvailableServers(body.servers);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [anilistId, episode, audio]);
  useEffect(() => {
    try {
      setProvider(
        localStorage.getItem(`kumori_server_pref_v1:${anilistId}:${audio}`) ||
          "auto",
      );
      setAutoSkip(localStorage.getItem("autoSkip") === "true");
      setAutoNext(localStorage.getItem("autoNext") !== "false");
    } catch {}
  }, [anilistId, audio]);
  const choose = (value: string) => {
    setProvider(value);
    try {
      const key = `kumori_server_pref_v1:${anilistId}:${audio}`;
      value === "auto"
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, value);
    } catch {}
    onProviderChange?.(value === "auto" ? "" : value);
  };
  const next = availableServers.find(
    (server) => server.id !== provider && server.healthy,
  );
  const reportAndChoose = (serverId: string) => {
    void fetch("/api/watch/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        anilistId,
        episode,
        audio,
        provider: provider === "auto" ? serverId : provider,
        reason: "network",
      }),
    }).catch(() => undefined);
    choose(serverId);
    setStatus("Switching server...");
  };
  const setPref = (
    key: string,
    value: boolean,
    setter: (value: boolean) => void,
  ) => {
    setter(value);
    try {
      localStorage.setItem(key, String(value));
    } catch {}
  };
  return (
    <div
      data-testid="watch-controls"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        padding: "10px 0",
        fontSize: 13,
      }}
    >
      {episode > 1 ? (
        <Link href={`/watch/${anilistId}?ep=${episode - 1}&audio=${audio}`}>
          Prev
        </Link>
      ) : (
        <button disabled type="button">
          Prev
        </button>
      )}
      {episodeCount && episode >= episodeCount ? (
        <button disabled type="button">
          Next
        </button>
      ) : (
        <Link href={`/watch/${anilistId}?ep=${episode + 1}&audio=${audio}`}>
          Next
        </Link>
      )}
      <span role="group" aria-label="Audio">
        <Link
          aria-disabled={!availableAudio.sub}
          href={
            availableAudio.sub
              ? `/watch/${anilistId}?ep=${episode}&audio=sub`
              : "#"
          }
        >
          SUB
        </Link>
        <Link
          aria-disabled={!availableAudio.dub}
          href={
            availableAudio.dub
              ? `/watch/${anilistId}?ep=${episode}&audio=dub`
              : "#"
          }
        >
          DUB
        </Link>
      </span>
      <label>
        Server{" "}
        <select
          aria-label="Server selector"
          value={provider}
          onChange={(event) => choose(event.target.value)}
        >
          <option value="auto">Auto</option>
          {availableServers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.label}
              {server.type === "embed" ? " (embed)" : ""}
              {!server.healthy ? " — unstable" : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={autoSkip}
          onChange={(event) =>
            setPref("autoSkip", event.target.checked, setAutoSkip)
          }
        />{" "}
        Auto Skip
      </label>
      <label>
        <input
          type="checkbox"
          checked={autoNext}
          onChange={(event) =>
            setPref("autoNext", event.target.checked, setAutoNext)
          }
        />{" "}
        Auto Next
      </label>
      <button
        type="button"
        disabled={!next}
        onClick={() => next && reportAndChoose(next.id)}
      >
        Try next server
      </button>
      <small>
        {status ||
          (provider === "auto"
            ? "Auto"
            : availableServers.find((server) => server.id === provider)
                ?.label || provider)}
      </small>
    </div>
  );
}
