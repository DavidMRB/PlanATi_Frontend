# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm install` — dependencies (lockfile is `package-lock.json`).
- `npm run dev` — dev server on http://localhost:3000.
- `npm run build` / `npm run start` — production build and serve.
- `npm run lint` — ESLint flat config (`eslint.config.mjs`: `eslint-config-next` core-web-vitals + TypeScript).
- Type-check: `npx tsc --noEmit` (no `typecheck` script exists).
- There is no test runner configured, so there is no test or single-test command.

Environment: copy `.env.example` to `.env.local`. `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000/api/v1` when unset. The backend is not in this repo; every auth call assumes it is running at that URL.

## Architecture

**Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4 (via `@tailwindcss/postcss`), framer-motion, lucide-react. The `lang` is `es` and all user-facing copy is in Spanish; keep new UI strings in Spanish.

**Route groups** (`app/`):
- `(auth)/` — `login` (hosts both login and register; `AuthView` toggles between `LoginForm` and `RegisterForm`), `register` (just redirects to `/login`), `complete-profile`, `google-callback`, and `restaurant/register`.
- `(home)/` (landing) and `(public)/` — `explore` (directory), `establishments/[id]` (detail), and `details` (redirect for `?id=`).
- `(restaurant)/` — the restaurant panel. Its `layout.tsx` checks role and `APPROVED` status; `PENDING`/`REJECTED` accounts only see `/restaurant/status`.
- `(admin)/` — the admin console. Its `layout.tsx` checks the `admin` role.
- `(user)/profile` — the regular user's profile.
- `restaurant-account-frontend.md` at the root is the plan these areas were built from. Its tasks are checked off; its endpoint list predates the live backend OpenAPI (`http://127.0.0.1:8000/docs`), so trust the OpenAPI.
- `proxy.ts` (Next 16 name, not `middleware.ts`) guards `/admin`, `/restaurant`, and `/profile` by checking only that the session cookie exists. Real role and status checks happen in the layouts against the API.

**Auth lives on cookies, not tokens.** The backend sets HttpOnly cookies. The frontend never reads or stores a token; every request uses `credentials: "include"`. `lib/auth-api.ts` holds the central `AUTH_ENDPOINTS` map and the `get/post/patchAuthRequest` helpers, which throw `ApiError` with the backend's `detail`/`message` as the text. `lib/api.ts` exports `API_URL` and an `apiFetch` helper, but the auth code does not use `apiFetch`.

**Post-auth routing:** `resolvePostAuthRoute` in `lib/auth-api.ts` picks the destination after login (admin → dashboard; restaurant → dashboard if `APPROVED`, else `/restaurant/status`; user → `/complete-profile` or `/`, honoring a safe `?redirect=`). The register form and `google-callback` still use the older `registration_complete` check.

**Google OAuth round-trip:** `LoginForm` GETs `/auth/google` and redirects to the returned `authorization_url`. The backend returns the user to `/google-callback?code=…`. That page strips the code from the URL, then POSTs it to `/auth/google/exchange`, which sets the cookie. Its effect uses a `useRef` guard because of StrictMode double-invocation.

**Phone verification gate:** `complete-profile` loads `/users/me` on mount. A user whose profile already has `phone_verified`, a `nickname`, and `status === "ACTIVE"` is sent to `/`. The rest fill in the form, verify the phone via `/auth/phone/send-code` and `/auth/phone/verify`, and then save with a PATCH to `/users/me` (`nickname`, `phone_number` as `+57…`, `picture`). Route protection is client-side `useEffect` redirects; there is no `middleware.ts`.

**Cross-page state:** `RegisterForm` stores the typed phone in `sessionStorage["registrationPhone"]`, and `complete-profile` reads it to prefill. It is per-tab and does not survive a new session.

**Form convention:** each form is split into `X.ts` (a `useXForm()` hook with state, validation, and submit logic) and `X.tsx` (JSX). Import the hook with the `.ts` extension, for example `from "./LoginForm.ts"`; `allowImportingTsExtensions` is enabled for this. Validation regexes are duplicated across `LoginForm.ts`, `RegisterForm.ts`, and `CompleteProfileForm.tsx`. The phone rule is 10 digits starting with `3` (Colombian mobile, prefixed `+57`).

**Service worker:** `public/sw.js` is registered from the root layout by `components/ServiceWorkerRegistration.tsx`. It caches `/` and serves same-origin GETs cache-first, so stale responses are possible when debugging. It references `/icons/icon-192.png`, which is not in `public/`.

**Known gaps in the current code:**
- Profile pictures are set from `URL.createObjectURL(file)`, a local `blob:` URL that is not uploaded. It will not persist across sessions.
- The session cookie is `access_token` (checked in the backend settings). `proxy.ts` relies on that name.
- Restaurant signup uploads logo and banner after the register call, because the cookie exists by then and `upload-url` requires a session. It then saves them with `PATCH /restaurant/profile`. The backend allows that PATCH for `PENDING` accounts only when the body contains image fields. Upload folders are an enum (`establishments`, `menu`, `products`) and `file_extension` includes the dot.
- The restaurant panel, admin console, and public pages were verified only by type-check, lint, production build, and route-level redirects. No end-to-end run with real accounts has been done.
