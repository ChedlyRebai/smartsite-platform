import { fetchSites } from "@/app/action/site.action";

import { useQuery } from "@tanstack/react-query";

import {
  Plus,
  MapPin,
  Search,
  Filter,
  Trash2,
  Edit,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  PauseCircle,
  Warehouse,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { useAuthStore } from "../../store/authStore";
import { mockSites } from "../../utils/mockData";
import { toast } from "sonner";
import type { Site } from "../../types";
import { createSite, updateSite, deleteSite } from "../../action/site.action";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { Link } from "react-router";

const ProjectMilestone = () => {
  const [sites, setSites] = useState<Site[]>([]);

  const { data, isPending, isLoading, isError } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const response = await fetchSites();
      setSites(response.data);
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
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Planing Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sites.map((site) => (
              <div key={site.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{site.address}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {site.budget} DT • {site.area} m²
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button  size="sm" variant="outline">
                     <Link to={`/project-milestone/${site.id}`} >Milestones</Link>
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
