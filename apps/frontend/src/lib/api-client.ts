import { useAuthStore } from "@/app/store/authStore";
import axios from "axios";

const {} = useAuthStore;
export const planingApi = axios.create({
  baseURL: process.env.PLANNING_URL || "http://localhost:3002",
  headers: {
    "Content-Type": "application/json",
  },
});

export const userApi = axios.create({
  baseURL: process.env.LOGIN_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

export const NotificationApi = axios.create({
  baseURL: process.env.NOTIFICATION_URL || "http://localhost:3004/notification",
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
