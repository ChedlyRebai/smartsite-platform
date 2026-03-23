// services/milestone.service.ts

import { planingApi } from "@/lib/api-client";
import { Milestone } from "../types";

export const getMilestonesByProjectId = async (projectId: string) => {
  const { data } = await planingApi.get(`/milestone/project/${projectId}`);
  return data;
};

export const createMilestone = async (milestone: Milestone,projectId:string) => {
  const { data } = await planingApi.post(`/milestone/project/${projectId}`, milestone);
  return data;
};

export const updateMilestone = async (
  milestoneId: string,
  milestone: Milestone
) => {
  const { data } = await planingApi.patch(
    `/milestone/${milestoneId}`,
    milestone
  );
  return data;
};

export const deleteMilestone = async (milestoneId: string) => {
  await planingApi.delete(`/milestone/${milestoneId}`);
};