
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
    throw error;
  }
};



export const getTaskStagesByMilestoneId = async (milestoneId: string) => {
  try {
    const { data } = await planingApi.get(
      `task-stage/milestone/${milestoneId}`
    );
    return data;
  }

  catch (error) {
    console.log("Error fetching task stages by milestone id:", error);
    throw error;
  }
}

export const getTaskStageById = async (taskStageId: string) => {
  try {
    const { data } = await planingApi.get(
      `task-stage/${taskStageId}`
    );
    return data;
  }

  catch (error) {
    console.log("Error fetching task stage by id:", error);
    throw error;
  }
}

export const removeTaskStage = async (taskStageId: string) => {
  try {
    const response = await planingApi.delete(
      `task-stage/${taskStageId}`
    );
    return ({ status: response.status, data: response.data });
  }

  catch (error) {
    console.log("Error deleting task stage:", error);
    throw error;
  }
}
export const createTaskStage = async (taskStage: TaskStage, milestoneId: string ) => {
    try {
        const response = await planingApi.post(`task-stage/milestone/${milestoneId}`, taskStage);
        return ({ status: response.status, data: response.data });
     } catch (error) {
        console.log("Error creating task stage:", error);
        throw error;
     }
}

export const updateTaskStage = async (taskStageId: string, taskStage: { name: string }) => {
    try {
        const response = await planingApi.put(`task-stage/${taskStageId}`, taskStage);  
        return ({ status: response.status, data: response.data });
    }
      catch (error) {
        console.log("Error updating task stage:", error);
        throw error;
    }
};
