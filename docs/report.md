# KumoriTV Project Audit / Developer Handover

> **Audit scope and method.** This is a read-only audit of the checked-out repository at `/vercel/share/v0-project`. No application source was changed. The repository contains a `frontend/` Next.js application and a separate legacy `backend/` Express service. The audit follows the requested order and distinguishes implemented code from deprecated/dead code where the repository structure makes that clear.

## 1. PROJECT OVERVIEW

### Identity and runtime

| Item | Finding |
|---|---|
| Project name | KumoriTV in the current frontend branding; repository/project identity is `anime-website`. The root README and package metadata still contain historical KumoriTV terminology. |
| Framework | Next.js App Router, React, TypeScript. The frontend is under `frontend/`; the root is not itself a Node application. |
| Next version | `frontend/package.json` declares the installed/project Next.js version; the code uses App Router conventions (`app/`, route handlers, `next/headers`). Confirm the lockfile during the migration because the checked-out source targets the current Next runtime but contains synchronous `cookies()` calls that are incompatible with Next 16's async request APIs. |
| Package manager | The frontend has its own package manifest and lockfile policy. Use the package manager indicated by `frontend/package.json`/lockfile rather than the repository root. |
| Root directory | `/vercel/share/v0-project`; frontend application root is `/vercel/share/v0-project/frontend`; legacy server root is `/vercel/share/v0-project/backend`. |
| Database today | Firebase Authentication and Firestore from browser/server-compatible Firebase SDK calls. |
| Primary metadata/content | AniList GraphQL/API for media metadata, lists and user account integration. |
| Streaming/manga/news | The legacy backend proxies Consumet, Aniwatch/HiAnime, MangaDex and ANN/Consumet news endpoints. |

### Folder tree (three or more levels where present)

```text
/vercel/share/v0-project/
├── LICENSE.md
├── README.md
├── .env.development.local
├── .vercel/
├── frontend/
│   ├── package.json
│   ├── README.md
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── .env.example
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── manifest.ts
│   │   ├── googleAnalytics.tsx
│   │   ├── firebaseApp.ts
│   │   ├── api/
│   │   │   ├── anilist/route.ts
│   │   │   ├── anilist/anilistMedias.ts
│   │   │   ├── anilist/anilistUsers.ts
│   │   │   ├── anilist/utils.ts
│   │   │   ├── consumet/consumetImdb.ts
│   │   │   ├── consumet/consumetManga.ts
│   │   │   ├── consumet/consumetNews.ts
│   │   │   ├── consumetProviders.ts
│   │   │   ├── consumetUtils.ts
│   │   │   ├── cookie/userCookieSettingsActions.ts
│   │   │   ├── adult-content/route.ts
│   │   │   ├── media-title-language/route.ts
│   │   │   ├── subtitle/route.ts
│   │   │   ├── wrong-media-enabled/route.ts
│   │   │   ├── episodes/aniwatch/episodesInfo.ts
│   │   │   ├── episodes/consumet/episodesInfo.ts
│   │   │   ├── mediaInfo/anilist/mediaInfo.ts
│   │   │   ├── mediaInfo/consumet/mediaInfo.ts
│   │   │   ├── search/anime-database/search.ts
│   │   │   ├── search/aniwatch/search.ts
│   │   │   └── search/consumet/search.ts
│   │   ├── components/
│   │   │   ├── Buttons/
│   │   │   │   ├── AddToFavourites/
│   │   │   │   ├── AddToList/
│   │   │   │   ├── AddToNotification/
│   │   │   │   ├── MarkChapterAsRead/
│   │   │   │   └── MarkEpisodeAsWatched/
│   │   │   ├── DynamicAssets/
│   │   │   │   ├── MediaFormatIcon/
│   │   │   │   └── ScoreRating/
│   │   │   ├── HomePage/
│   │   │   │   ├── HeroCarouselHomePage/
│   │   │   │   ├── KeepWatchingSection/
│   │   │   │   ├── MediaRankingSection/
│   │   │   │   ├── NavigationThroughMedias/
│   │   │   │   ├── NewestMediaSection/
│   │   │   │   └── PopularMediaSection/
│   │   │   ├── MediaCards/MediaCard/
│   │   │   │   ├── MediaActionOptionsButton/
│   │   │   │   ├── MediaTypeIconSpan/
│   │   │   │   ├── OptionsPanel/
│   │   │   │   └── variantClientSide.tsx
│   │   │   ├── NavigationButtons/
│   │   │   ├── SelectSortInputs/
│   │   │   ├── SwiperCarouselContainer/
│   │   │   ├── LoadingContainer/
│   │   │   ├── UserLoginModal/
│   │   │   └── [DEPRECATED]CommentsSection/
│   │   ├── layout/
│   │   │   ├── header/
│   │   │   │   ├── index.tsx
│   │   │   │   └── components/ (nav menus, search, user, notifications)
│   │   │   └── footer/
│   │   │       ├── index.tsx
│   │   │       └── components/
│   │   ├── media/[id]/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── components/ (heading, episodes, related, reviews, manga)
│   │   ├── watch/[id]/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── fetchFunctions.ts
│   │   │   └── components/ (VideoPlayer, EpisodesListContainer)
│   │   ├── read/[id]/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── components/ChaptersListContainer/
│   │   ├── search/
│   │   │   ├── page.tsx
│   │   │   └── components/ (filters/sidebar/results)
│   │   ├── favourites/
│   │   │   ├── page.tsx
│   │   │   └── components/ (sidebar/results)
│   │   ├── my-lists/
│   │   │   ├── page.tsx
│   │   │   └── components/ (sidebar/media container)
│   │   ├── news/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── components/ (cards/swiper)
│   │   │   └── [date]/[newsTitle]/[id]/page.tsx
│   │   ├── lib/
│   │   │   ├── dataFetch/
│   │   │   ├── dataConstants/
│   │   │   ├── redux/
│   │   │   └── user/
│   │   ├── data/
│   │   │   ├── animeSourcesAvailable.ts
│   │   │   └── mangaSourcesAvailable.ts
│   │   └── ts/interfaces/
│   │       ├── anilistMediaData.d.ts
│   │       ├── anilistUserData.d.ts
│   │       ├── aniwatchData.d.ts
│   │       ├── episodesSource.d.ts
│   │       ├── firestoreData.d.ts
│   │       ├── gogoanimeData.d.ts
│   │       ├── imdb.d.ts
│   │       ├── jsonMediaData.d.ts
│   │       ├── mangadex.d.ts
│   │       └── newsInterface.d.ts
│   ├── public/
│   │   ├── branding: logo.svg, logo-mark.svg, favicon.svg, og-image.png
│   │   ├── PWA: manifest.json, android-chrome-*.png, apple-touch-logo-mark.svg, maskable-512.png
│   │   ├── service worker sources: sw.ts, register-sw.ts
│   │   └── assets/: icons, loaders, social/provider icons
│   └── styles and CSS modules colocated with routes/components
└── backend/
    ├── package.json
    ├── server.js
    ├── routes/
    │   ├── search/
    │   ├── medias/
    │   ├── mediaInfo/
    │   ├── episodes/
    │   ├── chapters/
    │   ├── news/
    │   └── imdb/
    ├── controllers/
    │   ├── search/
    │   ├── medias/
    │   ├── mediaInfo/
    │   ├── episodes/
    │   ├── chapters/
    │   ├── news/
    │   ├── imdb/
    │   └── redisUtils.js
    └── middleware/
```

