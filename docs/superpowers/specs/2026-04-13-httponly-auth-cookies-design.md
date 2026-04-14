# HttpOnly Cookie-Based Auth

**Issue:** GitHub #3 — "Auth tokens stored in localStorage — vulnerable to XSS"
**Date:** 2026-04-13
**Scope:** `apps/dashboard` (Next.js) + `Geyed.Platform.Api` (C# backend)

## Problem

JWT access and refresh tokens are currently stored in `localStorage` by the dashboard, making them readable by any JavaScript running on the page. An XSS foothold would immediately yield long-lived credentials. The sibling marker cookie `geyed_access_token=1` used for Next middleware routing is set without `Secure` or `HttpOnly` and leaks the auth cookie name.

## Goals

- Tokens must never be reachable from JavaScript running in the dashboard.
- Browser session state must survive hard reload without JS-side token handling.
- Cross-site request forgery must be blocked for cookie-authenticated mutations.
- No backwards-compatibility shim: existing localStorage sessions will end on deploy.
- Minimal new surface area; prefer modifying existing endpoints over a new proxy layer.

## Non-Goals

- No Next.js BFF layer. FE continues to call the C# API directly.
- No double-submit CSRF token. A custom-header check + strict CORS is sufficient for a browser-only consumer.
- No cross-subdomain cookie `Domain` attribute. Same-origin (dev) and eTLD+1 (prod) only; revisit if the app is split across subdomains.
- No SDK changes. The public SDK uses its own token flow and is unaffected.
- No refresh-token rotation work — backend already rotates via `ValidateAndRotateRefreshTokenAsync`.

## Architecture

Tokens move from JSON response bodies and `localStorage` into cookies set by the backend on the API origin:

| Cookie | Contents | Attributes | Purpose |
|---|---|---|---|
| `geyed_at` | JWT access token | `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<access exp>` | Auth |
| `geyed_rt` | Refresh token | `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=<refresh exp>` | Refresh only |
| `geyed_session` | `1` | `Secure; SameSite=Lax; Path=/; Max-Age=<refresh exp>` (no HttpOnly) | Next middleware presence check |

The dashboard sends `credentials: "include"` on every API call and attaches a static header `X-Requested-With: geyed-dashboard`. The backend's CORS policy already calls `AllowCredentials()` against a configured origin allowlist, so no infra change is required. Because browsers force a CORS preflight for any request carrying a custom header, and the preflight only succeeds for allowlisted origins, the header effectively proves the request originated from a trusted origin — the CSRF guard.

JWT bearer authentication continues to accept `Authorization: Bearer …` for non-browser consumers. A new `OnMessageReceived` event handler falls back to reading the token from `Request.Cookies["geyed_at"]` when the header is absent.

## Backend Changes (`Geyed.Platform.Api`)

### 1. Cookie helper

New static class `Geyed.Platform.Api.Auth.AuthCookies` with:

- `Write(HttpContext ctx, string accessToken, string refreshToken, DateTime accessExpiresAt, DateTime refreshExpiresAt)`
- `Clear(HttpContext ctx)`

Centralises cookie names, flags, and `Path` values so controllers do not hand-roll `Append`/`Delete` calls.

### 2. AuthController

- `Login`, `Register`: call `AuthCookies.Write` with the generated tokens, then return an `AuthResponse` DTO containing only `user` and `accessExpiresAt`. The `accessToken` and `refreshToken` fields are removed from the response shape.
- `Refresh`: remove the `RefreshTokenApiRequest` body. Read the raw refresh token from `Request.Cookies["geyed_rt"]`; return 401 if absent. On success, call `AuthCookies.Write` with the rotated tokens and return the same trimmed `AuthResponse`.
- New `POST /auth/logout` (`[AllowAnonymous]`): if `geyed_rt` is present, attempt to resolve the user and call `ITokenService.RevokeAllUserTokensAsync`; always call `AuthCookies.Clear` and return 204. Idempotent.
- `ResetPassword` already revokes all tokens; also call `AuthCookies.Clear` so the browser is forced back through login.

### 3. DTO changes

- Introduce `AuthResponse(UserInfoRm User, DateTime AccessExpiresAt)` for the HTTP boundary.
- Keep the internal `AuthResult` record as-is; it still carries tokens inside the service layer.
- Update `ToHttp()` mapping so controllers project `AuthResult` → `AuthResponse` on the way out.

### 4. JWT bearer cookie fallback

In the `AddJwtBearer` configuration (`AppStart/AuthenticationConfiguration.cs` or equivalent), add:

```csharp
options.Events = new JwtBearerEvents
{
    OnMessageReceived = ctx =>
    {
        if (string.IsNullOrEmpty(ctx.Token) &&
            ctx.Request.Cookies.TryGetValue("geyed_at", out var cookie))
        {
            ctx.Token = cookie;
        }
        return Task.CompletedTask;
    }
};
```

### 5. CSRF middleware

New middleware `RequireCsrfHeaderMiddleware` registered after routing and before authorization:

- If the request method is `GET`, `HEAD`, `OPTIONS`, or `TRACE`: pass through.
- If the request carries no `geyed_at` cookie: pass through (header-authenticated clients bypass).
- Otherwise require `X-Requested-With: geyed-dashboard`. Missing or wrong value → 403 with `{ "detail": "CSRF check failed." }`.

The middleware is global; no per-endpoint opt-in. Exempt paths: none — even `/auth/logout` must carry the header when called from the browser.

### 6. CORS

Verify `AllowCredentials()` is already in place (confirmed during design). Ensure `WithExposedHeaders` does not need updating (it does not — we only read response bodies and cookies). Ensure `WithHeaders` permits `X-Requested-With` and `Content-Type`.

## Frontend Changes (`apps/dashboard`)

### 1. `src/lib/api/client.ts`

- Delete `TOKEN_KEYS`, `getAccessToken`, `getRefreshToken`, `setTokens`, `clearTokens`, and the `localStorage`/`document.cookie` writes.
- `apiClient`: always pass `credentials: "include"` and a `X-Requested-With: geyed-dashboard` header merged with caller-supplied headers.
- Drop the `Authorization: Bearer` injection — the cookie handles it.
- 401 refresh logic stays but simplifies: `tryRefreshToken` POSTs `/api/v1/auth/refresh` with no body; the browser supplies `geyed_rt`. On success, retry the original request (new cookies are already set). On failure, best-effort POST `/auth/logout` and redirect to `/login`.
- `refreshPromise` deduplication stays.

### 2. `src/providers/auth-provider.tsx`

- Remove imports of `setTokens`, `clearTokens`, `getAccessToken`.
- `login` / `register`: just consume the new `AuthResponse` shape and set `user`.
- Initial load: always call `/auth/me` once on mount; on 401 treat as unauthenticated. The "only fetch if we have a token" optimisation is gone because we cannot read the cookie.
- `logout`: `await apiClient("/api/v1/auth/logout", { method: "POST" })`, then `window.location.href = "/login"`. Swallow errors — we still want to redirect.

### 3. `src/proxy.ts` (Next middleware)

- Change presence check from `request.cookies.has("geyed_access_token")` → `request.cookies.has("geyed_session")`. No other change.

### 4. Auth request/response types

- `src/lib/api/types.ts`: remove `accessToken` / `refreshToken` from `AuthResult` (or introduce a separate `AuthResponse` type and retire `AuthResult` on the FE). Keep `expiresAt` and `user`.

### 5. Audit touchpoints

Grep for `getAccessToken`, `getRefreshToken`, `setTokens`, `clearTokens`, `localStorage`, `geyed_access_token`, `geyed_refresh_token`, `geyed_at`, `geyed_session` across `apps/dashboard/src` and delete or migrate each hit. Expected hotspots: `auth-provider.tsx`, `client.ts`, `proxy.ts`. Anything else is a red flag to investigate.

## Data Flow

**Login**
1. Browser POSTs `/api/v1/auth/login` with `credentials: include` and `X-Requested-With: geyed-dashboard`.
2. Backend validates, generates access + refresh tokens, writes `geyed_at`, `geyed_rt`, `geyed_session` cookies, returns `{ user, accessExpiresAt }`.
3. Frontend stores `user` in React state.

**Authenticated request**
1. Browser sends request with cookies automatically attached.
2. JWT middleware reads `geyed_at` via the `OnMessageReceived` fallback.
3. CSRF middleware confirms `X-Requested-With` on mutations.

**Refresh (triggered by a 401 on an authenticated call)**
1. Frontend `apiClient` sees 401, calls `tryRefreshToken`.
2. Browser POSTs `/api/v1/auth/refresh`; `geyed_rt` is attached automatically.
3. Backend rotates via `ValidateAndRotateRefreshTokenAsync`, sets fresh cookies, returns `{ user, accessExpiresAt }`.
4. Frontend retries the original request. New `geyed_at` cookie carries the new token.

**Logout**
1. Frontend POSTs `/api/v1/auth/logout`.
2. Backend revokes all user refresh tokens, clears cookies, returns 204.
3. Frontend hard-navigates to `/login`.

## Error Handling

- CSRF header missing on a cookie-authenticated mutation → 403 `{ detail: "CSRF check failed." }`. Frontend surfaces a generic toast; this condition should never happen in normal use and indicates a bug or an attack.
- Refresh cookie missing or invalid → 401 on `/auth/refresh` → frontend treats as signed out, redirects to `/login`.
- Logout is idempotent: missing cookies still yield 204.
- Concurrent 401s continue to share a single `refreshPromise` as today.

## Testing

**Backend (integration, `WebApplicationFactory`):**
- `Login` sets `geyed_at`, `geyed_rt`, `geyed_session` cookies with correct flags; response body excludes tokens.
- `Refresh` succeeds when `geyed_rt` is attached; 401 when absent; rotates the refresh cookie on success.
- `Logout` clears all three cookies and revokes server-side; 204 when no cookie present.
- CSRF middleware: POST without `X-Requested-With` but with cookie → 403; POST with header → passes; `Authorization: Bearer` request without header bypasses CSRF; GET without header passes.
- JWT cookie fallback: authenticated request with cookie only (no header) resolves `CurrentUserId`.

**Frontend (manual smoke in browser):**
1. Fresh login → hard reload → still authenticated (`/auth/me` succeeds via cookie).
2. Navigate protected route with no session → redirected to `/login` by middleware.
3. Access token expiry → next API call 401s → silent refresh → retry succeeds.
4. Logout → cookies cleared → protected route redirects back to `/login`.
5. DevTools `Application → Storage → LocalStorage` is empty of `geyed_*` keys.
6. DevTools `Cookies` shows `geyed_at` and `geyed_rt` with HttpOnly flag set.

No automated FE test harness exists for `apiClient`; not introducing one in this change.

## Migration / Deploy Notes

- On deploy, every existing dashboard session becomes invalid: `localStorage` tokens will no longer be sent, and the new middleware will redirect to `/login`. This is acceptable and expected.
- No database migration required; `RefreshToken` table already backs rotation.
- Clear the old `geyed_access_token=1` marker cookie on first logged-in request? Not worth the code — it will expire on its own and the middleware now keys off `geyed_session`.

## Open Questions (resolved during brainstorming)

- **Refresh rotation:** already implemented server-side.
- **CSRF strategy:** custom header + strict CORS.
- **Logout endpoint:** yes, new `POST /auth/logout`.
- **BFF layer:** rejected; keep direct FE→API.

## Out of Scope

- Issue #7 (Stripe checkout session validation). Tracked separately.
- Cross-subdomain cookie domain configuration for production.
- Automated FE test harness for `apiClient`.
- SDK auth flow.
