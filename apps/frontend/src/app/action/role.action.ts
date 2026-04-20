import { AUTH_API_URL } from "@/lib/auth-api-url";
import axios from "axios";

const API_URL = `${AUTH_API_URL}/roles`;

export const getAllRoles = async () => {
  const { data } = await axios.get(`${API_URL}`);
  return data;
};

export const getRoleById = async (id: string) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Get role error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const createRole = async (
  name: string,
  description?: string,
  permissions?: string[],
) => {
  try {
    const res = await axios.post(`${API_URL}`, {
      name,
      description,
      permissions,
    });
    if (res.status === 201) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Create role error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const updateRole = async (
  id: string,
  name?: string,
  description?: string,
  permissions?: string[],
) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, {
      name,
      description,
      permissions,
    });
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Update role error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const deleteRole = async (id: string) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Delete role error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const assignPermissionToRole = async (
  roleId: string,
  permissionId: string,
) => {
  try {
    const res = await axios.post(
      `${API_URL}/${roleId}/permissions/${permissionId}`,
    );
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Assign permission error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};

export const removePermissionFromRole = async (
  roleId: string,
  permissionId: string,
) => {
  try {
    const res = await axios.delete(
      `${API_URL}/${roleId}/permissions/${permissionId}`,
    );
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Remove permission error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};
