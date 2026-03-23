import { planingApi } from "@/lib/api-client";

export const getAllTaskStages = async () => {
  try {
    const { data } = await planingApi.get(
      `task-stage`
    );
    return data;
  } catch (error) {
    console.log("Error fetching task stages:", error);
    return Promise.reject(error);
  }
};