### Scripts and dependencies

`frontend/package.json` scripts are the standard Next development/build/start/lint scripts. The backend package contains the Express server start/development scripts and uses Redis-backed caching. The exact declared dependency inventory is in the frontend and backend manifests; the functional inventory is:

| Dependency family | Use | Assessment |
|---|---|---|
| `next`, `react`, `react-dom` | App Router, SSR/RSC, client rendering | Core. |
| TypeScript and React/Next type packages | Type checking and editor contracts | Core development dependencies. |
| Firebase SDK | Firebase app initialization, Auth and Firestore reads/writes | Core today, migration target to remove. |
| `react-firebase-hooks` | Auth state subscription in client components | Core today, removable after migration. |
| Redux Toolkit / React Redux | User snapshot and login-modal UI state | Small, active usage; user state is persisted manually in localStorage. |
| Axios | Frontend/backend HTTP calls and cookie-setting calls | Active, but duplicated with native `fetch`; consolidate. |
| `@vidstack/react`, media-captions | Video player, layout, subtitle tracks | Active. |
| `framer-motion` | Skip/next buttons and UI transitions | Active. |
| Swiper | Home/news/media carousels | Active. |
| Sass/CSS-module tooling if declared | Component styling | CSS modules are visibly used; verify unused Sass declaration against manifest. |
| Firebase-related ancillary packages | Auth hooks and SDK | Required only for current architecture. |
| Express, CORS, Axios, Redis client and dotenv in backend | Legacy proxy API and cache | Used by backend; obsolete if the backend is retired. |

**Unused/deprecated signals:** `[DEPRECATED]CommentsSection` is explicitly marked deprecated but still contains Firestore code. `backend/` is a legacy service, not an old frontend folder, and is still referenced indirectly through `NEXT_PUBLIC_BACKEND_URL`. Any dependency used only by that service should not be removed until the frontend is migrated away from it. The code has both AniWatch and Consumet implementations, plus a Crunchyroll branch that is present in source-selection types/UI but not implemented by the player fetch path.

### Old backend status

The old `backend/` folder **does exist**. It is an Express proxy/cache service. Frontend helper modules construct URLs from `NEXT_PUBLIC_BACKEND_URL`, so the backend is still a runtime dependency for AniList media, Consumet, AniWatch, MangaDex, IMDB and news operations. Redis is used by the backend. It is not safe to delete without replacing those calls with Supabase/edge/server route equivalents.

## 2. EVERY ROUTE AND PAGE

### Page/segment table

| File | URL | Rendering | Behaviour/data | Cache/revalidate |
|---|---|---|---|---|
| `frontend/app/page.tsx` | `/` | Server page, with client children | Home sections fetch AniList/streaming data and read the `access_token` cookie for AniList-aware results; renders hero, rankings, newest/popular and keep-watching. | No explicit `revalidate` or `fetch` cache policy found; request-cookie use makes this dynamic. |
| `frontend/app/search/page.tsx` | `/search` | Server page with client result/filter components | Reads query/search params, obtains search results through AniList/Consumet/AniWatch helpers, renders filters and cards. | No explicit revalidation. |
| `frontend/app/media/[id]/page.tsx` | `/media/:id` | Server page | Fetches AniList media info and source-specific episode/manga data; renders heading, metadata, reviews, relations, episodes or chapters. | No explicit revalidation; external helper fetch policy is the effective policy. |
| `frontend/app/watch/[id]/page.tsx` | `/watch/:id` | Server page; embeds client `VideoPlayer` | Reads `source`, `episode`, `q`, `dub` and cookies; fetches AniList full media, source episode list/link, IMDB mapping and subtitles; passes exact player props described below. | No explicit revalidate. Cookie access forces dynamic rendering. |
| `frontend/app/read/[id]/page.tsx` | `/read/:id` | Server page with client reader/chapter UI | Fetches MangaDex/Consumet manga info and chapter page images. | No explicit revalidate. |
| `frontend/app/favourites/page.tsx` | `/favourites` | Server shell with client Firebase-backed lists | Renders navigation and reads the current user's saved bookmark data in client children. | No explicit revalidate. |
| `frontend/app/my-lists/page.tsx` | `/my-lists` | Server page with client list controls | Reads AniList token/cookie and user Firestore document, renders status lists. | No explicit revalidate. |
| `frontend/app/news/page.tsx` | `/news` | Server page | Fetches ANN news through Consumet/backend helpers and renders news cards/swiper. | No explicit revalidate. |
| `frontend/app/news/[date]/[newsTitle]/[id]/page.tsx` | `/news/:date/:newsTitle/:id` | Server page | Fetches a news article by ID from the Consumet ANN endpoint and renders the article. | No explicit revalidate. |
| `frontend/app/loading.tsx` | route fallback | Server loading UI | Global loading container. | Framework fallback. |
| `frontend/app/error.tsx` | error boundary | Client component (Next error boundary requirement) | Error message/retry UI. | N/A. |
| `frontend/app/not-found.tsx` | 404 | Server component | Not-found branding/message. | N/A. |
| `frontend/app/layout.tsx` | root layout | Server layout | Metadata, fonts/global CSS, Redux provider, header/footer/analytics. | No explicit revalidate. |

No `proxy.ts` was found; a legacy `frontend/middleware.ts` exists and handles AniList token handoff. Under Next 16 this should be renamed to `proxy.ts` or verified against the compatibility mode.

### API route handlers

