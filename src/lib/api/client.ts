const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5073";

const TOKEN_KEYS = {
  access: "geyed_access_token",
  refresh: "geyed_refresh_token",
} as const;

export function getAccessToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEYS.access) : null;
}

export function getRefreshToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEYS.refresh) : null;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEYS.access, accessToken);
  localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
  // Also set a cookie for middleware route protection (presence check only)
  document.cookie = `${TOKEN_KEYS.access}=1; path=/; SameSite=Lax`;
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  document.cookie = `${TOKEN_KEYS.access}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Handle 401 with token refresh
  if (response.status === 401 && getRefreshToken()) {
    // Deduplicate concurrent refresh attempts
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      // Retry the original request with new token
      const newToken = getAccessToken();
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...options.headers,
        },
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
    } else {
      // Refresh failed — clear tokens, redirect to login
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
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
