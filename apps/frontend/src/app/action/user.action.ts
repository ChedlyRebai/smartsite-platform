import axios from "axios";

const API_URL = "http://localhost:3000/users";

export const getAllUsers = async () => {
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

export const getUserById = async (id: string) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Get user error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const createUser = async (userData: {
  cin: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  telephone?: string;
  address?: string;
}) => {
  try {
    const res = await axios.post(`${API_URL}`, userData);
    if (res.status === 201) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Create user error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const updateUser = async (
  id: string,
  userData: {
    cin: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    telephone?: string;
    address?: string;
  },
) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, userData);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Update user error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const deleteUser = async (id: string) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Delete user error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const assignRoleToUser = async (userId: string, roleId: string) => {
  try {
    const res = await axios.post(`${API_URL}/${userId}/roles/${roleId}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Assign role error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const removeRoleFromUser = async (userId: string, roleId: string) => {
  try {
    const res = await axios.delete(`${API_URL}/${userId}/roles/${roleId}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Remove role error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};
