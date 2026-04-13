# HttpOnly Cookie-Based Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move JWT access and refresh tokens out of `localStorage` into HttpOnly Secure cookies set by the backend, with a custom-header CSRF guard. Closes GitHub issue #3.

**Architecture:** Backend writes three cookies on login/register/refresh (`geyed_at` HttpOnly access token, `geyed_rt` HttpOnly refresh token scoped to `/api/v1/auth`, `geyed_session=1` non-HttpOnly presence marker). JWT bearer middleware falls back to reading the access cookie when `Authorization` header is missing. A global CSRF middleware rejects cookie-authenticated mutations without header `X-Requested-With: geyed-dashboard`. The Next.js dashboard sends all API calls with `credentials: "include"` plus that header and stops touching tokens from JavaScript entirely.

**Tech Stack:** .NET 9 / ASP.NET Core (backend), Next.js 15 (dashboard), xUnit + WebApplicationFactory + Testcontainers Postgres (backend tests).

**Spec:** `docs/superpowers/specs/2026-04-13-httponly-auth-cookies-design.md`

---

## File Structure

### Backend (create)
- `Backend/src/Geyed.Platform.Api/Auth/AuthCookies.cs` — cookie write/clear helper, single source of truth for cookie names and flags
- `Backend/src/Geyed.Platform.Api/Auth/RequireCsrfHeaderMiddleware.cs` — global CSRF middleware
- `Backend/src/Geyed.Platform.Api/V1/Models/AuthResponse.cs` — new public response DTO without tokens
- `Backend/tests/Geyed.Platform.Tests/Auth/AuthApiTestFactory.cs` — WebApplicationFactory for auth tests
- `Backend/tests/Geyed.Platform.Tests/Auth/AuthCookieFlowTests.cs` — integration tests covering login/refresh/logout/CSRF

### Backend (modify)
- `Backend/src/Geyed.Platform.Core/Services/Auth/Interfaces/ITokenService.cs` — add `RevokeRefreshTokenAsync(rawToken)`
- `Backend/src/Geyed.Platform.Core/Services/Auth/Concrete/TokenService.cs` — implement new method
- `Backend/src/Geyed.Platform.Core/Services/Auth/Interfaces/IAuthService.cs` — add `LogoutAsync(rawRefreshToken)`
- `Backend/src/Geyed.Platform.Core/Services/Auth/Concrete/AuthService.cs` — implement `LogoutAsync`
- `Backend/src/Geyed.Platform.Api/V1/Models/AuthRequests.cs` — delete `RefreshTokenApiRequest`
- `Backend/src/Geyed.Platform.Api/V1/Controllers/AuthController.cs` — write cookies on login/register/refresh/reset, add `Logout`, drop refresh body
- `Backend/src/Geyed.Platform.Api/Extensions/ServiceResponseExtensions.cs` (or wherever `ToHttp()` lives) — add projection for `AuthResponse` if needed (likely not — `ToHttp<T>()` is generic)
- `Backend/src/Geyed.Platform.Api/AppStart/AuthorizationConfiguration.cs` — JWT bearer `OnMessageReceived` cookie fallback
- `Backend/src/Geyed.Platform.Api/Program.cs` — register CSRF middleware after `UseAuthentication`, before `UseAuthorization`

### Frontend (modify)
- `apps/dashboard/src/lib/api/client.ts` — remove localStorage token code, always `credentials: "include"` + `X-Requested-With` header
- `apps/dashboard/src/lib/api/types.ts` — align `AuthResult` with trimmed server response
- `apps/dashboard/src/providers/auth-provider.tsx` — drop `setTokens`/`clearTokens`; logout hits `/auth/logout`
- `apps/dashboard/src/proxy.ts` — switch presence check from `geyed_access_token` to `geyed_session`

---

## Task 1: Add `RevokeRefreshTokenAsync` to token service

**Files:**
- Modify: `Backend/src/Geyed.Platform.Core/Services/Auth/Interfaces/ITokenService.cs`
- Modify: `Backend/src/Geyed.Platform.Core/Services/Auth/Concrete/TokenService.cs`

Why: logout needs to revoke a single refresh token given only its raw string. The existing API exposes `RevokeAllUserTokensAsync(userId)` but there's no path from a raw token to a userId without going through the rotation flow (which issues a new token). This task adds the missing primitive.

- [ ] **Step 1: Write failing test for single-token revocation**

Create `Backend/tests/Geyed.Platform.Tests/Domain/TokenServiceRevokeTests.cs`:

```csharp
using Geyed.Platform.Core.Domain.Auth;
using Geyed.Platform.Core.Persistence;
using Geyed.Platform.Core.Services.Auth.Concrete;
using Geyed.Platform.Core.Services.Auth.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Geyed.Platform.Tests.Domain;

public class TokenServiceRevokeTests
{
    private static TokenService CreateService(out AppDbContext db)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        db = new AppDbContext(options);
        var jwt = Options.Create(new JwtSettings
        {
            SecretKey = "0123456789abcdef0123456789abcdef",
            Issuer = "test",
            Audience = "test",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7,
        });
        return new TokenService(db, jwt);
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_marks_token_revoked()
    {
        var service = CreateService(out var db);
        var raw = service.GenerateRefreshToken();
        await service.CreateRefreshTokenAsync("user-1", raw);

        await service.RevokeRefreshTokenAsync(raw);

        var stored = await db.RefreshTokens.SingleAsync();
        Assert.False(stored.IsActive);
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_is_noop_for_unknown_token()
    {
        var service = CreateService(out _);
        await service.RevokeRefreshTokenAsync("not-a-real-token");
        // No throw; nothing to assert beyond that.
    }
}
```

