'use server';

import { unstable_cache } from 'next/cache';
import { anilistFetch } from './client';
import { requestMedias, requestMediasByDateRelease, requestMediasByTrendingSort } from './queries';

const season = () => ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor((new Date().getMonth() + 1) / 3) % 4] || 'WINTER';
const timestamp = (daysAgo: number, firstHour: boolean) => {
  const date = new Date();
  date.setUTCHours(firstHour ? 0 : 23, firstHour ? 1 : 59, firstHour ? 0 : 59, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return Math.floor(date.getTime() / 1000);
};

function withoutAdult<T extends { isAdult?: boolean }>(items: T[], showAdultContent?: boolean) {
  return showAdultContent ? items : items.filter((item) => item.isAdult === false);
}

function cached<T>(name: string, variables: Record<string, unknown>, ttl: number, load: () => Promise<T>) {
  return unstable_cache(load, [`anilist:${name}`, ...Object.entries(variables).sort().map(([key, value]) => `${key}:${String(value)}`)], { tags: ['anilist'], revalidate: ttl })();
}

export type MediaOptions = {
  type: string; format?: string; sort?: string; showAdultContent?: boolean; status?: string;
  page?: number; perPage?: number; accessToken?: string; season?: string; seasonYear?: number;
  releasedOnLastXDays?: number; showOnlyReleasesOnThisDate?: boolean;
};

export async function getNewReleases(options: MediaOptions = {}) {
  const { type = 'ANIME', format = 'TV', sort = 'POPULARITY_DESC', showAdultContent = false, status, page = 1, perPage = 20 } = options;
  const variables = { type, format, sort: options.releasedOnLastXDays ? 'TIME_DESC' : sort, perPage, page, status, season: status ? undefined : season(), seasonYear: new Date().getFullYear(), showAdultContent };
  try {
    const data = await cached('new-releases', variables, options.releasedOnLastXDays ? 900 : 3600, () => anilistFetch<{ Page?: { media?: unknown[] } }>(requestMedias(), variables));
    return withoutAdult((data.Page?.media || []) as { isAdult?: boolean }[], showAdultContent);
  } catch { return []; }
}

export async function getReleasingThisWeek(options: MediaOptions = {}) {
  return getNewReleases({ ...options, format: 'TV', sort: 'TRENDING_DESC', perPage: 10, season: season(), seasonYear: new Date().getFullYear() });
}

export async function getReleasingByDaysRange(options: MediaOptions & { days?: number; pageNumber?: number } = {}) {
  const { type = 'ANIME', days = 0, pageNumber = 1, perPage = 5, showAdultContent = false, showOnlyReleasesOnThisDate } = options;
  const variables = { type, page: pageNumber, perPage, sort: 'TIME_DESC', showAdultContent, airingAt_greater: timestamp(days, true), airingAt_lesser: timestamp(showOnlyReleasesOnThisDate ? days : 0, false) };
  try {
    const data = await cached('releasing-by-days', variables, 900, () => anilistFetch<{ Page?: { airingSchedules?: unknown[] } }>(requestMediasByDateRelease(), variables));
    const results = (data.Page?.airingSchedules || []) as Array<{ media: { isAdult?: boolean } }>;
    return showAdultContent ? results : results.filter((item) => item.media?.isAdult === false);
  } catch { return []; }
}

export async function getTrendingMedia(options: { sort?: string; showAdultContent?: boolean; accessToken?: string; page?: number; perPage?: number } = {}) {
  const { sort = 'TRENDING_DESC', showAdultContent = false, page = 1, perPage = 20 } = options;
  const variables = { sort, page, perPage };
  try {
    const data = await cached('trending', variables, 3600, () => anilistFetch<{ Page?: { mediaTrends?: unknown[] } }>(requestMediasByTrendingSort(), variables));
    const results = (data.Page?.mediaTrends || []) as Array<{ media: { isAdult?: boolean } }>;
    return showAdultContent ? results : results.filter((item) => item.media?.isAdult === false);
  } catch { return []; }
}

export async function getMediaForThisFormat(options: MediaOptions & { pageNumber?: number } = {}) {
  const { type = 'ANIME', status, sort = 'TRENDING_DESC', pageNumber = 1, perPage = 20, showAdultContent = false, format = 'TV' } = options;
  const variables = { type, format, status, sort, page: pageNumber, perPage, showAdultContent, season: options.season, seasonYear: options.seasonYear };
  try {
    const data = await cached('media-for-format', variables, 3600, () => anilistFetch<{ Page?: { media?: unknown[] } }>(requestMedias(), variables));
    return withoutAdult((data.Page?.media || []) as { isAdult?: boolean }[], showAdultContent);
  } catch { return []; }
}
