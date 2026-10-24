import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import * as MediaCardExpanded from "@/app/components/MediaCards/MediaInfoExpandedWithCover";
import { getMediaInfo } from "@/app/lib/anilist/medias.server";
import EpisodesListContainer from "./components/EpisodesListContainer";
import VideoPlayer from "./components/VideoPlayer";
import WatchControls from "./components/WatchControls";
import styles from "./page.module.css";

function clean(value: string | null | undefined) {
  return (value || "").replace(/<[^>]*>/g, "").trim();
}

function validEpisode(value: string | undefined) {
  const episode = Number(value);
  return Number.isInteger(episode) && episode >= 1 && episode <= 10000
    ? episode
    : null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ep?: string; episode?: string };
}) {
  const media = await getMediaInfo({ id: Number(params.id) });
  if (!media) return { title: "Not Found | KumoriTV" };
  const episode =
    media.format === "MOVIE"
      ? 1
      : validEpisode(searchParams.ep || searchParams.episode) || 1;
  const title =
    media.format === "MOVIE"
      ? media.title.english || media.title.userPreferred
      : `Episode ${episode} - ${media.title.userPreferred}`;
  return {
    title: `${title} | KumoriTV`,
    description: clean(media.description),
  };
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: {
    ep?: string;
    episode?: string;
    audio?: string;
    dub?: string;
    t?: string;
    provider?: string;
  };
}) {
  const id = Number(params.id);
  const media: any = await getMediaInfo({ id });
  if (!media) notFound();
  const episode =
    media.format === "MOVIE"
      ? 1
      : validEpisode(searchParams.ep || searchParams.episode) || 1;
  if (
    media.format !== "MOVIE" &&
    (searchParams.ep || searchParams.episode) &&
    !validEpisode(searchParams.ep || searchParams.episode)
  )
    redirect(`/watch/${id}?ep=1`);
  if (media.status === "FINISHED" && media.episodes && episode > media.episodes)
    notFound();
  const audio =
    searchParams.audio === "dub" || searchParams.dub === "true" ? "dub" : "sub";
  const initialTime = Math.max(0, Number(searchParams.t) || 0);
  const language = cookies().get("subtitle_language")?.value || "English";
  const englishTitle = media.title.english || media.title.userPreferred;
  return (
    <main id={styles.container}>
      <section className={styles.background}>
        <div id={styles.video_container}>
          <VideoPlayer
            anilistId={id}
            episode={episode}
            audio={audio}
            subtitleLanguage={language}
            initialTime={initialTime}
            title={englishTitle}
            provider={searchParams.provider}
          />
          <WatchControls
            anilistId={id}
            episode={episode}
            audio={audio}
            episodeCount={media.episodes}
          />
        </div>
      </section>
      <section id={styles.media_info_container}>
        <div id={styles.heading_info_container}>
          <h1>
            EP {episode} -{" "}
            {media.format === "MOVIE"
              ? englishTitle
              : media.title.userPreferred}
          </h1>
          <MediaCardExpanded.Container mediaInfo={media}>
            <MediaCardExpanded.Description description={media.description} />
          </MediaCardExpanded.Container>
        </div>
        <EpisodesListContainer
          mediaId={id}
          activeEpisodeNumber={episode}
          audio={audio}
          nextAiringEpisodeInfo={media.nextAiringEpisode || undefined}
        />
      </section>
    </main>
  );
}