- [ ] **Step 2: Verify tests fail**

Run: `dotnet test Backend/tests/Geyed.Platform.Tests/Geyed.Platform.Tests.csproj --filter FullyQualifiedName~TokenServiceRevokeTests`
Expected: compile error — `RevokeRefreshTokenAsync` not defined on `TokenService`.

- [ ] **Step 3: Add the method to the interface**

In `ITokenService.cs`, add below `RevokeAllUserTokensAsync`:

```csharp
Task RevokeRefreshTokenAsync(string rawToken, CancellationToken ct = default);
```

- [ ] **Step 4: Implement on `TokenService`**

Add to `TokenService.cs` (below `RevokeAllUserTokensAsync`):

```csharp
public async Task RevokeRefreshTokenAsync(string rawToken, CancellationToken ct = default)
{
    if (string.IsNullOrWhiteSpace(rawToken)) return;

    var tokenHash = HashToken(rawToken);
    var existing = await _db.RefreshTokens
        .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, ct);

    if (existing is null || !existing.IsActive) return;

    existing.Revoke();
    await _db.SaveChangesAsync(ct);
}
```

- [ ] **Step 5: Verify tests pass**

Run: `dotnet test Backend/tests/Geyed.Platform.Tests/Geyed.Platform.Tests.csproj --filter FullyQualifiedName~TokenServiceRevokeTests`
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git -C ../../../Backend add src/Geyed.Platform.Core/Services/Auth/Interfaces/ITokenService.cs \
    src/Geyed.Platform.Core/Services/Auth/Concrete/TokenService.cs \
    tests/Geyed.Platform.Tests/Domain/TokenServiceRevokeTests.cs
git -C ../../../Backend commit -m "feat(auth): add RevokeRefreshTokenAsync to token service"
```

---

## Task 2: Add `LogoutAsync` to auth service

**Files:**
- Modify: `Backend/src/Geyed.Platform.Core/Services/Auth/Interfaces/IAuthService.cs`
- Modify: `Backend/src/Geyed.Platform.Core/Services/Auth/Concrete/AuthService.cs`

Why: controller layer should not talk to `ITokenService` directly for logout — existing pattern puts business logic on `AuthService`. Thin wrapper.

- [ ] **Step 1: Add interface method**

In `IAuthService.cs`, add:

```csharp
Task LogoutAsync(string? rawRefreshToken, CancellationToken ct = default);
```

- [ ] **Step 2: Implement on `AuthService`**

In `AuthService.cs`, add below `GetCurrentUserAsync`:

```csharp
public async Task LogoutAsync(string? rawRefreshToken, CancellationToken ct = default)
{
    if (!string.IsNullOrWhiteSpace(rawRefreshToken))
        await _tokenService.RevokeRefreshTokenAsync(rawRefreshToken, ct);
}
```

- [ ] **Step 3: Verify the project still builds**

Run: `dotnet build Backend/src/Geyed.Platform.Api/Geyed.Platform.Api.csproj`
Expected: build success.

- [ ] **Step 4: Commit**

```bash
git -C ../../../Backend add src/Geyed.Platform.Core/Services/Auth/Interfaces/IAuthService.cs \
    src/Geyed.Platform.Core/Services/Auth/Concrete/AuthService.cs
git -C ../../../Backend commit -m "feat(auth): add AuthService.LogoutAsync"
```

---

## Task 3: `AuthCookies` helper

**Files:**
- Create: `Backend/src/Geyed.Platform.Api/Auth/AuthCookies.cs`

Why: single source of truth for cookie names, flags, paths, lifetimes. Controllers must never hand-roll `Response.Cookies.Append`.

- [ ] **Step 1: Create the helper**

Write `Backend/src/Geyed.Platform.Api/Auth/AuthCookies.cs`:

```csharp
using Geyed.Platform.Core.Services.Auth.Models;

namespace Geyed.Platform.Api.Auth;

/// <summary>
/// Centralises auth-cookie names, flags, and paths. Controllers MUST go through this class —
/// never call Response.Cookies.Append/Delete directly for auth cookies.
/// </summary>
public static class AuthCookies
{
    public const string AccessTokenCookie = "geyed_at";
    public const string RefreshTokenCookie = "geyed_rt";
    public const string SessionMarkerCookie = "geyed_session";

    public const string RefreshCookiePath = "/api/v1/auth";

    public static void Write(HttpContext ctx, string accessToken, string refreshToken, JwtSettings jwt)
    {
        var accessExpires = DateTimeOffset.UtcNow.AddMinutes(jwt.AccessTokenExpirationMinutes);
        var refreshExpires = DateTimeOffset.UtcNow.AddDays(jwt.RefreshTokenExpirationDays);

        ctx.Response.Cookies.Append(AccessTokenCookie, accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = accessExpires,
        });

