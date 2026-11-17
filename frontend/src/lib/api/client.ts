import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { API_ENDPOINTS } from "./endpoints";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.omnicassion.com/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const mapUser = (user: any) => {
  if (!user) return null
  const primaryRole = user.role || user.roles?.[0] || 'USER'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    roles: user.roles,
    role: primaryRole,
    name,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
  }
}

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined"
      ? useAuthStore.getState().accessToken
      : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    const { refreshToken, accessToken, user, setCredentials, logout } = useAuthStore.getState()

    if (!accessToken || typeof window === "undefined") {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const refreshPayload = refreshToken ? { refreshToken } : {}
      const { data } = await axios.post(
        `${API_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        refreshPayload,
        { withCredentials: true },
      )

      const nextAccessToken = data?.tokens?.accessToken
      const nextRefreshToken = data?.tokens?.refreshToken ?? refreshToken
      const nextUser = mapUser(data?.user) ?? user

      if (nextAccessToken && nextUser) {
        setCredentials(nextAccessToken, nextRefreshToken, nextUser)
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${nextAccessToken}`,
        }
        return apiClient(originalRequest)
      }
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        logout()
        window.location.href = "/login"
      }
      return Promise.reject(refreshError)
    }

    return Promise.reject(error)
  }
);
