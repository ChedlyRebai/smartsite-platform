import { Briefcase, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
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
import { canEdit } from "../../utils/permissions";
import { toast } from "sonner";
import {
  getSyncedProjectsWithDetails,
  type SyncedProject,
} from "../../action/synced-project.action";

const API_URL = "http://localhost:3007";

export default function Projects() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  // Contournement : si le role est null, utiliser un role par défaut
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageProjects = user && canEdit(userRole.name, "projects");
  const [projects, setProjects] = useState<SyncedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: "",
    budget: "",
    siteCount: 0,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [sites, setSites] = useState<{_id: string; name: string}[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SyncedProject | null>(
    null,
  );
  const [editData, setEditData] = useState({
    name: "",
    budget: "",
    siteCount: 0,
    status: "",
    progress: 0,
  });

  // Charger les projets depuis l'API
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/projects`, {
          params: { limit: 100, page: 1 }
        });
        setProjects(response.data.projects || []);
      } catch (error) {
        console.error("Error loading projects:", error);
        // Fallback to synced projects
        try {
          const syncedProjects = await getSyncedProjectsWithDetails();
          setProjects(syncedProjects);
        } catch (fallbackError) {
          console.error("Error loading synced projects:", fallbackError);
          toast.error("Failed to load projects");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleAddProject = async () => {
    setCreateError(null);
    if (!newProject.name || !newProject.budget) {
      setCreateError("Project name and budget are required.");
      return;
    }
    if (newProject.siteCount < 1) {
      setCreateError("You must specify at least 1 site to create a project.");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/projects`, {
        name: newProject.name,
        budget: parseFloat(newProject.budget),
        siteCount: newProject.siteCount,
        sites: selectedSites,
        status: "planning",
        priority: "medium",
      });
      setProjects([...projects, response.data]);
      setNewProject({ name: "", budget: "", siteCount: 0 });
      setCreateError(null);
      setSelectedSites([]);
      toast.success("Project created successfully!");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  const handleViewDetails = (project: SyncedProject) => {
    setSelectedProject(project);
    setViewDetailsOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await axios.delete(`${API_URL}/projects/${id}`);
      setProjects(projects.filter(p => p._id !== id));
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setEditData({
      name: project.name,
      budget: project.budget?.toString() || "",
      siteCount: project.siteCount || 0,
      status: project.status,
      progress: project.progress,
    });
    setEditOpen(true);
  };

  const handleExportPdf = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/export-pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `projects-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.name || !editData.budget) {
      toast.error("Name and budget are required");
      return;
    }
    if (editData.siteCount < 1) {
      toast.error("Number of sites must be at least 1");
      return;
    }
    try {
      const response = await axios.put(`${API_URL}/projects/${selectedProject?._id}`, {
        name: editData.name,
        budget: parseFloat(editData.budget),
        siteCount: editData.siteCount,
        status: editData.status,
        progress: editData.progress,
      });
      
      // Reload projects from database to ensure fresh data
      const reloadResponse = await axios.get(`${API_URL}/projects`, {
        params: { limit: 100, page: 1 }
      });
      setProjects(reloadResponse.data.projects || []);
      
      setEditOpen(false);
      toast.success("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours":
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "planning":
        return "bg-yellow-100 text-yellow-800";
      case "terminé":
      case "completed":
        return "bg-green-100 text-green-800";
      case "en_retard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 mt-1">Manage all construction projects</p>
        </div>
        {canManageProjects ? (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportPdf}
            >
              Export PDF
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  + New Project
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new construction project to your portfolio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Downtown Office Tower"
                    value={newProject.name}
                    onChange={(e) => {
                      setNewProject({ ...newProject, name: e.target.value });
                      setCreateError(null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (DT)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 1500000"
                    value={newProject.budget}
                    onChange={(e) =>
                      setNewProject({ ...newProject, budget: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-count">Number of Sites</Label>
                  <Input
                    id="site-count"
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={newProject.siteCount}
                    onChange={(e) => {
                      setNewProject({ ...newProject, siteCount: parseInt(e.target.value) || 0 });
                      setCreateError(null);
                    }}
                  />
                </div>
                {createError && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700 text-sm">Cannot create project</p>
                      <p className="text-sm text-red-600 mt-0.5">{createError}</p>
                    </div>
                  </div>
                )}
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={handleAddProject}
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            + New Project (No Permission)
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No projects found
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/projects/${project._id}/sites`)}>
                    <Briefcase className="h-5 w-5" />
                    {project.name}
                  </CardTitle>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}
                  >
                    {project.status === "en_cours"
                      ? "In Progress"
                      : project.status === "planning"
                        ? "Planning"
                        : project.status === "terminé"
                          ? "Completed"
                          : project.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Dialog
                      open={viewDetailsOpen}
                      onOpenChange={setViewDetailsOpen}
                    >
                      <DialogTrigger
                        asChild
                        onClick={() => handleViewDetails(project)}
                      >
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Project Details</DialogTitle>
                        </DialogHeader>
                        {selectedProject && (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                Project Name
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedProject.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Description
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedProject.description}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Project Manager
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedProject.projectManagerName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Budget</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                $
                                {(selectedProject.budget || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Priority</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedProject.priority}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <p
                                className={`font-semibold px-3 py-1 rounded-full text-sm inline-block ${getStatusColor(selectedProject.status)}`}
                              >
                                {selectedProject.status === "en_cours"
                                  ? "In Progress"
                                  : selectedProject.status === "planning"
                                    ? "Planning"
                                    : selectedProject.status === "terminé"
                                      ? "Completed"
                                      : selectedProject.status}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2">
                                Progress: {selectedProject.progress}%
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full"
                                  style={{
                                    width: `${selectedProject.progress}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Deadline</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {new Date(
                                  selectedProject.deadline,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Team Size</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedProject.teamSize || 0} members
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Sites</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedProject.siteCount || 0} sites
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Tasks</p>
                              <p className="font-semibold text-gray-900">
                                {(selectedProject.tasks?.length || 0)} tasks
                              </p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                      <DialogTrigger
                        asChild
                        onClick={() => handleEditProject(project)}
                      >
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Project</DialogTitle>
                          <DialogDescription>
                            Update project information
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Project Name</Label>
                            <Input
                              id="edit-name"
                              value={editData.name}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-budget">Budget (DT)</Label>
                            <Input
                              id="edit-budget"
                              type="number"
                              value={editData.budget}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  budget: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-site-count">Number of Sites</Label>
                            <Input
                              id="edit-site-count"
                              type="number"
                              min="1"
                              value={editData.siteCount}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  siteCount: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <select
                              id="edit-status"
                              className="w-full px-3 py-2 border rounded-md"
                              value={editData.status}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  status: e.target.value,
                                })
                              }
                            >
                              <option value="planning">Planning</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-progress">Progress (%)</Label>
                            <Input
                              id="edit-progress"
                              type="number"
                              min="0"
                              max="100"
                              value={editData.progress}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  progress: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                            onClick={handleSaveEdit}
                          >
                            Save Changes
                          </Button>
                          <Button
                            className="w-full bg-red-600 hover:bg-red-700"
                            onClick={() => handleDeleteProject(selectedProject?._id)}
                          >
                            Delete Project
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