        ctx.Response.Cookies.Append(RefreshTokenCookie, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = RefreshCookiePath,
            Expires = refreshExpires,
        });

        // Presence marker read by the Next.js middleware to gate route access.
        // Not HttpOnly so the middleware can read it; contains no secret.
        ctx.Response.Cookies.Append(SessionMarkerCookie, "1", new CookieOptions
        {
            HttpOnly = false,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = refreshExpires,
        });
    }

    public static void Clear(HttpContext ctx)
    {
        ctx.Response.Cookies.Delete(AccessTokenCookie, new CookieOptions
        {
            Path = "/",
            Secure = true,
            SameSite = SameSiteMode.Lax,
        });
        ctx.Response.Cookies.Delete(RefreshTokenCookie, new CookieOptions
        {
            Path = RefreshCookiePath,
            Secure = true,
            SameSite = SameSiteMode.Lax,
        });
        ctx.Response.Cookies.Delete(SessionMarkerCookie, new CookieOptions
        {
            Path = "/",
            Secure = true,
            SameSite = SameSiteMode.Lax,
        });
    }
}
```

- [ ] **Step 2: Verify it builds**

Run: `dotnet build Backend/src/Geyed.Platform.Api/Geyed.Platform.Api.csproj`
Expected: build success.

- [ ] **Step 3: Commit**

```bash
git -C ../../../Backend add src/Geyed.Platform.Api/Auth/AuthCookies.cs
git -C ../../../Backend commit -m "feat(auth): add AuthCookies helper"
```

---

## Task 4: JWT bearer cookie fallback

**Files:**
- Modify: `Backend/src/Geyed.Platform.Api/AppStart/AuthorizationConfiguration.cs`

Why: once tokens live in `HttpOnly` cookies, browser requests can't attach `Authorization: Bearer …`. Read the access token from the cookie when the header is absent, keeping Bearer support for non-browser clients.

- [ ] **Step 1: Add the event handler**

In `AuthorizationConfiguration.cs`, inside `.AddJwtBearer(options => { ... })` after setting `TokenValidationParameters`, append:

```csharp
options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
{
    OnMessageReceived = ctx =>
    {
        if (string.IsNullOrEmpty(ctx.Token) &&
            ctx.Request.Cookies.TryGetValue(Auth.AuthCookies.AccessTokenCookie, out var cookie) &&
            !string.IsNullOrWhiteSpace(cookie))
        {
            ctx.Token = cookie;
        }
        return Task.CompletedTask;
    }
};
```

Add at the top of the file:
```csharp
using Geyed.Platform.Api.Auth;
```

- [ ] **Step 2: Verify build**

Run: `dotnet build Backend/src/Geyed.Platform.Api/Geyed.Platform.Api.csproj`
Expected: build success.

- [ ] **Step 3: Commit**

```bash
git -C ../../../Backend add src/Geyed.Platform.Api/AppStart/AuthorizationConfiguration.cs
git -C ../../../Backend commit -m "feat(auth): fall back to cookie when Authorization header missing"
```

---

## Task 5: CSRF middleware

**Files:**
- Create: `Backend/src/Geyed.Platform.Api/Auth/RequireCsrfHeaderMiddleware.cs`
- Modify: `Backend/src/Geyed.Platform.Api/Program.cs`

Why: once auth comes from a cookie that browsers attach automatically, mutations need a separate guard. Custom header + strict CORS is enough for browser-only consumers: browsers force a preflight for custom headers, and the CORS preflight only succeeds for allowlisted origins.

- [ ] **Step 1: Create the middleware**

Write `Backend/src/Geyed.Platform.Api/Auth/RequireCsrfHeaderMiddleware.cs`:

```csharp
namespace Geyed.Platform.Api.Auth;

/// <summary>
/// Rejects cookie-authenticated unsafe requests that lack the dashboard's CSRF header.
/// Header-authenticated (Bearer) requests and safe methods pass through untouched.
/// </summary>
public sealed class RequireCsrfHeaderMiddleware
{
    public const string HeaderName = "X-Requested-With";
    public const string HeaderValue = "geyed-dashboard";

    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "GET", "HEAD", "OPTIONS", "TRACE"
    };

    private readonly RequestDelegate _next;

    public RequireCsrfHeaderMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        if (SafeMethods.Contains(ctx.Request.Method))
        {
            await _next(ctx);
            return;
        }

        var hasCookie = ctx.Request.Cookies.ContainsKey(AuthCookies.AccessTokenCookie)
                     || ctx.Request.Cookies.ContainsKey(AuthCookies.RefreshTokenCookie);

        if (!hasCookie)
        {
            await _next(ctx);
            return;
        }

        if (ctx.Request.Headers.TryGetValue(HeaderName, out var value) &&
            string.Equals(value.ToString(), HeaderValue, StringComparison.Ordinal))
        {
            await _next(ctx);
            return;
        }

        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
        ctx.Response.ContentType = "application/problem+json";
        await ctx.Response.WriteAsync("""{"detail":"CSRF check failed."}""");
    }
}
```

- [ ] **Step 2: Register the middleware**

In `Program.cs`, replace the block:

```csharp
    app.UseAuthentication();
    app.UseAuthorization();
```

with:

```csharp
    app.UseAuthentication();
    app.UseMiddleware<Geyed.Platform.Api.Auth.RequireCsrfHeaderMiddleware>();
    app.UseAuthorization();
```

- [ ] **Step 3: Verify build**

Run: `dotnet build Backend/src/Geyed.Platform.Api/Geyed.Platform.Api.csproj`
Expected: build success.

- [ ] **Step 4: Commit**

```bash
git -C ../../../Backend add src/Geyed.Platform.Api/Auth/RequireCsrfHeaderMiddleware.cs \
    src/Geyed.Platform.Api/Program.cs
git -C ../../../Backend commit -m "feat(auth): require X-Requested-With on cookie-authed mutations"
```

---

## Task 6: New `AuthResponse` DTO

**Files:**
- Create: `Backend/src/Geyed.Platform.Api/V1/Models/AuthResponse.cs`

Why: the public response must no longer carry tokens. Keep `AuthResult` as the internal service type; project to `AuthResponse` at the HTTP boundary.

- [ ] **Step 1: Write the DTO**

Write `Backend/src/Geyed.Platform.Api/V1/Models/AuthResponse.cs`:

```csharp
using Geyed.Platform.Core.Services.Auth.Models;

namespace Geyed.Platform.Api.V1.Models;