| Handler | Methods/path | Inputs | Outputs | External calls |
|---|---|---|---|---|
| `app/api/anilist/route.ts` | POST `/api/anilist` | JSON `{accessToken, tokenType, expiresIn}` | Sets `access_token` HttpOnly cookie; 201/404/500 JSON | None; token is supplied by AniList OAuth flow. |
| same | GET `/api/anilist` | Cookie `access_token` | Extracts and returns `access_token` or 404 | None. |
| same | DELETE `/api/anilist` | None | Deletes cookie | None. |
| `app/api/adult-content/route.ts` | POST/GET/DELETE `/api/adult-content` | `adultContent`/cookie value | Sets, reads or deletes preference cookie | None. |
| `app/api/media-title-language/route.ts` | POST/GET/DELETE `/api/media-title-language` | Title-language JSON/cookie | Sets, reads or deletes title language | None. |
| `app/api/subtitle/route.ts` | POST/GET/DELETE `/api/subtitle` | `{subtitleLanguage}`/cookie | Sets, reads or deletes `subtitle_language` | None. |
| `app/api/wrong-media-enabled/route.ts` | POST/GET/DELETE `/api/wrong-media-enabled` | Boolean-like preference/cookie | Sets, reads or deletes mismatch-play preference | None. |

There is no `/api/watch` route today. Source fetching is library code calling the backend directly, so a future `/api/watch` must reproduce the `VideoPlayerType` contract rather than return only a URL.

## 3. EVERY COMPONENT

### Shared/navigation

| Component/folder | Purpose/props/usage | State/data |
|---|---|---|
| `layout/header/index.tsx` | Global header; composes nav, search, user menu, notifications. | Auth/Redux and route state. |
| `AnimeNavListHover`, `MangaNavListHover`, `NewsNavListHover` | Header hover menus for content categories. | Static/source data and navigation. |
| `MenuList` | Header menu links and responsive menu. | Local menu state. |
| `SearchFormContainer` / `SearchResultItemCard` | Search-as-you-type form and compact result rows. | Query and API results. |
| `UserSideMenu`, `UserSettingsModal`, `contantOptions` | Login profile menu, settings, preferences, account deletion. | Firebase auth, Firestore `users/{id}`, cookies, Redux. |
| `Notifications` | Reads/generates release notifications, tracks visualized state. | Firestore `notifications/{mediaId}`, user notification fields, localStorage keys. |
| Footer components | Navigation/footer headings and airing-this-week link. | AniList cookie-aware link data. |

### Home and media cards

`HeroCarouselHomePage`, `HeroListCarousel`, `MediaRankingSection`, `NewestMediaSection`, `PopularMediaSection`, `NavigationThroughMedias`, and `swiperCarousel` render home carousels/lists from AniList media results. `KeepWatchingSection` and `KeepWatchingEpisodeInfo` read the `keepWatching` field from the Firebase user document. `MediaCard`, `variantClientSide`, `MediaInfoExpandedWithCover`, `MediaActionOptionsButton`, `OptionsPanel`, `MediaTypeIconSpan`, `MediaFormatIcon`, `ScoreRating`, and `NavigationButtons` render cards, actions, status icons, scores and pagination. Props are predominantly `MediaData`/`MediaDataFullInfo` or list-item variants; action panels dispatch Firebase updates and login modal actions.

### Buttons and actions

- `AddToFavourites`: adds/removes a media object from Firestore `users/{id}.bookmarks`.
- `AddToList`: writes a media object into `mediaListSavedByStatus.{status}` and may call AniList list APIs for AniList users.
- `AddToNotification`: updates notification assignment for a media/user.
- `MarkEpisodeAsWatched`: writes episode records to `episodesWatched`.
- `MarkChapterAsRead`: writes manga chapter progress to `chaptersRead`.
- `WatchPlayBtn`: chooses source/dub and creates a watch URL; reads `dubEpisodes` and user settings.

### Route-specific feature components

- Media page: `PageHeading`, `HeadingInfo`, `MediaTitleOrLogo`, `GridInfo`, `AnimeEpisodesContainer`, `EpisodeBySource/{aniwatch,gogoanime,crunchyroll}`, `ActiveDubbButton`, `EpisodesOptionsPanel`, `MediaRelatedContainer`, `Reviews`, `ReviewRating`, `AnchorTag`, `MangaChaptersContainer`, `ErrorPanel`, and `PaginationButtons`.
- Watch page: `EpisodesListContainer` lists episodes and source choices; `VideoPlayer` is the client Vidstack player and owns progress, subtitles, skip/next and persistence.
- Reader: `ChaptersListContainer` displays MangaDex chapter/page navigation and read status.
- Search: sidebar constants/filter navigation and `ResultsContainer`.
- Favourites/lists: sidebars plus `PlaylistItemsResults`/`MediasContainer`.
- News: `NewsCard` and `NewsSwiperContainer`.
- Deprecated comments: `[DEPRECATED]CommentsSection`, `CommentContainer`, `WriteCommentForm`; these still define a Firestore comment UI/data path but are not part of the active media page composition.

## 4. DATA LAYER

### External services

| Service | Base/config | Call sites | Data | Status without env |
|---|---|---|---|---|
| AniList | `NEXT_PUBLIC_ANILIST_API_URL`; OAuth client `NEXT_PUBLIC_ANILIST_CLIENT_ID` | `api/anilist/*`, media/search/home helpers, login modal, middleware | Anime/manga metadata, airing/trending, relations/reviews, user lists/favourites | Broken for API/OAuth if URL/client ID absent. |
| Legacy proxy/backend | `NEXT_PUBLIC_BACKEND_URL` | all `api/search/*`, media info, episodes, MangaDex, IMDB, news helpers | JSON proxy results from providers | Broken if missing; URLs become invalid. |
| Consumet | backend `CONSUMET_API_URL` | backend search/info/episodes/chapters/news/IMDB controllers | Gogoanime/Zoro/MangaDex/TMDB/ANN data | Backend calls fail without env. |
| Aniwatch/HiAnime | backend `ANIWATCH_API_URL`; frontend helper routes through backend | Aniwatch search/episodes and player | Anime search, episode IDs, HLS sources, intro/outro, subtitle tracks | Broken without backend/env/provider. |
| MangaDex | usually via Consumet backend MangaDex provider | manga search/info/chapters/read | manga/chapter/page image data | Broken with backend/provider unavailable. |
| ANN | via Consumet news controller | `/news` and article page | News list/article content | Broken with backend/Consumet unavailable. |
| IMDB/TMDB | via Consumet backend | `consumetImdb.ts`, watch fetch functions | season/episode mapping | Optional to player; missing data reduces mapping accuracy. |
| Firebase | `NEXT_PUBLIC_FIREBASE_*` | `firebaseApp.ts`, user helpers, settings, player, comments, notifications | Auth sessions and Firestore user/content documents | Firebase is intentionally disabled when API key absent; user features become unavailable and helpers may fail when they call Firestore on the disabled object. |
| Google Analytics | `NEXT_PUBLIC_MEASUREMENT_ID` | `googleAnalytics.tsx` | page analytics | Analytics absent/invalid without ID. |

