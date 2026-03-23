
import { planingApi } from "@/lib/api-client";
import { TaskStage } from "../types";

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


export const createTaskStage = async (taskStage: TaskStage, milestoneId: string ) => {
    try {
        const response = await planingApi.post(`task-stage/milestone/${milestoneId}`, taskStage);
        return Promise.resolve({ status: response.status, data: response.data });
     } catch (error) {
        console.log("Error creating task stage:", error);
        return Promise.reject(error);
     }
}

export const updateTaskStage = async (taskStageId: string, taskStage: { name: string }) => {
    try {
        const response = await planingApi.put(`task-stage/${taskStageId}`, taskStage);  
        return Promise.resolve({ status: response.status, data: response.data });
    }
      catch (error) {
        console.log("Error updating task stage:", error);
        return Promise.reject(error);
    }
};
