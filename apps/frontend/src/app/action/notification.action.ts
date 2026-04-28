import { AuthState } from "./../types/index";
import { NotificationApi } from "@/lib/api-client";

export const getMyNotifications = async (page = 1, limit = 10) => {
  const { data } = await NotificationApi.get("/mynotifications", {
    params: { page, limit },
  });
  return data;
};

export const getTeamNotifications = async (
  teamId: string,
  page = 1,
  limit = 10,
) => {
  const { data } = await NotificationApi.get(`/team/${teamId}`, {
    params: { page, limit },
  });
  return data || ([] as Notification[]);
};

export const getUnreadNotifications = async (page = 1, limit = 10) => {
  const { data } = await NotificationApi.get("/unread", {
    params: { page, limit },
  });
  console.log("data unread================================", data);
  return data || ([] as Notification[]);
};

export const getReadNotifications = async (page = 1, limit = 10) => {
  const { data } = await NotificationApi.get("/read", {
    params: { page, limit },
  });
  return data || ([] as Notification[]);
};

export const getTeamUnreadNotifications = async (
  teamId: string,
  page = 1,
  limit = 10,
) => {
  const { data } = await NotificationApi.get(`/team/${teamId}/unread`, {
    params: { page, limit },
  });
  return data || ([] as Notification[]);
};

export const getUnreadNotificationCount = async () => {
  const { data } = await NotificationApi.get("/unread-count");
  return data;
};

export const getTeamUnreadNotificationCount = async (teamId: string) => {
  const { data } = await NotificationApi.get(`/team/${teamId}/unread-count`);
  return data;
};

export const markTeamNotificationsAsRead = async (teamId: string) => {
  const { data } = await NotificationApi.post(`/team/${teamId}/mark-all-read`);
  return data;
};

export const deleteNotificationById = async (id: string) => {
  try {
    const res = await NotificationApi.delete(`/${id}`);
    if (res.status === 200) {
      return Promise.resolve({ status: res.status, data: res.data });
    }
  } catch (error: any) {
    console.error("Delete notification error:", error?.response?.data?.message);
    return Promise.resolve({
      status: error?.response?.status,
      data: error?.response?.data?.message,
    });
  }
};
