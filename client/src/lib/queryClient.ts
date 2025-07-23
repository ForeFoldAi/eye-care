import { QueryClient, QueryFunction } from "@tanstack/react-query";
export { useMutation } from "@tanstack/react-query"; // Re-export for convenience

// ✅ Load your backend URL from .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 🔁 Throw error if fetch fails
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ✅ Reusable API request function
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${url}`, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// 🔁 Type-safe QueryFunction generator with 401 handling
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    const url = `${API_URL}${queryKey[0] as string}`;

    const res = await fetch(url, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as unknown as T; // Ensure T is assignable
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };
};

// ✅ Global React Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: false,
    },
  },
});