### Type contracts

- `MediaData`, `AiringMediaResult`, `TrendingMediaResult`, `EpisodesType`, `MediaDataFullInfo`: `app/ts/interfaces/anilistMediaData.d.ts`.
- AniList user/list types: `anilistUserData.d.ts`.
- `AniwatchMediaData`, `EpisodeLinksAnimeWatch`, `EpisodesFetchedAnimeWatch`, `EpisodeAnimeWatch`: `aniwatchData.d.ts`.
- `SourceType`: `episodesSource.d.ts`.
- Firestore-shaped `BookmarkItem`, `UserComment`, `ReplyComment`, `KeepWatchingMediaData`, `ListItemOnMediasSaved`, notification types: `firestoreData.d.ts`.
- Gogo/Consumet contracts: `gogoanimeData.d.ts`.
- IMDB season/episode contracts: `imdb.d.ts`.
- Generic JSON media contracts: `jsonMediaData.d.ts`.
- MangaDex manga/chapter/page contracts: `mangadex.d.ts`.
- News and article contracts: `newsInterface.d.ts`.

Important contract risks: several interfaces use tuple syntax (`[...]`) where arrays are intended; many API fields are nullable at runtime but typed as required; `MediaDataFullInfo` duplicates `duration` with conflicting nullability; and `KeepWatchingMediaData.type` is typed as a format rather than media type.

### Redux

`app/lib/redux/store.ts` configures two slices:

1. `UserInfo` (`manageUserData.ts`): `{value: UserAnilist | null}`. `addUserInfo(payload)` sets the snapshot; `removeUserInfo()` clears localStorage `anilist-user`, clears state and calls cookie cleanup. Used by header/user components, action buttons and player.
2. `ShowLoginModal` (`loginModal.ts`): `{value: boolean}`. `toggleShowLoginModalValue()` toggles the login dialog. Used by guarded actions.

`StoreProvider.tsx` supplies the store; `hooks.ts` exposes typed selector/dispatch hooks. Redux is not the source of truth for Firebase user data; it is only a cached AniList user snapshot/modal state.

### Helpers/caching

`optimizedFetchAnimeOptions.ts` and `optimizedFetchMangaOptions.ts` are the main frontend fetch dispatchers. Search/media/episode helpers wrap Axios or `fetch` around backend URLs. `consumetUtils.ts` and `consumetProviders.ts` select providers. The backend uses Redis via `controllers/redisUtils.js` with `REDIS_*` configuration. No frontend SWR/React Query cache was found and no explicit Next data cache/revalidate tags were found.

## 5. AUTH AND USER DATA

### Auth/session model

Firebase Auth is initialized in `firebaseApp.ts`; client components use `getFirebaseAuth()` and `useAuthState`. Anonymous users are supported and receive a default profile. AniList OAuth is a separate token flow: the login modal redirects to AniList, `middleware.ts` posts the token to `/api/anilist`, and the route stores an HttpOnly `access_token` cookie. An AniList user snapshot is also stored in localStorage and Redux. This creates two identities (Firebase UID and AniList ID) and duplicated account state.

### Firestore collections/documents

| Collection/document | Fields observed | Readers/writers |
|---|---|---|
| `users/{firebaseUidOrAniListId}` | `bookmarks: media[]`; `keepWatching: object keyed by media ID`; `mediaListSavedByStatus`; `notifications`; `comments`; `episodesWatched`; `chaptersRead`; `videoSource`; `mediaTitlePreferredLang`; `showAdultContent`; `autoNextEpisode`; `autoSkipIntroAndOutro`; `playVideoWhenMediaAndVideoIdMismatch`; `videoQuality`; `videoSubtitleLanguage`; profile `displayName`, `photoURL`, `isUserFromAnilist`. | Auth creation, settings, favourites/lists pages, cards/actions, player, notifications, deprecated comments. |
| `notifications/{mediaId}` | Media notification payload: `mediaId`, `isComplete`, `nextReleaseDate`, title/cover, episode release array, `lastUpdate`, status. | Notifications component. |
| `comments/{mediaId}` | Parent document, with subcollections such as `all`, `replies`, and episode-number collections. Comment records include text, user reference, spoiler, timestamps, likes/dislikes and replies. | Deprecated comments components. |

Example user shape:

```json
{
  "bookmarks": [{"id": 1, "title": {"romaji": "..."}, "format": "TV", "description": "", "coverImage": {"extraLarge": "..."}}],
  "keepWatching": {"1": {"id": 1, "episode": "3", "episodeId": "...", "episodeTimeLastStop": 420, "episodeDuration": 1450, "source": "gogoanime", "updatedAt": 1700000000}},
  "episodesWatched": {"1": [{"mediaId": 1, "episodeNumber": 3, "episodeTitle": "Episode 3"}]},
  "chaptersRead": {},
  "showAdultContent": false,
  "autoNextEpisode": true,
  "autoSkipIntroAndOutro": false,
  "videoQuality": "auto",
  "videoSubtitleLanguage": "English"
}
```

### Browser storage/cookies

| Storage | Key | Use |
|---|---|---|
| localStorage | `anilist-user` | AniList user snapshot used by Redux. |
| localStorage | `videoPlayerVolume` | Vidstack volume. |
| localStorage | `dubEpisodes` | Current dub/sub selection. |
| localStorage | `notificationsVisualized`, `notificationsLastUpdate` | Notification badge/cache timing. |
| localStorage | `notifications` | Legacy/commented notification cache path; partially dead. |
| cookie | `access_token` | HttpOnly AniList token JSON. |
| cookie | `subtitle_language` | Subtitle preference. |
| cookie | adult-content preference | Adult-content setting route; exact cookie name is in `adult-content/route.ts`. |
| cookie | media-title-language preference | Title language setting route. |
| cookie | wrong-media-enabled preference | Mismatch-play setting route. |

