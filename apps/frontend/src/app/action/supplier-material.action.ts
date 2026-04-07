import axios from "axios";
import { AUTH_API_URL } from "../../lib/auth-api-url";

const API_URL = `${AUTH_API_URL}/suppliers-materials`;

function getAuthHeaders(): { Authorization?: string } {
  const authData = localStorage.getItem("smartsite-auth");
  const token =
    localStorage.getItem("access_token") ||
    (authData
      ? (() => {
          try {
            return JSON.parse(authData)?.state?.user?.access_token;
          } catch {
            return null;
          }
        })()
      : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface SupplierMaterial {
  _id?: string;
  supplierId: { _id: string; name: string; supplierCode: string };
  catalogItemId: { _id: string; code: string; name: string; category: string; unit: string };
  supplierRef?: string;
  unitPrice: number;
  currency: string;
  deliveryDays?: number;
  availability: string;
  qualityScore?: number;
  isPreferred: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllSupplierMaterials = async (query?: {
  supplierId?: string;
  catalogItemId?: string;
  page?: number;
  limit?: number;
}): Promise<{ status: number; data: SupplierMaterial[]; total?: number }> => {
  try {
    const params = new URLSearchParams();
    if (query?.supplierId) params.append("supplierId", query.supplierId);
    if (query?.catalogItemId) params.append("catalogItemId", query.catalogItemId);
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());

    const res = await axios.get(`${API_URL}?${params.toString()}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data.data, total: res.data.total };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    return { status: err?.response?.status ?? 500, data: [] };
  }
};

export const getMaterialsBySupplier = async (supplierId: string): Promise<{ status: number; data: SupplierMaterial[] }> => {
  try {
    const res = await axios.get(`${API_URL}/supplier/${supplierId}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    return { status: err?.response?.status ?? 500, data: [] };
  }
};

export const getSuppliersByCatalogItem = async (catalogItemId: string): Promise<{ status: number; data: SupplierMaterial[] }> => {
  try {
    const res = await axios.get(`${API_URL}/catalog-item/${catalogItemId}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    return { status: err?.response?.status ?? 500, data: [] };
  }
};

export const getSupplierMaterialById = async (id: string): Promise<{ status: number; data: SupplierMaterial }> => {
  try {
    const res = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    return { status: err?.response?.status ?? 500, data: {} as SupplierMaterial };
  }
};

export const createSupplierMaterial = async (data: Partial<SupplierMaterial>): Promise<{ status: number; data: SupplierMaterial }> => {
  try {
    const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    return { status: err?.response?.status ?? 500, data: {} as SupplierMaterial };
  }
};

export const updateSupplierMaterial = async (id: string, data: Partial<SupplierMaterial>): Promise<{ status: number; data: SupplierMaterial }> => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
    return { status: res.status, data: res.data };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown } };
    return { status: err?.response?.status ?? 500, data: {} as SupplierMaterial };
  }
};

export const deleteSupplierMaterial = async (id: string): Promise<{ status: number }> => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return { status: res.status };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    return { status: err?.response?.status ?? 500 };
  }
};