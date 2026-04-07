import { useAuthStore } from "@/app/store/authStore";
import axios from "axios";

const BASE_URL = "http://localhost:9000/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});

axiosInstance.interceptors.request.use((config) => {
  
  try {
    const persistedAuth = localStorage.getItem("smartsite-auth");
    const accessToken= useAuthStore().user?.access_token;
  
    
      // const parsedAuth = JSON.parse(persistedAuth);
      // const accessToken = parsedAuth?.state?.user?.access_token;

      if (accessToken) {
        const nextHeaders = { ...(config.headers as any), Authorization: `Bearer ${accessToken}` };
        config.headers = nextHeaders as any;
      }
    
  } catch {
    // Ignore malformed persisted auth state and fall back to cookie auth.
  }

  return config;
});
