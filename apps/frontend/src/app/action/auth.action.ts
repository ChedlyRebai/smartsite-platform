import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

export const LoginAction = async (cin: string, password: string) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      cin,
      password,
    });

    console.log(
      `${API_BASE_URL}/auth/login`,
      "Login request sent"
    );
    if (res.status === 200) {
      const expires = new Date(Date.now() + 1000 * 1000 * 1000);

      return Promise.resolve({ status: res.status, data: res.data.message });
    }
  } catch (error: any) {
    console.error("Login error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response.status,
      data: error?.response?.data?.message,
    });
  }
};

export const getCurrentUser = async (authUser: any) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${authUser?.access_token}`,
      },
    });
    console.log("Get current user response:", res.data);
    return Promise.resolve({ status: res.status, data: res.data });
  } catch (error: any) {
    return Promise.resolve({
      status: error?.response?.status || 500,
      data: error?.response?.data?.message || "Error fetching user data",
    });
  }
};
