"use client";

import type { MediaData, MediaDataFullInfo, EpisodesType } from "@/app/ts/interfaces/anilistMediaData";

type EpisodesContainerTypes = {
  imdb?: unknown;
  mediaInfo: MediaData | MediaDataFullInfo;
  crunchyrollInitialEpisodes?: EpisodesType[];
  episodesWatchedOnAnilist?: number;
};

export default function EpisodesContainer({
  mediaInfo,
}: EpisodesContainerTypes) {
  // TODO(task-7b): restore episode sources after the streaming task.
  if (!mediaInfo) return null;
  return <p>Episodes are being prepared. Check back soon.</p>;
}
