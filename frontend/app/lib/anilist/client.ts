export class AniListUnavailableError extends Error {
  constructor(message = 'AniList is unavailable') {
    super(message);
    this.name = 'AniListUnavailableError';
  }
}

const requestTimes: number[] = [];
const lastGoodResults = new Map<string, unknown>();

function cacheKey(query: string, variables: Record<string, unknown>) {
  return `${query}:${JSON.stringify(variables, Object.keys(variables).sort())}`;
}

function stale<T>(key: string): T | undefined {
  return lastGoodResults.get(key) as T | undefined;
}

function acquireSlot() {
  const now = Date.now();
  while (requestTimes[0] && now - requestTimes[0] >= 60000) requestTimes.shift();
  if (requestTimes.length >= 24) return false;
  requestTimes.push(now);
  return true;
}

export async function anilistFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const key = cacheKey(query, variables);
  if (!acquireSlot()) {
    const cached = stale<T>(key);
    if (cached !== undefined) return cached;
    throw new AniListUnavailableError('AniList request throttle is full');
  }

  const endpoint = process.env.ANILIST_API_URL || 'https://graphql.anilist.co';
  let response: Response;
  let retried429 = false;
  try {
    while (true) {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.status !== 429 || retried429) break;
      const retryAfter = Number(response.headers.get('Retry-After') || 0);
      console.warn(`[AniList] HTTP 429${retryAfter ? `; retry-after=${retryAfter}s` : ''}`);
      if (retryAfter > 3) break;
      retried429 = true;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      if (!acquireSlot()) break;
    }
    if (!response.ok) throw new AniListUnavailableError(`AniList HTTP ${response.status}`);
    const payload = (await response.json()) as { data?: T; errors?: unknown[] };
    if (payload.errors?.length || payload.data === undefined) throw new AniListUnavailableError('AniList GraphQL error');
    lastGoodResults.set(key, payload.data);
    return payload.data;
  } catch (error) {
    const cached = stale<T>(key);
    if (cached !== undefined) return cached;
    if (error instanceof AniListUnavailableError) throw error;
    throw new AniListUnavailableError(error instanceof Error ? error.message : 'AniList request failed');
  }
}
