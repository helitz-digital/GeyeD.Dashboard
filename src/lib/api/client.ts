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
