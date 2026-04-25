import { fetchSites } from "@/app/action/site.action";

import { useQuery } from "@tanstack/react-query";

import { PlusIcon, Warehouse } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";

import type { Milestone, Site } from "../../types";

import { useState } from "react";
import { Link, useParams } from "react-router";
import { getMilestonesByProjectId } from "@/app/action/milestone.action";
import useMilestoneModal from "@/app/hooks/use-milestone-modal";

const ProjectMilestone = () => {
  const { isOpen, setProjectId, onOpen } = useMilestoneModal();
  const { projectId } = useParams();
  console.log("project id from milestone page", projectId);
  const {
    data: milestones,
    isPending,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["milestones", projectId],
    queryFn: () => getMilestonesByProjectId(projectId || ""),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planning</h1>
          <p className="text-gray-500 mt-1">
            Manage site relationships and orders
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Project Milestone
            </CardTitle>

            <Button
              className="cursor-pointer"
              onClick={() => {
                setProjectId(projectId as string);
                console.log(
                  "project id from milestone page on click",
                  projectId,
                );
                onOpen();
              }}
            >
              <PlusIcon />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones?.map((milestone:Milestone) => (
              <div key={milestone._id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {milestone.description}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(milestone.startDate as Date).toLocaleDateString()} -{" "}
                      
                      •{" "}
                      {new Date(milestone.endDate as Date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button size="sm" variant="outline">
                      <Link to={`/milestone-tasks/${milestone._id}`}>
                        Tasks
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectMilestone;
