import { useState } from "react";
import { Building2, MapPin, TrendingUp, Users, Eye } from "lucide-react";
import { StatCard } from "../../components/DashboardStats";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Progress } from "../../components/ui/progress";
import { mockSites, mockProjects } from "../../utils/mockData";
import { useAuthStore } from "../../store/authStore";

export default function WorksManagerDashboard() {
  const user = useAuthStore((state) => state.user);
  const [selectedSite, setSelectedSite] = useState<(typeof mockSites)[number] | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const openSiteDetails = (site: (typeof mockSites)[number]) => {
    setSelectedSite(site);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Works Management Overview
        </h1>
        <p className="text-gray-500 mt-1">
          Multi-site supervision - {user?.firstname}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sites"
          value={mockSites.length}
          icon={Building2}
          subtitle="Under supervision"
        />
        <StatCard
          title="Active Sites"
          value={mockSites.filter((s) => s.status === "in_progress").length}
          icon={MapPin}
          trend={{ value: 10, isPositive: true }}
        />
        <StatCard
          title="Overall Progress"
          value="42%"
          icon={TrendingUp}
          subtitle="Average across sites"
        />
        <StatCard
          title="Total Workforce"
          value={156}
          icon={Users}
          subtitle="Across all sites"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sites Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSites.map((site) => (
              <div
                key={site.id}
                role="button"
                tabIndex={0}
                onClick={() => openSiteDetails(site)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openSiteDetails(site);
                }}
                className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {site.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{site.address}</p>
                    <Progress value={site.progress} className="h-2 mb-2" />
                    <p className="text-sm text-gray-600">
                      Progress: {site.progress}%
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSiteDetails(site);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Détails du site</DialogTitle>
          </DialogHeader>
          {selectedSite && (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Nom :</span> {selectedSite.name}</p>
              <p><span className="font-semibold">Adresse :</span> {selectedSite.address}</p>
              <p><span className="font-semibold">Statut :</span> {selectedSite.status}</p>
              <p><span className="font-semibold">Progression :</span> {selectedSite.progress}%</p>
              <p><span className="font-semibold">Surface :</span> {selectedSite.area} m²</p>
              <p><span className="font-semibold">Budget :</span> ${(selectedSite.budget / 1000000).toFixed(1)}M</p>
              <p><span className="font-semibold">Date début :</span> {selectedSite.workStartDate}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
