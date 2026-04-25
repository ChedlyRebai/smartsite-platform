import {
  AlertTriangle,
  Search,
  Upload,
  FileText,
  Send,
  User,
  Download,
  UserCheck,
  Users,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { mockIncidents } from "../../utils/mockData";
import { toast } from "sonner";
import axios from "axios";
import { trackAuditEvent } from "../../action/audit.action";
import { incidentMatchesSearch } from "../../utils/incidentSearchFilter";
import { incidentEvents } from "../../components/IncidentBadge";
import { NotificationPanel } from "../../components/NotificationPanel";

// API pour les incidents (port 3003 avec prefixe /api)
const incidentsApi = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

// API pour les utilisateurs
const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
});

// API pour les projets (port 3007)
const projectsApi = axios.create({
  baseURL: "http://localhost:3007",
  timeout: 10000,
});

// API pour les sites (port 3001 avec prefixe /api)
const sitesApi = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
});

const getAuthToken = (): string | null => {
  const directToken = localStorage.getItem("access_token");
  if (directToken) return directToken;
  const persisted = localStorage.getItem("smartsite-auth");
  if (!persisted) return null;
  try {
    const parsed = JSON.parse(persisted);
    return parsed?.state?.user?.access_token || null;
  } catch {
    return null;
  }
};

incidentsApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function Incidents() {
  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role?.name || user?.role || "user") as string;
  const canManageIncidents = user && canEdit(userRole, "incidents");

  const [incidents, setIncidents] = useState(mockIncidents);
  const [filteredIncidents, setFilteredIncidents] = useState(mockIncidents);
  const [searchTerm, setSearchTerm] = useState("");
  const [newIncident, setNewIncident] = useState({
    type: "",
    description: "",
    severity: "medium",
    image: null as File | null,
    pdfReport: null as File | null,
    assignedUserCin: "",
    assignedUserRole: "all",
    incidentName: "",
    projectId: "",
    siteId: "",
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [targetUserCin, setTargetUserCin] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  const [showUserSelectDialog, setShowUserSelectDialog] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUserForIncident, setSelectedUserForIncident] = useState<any>(null);
  const [assignRoleFilter, setAssignRoleFilter] = useState<string>("all");
  const [assignCinSearch, setAssignCinSearch] = useState<string>("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [selectedIncidentDetails, setSelectedIncidentDetails] = useState<any>(null);
  const [showIncidentDetailsDialog, setShowIncidentDetailsDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 6;

  const filteredAssignableUsers = allUsers.filter((u) => {
    const isActive = (u as any).isActive ?? (u as any).estActif ?? true;
    const hasCin = !!u?.cin;
    return isActive && hasCin;
  });

  const assignableRoles = Array.from(
    new Set(filteredAssignableUsers.map((u) => u?.role?.name).filter(Boolean)),
  ) as string[];

  const filteredAssignable = filteredAssignableUsers.filter((u) => {
    const matchesRole =
      assignRoleFilter === "all" || u?.role?.name === assignRoleFilter;
    const q = assignCinSearch.trim().toLowerCase();
    const matchesCin =
      !q ||
      String(u?.cin || "")
        .toLowerCase()
        .includes(q) ||
      `${u?.firstname || u?.firstName || ""} ${
        u?.lastname || u?.lastName || ""
      }`
        .toLowerCase()
        .includes(q);
    return matchesRole && matchesCin;
  });

  useEffect(() => {
    let filtered = allUsers;
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role?.name === selectedRole);
    }
    if (userSearchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.cin?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.firstname?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.lastname?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()),
      );
    }
    setFilteredUsers(filtered);
  }, [allUsers, userSearchTerm, selectedRole]);

  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          toast.error("Veuillez vous reconnecter");
          return;
        }
        const response = await api.get("/users");
        setAllUsers(response.data);
      } catch (error) {
        console.error("Erreur users:", error);
      }
    };

    const loadIncidents = async () => {
      try {
        const response = await incidentsApi.get("/incidents");
        setIncidents(response.data);
        setFilteredIncidents(response.data);
      } catch (error) {
        console.error("Erreur incidents:", error);
        setIncidents(mockIncidents);
        setFilteredIncidents(mockIncidents);
      }
    };

    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const token = getAuthToken();
        const response = await projectsApi.get("/projects", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        let data = response.data;
        if (!Array.isArray(data)) data = data?.data || data?.projects || [];
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    const loadSites = async () => {
      try {
        setIsLoadingSites(true);
        const token = getAuthToken();
        const response = await sitesApi.get("/gestion-sites", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        let data = response.data;
        if (!Array.isArray(data)) data = data?.data || data?.sites || [];
        setSites(Array.isArray(data) ? data : []);
      } catch {
        setSites([]);
      } finally {
        setIsLoadingSites(false);
      }
    };

    loadAllUsers();
    loadIncidents();
    loadProjects();
    loadSites();

    const unsubUpdated = incidentEvents.on("updated", () => loadIncidents());
    const unsubDeleted = incidentEvents.on("deleted", () => loadIncidents());
    return () => { unsubUpdated(); unsubDeleted(); };
  }, []);

  useEffect(() => {
    const filtered = incidents.filter((i) => incidentMatchesSearch(i, searchTerm));
    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [incidents, searchTerm]);

  const indexOfLast = currentPage * incidentsPerPage;
  const indexOfFirst = indexOfLast - incidentsPerPage;
  const currentIncidents = filteredIncidents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

  const handleAddIncident = async () => {
    try {
      const data: any = {
        title: newIncident.incidentName || newIncident.type,
        type: newIncident.type,
        description: newIncident.description,
        severity: newIncident.severity,
        reportedBy: user?.cin || "Unknown",
        assignedToCin: newIncident.assignedUserCin || null,
        assignedUserRole: newIncident.assignedUserRole !== "all" ? newIncident.assignedUserRole : null,
      };
      if (newIncident.projectId) data.projectId = newIncident.projectId;
      if (newIncident.siteId) data.siteId = newIncident.siteId;

      const response = await incidentsApi.post("/incidents", data);
      const savedIncident = response.data;
      setIncidents([savedIncident, ...incidents]);
      setFilteredIncidents([savedIncident, ...incidents]);
      setNewIncident({ type: "", description: "", severity: "medium", image: null, pdfReport: null, assignedUserCin: "", assignedUserRole: "all", incidentName: "", projectId: "", siteId: "" });
      toast.success("Incident enregistré");
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur enregistrement");
    }
  };

  const handleResolveIncident = async (id: string) => {
    try {
      await incidentsApi.put(`/incidents/${id}`, { status: "resolved" });
      setIncidents(incidents.map((i) => (i.id === id ? { ...i, status: "resolved" } : i)));
      toast.success("Résolu");
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    try {
      await incidentsApi.delete(`/incidents/${id}`);
      setIncidents(incidents.filter((i) => i.id !== id));
      setFilteredIncidents(filteredIncidents.filter((i) => i.id !== id));
      toast.success("Supprimé");
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur suppression");
    }
  };

  const handleAssignIncident = async () => {
    if (!selectedIncident || !targetUserCin.trim()) return;
    setIsSearchingUser(true);
    try {
      const res = await api.get(`/users/cin/${targetUserCin}`);
      setFoundUser(res.data);
      toast.success("Assigné");
    } catch {
      toast.error("Non trouvé");
      setFoundUser(null);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const selectUserForIncident = (u: any) => {
    setSelectedUserForIncident(u);
    setShowUserSelectDialog(false);
    toast.success(`Sélectionné: ${u.firstname}`);
  };

  const generateDescriptionWithAI = async () => {
    if (!newIncident.type || !newIncident.severity) {
      toast.error("Type et gravité requis");
      return;
    }
    setIsGeneratingDescription(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const map: any = {
        safety: { low: "Incident mineur", medium: "Incident modéré", high: "Incident majeur", critical: "Incident critique" },
        quality: { low: "Non-conformité mineure", medium: "Non-conformité modérée", high: "Non-conformité majeure", critical: "Non-conformité critique" },
        delay: { low: "Retard mineur", medium: "Retard modéré", high: "Retard majeur", critical: "Retard critique" },
        other: { low: "Incident mineur", medium: "Incident modéré", high: "Incident majeur", critical: "Incident critique" },
      };
      const d = map[newIncident.type as keyof typeof map]?.[newIncident.severity as keyof typeof map.safety] || "Description";
      setNewIncident({ ...newIncident, description: d });
      toast.success("Généré");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const getUniqueRoles = () => ["all", ...Array.from(new Set(allUsers.map((u) => u.role?.name).filter(Boolean)))];

  const handleExportPDF = (incident: any) => {
    const txt = `ID: ${incident.id}\nType: ${incident.type}\nGravité: ${incident.severity}\nStatut: ${incident.status}\nDescription: ${incident.description || "N/A"}\nRapporté par: ${incident.reportedBy}`;
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident_${incident.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exporté");
  };

  const handleShowIncidentDetails = (incident: any) => {
    setSelectedIncidentDetails(incident);
    setShowIncidentDetailsDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incident Management</h1>
          <p className="text-gray-500">Document a safety or quality incident</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationPanel />
          {canManageIncidents ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button><AlertTriangle className="h-4 w-4 mr-2" />Report Incident</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report New Incident</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={newIncident.type} onValueChange={(v) => setNewIncident({ ...newIncident, type: v })}>
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="delay">Delay</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newIncident.description} onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Nom incident</Label>
                    <Input value={newIncident.incidentName} onChange={(e) => setNewIncident({ ...newIncident, incidentName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Sévérité</Label>
                    <Select value={newIncident.severity} onValueChange={(v) => setNewIncident({ ...newIncident, severity: v })}>
                      <SelectTrigger><SelectValue placeholder="Sévérité" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Projet (opt)</Label>
                    <Select value={newIncident.projectId || "none"} onValueChange={(v) => setNewIncident({ ...newIncident, projectId: v === "none" ? "" : v, siteId: "" })} disabled={isLoadingProjects}>
                      <SelectTrigger><SelectValue placeholder="Projet" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {projects.map((p) => <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Site (opt)</Label>
                    <Select value={newIncident.siteId || "none"} onValueChange={(v) => setNewIncident({ ...newIncident, siteId: v === "none" ? "" : v })} disabled={isLoadingSites}>
                      <SelectTrigger><SelectValue placeholder="Site" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {sites.filter((s) => !newIncident.projectId || s.projectId === newIncident.projectId).map((s) => <SelectItem key={s._id || s.id} value={s._id || s.id}>{s.nom || s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assigner CIN (opt)</Label>
                    <Input value={newIncident.assignedUserCin} onChange={(e) => setNewIncident({ ...newIncident, assignedUserCin: e.target.value })} placeholder="CIN" />
                  </div>
                  <Button className="w-full" onClick={handleAddIncident}>Report</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button disabled>+ Report (No perm)</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> All Incidents</div>
            <div className="relative"><Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" /><Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" /></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentIncidents.length === 0 ? (
              <p className="text-center py-8 text-gray-500">{searchTerm ? "Aucun" : "No incidents"}</p>
            ) : (
              currentIncidents.map((inc) => (
                <div key={inc.id} className="p-4 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => handleShowIncidentDetails(inc)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{(inc as any).title?.toUpperCase() || inc.type.toUpperCase()}</h3>
                      <p className="text-sm text-gray-600">{inc.description}</p>
                      <p className="text-xs text-gray-400">{inc.reportedBy} • {new Date(inc.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Badge variant={inc.severity === "critical" || inc.severity === "high" ? "destructive" : "secondary"}>{inc.severity}</Badge>
                      <Badge variant={inc.status === "resolved" ? "secondary" : "destructive"}>{inc.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {inc.status !== "resolved" && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleResolveIncident(String(inc.id)); }}>Mark Resolved</Button>}
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleExportPDF(inc); }}><Download className="h-3 w-3 mr-1" />Export</Button>
                    <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDeleteIncident(String(inc.id)); }}>Suppr</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button size="sm" variant="outline" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Prev</Button>
          {[...Array(totalPages)].map((_, i) => <Button key={i} size="sm" variant={currentPage === i + 1 ? "default" : "outline"} className="w-8 h-8 p-0" onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>)}
          <Button size="sm" variant="outline" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}

      <Dialog open={showIncidentDetailsDialog} onOpenChange={setShowIncidentDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Détails</DialogTitle></DialogHeader>
          {selectedIncidentDetails && (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded"><h3 className="font-bold">{(selectedIncidentDetails as any).title?.toUpperCase() || selectedIncidentDetails.type.toUpperCase()}</h3><p className="text-sm">ID: {selectedIncidentDetails.id}</p></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Type</Label><p className="text-sm">{selectedIncidentDetails.type.toUpperCase()}</p></div><div><Label>Signalé par</Label><p className="text-sm">{selectedIncidentDetails.reportedBy}</p></div></div>
              <div><Label>Description</Label><p className="text-sm p-2 bg-gray-50 rounded">{selectedIncidentDetails.description || "N/A"}</p></div>
              <div className="flex gap-2">
                {selectedIncidentDetails.status !== "resolved" && <Button onClick={() => { handleResolveIncident(String(selectedIncidentDetails.id)); setShowIncidentDetailsDialog(false); }}>Mark Resolved</Button>}
                <Button variant="outline" onClick={() => handleExportPDF(selectedIncidentDetails)}><Download className="h-4 w-4 mr-1" />Export</Button>
                <Button variant="destructive" onClick={() => { handleDeleteIncident(String(selectedIncidentDetails.id)); setShowIncidentDetailsDialog(false); }}>Suppr</Button>
                <Button variant="secondary" onClick={() => setShowIncidentDetailsDialog(false)}>Fermer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
