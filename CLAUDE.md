# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build → dist/erp-frontend/browser/
npm run watch      # Watch mode (dev config)
npm test           # Unit tests via Karma + Jasmine
```

To test PWA/offline mode locally:
```bash
npx http-server dist/erp-frontend/browser -p 8080
```

No explicit lint script; use Angular's built-in TypeScript strict mode checks.

## Architecture

**Angular 20.3** with standalone components (no NgModules), lazy-loaded features, and NgRx for auth state.

### Routing (`src/app/app.routes.ts`)

| Route | Feature | Guard |
|---|---|---|
| `/auth/login` | Auth | — |
| `/admin/dashboard` | Dashboard | AuthGuard |
| `/admin/users` | User CRUD | AuthGuard + RoleGuard(ADMIN) |
| `/admin/roles` | Role CRUD | AuthGuard + RoleGuard(ADMIN) |

The `/admin/*` routes render inside `LayoutComponent` (sidebar + header shell).

### State Management

NgRx store only covers auth (`src/app/features/auth/store/`). The auth state holds `user`, `accessToken`, `refreshToken`, `loading`, and `error`. On app init, an effect rehydrates from localStorage; on login/logout, tokens are persisted/cleared there.

### Offline-First Pattern

The app has full offline support via three collaborating services:

1. **`IndexedDbService`** — wraps IDB. Stores `users` (cache) and `pending_operations` (mutation queue with retry counters, max 3 attempts).

2. **`NetworkService`** — exposes `isOnline: Signal<boolean>` (wraps `navigator.onLine` + window events).

3. **`SyncService`** — on `window.online`, drains the pending ops queue by replaying HTTP mutations. After sync, emits `syncCompleted$` and clears the user cache to force a fresh fetch.

**UserService** (`features/users/services/user.service.ts`) implements the offline-first read/write pattern: reads from API when online (caching to IDB), falls back to IDB when offline; writes queue to IDB when offline. Roles do not have offline support.

### HTTP Interceptor

`src/app/core/interceptors/auth.interceptor.ts` (function-based `HttpInterceptorFn`):
- Injects `Authorization: Bearer <token>` on all requests.
- On 401: dispatches `refreshToken` action (or `logout` if no refresh token available).

### UI Stack

- **PrimeNG 20.4** (Aura theme) — component library. Dark mode toggled via `.dark-mode` CSS class.
- **Tailwind CSS** — utility classes. `preflight` is disabled to avoid conflicts with PrimeNG's reset.
- **SCSS** — component-scoped styles + global `src/styles.scss`.

### PWA / Service Worker

`ngsw-config.json` enables Angular's service worker in production:
- `app` asset group — prefetches JS/CSS/HTML eagerly.
- `assets` asset group — lazily caches images/fonts.

### API

Base URL: `http://localhost:3000/api` (via `environment.ts`).

All responses follow:
```json
{ "statusCode": 200, "success": true, "message": "...", "data": {}, "errors": "" }
```

Paginated list responses return inside `data`:
```json
{ "data": [...], "meta": { "total": 50, "page": 1, "limit": 20, "pages": 3 } }
```

Auth uses short-lived `accessToken` (15 min) + `refreshToken` (7 days). 5 failed login attempts lock the account for 15 min — backend returns 403 with the remaining minutes in the message.

User create/update payloads use `roleId` (UUID). The user response returns `role` as a plain string (role name).

### Code Conventions

- All components are `standalone: true` with explicit imports.
- Angular Signals used for local reactive state (`signal()`, `computed()`).
- Prettier: 100-char line width, single quotes, Angular HTML parser.
