import { useAuthStore } from "@/app/store/authStore";
import axios from "axios";
import { AUTH_API_URL } from "@/lib/auth-api-url";
import { PAYMENT_API_URL } from "@/lib/payment-api-url";

export const FACTURE_API_URL = import.meta.env.VITE_PAYMENT_URL 
  ? import.meta.env.VITE_PAYMENT_URL.replace('/payments', '/factures')
  : "http://localhost:3007/api/factures";

export const planingApi = axios.create({
  baseURL:
    process.env.VITE_PLANNING_URL || "http://localhost:3002",
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
    process.env.VITE_NOTIFICATION_URL ||
    "http://localhost:3004/notification",
  headers: {
    "Content-Type": "application/json",
  },
});


userApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


NotificationApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
planingApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user.access_token;
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

export const factureApi = axios.create({
  baseURL: FACTURE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const setupAuthInterceptor = (api: axios.AxiosInstance) => {
  api.interceptors.request.use((config) => {
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
};

setupAuthInterceptor(paymentApi);
setupAuthInterceptor(factureApi);
