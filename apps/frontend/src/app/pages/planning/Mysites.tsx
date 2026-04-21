import {
  fetchSiteById,
  fetchSites,
  getSiteWIthTEAmId,
} from "@/app/action/site.action";

import { useQuery } from "@tanstack/react-query";

import { Warehouse } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import type { Site } from "../../types";

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { Link } from "react-router";
import { getCuureentUser } from "@/app/action/user.action";

const MySItes = () => {
  //const [sites, setSites] = useState<Site[]>([]);

  const { data: user   } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCuureentUser,
  });
  console.log("***********************************************user)", user);

  const { data: sites } = useQuery({
    queryKey: ["fetchSitesByUserId", user?.data.assignedTeam],
    queryFn: () => getSiteWIthTEAmId(user?.data.assignedTeam[0]),
    enabled: Boolean(user?.data.assignedTeam?.[0]),
  });



  console.log(sites,"************************************");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planing</h1>
          <p className="text-gray-500 mt-1">
            Manage site relationships and order
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sites &&
              sites.map((site) => (
                <div key={site.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {site.nom}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {site.address}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {site.budget} DT • {site.area} m²
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button size="sm" variant="outline">
                        <Link to={`/my-mil/${site.id}`}>Milestones</Link>
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

export default MySItes;
