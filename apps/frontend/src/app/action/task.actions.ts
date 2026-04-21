import { getTaskStageById } from './taskStage.action';
// services/task.service.ts

import { planingApi } from "@/lib/api-client";
import { CreateTaskPayload, UpdateTaskPayload } from "../types";

export const getTasksByMilestoneId = async (milestoneId: string) => {
  const { data } = await planingApi.get(`/task/milestone/${milestoneId}`);
  return data;
};
//localhost:3002/task/milestone/:milestoneId/task-stage/:taskStageId'
export const createTask = async (task: CreateTaskPayload) => {
  const { data } = await planingApi.post(`/task`, task);
  return data;
};

export const updateTask = async (taskId: string, task: UpdateTaskPayload) => {
  const { data } = await planingApi.put(`/task/${taskId}`, task);
  return data;
};

export const deleteTask = async (taskId: string) => {
  await planingApi.delete(`/task/${taskId}`);
};

export const getCurrentUserTask = async () => {
  const { data } = await planingApi.get(`/task/my-tasks`);
  return data;
};

export const getTaskByTeamid = async (teamId : string)=>{
  const {data} = await planingApi.get(`/task/team/${teamId}`);
  return data;
}

export const getAllTaskStagesByMilestoneId= async (milestoneId:string) =>{
  const {data} = await planingApi.get(`task-stage/milestone/${milestoneId}`);
  return data
}

export const getTaskStageByteamIdandMilestoneId = async (milestoneId:string,teamId:string) =>{
  const {data} = await planingApi.get(`task-stage/milestone/${milestoneId}/team/${teamId}`);
  return data
}

export const getTaskSTagesByMilestoneId = async (milestoneId: string) => {
  //http://localhost:3002/task-stage/milestone/69bc788e0912805125e58f70
  console.log("Fetching task stages for milestone ID:", milestoneId);
  const { data } = await planingApi.get(`task-stage/milestone/${milestoneId}`);
  console.log("Received task stages data:", data);
  return data;
};

export const getGanttTasksByMilestoneId = async (milestoneId: string) => {
  const { data } = await planingApi.get(`task-stage/milestone/${milestoneId}/gantt`);
  return data;
};

export const getMyTAsks = async (milestoneId: string,teamId:string) => {
  //milestone/:milestoneId/team/:teamId
  //http://localhost:3002/task-stage/milestone/69bc788e0912805125e58f70
  console.log("Fetching task stages for milestone ID:", milestoneId);
  const { data } = await planingApi.get(`task-stage/milestone/${milestoneId}/team/${teamId}`);
  console.log("Received task stages data:", data);
  return data;
};

  