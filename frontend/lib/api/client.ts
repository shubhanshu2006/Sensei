import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Important for cookies
});

// Store for the getToken function (set by useApiAuth hook)
// This is NOT storing the token itself, just the function to get it securely
let getTokenFunction: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  getTokenFunction = fn;
}

// Request interceptor - Get token from Clerk securely
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get fresh token from Clerk (stored in httpOnly cookie by Clerk)
    if (getTokenFunction) {
      try {
        const token = await getTokenFunction();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error getting auth token:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string }>) => {
    const message = error.response?.data?.message || "An error occurred";

    // Don't show toast for specific endpoints (e.g., polling)
    if (!error.config?.headers?.["X-No-Toast"]) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please sign in again.");
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
      } else if (error.response?.status === 403) {
        toast.error("You do not have permission to perform this action.");
      } else if (error.response?.status === 404) {
        toast.error("Resource not found.");
      } else if (error.response?.status === 429) {
        toast.error("Too many requests. Please slow down.");
      } else if (error.response?.status && error.response.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  },
);