public sealed record AuthResponse(UserInfoRm User, DateTime AccessExpiresAt)
{
    public static AuthResponse FromResult(AuthResult result) =>
        new(result.User, result.ExpiresAt);
}
```

Note: verify the `AuthResult` property names match (`User`, `ExpiresAt`). If the existing record uses different names (`UserInfo`, `AccessExpiresAt`, etc.), adjust the mapping.

- [ ] **Step 2: Verify build**

Run: `dotnet build Backend/src/Geyed.Platform.Api/Geyed.Platform.Api.csproj`
Expected: build success.

- [ ] **Step 3: Commit**

```bash
git -C ../../../Backend add src/Geyed.Platform.Api/V1/Models/AuthResponse.cs
git -C ../../../Backend commit -m "feat(auth): add AuthResponse DTO without tokens"
```

---

## Task 7: Rewrite `AuthController` to use cookies

**Files:**
- Modify: `Backend/src/Geyed.Platform.Api/V1/Controllers/AuthController.cs`
- Modify: `Backend/src/Geyed.Platform.Api/V1/Models/AuthRequests.cs` (delete `RefreshTokenApiRequest`)

Why: this is the real behaviour change. Every path that generates tokens must now write them as cookies and strip them from the JSON response. `/auth/refresh` reads the refresh token from a cookie, and a new `/auth/logout` endpoint revokes + clears.

- [ ] **Step 1: Delete the refresh body DTO**

In `AuthRequests.cs`, delete:

```csharp
public sealed record RefreshTokenApiRequest(
    string RefreshToken);