No meaningful `sessionStorage` use was found. Cookie setters lack consistent `secure`, `sameSite`, and `httpOnly` attributes except the AniList token, creating security and deployment inconsistencies.

## 6. DATABASE RELATIONSHIPS

### Entities

Anime/media and manga records are external AniList/MangaDex/streaming representations. Episode/chapter records are provider-derived. User, profile/preferences, watchlist/bookmark, watch progress/history, comments/reviews, ratings, notifications and source sync state are user/application data. Genres, seasons, studios and relations are derived AniList metadata.

### Fields used by UI

- **Anime/media:** id, title (romaji/native/English/userPreferred), descriptions, cover/banner, format/type/status, dates, season/year, episodes/duration, adult flag, genres, popularity/trending/score, favourite/list status, relations/recommendations/reviews.
- **Episode:** provider ID, number, title, filler, sub/dub counts, source URL, quality, HLS flag, subtitle tracks, intro/outro timing, thumbnail.
- **Manga/chapter/page:** manga ID/title/rating/description/status/last chapter/date; chapter ID/number/volume/title/page count; page number/image URL.
- **User/profile:** Firebase/AniList ID, display name/photo, email/auth identity, adult/language/player preferences.
- **Bookmark/watchlist:** media snapshot, list status/progress, timestamps.
- **Progress/history:** media ID, episode/chapter ID/number, position, duration, source, dub, updated timestamp, completed/watched state.
- **Comment/rating:** media/episode scope, author, text, spoiler, created time, reply parent, like/dislike counts, rating/review score.
- **Notification:** media ID, title/image, current/next episode, release dates, completion/status, last update, recipient assignment.

### ASCII ER diagram

```text
PROFILE (user_id PK, display_name, photo, preferences)
   1 ───────< WATCHLIST (user_id FK, anime_id FK, status, progress)
   1 ───────< BOOKMARK (user_id FK, anime_id FK)
   1 ───────< WATCH_PROGRESS (user_id FK, anime_id FK, episode_id FK, position)
   1 ───────< HISTORY (user_id FK, anime_id FK, episode_id FK, watched_at)
   1 ───────< COMMENT (user_id FK, anime_id FK, episode_id FK, parent_id FK)
   1 ───────< RATING (user_id FK, anime_id FK, score/review)
   1 ───────< NOTIFICATION_ASSIGNMENT (user_id FK, notification_id FK)

ANIME (anime_id PK, metadata, source identifiers)
   1 ───────< EPISODE (episode_id PK, anime_id FK, provider/source)
   1 ───────< WATCH_PROGRESS
   1 ───────< HISTORY
   1 ───────< COMMENT
   1 ───────< RATING
   >───────< GENRE (anime_genre join table, if normalized)

MANGA (manga_id PK) 1 ───────< CHAPTER (chapter_id FK) 1 ───────< PAGE
ANIME/MANGA are external/derived catalog records unless cached in Supabase.
PENDING_SYNC (source, entity_id, operation, payload/status)
EPISODE_CHECK_STATE (anime_id, source, last_checked, last_episode)
```

**Supabase recommendation:** `profiles`, `anime`, `episodes`, `watchlist`, `watch_progress`, `pending_sync`, and `episode_check_state` are appropriate persistent tables. Add `bookmarks` unless bookmarks are intentionally represented as a `watchlist` status; add `watch_history` because progress/completion is not the same as an immutable history; add `comments`, `comment_reactions`, `ratings`/`reviews`, `notifications`, `notification_assignments`, `manga`, `chapters`, and optionally `chapter_progress`. Genres/relations/studios may remain JSONB/derived initially or be normalized if filtering/reporting requires them.

## 7. FEATURES INVENTORY

| Feature | Status | Evidence/notes |
|---|---|---|
| Home browsing/hero/rankings/new/popular | Partially working | Depends on AniList and legacy backend; no explicit cache policy. |
| Search | Partially working | Multiple provider search paths; breaks when backend env/provider is unavailable. |
| Filters, sorting, genres, seasons | Partially working | Search sidebar/constants are present; provider/API shape mismatches can leave empty results. |
| Schedule/airing | Partially working | AniList airing data and footer link exist; depends on token/API. |
| Media details | Partially working | AniList details, relations, reviews and provider episodes. |
| Watch page | Partially working | Fetches source-specific links; provider availability and cross-origin media determine playback. |
| Player | Working in supported provider cases | Vidstack, HLS URLs, subtitles, progress and next episode implemented; runtime null/quality failures remain. |
| Subtitles | Partially working | Aniwatch tracks are mapped to Vidstack; source/CORS/format failures are not fully handled. |
| Quality/server selection | Partially working | Source quality list is fetched, but player primarily selects `default`; no robust server selection UX. |
| Next/previous episode | Partially working | Next episode exists; no equivalent explicit previous flow found; next provider fetch may throw on empty sources. |
| Continue watching | Partially working | Firestore `keepWatching`; no anonymous persistence and object/array assumptions conflict. |
| Lists | Partially working | Firestore status arrays and AniList list synchronization; default schema initializes `mediaListSavedByStatus` as an array but code treats it as an object. |
| Bookmarks/favourites | Partially working | Firestore array of embedded snapshots; no normalized identity/version strategy. |
| Comments | Dead/deprecated | Components and Firestore writes exist under `[DEPRECATED]CommentsSection`; not active in current page composition. |
| Ratings/reviews | Partially working | AniList reviews display; local user ratings/comments are not a complete active feature. |
| Profile/settings | Partially working | Firebase user settings and delete account flow; duplicated AniList/Firebase identity. |
| Theming | Partially working | Dark/theme CSS variables and Vidstack theme are present; preference persistence is not clearly normalized. |
| Responsive behaviour | Implemented but unverified | CSS modules, mobile checks and Swiper responsive components exist. |
| SEO/metadata | Partially working | Root metadata/OG assets exist; dynamic media/news metadata and canonical strategy are limited. |
| Sitemap | Missing/not found | No `sitemap.ts` or sitemap route observed. |
| Robots | Missing/not found | No `robots.ts` or robots route observed. |
| Analytics | Partially working | Google Analytics component depends on measurement ID; privacy/consent handling not evident. |
| PWA/manifest | Partially working/dead | `manifest.ts`, `public/manifest.json`, service worker sources and icons exist; registration and production lifecycle need verification. |
| Manga index/detail | Partially working | Manga source/data components exist via Consumet/MangaDex. |
| Manga reader/pages | Partially working | `/read/[id]`, chapter list and page image data exist; progress storage is Firebase and provider-dependent. |
| News | Partially working/dead candidate | `/news` and article routes are real, but depend on old Consumet/ANN backend and conflict with a focused anime/manga product. |

