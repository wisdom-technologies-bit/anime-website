import { MediaDataFullInfo } from "@/app/ts/interfaces/anilistMediaData";

export async function getMediaInfo({ id }: { id: number; accessToken?: string }): Promise<MediaDataFullInfo | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    const response = await fetch(`/api/anilist/medias?fn=mediaInfo&id=${id}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { result?: MediaDataFullInfo | null };
    return data.result || null;
  } catch {
    return null;
  }
}
