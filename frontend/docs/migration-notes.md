# Migration notes

## Deleted files

- `app/news/page.tsx`, `app/news/loading.tsx`, `app/news/page.module.css`
- `app/news/[date]/[newsTitle]/[id]/page.tsx` and its CSS
- `app/news/components/NewsCard/*`
- `app/news/components/NewsSwiperContainer/*`
- `app/layout/header/components/NewsNavListHover/*`
- `app/api/consumet/consumetNews.ts`
- `app/ts/interfaces/newsInterface.d.ts`
- `app/api/wrong-media-enabled/route.ts`
- `app/api/consumet/consumetImdb.ts`

## Remaining external references

- `NEXT_PUBLIC_BACKEND_URL`: existing API modules under `app/api/**` and data-fetch helpers use it for backend/Consumet requests.
- Consumet/Aniwatch/AniList: existing search, media-info, episode, manga, and AniList user modules under `app/api/**` and `app/lib/dataFetch/**`.
- Firebase: `app/firebaseApp.ts` and client user/favourite/watch components; initialization is inert when required Firebase configuration is absent.
- Redis: no active frontend implementation found.
- IMDB: no active implementation remains after deleting `app/api/consumet/consumetImdb.ts`.
- axios-to-backend calls: existing axios modules under `app/api/**`, especially Consumet/Aniwatch search, media-info, episodes, manga, and cookie preference routes.

## Notes

- Manga visibility is controlled by `app/lib/featureFlags.ts` with `ENABLE_MANGA = false`; the read route is disabled with `notFound()`.
- Existing media/source and external-fetch modules still need a dedicated follow-up hardening pass to add uniform timeout and empty-state handling to every backend call.