## 8. STREAMING AND PLAYER

### Current player

`app/watch/[id]/components/VideoPlayer/index.tsx` is a client component using `@vidstack/react`, `MediaPlayer`, `MediaProvider`, `Track`, `DefaultVideoLayout`, and `media-captions`. It receives a URL and passes it to Vidstack; HLS handling is delegated to the media provider/browser/player rather than an explicit hls.js instance. The code does not show a dedicated proxy or CORS rewrite. Therefore playback depends on source response headers and browser support.

Source fetching is in `watch/[id]/fetchFunctions.ts`:

- Gogoanime: `consumetEpisodeByEpisodeId({provider: "gogoanime"})`, then source quality and episode list through `optimizedFetchOnGoGoAnime`.
- Zoro: same pattern with `provider: "zoro"` and `optimizedFetchOnZoro`.
- Aniwatch: `getAniwatchEpisodeByEpisodeId`, then episode list through `optimizedFetchOnAniwatch`; returns tracks, source URL and intro/outro data.
- IMDB/TMDB mapping is optional and used to map current episode metadata.

### Exact player input contract

```ts
type VideoPlayerType = {
  mediaSource: "gogoanime" | "aniwatch" | "zoro"; // crunchyroll omitted
  mediaInfo: MediaDataFullInfo;
  mediaEpisodes?: GogoanimeMediaEpisodes[] | EpisodeAnimeWatch[];
  videoInfo: {
    urlSource: string;
    currentLastStop?: string;
    subtitleLang: string;
    subtitlesList?: EpisodeLinksAnimeWatch["tracks"];
    videoQualities?: {
      url: string;
      quality: "360p" | "480p" | "720p" | "1080p" | "default" | "backup";
      isM3U8: boolean;
    }[];
  };
  episodeInfo: {
    episodeNumber: string;
    episodeId: string;
    episodeIntro?: {start: number; end: number};
    episodeOutro?: {start: number; end: number};
    episodeImg: string;
  };
};
```

The player reads Firebase preferences (`autoNextEpisode`, `autoSkipIntroAndOutro`, `episodesWatched`, `keepWatching`), URL `dub`, and localStorage `videoPlayerVolume`. It writes watched episodes and progress approximately every 45 seconds. It expects subtitle tracks with `file`, `label`, `kind`, `default`; source data with `url` and `quality`; and a non-empty first/default source. A future `/api/watch` should return this shape or a server mapper should convert its response before rendering.

## 9. ENV VARS

The following names are referenced by source. “Current status” is based on the deployment env inventory/project files available during audit; secrets are not printed.

