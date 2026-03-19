import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  SortAsc,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  ChevronRight,
  Bell,
  UserIcon,
  Building2,
  Eye
} from "lucide-react";
import type { User } from "../../types";

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'en_cours' | 'terminé' | 'en_retard';
  progress: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline: string;
  assignedTo: string;
  assignedToName: string;
  assignedToRole: string;
  tasks: Task[];
  createdAt: string;
  projectManagerName: string;
}

interface Task {
  id: string;
  title: string;
  status: 'en_cours' | 'terminé' | 'en_retard';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline: string;
  projectId: string;
}

export default function SuperAdminProjectsDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("deadline");
  const [projectManagerFilter, setProjectManagerFilter] = useState<string>("all");
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statsDetailsOpen, setStatsDetailsOpen] = useState(false);
  const [statsTitle, setStatsTitle] = useState("");
  const [statsItems, setStatsItems] = useState<string[]>([]);

  // Vérifier si l'utilisateur est bien un Super Admin
  useEffect(() => {
    const userRole = user?.role?.name || user?.role;
    if (!user) {
      navigate("/login");
    } else if (userRole !== 'super_admin') {
      toast.error("Accès non autorisé. Cette page est réservée aux Super Administrateurs.");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Charger tous les projets des Project Managers
  const loadProjects = async () => {
    setLoading(true);
    try {
      // Simuler des données pour le moment - tous les projets des Project Managers
      const mockProjects: Project[] = [
        {
          id: "1",
          name: "Site E-commerce",
          description: "Développement plateforme e-commerce",
          status: "en_cours",
          progress: 65,
          priority: "high",
          deadline: "2026-04-15",
          assignedTo: "pm001",
          assignedToName: "Jean Dupont",
          assignedToRole: "project_manager",
          tasks: [
            {
              id: "1-1",
              title: "Intégration paiement",
              status: "en_cours",
              priority: "urgent",
              deadline: "2026-03-25",
              projectId: "1"
            },
            {
              id: "1-2",
              title: "Design responsive",
              status: "terminé",
              priority: "medium",
              deadline: "2026-03-20",
              projectId: "1"
            }
          ],
          createdAt: "2026-03-01",
          projectManagerName: "Jean Dupont"
        },
        {
          id: "2",
          name: "Application Mobile",
          description: "App iOS/Android pour gestion",
          status: "en_retard",
          progress: 30,
          priority: "urgent",
          deadline: "2026-03-22",
          assignedTo: "pm002",
          assignedToName: "Marie Martin",
          assignedToRole: "project_manager",
          tasks: [
            {
              id: "2-1",
              title: "Backend API",
              status: "en_retard",
              priority: "urgent",
              deadline: "2026-03-20",
              projectId: "2"
            }
          ],
          createdAt: "2026-02-15",
          projectManagerName: "Marie Martin"
        },
        {
          id: "3",
          name: "Dashboard Analytics",
          description: "Tableau de bord analytique",
          status: "terminé",
          progress: 100,
          priority: "low",
          deadline: "2026-03-10",
          assignedTo: "pm003",
          assignedToName: "Pierre Bernard",
          assignedToRole: "project_manager",
          tasks: [],
          createdAt: "2026-02-01",
          projectManagerName: "Pierre Bernard"
        },
        {
          id: "4",
          name: "Portail Client",
          description: "Espace client pour suivi commandes",
          status: "en_cours",
          progress: 45,
          priority: "medium",
          deadline: "2026-04-30",
          assignedTo: "pm001",
          assignedToName: "Jean Dupont",
          assignedToRole: "project_manager",
          tasks: [
            {
              id: "4-1",
              title: "Authentification",
              status: "en_cours",
              priority: "high",
              deadline: "2026-04-10",
              projectId: "4"
            }
          ],
          createdAt: "2026-03-05",
          projectManagerName: "Jean Dupont"
        },
        {
          id: "5",
          name: "Systeme Inventory",
          description: "Gestion des stocks et entrepôts",
          status: "en_cours",
          progress: 80,
          priority: "high",
          deadline: "2026-03-28",
          assignedTo: "pm002",
          assignedToName: "Marie Martin",
          assignedToRole: "project_manager",
          tasks: [
            {
              id: "5-1",
              title: "API Integration",
              status: "terminé",
              priority: "medium",
              deadline: "2026-03-15",
              projectId: "5"
            }
          ],
          createdAt: "2026-02-20",
          projectManagerName: "Marie Martin"
        }
      ];

      setProjects(mockProjects);
      setFilteredProjects(mockProjects);

      // Extraire les tâches urgentes de tous les projets
      const urgent = mockProjects.flatMap(p => p.tasks).filter(t =>
        t.priority === 'urgent' || t.status === 'en_retard' ||
        new Date(t.deadline) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      );
      setUrgentTasks(urgent);

      // Générer des notifications pour les deadlines proches
      const alerts = [];
      mockProjects.forEach(project => {
        const daysUntilDeadline = Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
          alerts.push(`⚠️ Deadline proche: ${project.name} (${project.projectManagerName}) - ${daysUntilDeadline} jours`);
        }
        if (daysUntilDeadline <= 0) {
          alerts.push(`🚨 Deadline dépassée: ${project.name} (${project.projectManagerName})`);
        }
      });
      setNotifications(alerts);

    } catch (error) {
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les projets
  useEffect(() => {
    let filtered = [...projects];

    // Filtrer par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Filtrer par priorité
    if (priorityFilter !== "all") {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }

    // Filtrer par Project Manager
    if (projectManagerFilter !== "all") {
      filtered = filtered.filter(p => p.assignedToName === projectManagerFilter);
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "progress":
          return b.progress - a.progress;
        case "name":
          return a.name.localeCompare(b.name);
        case "projectManager":
          return a.assignedToName.localeCompare(b.assignedToName);
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  }, [projects, statusFilter, priorityFilter, sortBy, projectManagerFilter]);

  useEffect(() => {
    loadProjects();
  }, []);

  // Obtenir la liste unique des Project Managers
  const uniqueProjectManagers = Array.from(new Set(projects.map(p => p.assignedToName).filter(Boolean)));

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_retard': return 'destructive';
      case 'en_cours': return 'default';
      case 'terminé': return 'secondary';
      default: return 'outline';
    }
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  // Calculer les statistiques
  const stats = {
    totalProjects: projects.length,
    projectsEnCours: projects.filter(p => p.status === 'en_cours').length,
    projectsTermines: projects.filter(p => p.status === 'terminé').length,
    projectsEnRetard: projects.filter(p => p.status === 'en_retard').length,
    urgentTasks: urgentTasks.length,
    totalProjectManagers: uniqueProjectManagers.length,
    avgProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setDetailsOpen(true);
  };

  const openStatsDetails = (type: "total" | "en_cours" | "termines" | "retard" | "urgent" | "pms") => {
    switch (type) {
      case "total":
        setStatsTitle("Détail - Total Projets");
        setStatsItems(projects.map((p) => `${p.name} - ${p.projectManagerName}`));
        break;
      case "en_cours":
        setStatsTitle("Détail - Projets En Cours");
        setStatsItems(projects.filter((p) => p.status === "en_cours").map((p) => `${p.name} - ${p.projectManagerName}`));
        break;
      case "termines":
        setStatsTitle("Détail - Projets Terminés");
        setStatsItems(projects.filter((p) => p.status === "terminé").map((p) => `${p.name} - ${p.projectManagerName}`));
        break;
      case "retard":
        setStatsTitle("Détail - Projets En Retard");
        setStatsItems(projects.filter((p) => p.status === "en_retard").map((p) => `${p.name} - ${p.projectManagerName}`));
        break;
      case "urgent":
        setStatsTitle("Détail - Tâches Urgentes");
        setStatsItems(
          urgentTasks.map((t) => {
            const project = projects.find((p) => p.id === t.projectId);
            return `${t.title} - ${project?.name ?? "Projet inconnu"} (${t.status})`;
          }),
        );
        break;
      case "pms":
        setStatsTitle("Détail - Project Managers");
        setStatsItems(uniqueProjectManagers.map((pm) => `${pm} - ${projects.filter((p) => p.assignedToName === pm).length} projet(s)`));
        break;
    }
    setStatsDetailsOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header avec notifications */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Super Admin - Tous les Projets</h1>
          <p className="text-gray-600">Vue d'ensemble de tous les projets des Project Managers</p>
        </div>
        {notifications.length > 0 && (
          <div className="relative">
            <Bell className="h-6 w-6 text-red-500" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.length}
            </span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Alertes Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div key={index} className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {notification}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openStatsDetails("total")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
                <p className="text-sm text-gray-600">Total Projets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openStatsDetails("en_cours")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.projectsEnCours}</p>
                <p className="text-sm text-gray-600">En Cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openStatsDetails("termines")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.projectsTermines}</p>
                <p className="text-sm text-gray-600">Terminés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openStatsDetails("retard")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.projectsEnRetard}</p>
                <p className="text-sm text-gray-600">En Retard</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openStatsDetails("urgent")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.urgentTasks}</p>
                <p className="text-sm text-gray-600">Tâches Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openStatsDetails("pms")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalProjectManagers}</p>
                <p className="text-sm text-gray-600">Project Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et tri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Tri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="terminé">Terminé</SelectItem>
                  <SelectItem value="en_retard">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priorité</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Project Manager</label>
              <Select value={projectManagerFilter} onValueChange={setProjectManagerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par PM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les PM</SelectItem>
                  {uniqueProjectManagers.map(pm => (
                    <SelectItem key={pm} value={pm}>{pm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Trier par</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Échéance</SelectItem>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="progress">Progression</SelectItem>
                  <SelectItem value="name">Nom du projet</SelectItem>
                  <SelectItem value="projectManager">Project Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadProjects} variant="outline" className="w-full">
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section urgente */}
      {urgentTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Tâches Urgentes - Tous Projets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des projets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tous les Projets ({filteredProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun projet trouvé pour les critères sélectionnés
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openProjectDetails(project)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openProjectDetails(project);
                  }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <Badge variant={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge variant={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-3">{project.description}</p>

                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          {project.assignedToName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Deadline: {new Date(project.deadline).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {project.tasks.length} tâches
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progression</span>
                          <span className="text-sm font-bold">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProjectDetails(project);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du projet</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-base">{selectedProject.name}</p>
                <p className="text-gray-600">{selectedProject.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <p><span className="font-medium">Project Manager:</span> {selectedProject.assignedToName}</p>
                <p><span className="font-medium">Statut:</span> {selectedProject.status}</p>
                <p><span className="font-medium">Priorité:</span> {selectedProject.priority}</p>
                <p><span className="font-medium">Deadline:</span> {new Date(selectedProject.deadline).toLocaleDateString()}</p>
                <p><span className="font-medium">Progression:</span> {selectedProject.progress}%</p>
                <p><span className="font-medium">Créé le:</span> {new Date(selectedProject.createdAt).toLocaleDateString()}</p>
              </div>

              <div>
                <p className="font-medium mb-2">Tâches ({selectedProject.tasks.length})</p>
                {selectedProject.tasks.length === 0 ? (
                  <p className="text-gray-500">Aucune tâche pour ce projet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProject.tasks.map((task) => (
                      <div key={task.id} className="p-2 border rounded-md">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={statsDetailsOpen} onOpenChange={setStatsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{statsTitle}</DialogTitle>
          </DialogHeader>
          {statsItems.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune donnée à afficher.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {statsItems.map((item, index) => (
                <div key={`${item}-${index}`} className="text-sm p-2 border rounded-md">
                  {item}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