```

- [ ] **Step 2: Rewrite `AuthController`**

Replace the full contents of `AuthController.cs` with:

```csharp
using Asp.Versioning;
using Geyed.Platform.Api.AppStart;
using Geyed.Platform.Api.Auth;
using Geyed.Platform.Api.Extensions;
using Geyed.Platform.Api.V1.Models;
using Geyed.Platform.Core.Common;
using Geyed.Platform.Core.Services.Auth.Interfaces;
using Geyed.Platform.Core.Services.Auth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Geyed.Platform.Api.V1.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/auth")]
[ApiVersion("1.0")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly JwtSettings _jwtSettings;

    public AuthController(IAuthService authService, IOptions<JwtSettings> jwtSettings)
    {
        _authService = authService;
        _jwtSettings = jwtSettings.Value;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting(BuilderExtensions.AuthRegisterPolicy)]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterApiRequest req)
    {
        var request = new RegisterRequest(req.Email, req.Password, req.ConfirmPassword, req.DisplayName);
        var response = await _authService.RegisterAsync(request, HttpContext.RequestAborted);
        return WriteCookiesAndProject(response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(BuilderExtensions.AuthLoginPolicy)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginApiRequest req)
    {
        var request = new LoginRequest(req.Email, req.Password);
        var response = await _authService.LoginAsync(request, HttpContext.RequestAborted);
        return WriteCookiesAndProject(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh()
    {
        if (!Request.Cookies.TryGetValue(AuthCookies.RefreshTokenCookie, out var refreshToken) ||
            string.IsNullOrWhiteSpace(refreshToken))
        {
            AuthCookies.Clear(HttpContext);
            return Unauthorized(new ProblemDetails { Detail = "No refresh token." });
        }

        var response = await _authService.RefreshTokenAsync(refreshToken, HttpContext.RequestAborted);

        if (!response.IsSuccess)
            AuthCookies.Clear(HttpContext);

        return WriteCookiesAndProject(response);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        Request.Cookies.TryGetValue(AuthCookies.RefreshTokenCookie, out var refreshToken);
        await _authService.LogoutAsync(refreshToken, HttpContext.RequestAborted);
        AuthCookies.Clear(HttpContext);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting(BuilderExtensions.AuthForgotPasswordPolicy)]
    public async Task<ActionResult<bool>> ForgotPassword([FromBody] ForgotPasswordApiRequest req)
    {
        var request = new ForgotPasswordRequest(req.Email);
        return (await _authService.ForgotPasswordAsync(request, HttpContext.RequestAborted)).ToHttp();
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<bool>> ResetPassword([FromBody] ResetPasswordApiRequest req)
    {
        var request = new ResetPasswordRequest(req.Email, req.Token, req.NewPassword, req.ConfirmPassword);
        var result = (await _authService.ResetPasswordAsync(request, HttpContext.RequestAborted)).ToHttp();
        // Force-logout any active session on this browser: AuthService already revoked refresh tokens.
        AuthCookies.Clear(HttpContext);
        return result;
    }

    [HttpGet("confirm-email")]
    [AllowAnonymous]
    public async Task<ActionResult<bool>> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
    {
        return (await _authService.ConfirmEmailAsync(userId, token, HttpContext.RequestAborted)).ToHttp();
    }

    [HttpPost("resend-confirmation")]
    [AllowAnonymous]
    public async Task<ActionResult<bool>> ResendConfirmation([FromBody] ResendConfirmationApiRequest req)
    {
        var request = new ResendConfirmationRequest(req.Email);
        return (await _authService.ResendConfirmationEmailAsync(request, HttpContext.RequestAborted)).ToHttp();
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserInfoRm>> GetCurrentUser()
    {
        return (await _authService.GetCurrentUserAsync(CurrentUserId, HttpContext.RequestAborted)).ToHttp();
    }

    private ActionResult<AuthResponse> WriteCookiesAndProject(ServiceResponse<AuthResult> response)
    {
        if (!response.IsSuccess)
            return response.ToHttp<AuthResult, AuthResponse>(AuthResponse.FromResult);

        AuthCookies.Write(HttpContext, response.Value!.AccessToken, response.Value.RefreshToken, _jwtSettings);
        return response.ToHttp<AuthResult, AuthResponse>(AuthResponse.FromResult);
    }
}
```

- [ ] **Step 3: Inspect existing `ToHttp()` helper and add projection overload if missing**

Open `Backend/src/Geyed.Platform.Api/Extensions/ServiceResponseExtensions.cs` (or whichever file contains `ToHttp`). If there is no overload taking a projection, add:

```csharp
public static ActionResult<TOut> ToHttp<TIn, TOut>(
    this ServiceResponse<TIn> response,
    Func<TIn, TOut> project)
{
    if (response.IsSuccess)
        return new OkObjectResult(project(response.Value!));

    // Reuse whatever error-mapping logic the existing ToHttp<T>() uses.
    // If the file exposes a private MapError(response) helper, call it; otherwise
    // replicate the non-success branches so error mapping stays in one place.
    return response.ToHttp().Result ?? new BadRequestResult();
}
```

If the existing `ToHttp` shape makes this awkward (e.g. it returns `ActionResult<T>` with a non-generic error path), the alternative is to keep the controller returning `AuthResult` internally and project after `ToHttp()` — but that leaks tokens. Prefer the projection overload; open the file first and choose the cleanest fit.

- [ ] **Step 4: Build and fix compile errors**

Run: `dotnet build Backend/src/Geyed.Platform.Api/Geyed.Platform.Api.csproj`
Expected: build success. Most likely compile errors:
- Missing `using Geyed.Platform.Api.Auth;`
- `AuthResult` property names (`AccessToken` vs `accessToken`) — verify against `Backend/src/Geyed.Platform.Core/Services/Auth/Models/AuthResult.cs`
- `ServiceResponse<T>.IsSuccess` / `.Value` spelling — check `Backend/src/Geyed.Platform.Core/Common/ServiceResponse.cs`

- [ ] **Step 5: Commit**

```bash
git -C ../../../Backend add src/Geyed.Platform.Api/V1/Controllers/AuthController.cs \
    src/Geyed.Platform.Api/V1/Models/AuthRequests.cs \
    src/Geyed.Platform.Api/Extensions/ServiceResponseExtensions.cs
git -C ../../../Backend commit -m "feat(auth): controller writes cookies and strips tokens from response"
```

---

## Task 8: CORS headers allowlist

**Files:**
- Modify: `Backend/src/Geyed.Platform.Api/AppStart/CORSConfiguration.cs`

Why: the dashboard CORS policy already uses `AllowAnyHeader()`, which is sufficient — but we depend on it allowing `X-Requested-With`. If future changes tighten CORS to `WithHeaders(...)`, the CSRF flow breaks silently. Add a comment pinning the contract.

- [ ] **Step 1: Annotate the policy**

In `CORSConfiguration.cs`, just above `policy.WithOrigins(allowedOrigins)` inside `AddPolicy(CorsPolicyName, ...)`, add:

```csharp
// NOTE: AllowAnyHeader is load-bearing for the dashboard CSRF guard —
// it must permit X-Requested-With so the RequireCsrfHeaderMiddleware check
// can run. If this ever moves to WithHeaders(...), include "X-Requested-With"
// and "Content-Type".
```

- [ ] **Step 2: Verify build**

Run: `dotnet build Backend/src/Geyed.Platform.Api/Geyed.Platform.Api.csproj`
Expected: build success.

- [ ] **Step 3: Commit**

```bash
git -C ../../../Backend add src/Geyed.Platform.Api/AppStart/CORSConfiguration.cs
git -C ../../../Backend commit -m "docs(cors): note CSRF header dependency on AllowAnyHeader"
```

---

## Task 9: Integration test factory for auth cookie flow

**Files:**
- Create: `Backend/tests/Geyed.Platform.Tests/Auth/AuthApiTestFactory.cs`

Why: there is no existing `WebApplicationFactory` for auth. Copy the pattern from `RateLimiting/RateLimitingTestFactory.cs`.

- [ ] **Step 1: Create the factory**

Write `Backend/tests/Geyed.Platform.Tests/Auth/AuthApiTestFactory.cs`:

```csharp
using Geyed.Platform.Core.Persistence;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Geyed.Platform.Tests.Auth;

public sealed class AuthApiTestFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = connectionString,
                ["Jwt:SecretKey"] = "test-secret-key-at-least-32-chars-long-xxxx",
                ["Jwt:Issuer"] = "geyed-test",
                ["Jwt:Audience"] = "geyed-test",
                ["Jwt:AccessTokenExpirationMinutes"] = "15",
                ["Jwt:RefreshTokenExpirationDays"] = "7",
                ["Cors:AllowedOrigins:0"] = "http://localhost:3000",
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString));

            services.AddHangfire(config =>
            {
                config
                    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                    .UseSimpleAssemblyNameTypeSerializer()
                    .UseRecommendedSerializerSettings()
                    .UsePostgreSqlStorage(options =>
                    {
                        options.UseNpgsqlConnection(connectionString);
                    });
            });
        });
    }
}
```

- [ ] **Step 2: Verify build**

Run: `dotnet build Backend/tests/Geyed.Platform.Tests/Geyed.Platform.Tests.csproj`
Expected: build success.

- [ ] **Step 3: Commit**

```bash
git -C ../../../Backend add tests/Geyed.Platform.Tests/Auth/AuthApiTestFactory.cs
git -C ../../../Backend commit -m "test(auth): add WebApplicationFactory for cookie-flow tests"
```

---

## Task 10: Integration tests for cookie flow

**Files:**
- Create: `Backend/tests/Geyed.Platform.Tests/Auth/AuthCookieFlowTests.cs`

Why: prove the full flow end-to-end against a real HTTP stack. Reuse the Postgres container fixture from the rate-limiting tests (`PostgresContainerFixture`).

- [ ] **Step 1: Write the tests**

Write `Backend/tests/Geyed.Platform.Tests/Auth/AuthCookieFlowTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Geyed.Platform.Api.Auth;
using Geyed.Platform.Api.V1.Models;
using Geyed.Platform.Tests.RateLimiting; // reuse PostgresContainerFixture