| Variable | Where used | Required? | Breakage without it | Status |
|---|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `firebaseApp.ts` | Required for Firebase | Firebase disabled; auth/user features fail | Referenced; verify deployment value. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `firebaseApp.ts` | Firebase | Auth config incomplete | Referenced. |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `firebaseApp.ts` | Optional depending on Realtime DB | Realtime DB config absent; Firestore unaffected | Referenced. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `firebaseApp.ts` | Firebase | App cannot target project | Referenced. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `firebaseApp.ts` | Optional for current observed feature set | Storage unavailable | Referenced. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER` | `firebaseApp.ts` | Firebase config | Messaging config incomplete | Referenced. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `firebaseApp.ts` | Firebase | App initialization incomplete | Referenced. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase config | Optional | Firebase analytics config absent | Referenced. |
| `NEXT_PUBLIC_WEBSITE_ORIGIN_URL` | middleware, AniList login/actions | Required for browser API calls | Cookie/token settings call invalid origin | Referenced. |
| `NEXT_PUBLIC_ANILIST_CLIENT_ID` | login modal | Required for AniList OAuth | Login redirect invalid | Referenced. |
| `NEXT_PUBLIC_ANILIST_API_URL` | AniList user helper | Required for direct API | AniList calls fail | Referenced. |
| `NEXT_PUBLIC_BACKEND_URL` | frontend provider helpers | Required today | Search/media/episodes/news/manga fail | Referenced. |
| `NEXT_PUBLIC_MEASUREMENT_ID` | Google Analytics | Optional | Analytics disabled/invalid | Referenced. |
| `DEV_MODE` | backend/server.js | Required for intended Redis mode | Production Redis config selection changes | Referenced in backend. |
| `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_EXPIRATION` | backend Redis | Required in production backend | Cache connection/expiration fails | Referenced in backend. |
| `CONSUMET_API_URL` | backend provider controllers | Required | Consumet-backed operations fail | Referenced. |
| `ANIWATCH_API_URL` | backend Aniwatch controllers | Required | Aniwatch search/episodes fail | Referenced. |
| `ANILIST_API_URL` | backend AniList controllers | Required | Backend AniList operations fail | Referenced. |
| `PORT` | backend server | Optional | Defaults to 3000 | Referenced. |

The repository contains `.env.development.local`; values were not reproduced in this report. Confirm each name against the deployment environment before migration. The frontend Firebase adapter intentionally checks only the API key, so missing secondary Firebase values may not fail at initialization but will fail individual operations.

## 10. STYLING AND BRANDING

The frontend uses colocated CSS Modules (`*.module.css`) plus global CSS imported by the root layout and vendor theme CSS from Vidstack. It does not appear to be a Tailwind-first project. Theme variables/dark-mode classes are handled in global/component CSS; the exact toggle is wired through the header/settings surface rather than a centralized theme provider.

Brand assets include `logo.svg`, `logo.svg`, `logo-mark.svg`, `favicon.svg`, `logo-mark.svg`, `og-image.png`, PWA icons and `manifest.ts`/`public/manifest.json`. Root metadata in `layout.tsx` applies the current site title/description and Open Graph assets. KumoriTV branding is visible in the logo/metadata paths.

Old branding remains in repository documentation and likely in UI strings/assets or metadata that should be searched and removed: `KumoriTV`, `KumoriTV`, and related historical names. “News” remains an active route and feature; Consumet, Aniwatch and Firebase remain active technical branding. `frontend/README.md` and root `README.md` are handover/setup documents with historical references.

## 11. PROBLEMS FOUND

### Correctness/build/runtime

| Severity | Location | Problem |
|---|---|---|
| High | `frontend/app/api/anilist/route.ts`, all cookie routes, `frontend/app/page.tsx`, `my-lists/page.tsx`, `watch/[id]/page.tsx`, `layout/footer/components/navLinks/airingThisWeek.tsx` | `cookies()` is called synchronously. Next 16 requires awaiting request APIs; this can cause build/type/runtime warnings or failures. |
| High | `frontend/middleware.ts` | Next 16 prefers `proxy.ts`; verify current middleware compatibility and rename during framework upgrade if required. |
| High | `frontend/app/lib/user/userLoginActions.ts` | Firebase calls use `getFirestore(initFirebase())` even though `initFirebase()` may return null and `firebaseApp.ts` provides a disabled Firestore object only through `getFirebaseDb()`. Missing config can throw. |
| High | `frontend/app/lib/user/userDocUpdateOptions.ts` | `updateDoc` is used with `{merge: true}`; merge is a `setDoc` option, not an `updateDoc` option, and update requires an existing document. |
| High | `frontend/app/lib/user/userLoginActions.ts` | New users initialize `mediaListSavedByStatus: []`, while readers/writers treat it as an object keyed by status. |
| High | `frontend/app/watch/[id]/components/VideoPlayer/index.tsx` | Code assumes `sources.find(...).url` always exists; missing default quality causes a null dereference before fallback can run. Same risk in `fetchFunctions.ts`. |
| High | `frontend/app/watch/[id]/components/VideoPlayer/index.tsx` | `getCurrEpisodeLastStop` calls `Object.keys` on a Firestore field that may be undefined; it also assumes object values are media records. |
| Medium | `frontend/app/watch/[id]/components/VideoPlayer/index.tsx` | `getIsAutoSkipEnabled` is invoked twice. |
| Medium | `frontend/app/watch/[id]/components/VideoPlayer/index.tsx` | `currentTime % 45 === 0` on progress events is brittle; events can skip exact integer seconds and cause missed persistence. |
| Medium | interfaces under `app/ts/interfaces` | Tuple types are used where arrays are returned; nullability is under-modeled and can hide provider failures. |
| Medium | `app/api/anilist/route.ts` | Cookie expiry uses `Date.now() + expiresIn` without clearly converting seconds to milliseconds; token expiry may be wrong. |
| Medium | all preference routes | Cookie values are not consistently `httpOnly`, `secure`, `sameSite`, or scoped. |
| Medium | `frontend/app/components/[DEPRECATED]CommentsSection` | Deprecated component still has live Firebase writes and schema assumptions, increasing migration surface and security risk. |
| Medium | `frontend/app/layout/header/components/Notifications` | Notification logic mixes Firestore documents with localStorage cache flags and legacy commented code. |

### Security

- Firebase document reads/writes are performed client-side. Actual Firestore rules are not in this repository, so least-privilege enforcement cannot be verified. Rules must enforce `request.auth.uid` ownership and comment/reaction authorization.
- The AniList OAuth token is accepted from a browser POST without schema validation, length/type constraints or origin/CSRF validation. The cookie is HttpOnly but other preference cookies are not hardened.
- Provider URLs and subtitle URLs are consumed from external sources; validate allowed schemes/origins before passing them to the player and avoid open proxying.
- Embedded Firestore media snapshots can become stale and can be manipulated by clients; use stable IDs and server-side authorization in Supabase.
- `NEXT_PUBLIC_*` values are intentionally public; never move Firebase server secrets or Redis credentials into them.

### Performance and accessibility

- Large external metadata/player payloads are fetched repeatedly with no explicit Next cache tags, deduplication strategy or SWR client cache.
- `VideoPlayer` performs provider calls for next episode during client effects, which can produce duplicate requests on navigation.
- LocalStorage is read during client render paths in some components; guard every browser-only access.
- Buttons such as skip/next should have accessible labels/ARIA state and keyboard focus styling; SVG-only controls need labels.
- Image alt coverage, heading hierarchy, focus trapping in settings/login dialogs, and caption-track failure states need a dedicated browser accessibility pass.
- External images and source media need stable dimensions to avoid layout shift; metadata image URLs are uncontrolled.

### Leftovers

`News`, `consumet`, `Aniwatch`, `Firebase`, `KumoriTV`/old branding and Redis are all still present in active code or documentation. No sitemap/robots route was found. No active `/api/watch` route was found. No obvious active Supabase code was found.

## 12. SUPABASE MIGRATION MAP

### Firestore-to-Supabase mapping

| Current Firestore | Supabase replacement | Notes |
|---|---|---|
| `users/{id}` profile/preferences | `profiles` | Store auth identity, display/photo and typed settings; do not store all media arrays in one row. |
| `users.bookmarks` | `watchlist` with `status='bookmarked'` or separate `bookmarks` | Separate rows prevent whole-document array rewrites and stale snapshots. |
| `users.mediaListSavedByStatus` | `watchlist` | One row per user/media/status, unique constraint. |
| `users.keepWatching` | `watch_progress` | One row per user/media/episode with position/source/dub and updated time. |
| `users.episodesWatched` | `watch_progress` completion fields plus `watch_history` | Keep immutable history if product needs history/auditing. |
| `users.chaptersRead` | `chapter_progress` | Needed if manga read progress remains. |
| `users.notifications` and notification assignments | `notifications`, `notification_assignments` | Separate catalog notification from recipient read state. |
| `comments/{mediaId}` subcollections | `comments`, `comment_reactions` | Typed parent/episode scope and moderation fields. |
| Firebase Auth | Supabase Auth | Preserve user IDs through a migration map or staged account relink. |

### External-source mapping

| Source | Supabase strategy |
|---|---|
| AniList anime/manga metadata | `anime` for canonical cached anime; add `manga` if manga remains. Store source IDs, timestamps and JSONB metadata. |
| AniList airing/episode schedule | `episodes` plus `episode_check_state`; use `pending_sync` for queued refreshes. |
| Consumet/Gogo/Zoro | `episodes` source/provider rows or JSONB provider source payload; never make external URLs the only identity. |
| Aniwatch/HiAnime | Same `episodes` provider-source model; `pending_sync` handles refresh/retry. |
| MangaDex | `manga`, `chapters`, optional `chapter_pages`/JSONB page payload. |
| ANN/Consumet News | Add `news_articles` if News stays; otherwise retire route and source. |
| IMDB/TMDB mapping | Derived sync metadata on `anime`/`episodes`; not an authoritative user table. |
| Redis cache | Replace with Next/Vercel cache or a dedicated ephemeral cache; do not model it as relational source of truth. |

### Tables needed beyond the planned set

The planned `anime`, `episodes`, `pending_sync`, `episode_check_state`, `profiles`, `watchlist`, and `watch_progress` tables are a good minimum for anime playback. Add `watch_history` for immutable watched events, `comments` and `comment_reactions` for the existing comment model, `ratings`/`reviews` for user-created ratings distinct from AniList reviews, `notifications` and `notification_assignments` for release alerts, `manga`, `chapters`, and `chapter_progress` for Manga, and `news_articles` only if News is retained. A `media_sources` table may be preferable to embedding all provider URLs inside `episodes` when quality/server/subtitle records need independent refresh.

### Files that must change for Firebase-to-Supabase migration

- `frontend/app/firebaseApp.ts` (remove/replace initialization).
- `frontend/app/lib/user/userLoginActions.ts` (profile creation, auth account handling).
- `frontend/app/lib/user/userDocFetchOptions.ts` and `userDocUpdateOptions.ts` (all user reads/writes).
- `frontend/app/lib/user/anilistUserLoginOptions.ts` (identity linking and cookie/API calls).
- `frontend/app/lib/redux/features/manageUserData.ts` and Redux provider/hooks if auth state changes.
- `frontend/app/layout/header/components/User/UserSideMenu/index.tsx` and `UserSettingsModal/index.tsx`.
- `frontend/app/components/Buttons/AddToFavourites`, `AddToList`, `AddToNotification`, `MarkEpisodeAsWatched`, `MarkChapterAsRead`.
- `frontend/app/components/HomePage/KeepWatchingSection/*`.
- `frontend/app/favourites/components/*`, `frontend/app/my-lists/components/*` and both pages.
- `frontend/app/watch/[id]/components/VideoPlayer/index.tsx` and `EpisodesListContainer/index.tsx`.
- `frontend/app/media/[id]/components/WatchPlayBtn/index.tsx`, `AnimeEpisodesContainer/*`, `EpisodesOptionsPanel/*`.
- `frontend/app/layout/header/components/Notifications/index.tsx`.
- `[DEPRECATED]CommentsSection/*` if comments are retained, otherwise delete from the migration surface.
- `frontend/app/layout.tsx`/auth provider setup and any middleware/proxy session guard.
- `frontend/package.json` and lockfile to remove Firebase/hooks and add Supabase SSR/client dependencies.
- New server-side Supabase client, browser client, auth callback, RLS migrations and API/server actions for all listed tables.
- Data fetchers under `app/api/*` and `app/lib/dataFetch/*` if external catalog data is persisted/cached in Supabase.

## 13. RECOMMENDED CHANGES

1. **Define the target architecture and auth identity first.** Choose Supabase Auth as the sole session source, decide whether AniList OAuth remains a linked provider, and write RLS policies for profiles, watchlist, progress, comments and notifications. Files: new Supabase clients/migrations; `firebaseApp.ts`; auth/layout/middleware; user helpers.
2. **Make the app build cleanly on the declared Next version.** Await `cookies()` everywhere, verify/rename `middleware.ts` to `proxy.ts`, run typecheck/lint/build, and fix all nullability errors. Files: all route pages/handlers using `cookies`, `middleware.ts`, player/fetch helpers, interfaces.
3. **Replace Firestore user arrays with normalized Supabase rows.** Migrate bookmarks/lists/progress/history and settings. Files listed in the migration map, plus new data-access modules and server actions.
4. **Create a canonical `/api/watch` server route.** Validate media/source/episode inputs, call approved providers server-side, normalize URLs/quality/subtitles/intro/outro into the player contract, and restrict proxy behavior. Files: new `app/api/watch/route.ts`, `watch/[id]/page.tsx`, `fetchFunctions.ts`, `VideoPlayer/index.tsx`.
5. **Stabilize provider integrations.** Add runtime validation, timeouts, retries, provider health states, URL encoding and safe fallback selection. Files: `app/api/*`, `optimizedFetch*`, backend controllers/routes or their replacement.
6. **Decide the fate of the legacy backend.** Either retire it after moving provider calls into controlled server routes, or document/deploy it as a supported service with health checks and managed Redis. Files: `backend/*`, frontend env/config, deployment config and README.
7. **Normalize types and schemas.** Replace tuple-array declarations, correct nullable fields, split external/provider DTOs from database models, and generate Supabase types. Files: `app/ts/interfaces/*`, new generated database types, all affected components.
8. **Repair data consistency bugs.** Fix `updateDoc`/merge misuse, initialize list maps correctly, guard absent Firestore/provider fields during transition, remove duplicate preference calls and replace exact-45-second progress checks with throttled elapsed-time tracking. Files: user helpers, player, settings, list components.
9. **Choose product scope for News and Manga.** Keep and migrate `news_articles`/Manga tables, or remove routes/components/backend controllers and dependencies. Files: `app/news/*`, `app/read/*`, manga helpers/components, backend news/chapters, navigation/footer.
10. **Harden cookies, OAuth and provider content.** Validate request schemas, set secure/sameSite/httpOnly as appropriate, add CSRF/origin checks, restrict external URL schemes/origins and enforce server-side ownership. Files: all cookie route handlers, AniList OAuth route/middleware, watch route, Supabase RLS.
11. **Add operational caching and synchronization.** Use `pending_sync` and `episode_check_state`, cache external catalog responses with explicit TTL/tags, and instrument provider failures. Files: data fetchers, new sync workers/routes, home/search/media/watch pages.
12. **Complete accessibility and SEO.** Audit alt text, dialog focus/labels, keyboard controls, headings, captions, canonical/dynamic metadata, `sitemap.ts`, `robots.ts`, and analytics consent. Files: layout, metadata routes, dialogs/player/action buttons, relevant CSS.
13. **Remove historical/dead code after migration.** Remove `[DEPRECATED]CommentsSection` if not retained, unused Firebase/Redis/provider dependencies, old KumoriTV branding, obsolete News/Consumet references and stale README instructions. Files: component tree, package manifests/lockfiles, public branding assets, READMEs.
14. **Verify the deployment environment.** Inventory all env vars, add health-check diagnostics that do not expose secrets, test anonymous/authenticated flows, provider failures, responsive layouts, PWA registration, and production security headers. Files: env/config, `next.config.mjs`, test/e2e setup, deployment settings.

---

**Files read during this audit:** 35 distinct project files were directly read, supplemented by repository-wide file listings and targeted searches across the full frontend/backend tree. **Report path:** `docs/report.md`.
