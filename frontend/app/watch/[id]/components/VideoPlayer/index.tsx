"use client";

import type { MediaDataFullInfo } from "@/app/ts/interfaces/anilistMediaData";

type VideoPlayerProps = {
  mediaInfo: MediaDataFullInfo;
  mediaSource?: string;
  mediaEpisodes?: unknown[];
  videoInfo?: unknown;
  episodeInfo?: unknown;
};

export default function VideoPlayer({ mediaInfo }: VideoPlayerProps) {
  // TODO(task-7b): restore provider-backed playback after the streaming task.
  return mediaInfo ? null : null;
}
