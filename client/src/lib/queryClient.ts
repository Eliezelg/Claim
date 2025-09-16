import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Handle FormData (for file uploads) - don't set Content-Type
  const isFormData = data instanceof FormData;
  
  // Add Authorization header if we have a token
  const headers: HeadersInit = !isFormData && data ? { "Content-Type": "application/json" } : {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  // Handle 401 - try to refresh token and retry once
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry the request with new token
      const newHeaders = { ...headers };
      newHeaders['Authorization'] = `Bearer ${newToken}`;
      
      const retryRes = await fetch(url, {
        method,
        headers: newHeaders,
        body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
        credentials: "include",
      });
      
      await throwIfResNotOk(retryRes);
      return retryRes;
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// Token management
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Refresh token function
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Send refresh token cookie
    });
    
    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data.accessToken;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  
  // Clear token if refresh failed
  setAccessToken(null);
  return null;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url: string;
    
    if (queryKey.length === 1) {
      // Simple case: just the URL
      url = queryKey[0] as string;
    } else if (queryKey.length === 2 && typeof queryKey[1] === 'object') {
      // Object-based query parameters
      const baseUrl = queryKey[0] as string;
      const params = queryKey[1] as Record<string, any>;
      url = baseUrl + buildQueryString(params);
    } else {
      // Legacy case: join with slashes (keep for compatibility)
      url = queryKey.join("/") as string;
    }

    // Add Authorization header if we have a token
    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    // Handle 401 - try to refresh token and retry once
    if (res.status === 401 && accessToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry the request with new token
        const retryRes = await fetch(url, {
          credentials: "include",
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
        });
        
        if (retryRes.ok) {
          return await retryRes.json();
        }
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
