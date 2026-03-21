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

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { getMilestonesByProjectId } from "@/app/action/planing.action";
import useMilestoneModal from "@/app/hooks/use-milestone-modal";

const ProjectMilestone = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const { isOpen, setProjectId, onOpen } = useMilestoneModal();
  const { projectId } = useParams();
  console.log("project id from milestone page", projectId);
  const { data, isPending, isLoading, isError } = useQuery({
    queryKey: ["siteMilestoneData"],
    queryFn: async () => {
      const response = await getMilestonesByProjectId(projectId);
      setMilestones(response.data);
      console.log(response.data);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planing</h1>
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
              Planing Management
            </CardTitle>

            <Button
              className="cursor-pointer"
              onClick={() => {
                onOpen();
                setProjectId(projectId);
              }}
            >
              <PlusIcon />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone._id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {milestone.description}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {typeof (milestone.startDate) =="object" ? milestone.startDate?.toLocaleDateString() : milestone.startDate} •{" "}
                      {typeof (milestone.endDate) =="object" ? milestone.endDate?.toLocaleDateString() : milestone.endDate}
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
