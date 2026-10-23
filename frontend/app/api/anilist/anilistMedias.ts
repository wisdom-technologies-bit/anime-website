import { AiringMediaResult, MediaData, TrendingMediaResult } from '@/app/ts/interfaces/anilistMediaData';
import { getHeadersWithAuthorization } from './anilistUsers';
import axios from 'axios';

async function homeRequest(fn: string, options: Record<string, unknown>) {
  const params = new URLSearchParams({ fn });
  Object.entries(options).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); });
  try {
    const response = await fetch(`/api/anilist/medias?${params}`, { cache: 'no-store' });
    if (!response.ok) return [];
    return ((await response.json()) as { results?: unknown[] }).results || [];
  } catch { return []; }
}

function filterMedia<T extends MediaData | AiringMediaResult>(items: T[], adult: boolean) {
  if (adult) return items;
  return items.filter((item) => ('media' in item ? item.media?.isAdult === false : item.isAdult === false));
}

const legacyBackend = process.env.NEXT_PUBLIC_BACKEND_URL;

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  getNewReleases: async (options: { type: string; format?: string; sort?: string; showAdultContent?: boolean; status?: string; page?: number; perPage?: number; accessToken?: string }) => homeRequest('getNewReleases', options),
  getReleasingThisWeek: async (options: { type: string; page?: number; showAdultContent?: boolean; accessToken?: string }) => homeRequest('getReleasingThisWeek', options),
  getReleasingByDaysRange: async (options: { type: string; days: 0 | 7 | 30; pageNumber?: number; perPage?: number; showAdultContent?: boolean; accessToken?: string }) => filterMedia(await homeRequest('getReleasingByDaysRange', { ...options, page: options.pageNumber }), options.showAdultContent === true),
  getTrendingMedia: async (options: { sort?: string; showAdultContent?: boolean; accessToken?: string }) => filterMedia(await homeRequest('getTrendingMedia', options), options.showAdultContent === true),
  getMediaForThisFormat: async (options: { type: string; sort?: string; status?: string | string[]; pageNumber?: number; perPage?: number; showAdultContent?: boolean; accessToken?: string }) => filterMedia(await homeRequest('getMediaForThisFormat', { ...options, page: options.pageNumber }), options.showAdultContent === true),

  getSeachResults: async ({ query, showAdultContent, accessToken }: { query: string; showAdultContent?: boolean; accessToken?: string }) => {
    try {
      if (!legacyBackend) return null;
      const headers = await getHeadersWithAuthorization({ accessToken });
      const data: MediaData[] = await axios.get(`${legacyBackend}/search/any/anilist`, { params: { query, authToken: headers?.Authorization?.slice(7), page: 1, sort: 'TRENDING_DESC', perPage: 15, showAdultContent: showAdultContent ? undefined : false } }).then((res) => res.data.results);
      return showAdultContent ? data : data.filter((item) => item.isAdult === false);
    } catch { return null; }
  },
};

export type { MediaData, AiringMediaResult, TrendingMediaResult };
