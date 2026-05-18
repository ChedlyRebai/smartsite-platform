import axios from "axios";
import { userApi } from "@/lib/api-client";
export const LoginAction = async (cin: string, password: string) => {
  try {
    const res = await axios.post(`${process.env.LOGIN_API_URL}/login`, {
      cin,
      password,
    });

    console.log(
      `${process.env.LOGIN_API_URL}/login`,
      "ppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp",
    );
    console.log(
      `${process.env.LOGIN_API_URL}/login`,
      "ppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp",
    );
    if (res.status === 200) {
      const expires = new Date(Date.now() + 1000 * 1000 * 1000);

      cookieStore.set("jwt2", res.data.token);
      console.log("Login successful, token stored in cookie",res);
      return ({ status: res.status, data: res.data.message });
    }
  } catch (error: any) {
    console.error("Login error:", error?.response?.data?.message);
    return ({
      status: error?.response.status,
      data: error?.response?.data?.message,
    });
  }
};

export const getCurrentUser = async (authUser: any) => {
  try {
    const authApiUrl = import.meta.env.VITE_AUTH_API_URL || "http://localhost:3000";
    const res = await axios.get(`${authApiUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${authUser?.access_token}`,
      },
    });
    console.log("Get current user response:", res.data);
    return ({ status: res.status, data: res.data });
  } catch (error: any) {
    return ({
      status: error?.response?.status || 500,
      data: error?.response?.data?.message || "Error fetching user data",
    });
  }
};
