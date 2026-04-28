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
import { IncidentBiDashboard } from "../../components/IncidentBiDashboard";

// API pour rechercher des utilisateurs
const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000, // 10 secondes timeout
});

// API pour les incidents (port 3003)
const incidentsApi = axios.create({
  baseURL: "http://localhost:3003",
  timeout: 10000,
});

// API pour les projets (port 3010)
const projectsApi = axios.create({
  baseURL: "https://smartsite-gestion-projects-latest.onrender.com",
  timeout: 10000,
});

// API pour les sites (port 3001 avec préfixe /api)
const sitesApi = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
});

// Récupérer le token depuis plusieurs sources (store persist + clé directe)
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

// Configuration des headers pour l'authentification - incidents API
incidentsApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(
    "🔍 Frontend: Requête Incidents API:",
    config.method?.toUpperCase(),
    config.url,
    "avec token:",
    !!token,
  );
  return config;
});

// Interceptor pour les réponses (debug) - incidents API
incidentsApi.interceptors.response.use(
  (response) => {
    console.log(
      "🔍 Frontend: Réponse Incidents API réussie:",
      response.config.url,
      response.status,
      "taille:",
      Array.isArray(response.data) ? response.data.length : "non-array",
    );
    return response;
  },
  (error) => {
    console.error(
      "❌ Frontend: Erreur Incidents API:",
      error.config?.url,
      error.response?.status,
      error.message,
    );
    return Promise.reject(error);
  },
);

// Configuration des headers pour l'authentification
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(
    "🔍 Frontend: Requête API:",
    config.method?.toUpperCase(),
    config.url,
    "avec token:",
    !!token,
  );
  return config;
});

// Interceptor pour les réponses (debug)
api.interceptors.response.use(
  (response) => {
    console.log(
      "🔍 Frontend: Réponse API réussie:",
      response.config.url,
      response.status,
      "taille:",
      Array.isArray(response.data) ? response.data.length : "non-array",
    );
    return response;
  },
  (error) => {
    console.error(
      "❌ Frontend: Erreur API:",
      error.config?.url,
      error.response?.status,
      error.message,
    );
    return Promise.reject(error);
  },
);

