import { useAuthStore } from "@/app/store/authStore";
import axios from "axios";
import { AUTH_API_URL } from "@/lib/auth-api-url";
import { PAYMENT_API_URL } from "@/lib/payment-api-url";

export const planingApi = axios.create({
  baseURL:
    import.meta.env.VITE_PLANNING_URL || "http://localhost:3002",
  headers: {
    "Content-Type": "application/json",
  },
});

export const userApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: { "Content-Type": "application/json" },
});

export const NotificationApi = axios.create({
  baseURL:
    import.meta.env.VITE_NOTIFICATION_URL ||
    "http://localhost:3004/notification",
  headers: {
    "Content-Type": "application/json",
  },
});

NotificationApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user.access_token;
  console.log(token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
planingApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user.access_token;
  console.log("interceptor token", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const paymentApi = axios.create({
  baseURL: PAYMENT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

paymentApi.interceptors.request.use((config) => {
  const authData = localStorage.getItem('smartsite-auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed.state?.user?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.state.user.access_token}`;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  return config;
});
