import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
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
  Bell
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
  tasks: Task[];
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  status: 'en_cours' | 'terminé' | 'en_retard';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline: string;
  projectId: string;
}

export default function ProjectManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("deadline");
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Vérifier si l'utilisateur est bien un Project Manager
  useEffect(() => {
    const userRole = user?.role?.name || user?.role;
    if (!user) {
      navigate("/login");
    } else if (userRole !== 'project_manager') {
      toast.error("Accès non autorisé. Cette page est réservée aux Project Managers.");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Charger les projets assignés au Project Manager
  const loadProjects = async () => {
    setLoading(true);
    try {
      // Simuler des données pour le moment
      const mockProjects: Project[] = [
        {
          id: "1",
          name: "Site E-commerce",
          description: "Développement plateforme e-commerce",
          status: "en_cours",
          progress: 65,
          priority: "high",
          deadline: "2026-04-15",
          assignedTo: user?.cin || "",
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
          createdAt: "2026-03-01"
        },
        {
          id: "2",
          name: "Application Mobile",
          description: "App iOS/Android pour gestion",
          status: "en_retard",
          progress: 30,
          priority: "urgent",
          deadline: "2026-03-22",
          assignedTo: user?.cin || "",
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
          createdAt: "2026-02-15"
        },
        {
          id: "3",
          name: "Dashboard Analytics",
          description: "Tableau de bord analytique",
          status: "terminé",
          progress: 100,
          priority: "low",
          deadline: "2026-03-10",
          assignedTo: user?.cin || "",
          tasks: [],
          createdAt: "2026-02-01"
        }
      ];

      setProjects(mockProjects);
      setFilteredProjects(mockProjects);

      // Extraire les tâches urgentes
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
          alerts.push(`⚠️ Deadline proche: ${project.name} (${daysUntilDeadline} jours)`);
        }
        if (daysUntilDeadline <= 0) {
          alerts.push(`🚨 Deadline dépassée: ${project.name}`);
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
    let filtered = projects.filter(project => project.assignedTo === user?.cin);

    // Filtrer par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Filtrer par priorité
    if (priorityFilter !== "all") {
      filtered = filtered.filter(p => p.priority === priorityFilter);
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
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  }, [projects, statusFilter, priorityFilter, sortBy, user?.cin]);

  useEffect(() => {
    loadProjects();
  }, []);

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
    avgProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header avec notifications */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Project Manager</h1>
          <p className="text-gray-600">Bienvenue, {user?.firstname} {user?.lastname}</p>
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
              Alertes Urgentes
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
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
                <p className="text-sm text-gray-600">Progression Moy.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="pm-status-filter" className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="pm-status-filter">
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
                <SelectTrigger id="pm-priority-filter">
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
              <label htmlFor="pm-sort-by" className="text-sm font-medium mb-2 block">Trier par</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="pm-sort-by">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Échéance</SelectItem>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="progress">Progression</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
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
              Urgent / À traiter en priorité
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
            Mes Projets ({filteredProjects.length})
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
                <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progression</span>
                          <span className="text-sm font-bold">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Deadline: {new Date(project.deadline).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.tasks.length} tâches
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      Détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