namespace Geyed.Platform.Tests.Auth;

public class AuthCookieFlowTests : IClassFixture<PostgresContainerFixture>
{
    private readonly PostgresContainerFixture _pg;

    public AuthCookieFlowTests(PostgresContainerFixture pg) => _pg = pg;

    private AuthApiTestFactory CreateFactory() => new(_pg.ConnectionString);

    private static HttpClient CreateClient(AuthApiTestFactory factory) =>
        factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });

    private static HttpRequestMessage Post(string url, object body)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(body)
        };
        req.Headers.Add("X-Requested-With", "geyed-dashboard");
        return req;
    }

    [Fact]
    public async Task Login_sets_auth_cookies_and_omits_tokens_from_body()
    {
        using var factory = CreateFactory();
        var client = CreateClient(factory);

        // Register first so the user exists.
        var registerRes = await client.SendAsync(Post("/api/v1/auth/register", new
        {
            email = $"t-{Guid.NewGuid():N}@example.com",
            password = "Password1",
            confirmPassword = "Password1",
            displayName = "Test",
        }));
        Assert.Equal(HttpStatusCode.OK, registerRes.StatusCode);

        var setCookies = registerRes.Headers.GetValues("Set-Cookie").ToList();
        Assert.Contains(setCookies, c => c.StartsWith($"{AuthCookies.AccessTokenCookie}=") && c.Contains("HttpOnly", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(setCookies, c => c.StartsWith($"{AuthCookies.RefreshTokenCookie}=") && c.Contains("HttpOnly", StringComparison.OrdinalIgnoreCase) && c.Contains("/api/v1/auth"));
        Assert.Contains(setCookies, c => c.StartsWith($"{AuthCookies.SessionMarkerCookie}=") && !c.Contains("HttpOnly", StringComparison.OrdinalIgnoreCase));

        var bodyJson = await registerRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(bodyJson);
        Assert.False(doc.RootElement.TryGetProperty("accessToken", out _));
        Assert.False(doc.RootElement.TryGetProperty("refreshToken", out _));
        Assert.True(doc.RootElement.TryGetProperty("user", out _));
    }

    [Fact]
    public async Task Refresh_rotates_cookies_when_refresh_cookie_present()
    {
        using var factory = CreateFactory();
        var client = CreateClient(factory);

        await client.SendAsync(Post("/api/v1/auth/register", new
        {
            email = $"t-{Guid.NewGuid():N}@example.com",
            password = "Password1",
            confirmPassword = "Password1",
            displayName = "Test",
        }));

        var refreshRes = await client.SendAsync(new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh")
        {
            Headers = { { "X-Requested-With", "geyed-dashboard" } }
        });

        Assert.Equal(HttpStatusCode.OK, refreshRes.StatusCode);
        var setCookies = refreshRes.Headers.GetValues("Set-Cookie").ToList();
        Assert.Contains(setCookies, c => c.StartsWith($"{AuthCookies.AccessTokenCookie}="));
        Assert.Contains(setCookies, c => c.StartsWith($"{AuthCookies.RefreshTokenCookie}="));
    }

    [Fact]
    public async Task Refresh_without_cookie_returns_401()
    {
        using var factory = CreateFactory();
        // Use a raw client so there's no cookie container carrying state.
        var client = factory.CreateClient();

        var res = await client.SendAsync(new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh")
        {
            Headers = { { "X-Requested-With", "geyed-dashboard" } }
        });

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Logout_clears_cookies_and_is_idempotent()
    {
        using var factory = CreateFactory();
        var client = CreateClient(factory);

        await client.SendAsync(Post("/api/v1/auth/register", new
        {
            email = $"t-{Guid.NewGuid():N}@example.com",
            password = "Password1",
            confirmPassword = "Password1",
            displayName = "Test",
        }));

        var logoutRes = await client.SendAsync(new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout")
        {
            Headers = { { "X-Requested-With", "geyed-dashboard" } }
        });

        Assert.Equal(HttpStatusCode.NoContent, logoutRes.StatusCode);
        var setCookies = logoutRes.Headers.GetValues("Set-Cookie").ToList();
        // ASP.NET Core's Cookies.Delete sends the cookie with Expires in the past.
        Assert.Contains(setCookies, c => c.StartsWith($"{AuthCookies.AccessTokenCookie}=") && c.Contains("expires=Thu, 01 Jan 1970", StringComparison.OrdinalIgnoreCase));

        // Second call with no cookies still returns 204.
        var client2 = factory.CreateClient();
        var res2 = await client2.SendAsync(new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout")
        {
            Headers = { { "X-Requested-With", "geyed-dashboard" } }
        });
        Assert.Equal(HttpStatusCode.NoContent, res2.StatusCode);
    }

    [Fact]
    public async Task Mutation_with_cookie_but_no_csrf_header_returns_403()
    {
        using var factory = CreateFactory();
        var client = CreateClient(factory);

        await client.SendAsync(Post("/api/v1/auth/register", new
        {
            email = $"t-{Guid.NewGuid():N}@example.com",
            password = "Password1",
            confirmPassword = "Password1",
            displayName = "Test",
        }));

        // No X-Requested-With header on a POST while the cookie container still holds auth cookies.
        var res = await client.PostAsync("/api/v1/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Cookie_alone_authenticates_me_endpoint()
    {
        using var factory = CreateFactory();
        var client = CreateClient(factory);

        await client.SendAsync(Post("/api/v1/auth/register", new
        {
            email = $"t-{Guid.NewGuid():N}@example.com",
            password = "Password1",
            confirmPassword = "Password1",
            displayName = "Test",
        }));

        // GET — safe method, no CSRF header needed, cookie is the only credential.
        var res = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }
}
```

- [ ] **Step 2: Run the tests**

Run: `dotnet test Backend/tests/Geyed.Platform.Tests/Geyed.Platform.Tests.csproj --filter FullyQualifiedName~AuthCookieFlowTests`
Expected: 6 tests PASS.

If any fail, diagnose by reading the output — common issues: the `FallbackPolicy` requires auth on every endpoint, so `/auth/me` must be reached after cookie is set. If `Program.cs` rejects the GET because authentication didn't pick up the cookie, the JWT fallback in Task 4 is wrong.

- [ ] **Step 3: Commit**

```bash
git -C ../../../Backend add tests/Geyed.Platform.Tests/Auth/AuthCookieFlowTests.cs
git -C ../../../Backend commit -m "test(auth): cover cookie login/refresh/logout/CSRF flow"
```

---

## Task 11: Frontend — rewrite `apiClient` for cookie auth

**Files:**
- Modify: `apps/dashboard/src/lib/api/client.ts`

Why: strip all localStorage handling; rely on the browser to send/receive cookies; attach the CSRF header to every request.

- [ ] **Step 1: Replace the file**

Replace the full contents of `apps/dashboard/src/lib/api/client.ts` with:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5073";

const CSRF_HEADER = "X-Requested-With";
const CSRF_VALUE = "geyed-dashboard";

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER]: CSRF_VALUE,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    [CSRF_HEADER]: CSRF_VALUE,
    ...extra,
  };
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options.headers),
  });

  if (response.status === 401 && !endpoint.startsWith("/api/v1/auth/")) {
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: buildHeaders(options.headers),
      });

      if (!retryResponse.ok) {
        let message = `API error: ${retryResponse.status} ${retryResponse.statusText}`;
        try {
          const body = await retryResponse.json();
          if (body.detail) message = body.detail;
          else if (body.title) message = body.title;
        } catch {
          // Response body wasn't JSON — use the default message
        }
        throw new Error(message);
      }

      if (retryResponse.status === 204) return undefined as T;
      return retryResponse.json();
    }

    // Refresh failed — best-effort logout to clear any stale cookies, then redirect.
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { [CSRF_HEADER]: CSRF_VALUE },
      });
    } catch {
      // Ignore — we're on our way out anyway.
    }

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (response.status === 402) {
    const body = await response.json().catch(() => ({}));
    const message = body.detail || "A subscription is required to access this resource.";
    const error = new Error(message);
    (error as any).status = 402;
    (error as any).requiresSubscription = body.extensions?.requiresSubscription;
    throw error;
  }

  if (response.status === 403) {
    const error = new Error("You don't have access to this resource.");
    (error as any).status = 403;
    throw error;
  }

  if (!response.ok) {
    let message = `API error: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body.detail) message = body.detail;
      else if (body.title) message = body.title;
    } catch {
      // Response body wasn't JSON — use the default message
    }
    const error = new Error(message);
    (error as any).status = response.status;
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
```

Notes on the change:
- `getAccessToken`, `getRefreshToken`, `setTokens`, `clearTokens`, and `TOKEN_KEYS` are all gone. Callers must not import them.
- `tryRefreshToken` no longer reads or writes tokens — the browser attaches `geyed_rt` automatically and the server rotates.
- The 401-refresh guard now skips retry for `/api/v1/auth/*` itself, preventing an infinite loop on `/auth/me` when logged out.

- [ ] **Step 2: Verify the dashboard still type-checks**

Run: `npx tsc --noEmit -p apps/dashboard/tsconfig.json` (or the project's existing type-check command — check `apps/dashboard/package.json` scripts).
Expected: failures in `auth-provider.tsx` where it imports `setTokens`, `clearTokens`, `getAccessToken`. Those are fixed in the next task.

- [ ] **Step 3: Do NOT commit yet**

The FE is in a broken state until Task 12 lands. Next task completes the FE wiring.

---

## Task 12: Frontend — update auth provider

**Files:**
- Modify: `apps/dashboard/src/providers/auth-provider.tsx`

Why: `auth-provider.tsx` is the only other caller of the token helpers. Update it to work purely off the `user` state plus `/auth/me` round-trips.

- [ ] **Step 1: Replace the file**

Replace the full contents of `apps/dashboard/src/providers/auth-provider.tsx` with:

```typescript
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthResult, UserInfoRm, LoginApiRequest, RegisterApiRequest } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";

interface AuthContextValue {
  user: UserInfoRm | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginApiRequest) => Promise<AuthResult>;
  register: (data: RegisterApiRequest) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfoRm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await apiClient<UserInfoRm>("/api/v1/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser().finally(() => setIsLoading(false));
  }, [fetchCurrentUser]);

  const login = useCallback(async (data: LoginApiRequest): Promise<AuthResult> => {
    const result = await apiClient<AuthResult>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (data: RegisterApiRequest): Promise<AuthResult> => {
    const result = await apiClient<AuthResult>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — redirect regardless.
    }
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

Key changes from the previous version:
- `import { setTokens, clearTokens, getAccessToken }` is gone.
- Initial load always calls `/auth/me`; a 401 just means "not logged in".
- `login`/`register` no longer call `setTokens` — the backend set the cookies on the response.
- `logout` is now async and hits `POST /auth/logout`.

- [ ] **Step 2: Update `AuthResult` type if needed**

Open `apps/dashboard/src/lib/api/types.ts`. If `AuthResult` has `accessToken` and `refreshToken` fields, remove them so the client type matches the new server response:

```typescript
export interface AuthResult {
  user: UserInfoRm;
  accessExpiresAt: string;
}
```

(Keep whatever other fields already match the backend DTO.)

- [ ] **Step 3: Search for any remaining callers**

Run:

Grep (from repo root `apps/dashboard`):
- `getAccessToken`
- `getRefreshToken`
- `setTokens`
- `clearTokens`
- `geyed_access_token`
- `geyed_refresh_token`

Expected: zero hits in `src/`. If any exist, delete the call site or migrate it — these are all dead now.

- [ ] **Step 4: Type-check**

Run: `npm --prefix apps/dashboard run type-check` (or `tsc --noEmit` via whichever script exists).
Expected: PASS.

- [ ] **Step 5: Commit FE (tasks 11 + 12 together)**

```bash
git add apps/dashboard/src/lib/api/client.ts \
    apps/dashboard/src/lib/api/types.ts \
    apps/dashboard/src/providers/auth-provider.tsx
git commit -m "feat(auth): dashboard uses HttpOnly cookies via credentials include"
```

---

## Task 13: Frontend — proxy middleware presence check

**Files:**
- Modify: `apps/dashboard/src/proxy.ts`

Why: the `geyed_access_token=1` marker cookie is gone; the new one is `geyed_session`.

- [ ] **Step 1: Switch the cookie name**

In `proxy.ts`, change:

```typescript
const hasToken = request.cookies.has("geyed_access_token");
```

to:

```typescript
const hasToken = request.cookies.has("geyed_session");
```

- [ ] **Step 2: Type-check**

Run: `npm --prefix apps/dashboard run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/proxy.ts
git commit -m "feat(auth): proxy checks geyed_session marker cookie"
```

---

## Task 14: End-to-end smoke in a real browser

**Files:** none

Why: there is no automated FE test harness for `apiClient`. Manual smoke confirms the full loop.

- [ ] **Step 1: Start backend and frontend**

Run in two terminals:
- `dotnet run --project Backend/src/Geyed.Platform.Api`
- `npm --prefix apps/dashboard run dev`

- [ ] **Step 2: Register a new user and verify cookies**

1. Open `http://localhost:3000/register` in a fresh incognito window.
2. Submit the form with a test email + password.
3. DevTools → Application → Cookies → `http://localhost:5073`. Confirm:
   - `geyed_at` present, `HttpOnly` ✓, `Secure` ✓ (will fail on plain HTTP dev — note below).
   - `geyed_rt` present, `HttpOnly` ✓, `Path=/api/v1/auth`.
   - `geyed_session` present, `HttpOnly` unchecked.
4. DevTools → Application → Local Storage. Confirm **no** `geyed_*` keys.

**Secure flag dev note:** `Secure` cookies are rejected by browsers on plain HTTP except for `localhost` (which browsers exempt). If dev is HTTP and the cookies get dropped, verify you're hitting `localhost` and not `127.0.0.1` or a LAN IP.

- [ ] **Step 3: Reload and verify session survives**

Hard-reload the dashboard (Ctrl+Shift+R). You should remain logged in and land on the dashboard without a redirect to `/login`.

- [ ] **Step 4: Verify access token expiry refresh**

Temporarily lower `Jwt:AccessTokenExpirationMinutes` to `1` in `Backend/src/Geyed.Platform.Api/appsettings.Development.json`, restart the backend, log in, wait ~70s, click around. The next API call should 401 silently, trigger `/auth/refresh`, and succeed. In DevTools → Network, you should see a 401 followed by a `POST /auth/refresh` 200 followed by a successful retry. Restore the original value after testing.

- [ ] **Step 5: Verify logout**

Click logout. Confirm:
- `POST /api/v1/auth/logout` fires and returns 204.
- All three cookies are gone from DevTools.
- You are redirected to `/login`.
- Navigating to `/` redirects back to `/login` (middleware presence check).

- [ ] **Step 6: Verify CSRF guard**

In DevTools console while logged in:

```javascript
fetch("http://localhost:5073/api/v1/auth/logout", {
  method: "POST",
  credentials: "include",
  // Deliberately missing X-Requested-With
}).then(r => console.log(r.status));
```

Expected: `403`. (The browser won't block this call — same-site POSTs aren't preflighted — but the server rejects it.)

- [ ] **Step 7: Close issue**

If all smoke steps pass, the change is complete. Do not close GitHub issue #3 yet — leave that for the user to close after they review the PR.

---

## Task 15: Run full backend test suite and commit final state

- [ ] **Step 1: Run all backend tests**

Run: `dotnet test Backend/Geyed.Platform.sln`
Expected: all green. If the existing auth or rate-limiting tests fail because of response-shape assumptions (e.g. they asserted `accessToken` in the body), update those assertions as part of this task.

- [ ] **Step 2: Run frontend type-check and build**

Run: `npm --prefix apps/dashboard run type-check && npm --prefix apps/dashboard run build`
Expected: both succeed.

- [ ] **Step 3: Final git status check**

Run: `git -C ../../../Backend status` and `git status`
Expected: clean working trees on both repos after all earlier commits.

- [ ] **Step 4: Summarise for the user**

Report back which commits landed, which files changed, and any follow-up items that surfaced during smoke testing. Do not open the PR or close the issue without explicit confirmation.
