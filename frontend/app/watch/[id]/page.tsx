import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import React from "react";
import styles from "./page.module.css";
import * as MediaCardExpanded from "@/app/components/MediaCards/MediaInfoExpandedWithCover";
import { MediaData } from "@/app/ts/interfaces/anilistMediaData";
import { getMediaInfo } from "@/app/lib/anilist/medias.server";

export async function generateMetadata({ params }: { params: { id: number } }) {
  const mediaInfo = await getMediaInfo({ id: Number(params.id) });
  if (!mediaInfo) return { title: "Not Found | KumoriTV" };
  return { title: `Watch ${mediaInfo.title.userPreferred} | KumoriTV`, description: `Watch ${mediaInfo.title.userPreferred} on KumoriTV.` };
}

export default async function WatchEpisode({ params }: { params: { id: number } }) {
  cookies();
  const mediaInfo = await getMediaInfo({ id: Number(params.id) });
  if (!mediaInfo) notFound();
  return (
    <main id={styles.container}>
      <section id={styles.media_info_container}>
        <div id={styles.heading_info_container}>
          <h1>{mediaInfo.title.userPreferred}</h1>
          <MediaCardExpanded.Container mediaInfo={mediaInfo as MediaData}>
            <MediaCardExpanded.Description description={mediaInfo.description} />
          </MediaCardExpanded.Container>
          <p>Streaming is being set up for KumoriTV. Check back soon.</p>
        </div>
      </section>
    </main>
  );
}
