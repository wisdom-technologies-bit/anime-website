"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import styles from "./component.module.css";
import MarkEpisodeAsWatchedButton from "@/app/components/Buttons/MarkEpisodeAsWatched";
import { convertFromUnix } from "@/app/lib/formatDateUnix";

type Props = {
  mediaId: number;
  activeEpisodeNumber: number;
  audio: "sub" | "dub";
  nextAiringEpisodeInfo?: { episode: number; airingAt?: number };
};
export default function EpisodesListContainer({
  mediaId,
  activeEpisodeNumber,
  audio,
  nextAiringEpisodeInfo,
}: Props) {
  const [state, setState] = useState<any>(null);
  const [retry, setRetry] = useState(0);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const active = useRef<HTMLLIElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const searchParams = useSearchParams();
  useEffect(() => {
    let live = true;
    const load = () =>
      fetch(`/api/anime/${mediaId}/episodes`)
        .then((r) => r.json())
        .then((x) => {
          if (live) setState(x);
        })
        .catch(() => {});
    load();
    const timer = setInterval(() => {
      if (state?.status === "syncing") load();
    }, 3000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [mediaId, retry, state?.status]);
  useEffect(() => {
    const saved = window.localStorage.getItem("kumori_episode_order_v1");
    if (saved === "asc" || saved === "desc") setOrder(saved);
  }, []);
  useEffect(() => {
    const item = active.current;
    const container = list.current;
    if (!item || !container) return;
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    if (itemTop < container.scrollTop) container.scrollTop = itemTop;
    else if (itemBottom > container.scrollTop + container.clientHeight) {
      container.scrollTop = itemBottom - container.clientHeight;
    }
  }, [state, activeEpisodeNumber, order]);
  const toggleOrder = () => {
    const nextOrder = order === "desc" ? "asc" : "desc";
    setOrder(nextOrder);
    window.localStorage.setItem("kumori_episode_order_v1", nextOrder);
  };
  const loading = !state || state.status === "syncing";
  const episodes = state?.episodes
    ? [...state.episodes].sort((a: any, b: any) =>
        order === "desc" ? b.number - a.number : a.number - b.number,
      )
    : [];
  return (
    <div id={styles.episodes_list_container}>
      <div className={styles.heading_container}>
        <h3>EPISODES {audio === "dub" ? "(DUB)" : ""}</h3>
        <p>on KUMORITV</p>
        <button type="button" onClick={toggleOrder}>
          {order === "desc" ? "Oldest first" : "Newest first"}
        </button>
      </div>
      {state?.status === "unavailable" ? (
        <div className={styles.filler_alert_text}>
          No episodes available yet{" "}
          <button type="button" onClick={() => setRetry((x) => x + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <motion.ol ref={list} id={styles.list_container} data-loading={loading}>
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <li className="item_placeholder" key={i} />
              ))
            : episodes.map((ep: any) => (
                <motion.li
                  key={ep.number}
                  ref={ep.number === activeEpisodeNumber ? active : null}
                  data-active={ep.number === activeEpisodeNumber}
                >
                  <Link
                    href={`/watch/${mediaId}?ep=${ep.number}&audio=${audio}`}
                    title={`Episode ${ep.number}`}
                  >
                    <div className={styles.img_container}>
                      <span>{ep.number}</span>
                    </div>
                  </Link>
                  <div className={styles.episode_info_container}>
                    <Link
                      href={`/watch/${mediaId}?ep=${ep.number}&audio=${audio}`}
                    >
                      <h4>{ep.title || `Episode ${ep.number}`}</h4>
                    </Link>
                    <MarkEpisodeAsWatchedButton
                      episodeNumber={ep.number}
                      episodeTitle={ep.title || `Episode ${ep.number}`}
                      mediaId={mediaId}
                      maxEpisodesNumber={state.episodes.length}
                      wasWatched={false}
                      showAdditionalText={false}
                    />
                  </div>
                </motion.li>
              ))}
          {nextAiringEpisodeInfo && (
            <li className={styles.next_episode_container}>
              <div className={styles.img_container}>
                <span>{nextAiringEpisodeInfo.episode}</span>
              </div>
              <div className={styles.episode_info_container}>
                <small>Next episode</small>
                {nextAiringEpisodeInfo.airingAt && (
                  <small>
                    {convertFromUnix(nextAiringEpisodeInfo.airingAt)}
                  </small>
                )}
              </div>
            </li>
          )}
        </motion.ol>
      )}
    </div>
  );
}
