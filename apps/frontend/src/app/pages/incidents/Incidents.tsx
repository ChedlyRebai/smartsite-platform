import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import {
  getIncidents,
  createIncident,
  deleteIncident,
  updateIncident,
  Incident,
  IncidentType,
  IncidentDegree,
} from "../../action/incident.action";
import {
  canCreateIncident,
  canReadIncident,
  canResolveIncident,
  canDeleteIncident,
  isReadOnly,
} from "../../utils/incidentPermissions";

const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  [IncidentType.MATERIEL]: "🔧 Matériel",
  [IncidentType.ENVIRONNEMENT]: "🌍 Environnement",
  [IncidentType.PERSONNEL]: "👤 Personnel",
};

const DEGREE_LABELS: Record<IncidentDegree, string> = {
  [IncidentDegree.LOW]: "Faible",
  [IncidentDegree.MEDIUM]: "Moyen",
  [IncidentDegree.HIGH]: "Critique",
};

const DEGREE_COLORS: Record<IncidentDegree, string> = {
  [IncidentDegree.LOW]: "bg-green-100 text-green-800",
  [IncidentDegree.MEDIUM]: "bg-yellow-100 text-yellow-800",
  [IncidentDegree.HIGH]: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  open: "🔴 Ouvert",
  in_progress: "🔵 En cours",
  resolved: "🟢 Résolu",
  closed: "⚫ Fermé",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

interface NewIncidentForm {
  type: IncidentType;
  degree: IncidentDegree;
  title: string;
  description: string;
  siteId: string;
  projectId: string;
  location: string;
  reporterName: string;
  reporterPhone: string;
  affectedPersons: string;
  immediateAction: string;
}

export default function Incidents() {
  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role?.name || "") as any;

  const canCreate = canCreateIncident(userRole);
  const canRead = canReadIncident(userRole);
  const isClientReadOnly = isReadOnly(userRole);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [formData, setFormData] = useState<NewIncidentForm>({
    type: IncidentType.MATERIEL,
    degree: IncidentDegree.MEDIUM,
    title: "",
    description: "",
    siteId: "",
    projectId: "",
    location: "",
    reporterName: user?.firstname || "",
    reporterPhone: "",
    affectedPersons: "",
    immediateAction: "",
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await getIncidents();
      if (canRead) {
        setIncidents(data);
      } else {
        setIncidents([]);
        toast.error("Vous n'avez pas la permission de lire les incidents");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur: impossible de charger les incidents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!formData.title || !formData.description || !formData.location) {
      toast.error("Les champs obligatoires doivent être remplis");
      return;
    }

    try {
      const incident = await createIncident({
        type: formData.type,
        degree: formData.degree,
        title: formData.title,
        description: formData.description,
        siteId: formData.siteId || undefined,
        projectId: formData.projectId || undefined,
        location: formData.location,
        reporterName: formData.reporterName,
        reporterPhone: formData.reporterPhone,
        affectedPersons: formData.affectedPersons || undefined,
        immediateAction: formData.immediateAction || undefined,
        reportedBy: user?.firstname || "Utilisateur",
        status: "open",
      });

      setIncidents([...incidents, incident]);
      setFormData({
        type: IncidentType.MATERIEL,
        degree: IncidentDegree.MEDIUM,
        title: "",
        description: "",
        siteId: "",
        projectId: "",
        location: "",
        reporterName: user?.firstname || "",
        reporterPhone: "",
        affectedPersons: "",
        immediateAction: "",
      });
      setIsFormOpen(false);
      toast.success("Incident créé avec succès!");
      await fetchIncidents();
    } catch (error: any) {
      toast.error("Erreur: impossible de créer l'incident");
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident) return;

    try {
      const updated = await updateIncident(selectedIncident.id, {
        status: "resolved",
        resolutionNotes: resolutionNotes,
        resolvedBy: user?.firstname || "Utilisateur",
      });

      setIncidents(incidents.map((i) => (i.id === updated.id ? updated : i)));
      setSelectedIncident(null);
      setResolutionNotes("");
      setIsResolveOpen(false);
      toast.success("Incident marqué comme résolu!");
      await fetchIncidents();
    } catch (error: any) {
      toast.error("Erreur: impossible de résoudre l'incident");
    }
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      await deleteIncident(id);
      setIncidents(incidents.filter((i) => i.id !== id));
      toast.success("Incident supprimé");
    } catch (error: any) {
      toast.error("Erreur: impossible de supprimer l'incident");
    }
  };

  if (!canRead) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-semibold">
              ❌ Vous n'avez pas la permission d'accéder aux incidents.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Incidents
          </h1>
          <p className="text-gray-500 mt-1">
            Suivi et résolution des incidents de sécurité et qualité
          </p>
        </div>
        {canCreate && !isClientReadOnly && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                + Signaler un Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Signaler un nouvel incident</DialogTitle>
                <DialogDescription>
                  Remplissez tous les détails de l'incident
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Row 1: Type & Degree */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type d'incident *</Label>
                    <select
                      id="type"
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as IncidentType,
                        })
                      }
                    >
                      {Object.entries(INCIDENT_TYPE_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="degree">Degré de sévérité *</Label>
                    <select
                      id="degree"
                      className="w-full px-3 py-2 border rounded-md"
                      value={formData.degree}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          degree: e.target.value as IncidentDegree,
                        })
                      }
                    >
                      {Object.entries(DEGREE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de l'incident *</Label>
                  <Input
                    id="title"
                    placeholder="Titre court et descriptif"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description détaillée *</Label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Décrivez l'incident en détail"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Lieu de l'incident *</Label>
                  <Input
                    id="location"
                    placeholder="Zone, bâtiment, ou localisation"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                {/* Row 2: Site & Project */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteId">Chantier (optionnel)</Label>
                    <Input
                      id="siteId"
                      placeholder="ID du chantier"
                      value={formData.siteId}
                      onChange={(e) =>
                        setFormData({ ...formData, siteId: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectId">Projet (optionnel)</Label>
                    <Input
                      id="projectId"
                      placeholder="ID du projet"
                      value={formData.projectId}
                      onChange={(e) =>
                        setFormData({ ...formData, projectId: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Row 3: Reporter Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporterName">Nom du signataire</Label>
                    <Input
                      id="reporterName"
                      placeholder="Nom complet"
                      value={formData.reporterName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reporterName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reporterPhone">Téléphone</Label>
                    <Input
                      id="reporterPhone"
                      placeholder="+216 XX XXX XXX"
                      value={formData.reporterPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reporterPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Affected Persons */}
                <div className="space-y-2">
                  <Label htmlFor="affectedPersons">
                    Personnes affectées (optionnel)
                  </Label>
                  <textarea
                    id="affectedPersons"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Nom des personnes affectées, blessures, etc."
                    value={formData.affectedPersons}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        affectedPersons: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>

                {/* Immediate Action */}
                <div className="space-y-2">
                  <Label htmlFor="immediateAction">
                    Action immédiate prise (optionnel)
                  </Label>
                  <textarea
                    id="immediateAction"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Actions de premiers secours ou mesures d'urgence"
                    value={formData.immediateAction}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        immediateAction: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={handleCreateIncident}
                >
                  Créer l'incident
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Tous les incidents ({incidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chargement des incidents...</p>
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                Aucun incident signalé
              </p>
            ) : (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {INCIDENT_TYPE_LABELS[incident.type]}:{" "}
                          {incident.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {incident.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={DEGREE_COLORS[incident.degree] || ""}>
                          {DEGREE_LABELS[incident.degree]}
                        </Badge>
                        {incident.status && (
                          <Badge
                            className={
                              STATUS_COLORS[incident.status] || "bg-gray-100"
                            }
                          >
                            {STATUS_LABELS[incident.status] || incident.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {incident.location && (
                        <div>
                          <span className="font-medium">Lieu:</span>{" "}
                          {incident.location}
                        </div>
                      )}
                      {incident.reporterName && (
                        <div>
                          <span className="font-medium">Signataire:</span>{" "}
                          {incident.reporterName}
                        </div>
                      )}
                      {incident.siteId && (
                        <div>
                          <span className="font-medium">Chantier:</span>{" "}
                          {incident.siteId}
                        </div>
                      )}
                      {incident.reportedAt && (
                        <div>
                          <span className="font-medium">Date:</span>{" "}
                          {new Date(incident.reportedAt).toLocaleString(
                            "fr-FR",
                          )}
                        </div>
                      )}
                    </div>

                    {/* Affected Persons */}
                    {incident.affectedPersons && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm">
                          <span className="font-medium">
                            Personnes affectées:
                          </span>{" "}
                          {incident.affectedPersons}
                        </p>
                      </div>
                    )}

                    {/* Resolution Notes */}
                    {incident.resolutionNotes && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm">
                          <span className="font-medium">Résolution:</span>{" "}
                          {incident.resolutionNotes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {canResolveIncident(userRole, incident.degree) &&
                        incident.status === "open" && (
                          <Dialog
                            open={
                              isResolveOpen &&
                              selectedIncident?.id === incident.id
                            }
                            onOpenChange={(open) => {
                              setIsResolveOpen(open);
                              if (!open) setSelectedIncident(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => setSelectedIncident(incident)}
                              >
                                ✓ Résoudre
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Résoudre l'incident</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="resolution">
                                    Notes de résolution
                                  </Label>
                                  <textarea
                                    id="resolution"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Décrivez les actions prises pour résoudre l'incident"
                                    value={resolutionNotes}
                                    onChange={(e) =>
                                      setResolutionNotes(e.target.value)
                                    }
                                    rows={4}
                                  />
                                </div>
                                <Button
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  onClick={handleResolveIncident}
                                >
                                  Marquer comme résolu
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                      {canDeleteIncident(userRole) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteIncident(incident.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
