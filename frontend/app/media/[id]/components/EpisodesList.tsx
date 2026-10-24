"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./AnimeEpisodesContainer/component.module.css";
export default function EpisodesList({
  anilistId,
  format,
  cover,
  episodes,
}: {
  anilistId: number;
  format: string | null;
  cover: string;
  episodes: any[];
}) {
  const [more, setMore] = useState(false);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  useEffect(() => {
    const value = window.localStorage.getItem("kumori_episode_order_v1");
    if (value === "asc" || value === "desc") setOrder(value);
  }, []);
  const ordered = useMemo(
    () =>
      [...episodes].sort((a, b) =>
        order === "desc"
          ? b.episode_number - a.episode_number
          : a.episode_number - b.episode_number,
      ),
    [episodes, order],
  );
  const shown = more ? ordered : ordered.slice(0, 100);
  const movie = format === "MOVIE";
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          const next = order === "desc" ? "asc" : "desc";
          setOrder(next);
          window.localStorage.setItem("kumori_episode_order_v1", next);
        }}
      >
        {order === "desc" ? "Oldest first" : "Newest first"}
      </button>
      <ul className={styles.episode_list}>
        {shown.map((ep) => (
          <li key={ep.play_id}>
            <Link
              href={`/watch/${anilistId}?ep=${ep.episode_number}&audio=${typeof window !== "undefined" && localStorage.getItem("dubEpisodes") === "true" ? "dub" : "sub"}`}
              className={styles.episode_card}
            >
              <Image
                src={ep.image_url || cover}
                alt=""
                width={160}
                height={90}
              />
              <div>
                <strong>
                  {movie ? "Watch movie" : `Episode ${ep.episode_number}`}
                </strong>
                <span>{ep.title || "Untitled"}</span>
                {ep.duration ? (
                  <small>{Math.round(ep.duration / 60)} min</small>
                ) : null}
                <div>
                  {ep.sub_providers?.length ? <b>Sub</b> : null}
                  {ep.dub_providers?.length ? <b>Dub</b> : null}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {episodes.length > 100 && !more ? (
        <button type="button" onClick={() => setMore(true)}>
          Show more
        </button>
      ) : null}
    </div>
  );
}