export default function Incidents() {
  console.log("🎯 Frontend: Composant Incidents monté!");

  const user = useAuthStore((state) => state.user);
  console.log("🎯 Frontend: User depuis store:", user);

  // Contournement : si le role est null, utiliser un role par défaut
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageIncidents = user && canEdit(userRole.name, "incidents");
  const [incidents, setIncidents] = useState(mockIncidents);
  const [filteredIncidents, setFilteredIncidents] = useState(mockIncidents);
  const [searchTerm, setSearchTerm] = useState("");
  const [newIncident, setNewIncident] = useState({
    type: "",
    description: "",
    severity: "medium",
    image: null as File | null,
    pdfReport: null as File | null,
    assignedUserCin: "", // Champ optionnel pour assignation directe
    assignedUserRole: "all", // Champ optionnel pour filtre par rôle avec valeur par défaut
    incidentName: "", // Nouveau champ pour le nom de l'incident
    projectId: "", // Champ pour assigner à un projet
    siteId: "", // Champ pour assigner à un site
  });

  // États pour les listes de projets et sites
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [targetUserCin, setTargetUserCin] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  // États pour la sélection d'utilisateur
  const [showUserSelectDialog, setShowUserSelectDialog] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUserForIncident, setSelectedUserForIncident] =
    useState<any>(null);
  const [assignRoleFilter, setAssignRoleFilter] = useState<string>("all");
  const [assignCinSearch, setAssignCinSearch] = useState<string>("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [selectedIncidentDetails, setSelectedIncidentDetails] =
    useState<any>(null);
  const [showIncidentDetailsDialog, setShowIncidentDetailsDialog] =
    useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 6;

  console.log(
    "🎯 Frontend: États initialisés - allUsers.length:",
    allUsers.length,
  );

  // Filtrer les incidents par recherche (dont nom d'incident : title, incidentName, etc.)
  useEffect(() => {
    const filtered = incidents.filter((incident) =>
      incidentMatchesSearch(incident, searchTerm),
    );
    setFilteredIncidents(filtered);
    setCurrentPage(1); // Réinitialiser à la première page lors de la recherche
  }, [incidents, searchTerm]);

  // Calculer les incidents pour la page actuelle
  const indexOfLastIncident = currentPage * incidentsPerPage;
  const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
  const currentIncidents = filteredIncidents.slice(
    indexOfFirstIncident,
    indexOfLastIncident,
  );

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

  // Utilisateurs disponibles pour assignation (comptes déjà créés/validés)
  const assignableUsers = allUsers.filter((u) => {
    const isActive = (u as any).isActive ?? (u as any).estActif ?? true;
    const hasCin = !!u?.cin;
    return isActive && hasCin;
  });

  const assignableRoles = Array.from(
    new Set(assignableUsers.map((u) => u?.role?.name).filter(Boolean)),
  ) as string[];

  const filteredAssignableUsers = assignableUsers.filter((u) => {
    const matchesRole =
      assignRoleFilter === "all" || u?.role?.name === assignRoleFilter;
    const q = assignCinSearch.trim().toLowerCase();
    const matchesCin =
      !q ||
      String(u?.cin || "")
        .toLowerCase()
        .includes(q) ||
      `${u?.firstname || u?.firstName || ""} ${u?.lastname || u?.lastName || ""}`
        .toLowerCase()
        .includes(q);
    return matchesRole && matchesCin;
  });

  // Filtrer les utilisateurs par recherche et rôle
  useEffect(() => {
    let filtered = allUsers;

    // Filtrer par rôle
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role?.name === selectedRole);
    }

    // Filtrer par terme de recherche
    if (userSearchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.cin?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.firstname
            ?.toLowerCase()
            .includes(userSearchTerm.toLowerCase()) ||
          user.lastname?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()),
      );
    }

    setFilteredUsers(filtered);
    console.log(
      "🔍 Frontend: Filtrage utilisateurs - Total:",
      allUsers.length,
      "Filtrés:",
      filtered.length,
    );
  }, [allUsers, userSearchTerm, selectedRole]);

  // Charger tous les utilisateurs, projets et sites au démarrage - UNE SEULE FOIS
  useEffect(() => {
    console.log("🔄 Frontend: useEffect déclenché!");

    const loadAllUsers = async () => {
      try {
        console.log("🔍 Frontend: Début du chargement des utilisateurs...");

        // Vérifier le token directement
        const token = getAuthToken();
        console.log("🔍 Frontend: Token brut:", token ? "présent" : "absent");

        if (!token) {
          console.error("❌ Frontend: Aucun token disponible");
          toast.error(
            "Veuillez vous reconnecter - Token manquant dans localStorage",
          );
          return;
        }

        console.log("🔍 Frontend: Appel API en cours...");
        const response = await api.get("/users");
        console.log(
          "🔍 Frontend: Réponse reçue:",
          response.data.length,
          "utilisateurs",
        );
        console.log(
          "🔍 Frontend: Type de réponse:",
          typeof response.data,
          "Array?",
          Array.isArray(response.data),
        );

        if (response.data.length > 0) {
          console.log("🔍 Frontend: Premier utilisateur:", {
            cin: response.data[0].cin,
            name: response.data[0].firstname + " " + response.data[0].lastname,
            role: response.data[0].role?.name,
            status: response.data[0].status,
          });
        }

        console.log(
          "🔍 Frontend: Avant setAllUsers - allUsers.length:",
          allUsers.length,
        );
        console.log(
          "🔍 Frontend: Données à setter:",
          JSON.stringify(response.data).slice(0, 100) + "...",
        );

        setAllUsers(response.data);

        console.log("🔍 Frontend: setAllUsers appelé");
        console.log(
          "✅ Frontend: Utilisateurs chargés - réponse length:",
          response.data.length,
        );

        // Forcer la vérification après un court délai
        setTimeout(() => {
          console.log(
            "🔍 Frontend: Vérification différée - allUsers.length:",
            allUsers.length,
          );
        }, 500);
      } catch (error:any) {
        console.error(
          "❌ Frontend: Erreur lors du chargement des utilisateurs:",
          error,
        );
        if (error.response) {
          console.error("❌ Frontend: Status:", error.response.status);
          console.error("❌ Frontend: Data:", error.response.data);
        }
        toast.error("Erreur lors du chargement des utilisateurs");
      }
    };

    loadAllUsers();

    // Charger les incidents depuis la base de données
    const loadIncidents = async () => {
      try {
        console.log("🔍 Frontend: Chargement des incidents depuis la base...");

        const response = await incidentsApi.get("/incidents");
        console.log(
          "🔍 Frontend: Incidents chargés depuis la base:",
          response.data.length,
        );
        console.log(
          "🔍 Frontend: Structure des incidents:",
          JSON.stringify(response.data[0], null, 2),
        );

        setIncidents(response.data);
        setFilteredIncidents(response.data);
        console.log("✅ Frontend: Incidents sauvegardés dans le state local");
        console.log(
          "🔍 Frontend: Incidents avec assignation:",
          response.data.filter((i: any) => i.assignedTo),
        );

        // Debug: Afficher les champs d'assignation pour chaque incident
        response.data.forEach((incident: any, index: number) => {
          console.log(`🔍 Incident ${index + 1}:`, {
            id: incident.id,
            title: incident.title,
            assignedTo: incident.assignedTo,
            assignedUserRole: incident.assignedUserRole,
            hasAssignment: !!(incident.assignedTo || incident.assignedUserRole),
          });
        });
      } catch (error:any) {
        console.error(
          "❌ Frontend: Erreur lors du chargement des incidents:",
          error,
        );
        if (error.response) {
          console.error("❌ Frontend: Status:", error.response.status);
          console.error("❌ Frontend: Data:", error.response.data);
        }
        // En cas d'erreur, utiliser les mock data
        console.log("🔄 Frontend: Utilisation des mock data en fallback");
        setIncidents(mockIncidents);
        setFilteredIncidents(mockIncidents);
      }
    };

    loadIncidents();

    // Écouter les événements du badge (quand un incident est traité/supprimé depuis /sites)
    const unsubscribeUpdated = incidentEvents.on('updated', (data) => {
      console.log('📢 Incident page received update:', data);
      toast.success('✅ Incident traité', {
        description: `L'incident a été marqué comme traité depuis la page Sites/Projets`,
        duration: 5000,
      });
      // Rafraîchir la liste
      loadIncidents();
    });

    const unsubscribeDeleted = incidentEvents.on('deleted', (data) => {
      console.log('📢 Incident page received delete:', data);
      toast.error('🗑️ Incident supprimé', {
        description: `L'incident a été supprimé depuis la page Sites/Projets`,
        duration: 5000,
      });
      // Rafraîchir la liste
      loadIncidents();
    });

    // Charger les projets depuis le service gestion-projects (port 3007)
    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const token = getAuthToken();
        const response = await projectsApi.get("/projects", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        // Gérer différents formats de réponse
        let projectsData = response.data;
        if (!Array.isArray(projectsData)) {
          // Si c'est un objet avec une propriété data
          projectsData = projectsData?.data || projectsData?.projects || [];
        }
        if (!Array.isArray(projectsData)) {
          projectsData = [];
        }
        setProjects(projectsData);
        console.log("✅ Frontend: Projets chargés:", projectsData.length);
        console.log("🔍 Premier projet:", projectsData[0]);
      } catch (error:any) {
        console.error("❌ Frontend: Erreur chargement projets:", error);
        console.error("   URL:", error.config?.url);
        console.error("   Status:", error.response?.status);
        setProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    loadProjects();

    // Charger les sites depuis le service gestion-site (port 3001)
    const loadSites = async () => {
      try {
        setIsLoadingSites(true);
        const token = getAuthToken();
        const response = await sitesApi.get("/gestion-sites", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        // Gérer différents formats de réponse
        let sitesData = response.data;
        if (!Array.isArray(sitesData)) {
          // Si c'est un objet avec une propriété data
          sitesData = sitesData?.data || sitesData?.sites || [];
        }
        if (!Array.isArray(sitesData)) {
          sitesData = [];
        }
        setSites(sitesData);
        console.log("✅ Frontend: Sites chargés:", sitesData.length);
        console.log("🔍 Premier site:", sitesData[0]);
      } catch (error:any) {
        console.error("❌ Frontend: Erreur chargement sites:", error);
        console.error("   URL:", error.config?.url);
        setSites([]);
      } finally {
        setIsLoadingSites(false);
      }
    };
    loadSites();

    return () => {
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, []);

  // Fonction pour ajouter un incident
  const handleAddIncident = async () => {
    try {
      // Créer l'objet incident pour l'API
      const incidentData: any = {
        title: newIncident.incidentName || newIncident.type, // Utiliser le nom personnalisé ou le type
        type: newIncident.type, // Backend attend aussi 'type'
        description: newIncident.description,
        severity: newIncident.severity,
        reportedBy: user?.cin || "Unknown",
        assignedToCin: newIncident.assignedUserCin || null, // Utiliser le bon champ
        assignedUserRole:
          newIncident.assignedUserRole !== "all"
            ? newIncident.assignedUserRole
            : null,
      };

      // Ajouter projectId et siteId seulement si renseignés
      if (newIncident.projectId) {
        incidentData.projectId = newIncident.projectId;
      }
      if (newIncident.siteId) {
        incidentData.siteId = newIncident.siteId;
      }

      console.log("🔍 Frontend: Envoi incident vers API:", incidentData);

      // Sauvegarder dans la base de données via l'API
      const response = await incidentsApi.post("/incidents", incidentData);
      console.log(
        "✅ Frontend: Incident sauvegardé dans la base:",
        response.data,
      );

      // Ajouter l'incident au state local
      const incident = {
        id: response.data.id || String(incidents.length + 1),
        title: newIncident.incidentName || newIncident.type, // Utiliser le nom personnalisé ou le type
        type: newIncident.type as "safety" | "quality" | "delay" | "other",
        description: newIncident.description,
        severity: newIncident.severity as
          | "medium"
          | "low"
          | "high"
          | "critical",
        reportedBy: user?.cin || "Unknown",
        status: "open" as "open" | "investigating" | "resolved" | "closed",
        createdAt: new Date().toISOString(),
        siteId: "default-site",
        assignedTo: newIncident.assignedUserCin || null, // Utiliser le bon champ
        assignedUserRole:
          newIncident.assignedUserRole !== "all"
            ? newIncident.assignedUserRole || null
            : null,
      };

      // Mettre à jour les états dans le bon ordre
      setIncidents([incident, ...incidents]);
      setFilteredIncidents([incident, ...incidents]); // Mettre à jour filteredIncidents aussi
      setNewIncident({
        type: "",
        description: "",
        severity: "medium",
        image: null,
        pdfReport: null,
        assignedUserCin: "",
        assignedUserRole: "all",
        incidentName: "",
        projectId: "",
        siteId: "",
      });

      toast.success("Incident enregistré avec succès dans la base de données");
    } catch (error:any) {
      console.error(
        "❌ Frontend: Erreur lors de la sauvegarde de l'incident:",
        error,
      );
      if (error.response) {
        console.error("❌ Frontend: Status:", error.response.status);
        console.error("❌ Frontend: Data:", error.response.data);
      }
      toast.error("Erreur lors de l'enregistrement de l'incident");
    }
  };

  const handleResolveIncident = async (id: string) => {
    try {
      // Mettre à jour l'incident dans la base de données
      await incidentsApi.put(`/incidents/${id}`, {
        status: "resolved",
      });

      // Mettre à jour le state local
      setIncidents(
        incidents.map((incident) =>
          incident.id === id ? { ...incident, status: "resolved" } : incident,
        ),
      );
      trackAuditEvent({
        actionType: "update",
        actionLabel: "Resolved incident",
        resourceType: "incident",
        resourceId: id,
        severity: "important",
        status: "success",
      });

      toast.success("Incident marqué comme résolu");
    } catch (error) {
      console.error(
        "❌ Frontend: Erreur lors de la résolution de l'incident:",
        error,
      );
      toast.error("Erreur lors de la résolution de l'incident");
    }
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      // Confirmation de suppression
      const confirmed = window.confirm(
        "Êtes-vous sûr de vouloir supprimer cet incident ? Cette action est irréversible.",
      );
      if (!confirmed) {
        return;
      }

      // Supprimer l'incident dans la base de données
      await incidentsApi.delete(`/incidents/${id}`);

      // Mettre à jour le state local
      setIncidents(incidents.filter((incident) => incident.id !== id));
      setFilteredIncidents(
        filteredIncidents.filter((incident) => incident.id !== id),
      );
      trackAuditEvent({
        actionType: "delete",
        actionLabel: "Deleted incident",
        resourceType: "incident",
        resourceId: id,
        severity: "critical",
        status: "success",
      });

      toast.success("Incident supprimé avec succès");
    } catch (error) {
      console.error(
        "❌ Frontend: Erreur lors de la suppression de l'incident:",
        error,
      );
      toast.error("Erreur lors de la suppression de l'incident");
    }
  };

  // Fonction pour assigner un incident à un utilisateur
  const handleAssignIncident = async () => {
    if (!selectedIncident || !targetUserCin.trim()) {
      toast.error("Veuillez spécifier le CIN de l'utilisateur");
      return;
    }

    setIsSearchingUser(true);
    setFoundUser(null);

    // Rechercher l'utilisateur
    const user = await findUserByCin(targetUserCin);

    if (user) {
      setFoundUser(user);
      toast.success(`Incident assigné à ${user.name} (${user.cin})`);
    } else {
      toast.error("Utilisateur non trouvé pour ce CIN");
    }

    setIsSearchingUser(false);
  };

  // Fonction pour ouvrir la sélection d'utilisateur
  const openUserSelectDialog = () => {
    setShowUserSelectDialog(true);
    setUserSearchTerm("");
    setSelectedRole("all");
  };

  // Fonction pour sélectionner un utilisateur pour l'incident
  const selectUserForIncident = (user: any) => {
    setSelectedUserForIncident(user);
    setShowUserSelectDialog(false);
    toast.success(`Utilisateur ${user.name} sélectionné pour l'incident`);
  };

  // Fonction pour générer une description avec l'IA
  const generateDescriptionWithAI = async () => {
    if (!newIncident.type || !newIncident.severity) {
      toast.error("Veuillez sélectionner le type et la gravité de l'incident");
      return;
    }

    setIsGeneratingDescription(true);

    try {
      // Simuler une génération IA (remplacer par un appel API réel)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const descriptions = {
        safety: {
          low: "Incident mineur de sécurité : situation contrôlée sans risque immédiat pour le personnel. Mesures préventives recommandées pour éviter récurrence.",
          medium:
            "Incident de sécurité modéré : risque potentiel pour le personnel avec nécessité d'intervention immédiate. Évaluation des procédures de sécurité requise.",
          high: "Incident de sécurité majeur : risque élevé pour le personnel avec arrêt temporaire des activités. Investigation complète et plan d'action corrective urgent.",
          critical:
            "Incident critique de sécurité : danger immédiat et grave pour le personnel. Évacuation et arrêt complet des activités en cours. Intervention d'urgence requise.",
        },
        quality: {
          low: "Non-conformité qualité mineure : écart acceptable dans les tolérances standards. Action corrective simple et rapide à mettre en œuvre.",
          medium:
            "Non-conformité qualité modérée : impact sur les spécifications du produit. Analyse des causes et mise en place de mesures correctives.",
          high: "Non-conformité qualité majeure : impact significatif sur la performance du produit. Arrêt de production et investigation complète requise.",
          critical:
            "Non-conformité qualité critique : défaillance complète du produit. Rappel produit possible et révision complète du processus qualité.",
        },
        delay: {
          low: "Retard mineur : impact négligeable sur le planning. Rattrapage possible sans ressources supplémentaires.",
          medium:
            "Retard modéré : impact sur le planning avec nécessité de réorganisation. Communication aux parties prenantes requise.",
          high: "Retard majeur : impact significatif sur le planning et budget. Plan de récupération urgent et réévaluation des délais.",
          critical:
            "Retard critique : arrêt du projet avec impact contractuel. Négociation avec client et révision complète du planning.",
        },
        other: {
          low: "Incident mineur : situation gérable avec les ressources actuelles. Monitoring et documentation suffisants.",
          medium:
            "Incident modéré : nécessite une attention particulière et des ressources additionnelles. Plan d'action à définir.",
          high: "Incident majeur : impact significatif sur les opérations. Intervention immédiate et coordination d'équipe requise.",
          critical:
            "Incident critique : urgence absolue avec impact sur plusieurs départements. Mobilisation de toutes les ressources nécessaires.",
        },
      };

      const generatedDescription =
        descriptions[newIncident.type as keyof typeof descriptions]?.[
        newIncident.severity as keyof typeof descriptions.safety
        ] ||
        "Description générée automatiquement pour cet incident. Veuillez compléter avec les détails spécifiques.";

      setNewIncident({ ...newIncident, description: generatedDescription });
      toast.success("Description générée avec succès par l'IA");
    } catch (error) {
      console.error("Erreur lors de la génération IA:", error);
      toast.error("Erreur lors de la génération de la description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Fonction pour filtrer les utilisateurs par rôle
  const getUniqueRoles = () => {
    const roles = allUsers.map((user) => user.role?.name).filter(Boolean);
    return ["all", ...Array.from(new Set(roles))];
  };

  // Fonction pour exporter un incident en PDF
  const handleExportPDF = (incident: any) => {
    // Créer le contenu du PDF
    const pdfContent = `
==========================================
RAPPORT D'INCIDENT - SMARTSITE PLATFORM
==========================================

INFORMATIONS DE L'INCIDENT
---------------------------
ID: ${incident.id}
Type: ${incident.type?.toUpperCase() || "N/A"}
Gravité: ${incident.severity?.toUpperCase() || "N/A"}
Statut: ${incident.status?.toUpperCase() || "N/A"}
Date de création: ${new Date(incident.createdAt).toLocaleString("fr-FR")}

DESCRIPTION
-----------
${incident.description || "N/A"}

INFORMATIONS DU RAPPORTEUR
-------------------------
Nom: ${incident.reportedBy || "N/A"}
Date du rapport: ${new Date().toLocaleString("fr-FR")}
Généré par: SmartSite Platform

==========================================
Ce rapport est généré automatiquement par la plateforme SmartSite.
Pour toute question, veuillez contacter l'administrateur système.
==========================================
    `;

    // Créer un Blob et le télécharger
    const blob = new Blob([pdfContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `incident_${incident.id}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Rapport d'incident exporté avec succès !");
  };

  // Fonction pour afficher les détails d'un incident
  const handleShowIncidentDetails = (incident: any) => {
    setSelectedIncidentDetails(incident);
    setShowIncidentDetailsDialog(true);
    trackAuditEvent({
      actionType: "view",
      actionLabel: "Viewed incident details",
      resourceType: "incident",
      resourceId: String(incident?.id || ""),
      severity: "normal",
      status: "success",
      details: incident?.title || incident?.type,
    });
  };

  // Fonction pour trouver un utilisateur par CIN (API réelle)
  const findUserByCin = async (cin: string) => {
    try {
      const response = await api.get(`/users/cin/${cin}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la recherche utilisateur:", error);
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Incident Management
          </h1>
          <p className="text-gray-500 mt-1">
            Document a safety or quality incident
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationPanel />
          {canManageIncidents ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-background">
                  <DialogTitle>Report New Incident</DialogTitle>
                  <DialogDescription>
                    Document a safety or quality incident
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="incident-type">Incident Type</Label>
                    <Select
                      value={newIncident.type}
                      onValueChange={(value) =>
                        setNewIncident({ ...newIncident, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="e.g., Safety Hazard, Quality Issue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="safety">Safety Hazard</SelectItem>
                        <SelectItem value="quality">Quality Issue</SelectItem>
                        <SelectItem value="delay">Delay</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportedByCin">
                      Your CIN (non-modifiable)
                    </Label>
                    <Input
                      id="reportedByCin"
                      value={user?.cin || ""}
                      disabled
                      className="bg-gray-100"
                      placeholder="Your CIN will be automatically filled"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <div className="space-y-2">
                      <Textarea
                        id="description"
                        placeholder="Describe the incident in detail..."
                        value={newIncident.description}
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateDescriptionWithAI}
                          disabled={isGeneratingDescription}
                          className="flex items-center gap-2"
                        >
                          {isGeneratingDescription ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Générer avec l'IA
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incidentName">Nom de l'incident</Label>
                    <Input
                      id="incidentName"
                      placeholder="Donnez un nom à cet incident (optionnel)"
                      value={newIncident.incidentName}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          incidentName: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  {/* Sélection du Projet */}
                  <div className="space-y-2">
                    <Label htmlFor="projectId">
                      📁 Projet (optionnel)
                    </Label>
                    <Select
                      value={newIncident.projectId || "none"}
                      onValueChange={(value) =>
                        setNewIncident({
                          ...newIncident,
                          projectId: value === "none" ? "" : value,
                          // Reset site si on change de projet
                          siteId: "",
                        })
                      }
                      disabled={isLoadingProjects}
                    >
                      <SelectTrigger id="projectId">
                        <SelectValue placeholder={isLoadingProjects ? "Chargement..." : "Sélectionner un projet"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🚫 Aucun projet</SelectItem>
                        {Array.isArray(projects) && projects.map((p) => (
                          <SelectItem key={p._id || p.id} value={p._id || p.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {p.description?.substring(0, 50) || "Pas de description"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {projects.length === 0 && !isLoadingProjects && (
                      <p className="text-xs text-gray-500">
                        ⚠️ Aucun projet disponible
                      </p>
                    )}
                  </div>

                  {/* Sélection du Site */}
                  <div className="space-y-2">
                    <Label htmlFor="siteId">
                      🏗️ Site (optionnel)
                    </Label>
                    <Select
                      value={newIncident.siteId || "none"}
                      onValueChange={(value) =>
                        setNewIncident({
                          ...newIncident,
                          siteId: value === "none" ? "" : value,
                        })
                      }
                      disabled={isLoadingSites}
                    >
                      <SelectTrigger id="siteId">
                        <SelectValue placeholder={isLoadingSites ? "Chargement..." : "Sélectionner un site"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🚫 Aucun site</SelectItem>
                        {Array.isArray(sites) && sites
                          .filter((s) =>
                            // Si un projet est sélectionné, ne montrer que les sites de ce projet
                            !newIncident.projectId ||
                            s.projectId === newIncident.projectId ||
                            (s.project?.id || s.project?._id) === newIncident.projectId
                          )
                          .map((s) => (
                            <SelectItem key={s._id || s.id} value={s._id || s.id}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{s.nom || s.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {s.localisation || s.address || "Pas d'adresse"}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {sites.length === 0 && !isLoadingSites && (
                      <p className="text-xs text-gray-500">
                        ⚠️ Aucun site disponible
                      </p>
                    )}
                    {newIncident.projectId && (
                      <p className="text-xs text-gray-500">
                        💡 Sites filtrés par le projet sélectionné
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedUserCin">
                      Assigner à un utilisateur (optionnel)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Select
                        value={assignRoleFilter}
                        onValueChange={setAssignRoleFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="🎭 Filtrer par rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">🎭 Tous les rôles ({assignableUsers.length})</SelectItem>
                          {assignableRoles.map((role) => {
                            const count = assignableUsers.filter(u => u.role?.name === role).length;
                            return (
                              <SelectItem key={role} value={role}>
                                🎭 {role} ({count})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="🔍 Rechercher nom ou CIN"
                          value={assignCinSearch}
                          onChange={(e) => setAssignCinSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select
                      value={newIncident.assignedUserCin || "none"}
                      onValueChange={(value) =>
                        setNewIncident({
                          ...newIncident,
                          assignedUserCin: value === "none" ? "" : value,
                          assignedUserRole:
                            value === "none"
                              ? "all"
                              : assignableUsers.find((u) => u.cin === value)?.role
                                ?.name || "all",
                        })
                      }
                    >
                      <SelectTrigger id="assignedUserCin">
                        <SelectValue placeholder="👤 Sélectionner un utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🚫 Non assigné</SelectItem>
                        {filteredAssignableUsers.map((u) => (
                          <SelectItem key={u._id} value={u.cin}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {(u.firstname || u.firstName || "") + " " + (u.lastname || u.lastName || "")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                CIN: {u.cin} • {u.role?.name || "No role"} • {u.email || "No email"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="manualCin"
                      placeholder="Ou entrer manuellement un CIN"
                      value={newIncident.assignedUserCin}
                      onChange={(e) =>
                        setNewIncident({
                          ...newIncident,
                          assignedUserCin: e.target.value,
                          assignedUserRole:
                            assignableUsers.find((u) => u.cin === e.target.value)
                              ?.role?.name || "all",
                        })
                      }
                    />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        💡 <strong>Utilisateurs disponibles:</strong> {filteredAssignableUsers.length} sur {assignableUsers.length}
                      </p>
                      <p>
                        Choisir depuis la base, filtrer par rôle, ou saisir directement le CIN.
                      </p>
                      {assignCinSearch && (
                        <p>
                          🔍 Recherche: "{assignCinSearch}" - {filteredAssignableUsers.length} résultat(s)
                        </p>
                      )}
                      {assignRoleFilter !== "all" && (
                        <p>
                          🎭 Filtre rôle: {assignRoleFilter} - {filteredAssignableUsers.length} utilisateur(s)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={newIncident.severity}
                      onValueChange={(value) =>
                        setNewIncident({ ...newIncident, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Upload Image (optional)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            image: e.target.files?.[0] || null,
                          })
                        }
                        className="flex-1"
                      />
                      <Upload className="h-4 w-4 text-gray-400" />
                    </div>
                    {newIncident.image && (
                      <p className="text-xs text-green-600">
                        Image selected: {newIncident.image.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdfReport">
                      Upload PDF Report (optional)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="pdfReport"
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setNewIncident({
                            ...newIncident,
                            pdfReport: e.target.files?.[0] || null,
                          })
                        }
                        className="flex-1"
                      />
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    {newIncident.pdfReport && (
                      <p className="text-xs text-green-600">
                        PDF selected: {newIncident.pdfReport.name}
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    onClick={handleAddIncident}
                  >
                    Report Incident
                  </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button disabled className="opacity-50 cursor-not-allowed">
              + Report Incident (No Permission)
            </Button>
          )}
        </div>
      </div>

      <IncidentBiDashboard userCin={user?.cin} />

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Incidents</p>
                <h2 className="text-lg font-bold text-slate-900">All Incidents List</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom d'incident, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {currentIncidents.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchTerm
                    ? "Aucun incident trouvé pour cette recherche"
                    : "No incidents reported"}
                </p>
              </div>
            ) : (
              currentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-5 border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200 bg-white hover:bg-slate-50"
                  onClick={() => handleShowIncidentDetails(incident)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {(incident as any).title?.toUpperCase() ||
                            (incident as any).incidentName?.toUpperCase() ||
                            incident.type.toUpperCase()}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {incident.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>Reported by: <span className="font-medium text-slate-700">{incident.reportedBy}</span></span>
                        <span>{new Date(incident.createdAt).toLocaleString()}</span>
                      </div>
                      {(incident as any).assignedTo && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">
                            Assigné à: {(incident as any).assignedTo}
                          </span>
                          {(incident as any).assignedUserRole && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {(incident as any).assignedUserRole}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Badge
                        className={`font-semibold ${
                          incident.severity === "critical"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : incident.severity === "high"
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : incident.severity === "medium"
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {incident.severity}
                      </Badge>
                      <Badge
                        className={`font-semibold ${
                          incident.status === "resolved"
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : incident.status === "closed"
                              ? "bg-slate-600 text-white hover:bg-slate-700"
                              : incident.status === "investigating"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        {incident.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    {incident.status !== "resolved" &&
                      incident.status !== "closed" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveIncident(String(incident.id));
                          }}
                        >
                          Mark as Resolved
                        </Button>
                      )}
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(incident);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIncident(String(incident.id));
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {
        totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => (
                <Button
                  key={index + 1}
                  variant={currentPage === index + 1 ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        )
      }

      {/* Dialogue d'assignation d'incident */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Incident to User</DialogTitle>
            <DialogDescription>
              Assign this incident to a specific user by their CIN
            </DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm">Incident Details</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedIncident.type}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedIncident.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetUserCin">User CIN</Label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Input
                    id="targetUserCin"
                    placeholder="Enter user CIN..."
                    value={targetUserCin}
                    onChange={(e) => {
                      setTargetUserCin(e.target.value);
                      setFoundUser(null);
                    }}
                    className="flex-1"
                  />
                </div>
                {foundUser && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {foundUser.name} ({foundUser.cin})
                        </p>
                        <p className="text-xs text-green-600">
                          {foundUser.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignDialog(false);
                      setSelectedIncident(null);
                      setTargetUserCin("");
                      setFoundUser(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignIncident}
                    disabled={isSearchingUser}
                  >
                    {isSearchingUser ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Assign Incident
                      </>
                    )}
                  </Button>
                </>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de sélection d'utilisateur */}
      <Dialog
        open={showUserSelectDialog}
        onOpenChange={setShowUserSelectDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sélectionner un utilisateur</DialogTitle>
            <DialogDescription>
              Choisissez un utilisateur pour assigner l'incident
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="user-search">Rechercher un utilisateur</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    id="user-search"
                    placeholder="Rechercher par nom, CIN, email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="role-filter">Filtrer par rôle</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueRoles().map((role) => (
                      <SelectItem key={role} value={role}>
                        {role === "all" ? "Tous les rôles" : role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedUserForIncident && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Utilisateur sélectionné:{" "}
                        {selectedUserForIncident.firstname}{" "}
                        {selectedUserForIncident.lastname}
                      </p>
                      <p className="text-xs text-green-600">
                        CIN: {selectedUserForIncident.cin} | Email:{" "}
                        {selectedUserForIncident.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedUserForIncident(null);
                      toast.info("Sélection annulée");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="text-xs text-gray-500 mb-2">
                Total utilisateurs: {allUsers.length} | Filtrés:{" "}
                {filteredUsers.length}
              </div>

              {/* Debug info */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs bg-yellow-50 p-2 rounded mb-2">
                  <div>Debug Info:</div>
                  <div>allUsers.length: {allUsers.length}</div>
                  <div>filteredUsers.length: {filteredUsers.length}</div>
                  <div>userSearchTerm: "{userSearchTerm}"</div>
                  <div>selectedRole: "{selectedRole}"</div>
                  <div>user?.cin: "{user?.cin}"</div>
                  <div>
                    localStorage token:{" "}
                    {!!localStorage.getItem("access_token") ? "true" : "false"}
                  </div>
                </div>
              )}

              {/* Bouton de debug pour forcer le rechargement */}
              {process.env.NODE_ENV === "development" &&
                allUsers.length === 0 && (
                  <button
                    onClick={async () => {
                      console.log("🔄 Debug: Forcing reload...");
                      try {
                        console.log("🔄 Debug: Appel direct API...");
                        const response = await api.get("/users");
                        console.log(
                          "🔄 Debug: Réponse directe:",
                          response.data.length,
                        );
                        setAllUsers(response.data);
                      } catch (error) {
                        console.error("🔄 Debug: Erreur directe:", error);
                      }
                    }}
                    className="w-full p-2 bg-red-500 text-white rounded mb-2"
                  >
                    Forcer Reload (Debug)
                  </button>
                )}

              {allUsers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  Chargement des utilisateurs...
                </p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  {userSearchTerm || selectedRole !== "all"
                    ? "Aucun utilisateur trouvé pour ces critères"
                    : "Aucun utilisateur disponible"}
                </p>
              ) : (
                <>
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => selectUserForIncident(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {user.firstname} {user.lastname}
                            </p>
                            <p className="text-xs text-gray-500">
                              CIN: {user.cin}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              user.status === "approved"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.status}
                          </Badge>
                          {user.role && (
                            <Badge variant="outline" className="text-xs">
                              {user.role.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowUserSelectDialog(false)}
              >
                Fermer
              </Button>
              {selectedUserForIncident && (
                <Button
                  onClick={() => {
                    if (selectedIncident) {
                      toast.success(
                        `Incident assigné à ${selectedUserForIncident.firstname} ${selectedUserForIncident.lastname}`,
                      );
                      setShowUserSelectDialog(false);
                      setSelectedUserForIncident(null);
                    }
                  }}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Confirmer l'assignation
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de détails d'incident */}
      <Dialog
        open={showIncidentDetailsDialog}
        onOpenChange={setShowIncidentDetailsDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Détails de l'Incident
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur l'incident sélectionné
            </DialogDescription>
          </DialogHeader>
          {selectedIncidentDetails && (
            <div className="space-y-4">
              {/* En-tête avec statut et sévérité */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(selectedIncidentDetails as any).title?.toUpperCase() ||
                      (
                        selectedIncidentDetails as any
                      ).incidentName?.toUpperCase() ||
                      selectedIncidentDetails.type.toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    ID: {selectedIncidentDetails.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedIncidentDetails.severity === "critical" ||
                        selectedIncidentDetails.severity === "high"
                        ? "destructive"
                        : selectedIncidentDetails.severity === "medium"
                          ? "default"
                          : "secondary"
                    }
                    className="text-sm"
                  >
                    {selectedIncidentDetails.severity.toUpperCase()}
                  </Badge>
                  <Badge
                    variant={
                      selectedIncidentDetails.status === "resolved" ||
                        selectedIncidentDetails.status === "closed"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-sm"
                  >
                    {selectedIncidentDetails.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Type d'incident
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedIncidentDetails.type.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Signalé par
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedIncidentDetails.reportedBy}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Date de création
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(
                        selectedIncidentDetails.createdAt,
                      ).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Dernière mise à jour
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedIncidentDetails.updatedAt
                        ? new Date(
                          selectedIncidentDetails.updatedAt,
                        ).toLocaleString("fr-FR")
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Site
                    </Label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {(selectedIncidentDetails as any).siteId || "N/A"}
                    </p>
                  </div>
                  {(selectedIncidentDetails as any).assignedTo && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Assigné à
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {(selectedIncidentDetails as any).assignedTo}
                        </span>
                        {(selectedIncidentDetails as any).assignedUserRole && (
                          <Badge variant="outline" className="text-xs">
                            {(selectedIncidentDetails as any).assignedUserRole}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedIncidentDetails.description ||
                      "Aucune description fournie"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedIncidentDetails.status !== "resolved" &&
                  selectedIncidentDetails.status !== "closed" && (
                    <Button
                      onClick={() => {
                        handleResolveIncident(
                          String(selectedIncidentDetails.id),
                        );
                        setShowIncidentDetailsDialog(false);
                      }}
                    >
                      Marquer comme résolu
                    </Button>
                  )}
                <Button
                  variant="outline"
                  onClick={() => handleExportPDF(selectedIncidentDetails)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter PDF
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteIncident(String(selectedIncidentDetails.id));
                    setShowIncidentDetailsDialog(false);
                  }}
                >
                  Supprimer
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowIncidentDetailsDialog(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}
