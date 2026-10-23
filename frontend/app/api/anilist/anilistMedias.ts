import { AiringMediaResult, MediaData, TrendingMediaResult } from '@/app/ts/interfaces/anilistMediaData';

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

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  getNewReleases: async (options: { type: string; format?: string; sort?: string; showAdultContent?: boolean; status?: string; page?: number; perPage?: number; accessToken?: string }) => homeRequest('getNewReleases', options),
  getReleasingThisWeek: async (options: { type: string; page?: number; showAdultContent?: boolean; accessToken?: string }) => homeRequest('getReleasingThisWeek', options),
  getReleasingByDaysRange: async (options: { type: string; days: 0 | 7 | 30; pageNumber?: number; perPage?: number; showAdultContent?: boolean; accessToken?: string }) => filterMedia(await homeRequest('getReleasingByDaysRange', { ...options, page: options.pageNumber }), options.showAdultContent === true),
  getTrendingMedia: async (options: { sort?: string; showAdultContent?: boolean; accessToken?: string }) => filterMedia(await homeRequest('getTrendingMedia', options), options.showAdultContent === true),
  getMediaForThisFormat: async (options: { type: string; sort?: string; status?: string | string[]; pageNumber?: number; perPage?: number; showAdultContent?: boolean; accessToken?: string }) => filterMedia(await homeRequest('getMediaForThisFormat', { ...options, page: options.pageNumber }), options.showAdultContent === true),

  getSeachResults: async ({ query, showAdultContent, signal }: { query: string; showAdultContent?: boolean; accessToken?: string; signal?: AbortSignal }) => {
    try {
      const params = new URLSearchParams({ fn: 'search', query: query.trim(), showAdultContent: String(showAdultContent === true), page: '1', perPage: '15' });
      const response = await fetch(`/api/anilist/medias?${params}`, { signal, cache: 'no-store' });
      if (!response.ok) return [];
      return ((await response.json()) as { results?: MediaData[] }).results || [];
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return [];
      return [];
    }
  },
};

export type { MediaData, AiringMediaResult, TrendingMediaResult };
