import { AUTH_API_URL } from "@/lib/auth-api-url";
import axios from "axios";

const API_URL = `${AUTH_API_URL}/stats`;

export const getAllStatics = async () => {
  try {
    const res = await axios.get(`${API_URL}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Get users error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};
