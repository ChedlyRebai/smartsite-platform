import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const getPermissions = async () => {
  try {
    const token = useAuthStore.getState().user?.access_token;
    console.log(
      "Fetching permissions with token:",
      token,
    );
    
    if (!token) {
      console.error("No token found in auth store");
      return Promise.resolve({
        status: 401,
        data: "No authentication token found",
      });
    }
    
    const res = await axios.get(`http://localhost:3000/api/users/mypermissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 200) {
      return Promise.resolve({
        status: res.status,
        data: res.data.permissions,
      });
    }
    return res.data.permissions || [];
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return Promise.resolve({
      status: error?.response.status,
      data: error?.response?.data?.message,
    });
  }
};
