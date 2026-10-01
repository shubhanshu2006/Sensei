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

// Request interceptor - Get token from Clerk securely & attach device fingerprint
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Get fresh token from Clerk (stored in httpOnly cookie by Clerk)
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

    // 2. Attach open-source device fingerprint to every outgoing request
    if (typeof window !== "undefined") {
      try {
        const fp =
          sessionStorage.getItem("sensei_device_fingerprint") ||
          localStorage.getItem("sensei_device_fingerprint");
        if (fp && config.headers) {
          config.headers["X-Device-Fingerprint"] = fp;
        }
      } catch {
        // Ignore storage restrictions
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Unwrap ApiResponse and handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // If backend returned an ApiResponse envelope, unwrap the nested data
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      "success" in response.data
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error: AxiosError<{ message: string }>) => {
    const message = error.response?.data?.message || "An error occurred";

    // Intercept device account switching block
    if (
      error.response?.status === 403 &&
      (message.includes("already associated with an existing Sensei account") ||
        message.includes("Multiple accounts or account switching") ||
        message.includes("already registered to another account"))
    ) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("sensei:device_account_blocked", {
            detail: { message },
          }),
        );
      }
      return Promise.reject(error);
    }

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
