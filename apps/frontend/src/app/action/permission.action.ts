import axios from "axios";

const API_URL =  "http://localhost:3000/permissions";

export const getAllPermissions = async () => {
  try {
    const res = await axios.get(`${API_URL}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Get permissions error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const getPermissionById = async (id: string) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Get permission error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const createPermission = async (permissionData: {
  name: string;
  description?: string;
  resource?: string;
  action?: string;
}) => {
  try {
    const res = await axios.post(`${API_URL}`, permissionData);
    if (res.status === 201) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Create permission error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const updatePermission = async (
  id: string,
  permissionData: {
    name?: string;
    description?: string;
    resource?: string;
    action?: string;
  }
) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, permissionData);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Update permission error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const deletePermission = async (id: string) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Delete permission error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};
