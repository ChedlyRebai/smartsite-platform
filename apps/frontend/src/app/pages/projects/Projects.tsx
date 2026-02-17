import { Briefcase } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { toast } from 'sonner';

export default function Projects() {
  const user = useAuthStore((state) => state.user);
  const canManageProjects = user && canEdit(user.role, 'projects');
  const [projects, setProjects] = useState([
    { id: 1, name: 'Downtown Office Tower', status: 'in_progress', progress: 65, client: 'ABC Corp', budget: 5000000 },
    { id: 2, name: 'Residential Complex', status: 'planning', progress: 20, client: 'XYZ Holdings', budget: 3500000 },
    { id: 3, name: 'Shopping Mall Extension', status: 'in_progress', progress: 45, client: 'Retail Group', budget: 8000000 },
  ]);
  const [newProject, setNewProject] = useState({ name: '', client: '', budget: '' });
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editData, setEditData] = useState({ name: '', client: '', budget: '', status: '', progress: 0 });

  const handleAddProject = () => {
    if (!newProject.name || !newProject.client || !newProject.budget) {
      toast.error('All fields are required');
      return;
    }
    const project = { 
      id: projects.length + 1, 
      name: newProject.name,
      client: newProject.client,
      budget: parseInt(newProject.budget),
      status: 'planning', 
      progress: 0 
    };
    setProjects([...projects, project]);
    setNewProject({ name: '', client: '', budget: '' });
    toast.success('Project created successfully!');
  };

  const handleViewDetails = (project: any) => {
    setSelectedProject(project);
    setViewDetailsOpen(true);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setEditData({ 
      name: project.name, 
      client: project.client, 
      budget: project.budget, 
      status: project.status,
      progress: project.progress 
    });
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editData.name || !editData.client || !editData.budget) {
      toast.error('All fields are required');
      return;
    }
    setProjects(projects.map(p => 
      p.id === selectedProject.id 
        ? { ...p, name: editData.name, client: editData.client, budget: editData.budget, status: editData.status, progress: editData.progress }
        : p
    ));
    setEditOpen(false);
    toast.success('Project updated successfully!');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage all construction projects</p>
        </div>
        {canManageProjects ? (
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
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input
                  id="client"
                  placeholder="e.g., Acme Corporation"
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g., 1500000"
                  value={newProject.budget}
                  onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                />
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleAddProject}
              >
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            + New Project (No Permission)
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {project.name}
                </CardTitle>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status === 'in_progress' ? 'In Progress' : project.status === 'planning' ? 'Planning' : 'Completed'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
                    <DialogTrigger asChild onClick={() => handleViewDetails(project)}>
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
                            <p className="text-sm text-gray-600">Project Name</p>
                            <p className="font-semibold text-gray-900">{selectedProject.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Client</p>
                            <p className="font-semibold text-gray-900">{selectedProject.client}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Budget</p>
                            <p className="font-semibold text-gray-900">${selectedProject.budget.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className={`font-semibold px-3 py-1 rounded-full text-sm inline-block ${getStatusColor(selectedProject.status)}`}>
                              {selectedProject.status === 'in_progress' ? 'In Progress' : selectedProject.status === 'planning' ? 'Planning' : 'Completed'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Progress: {selectedProject.progress}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full" 
                                style={{ width: `${selectedProject.progress}%` }}
                              />
                            </div>
                          </div>
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600" onClick={() => setViewDetailsOpen(false)}>
                            Close
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild onClick={() => handleEditProject(project)}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>Update project information</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Project Name</Label>
                          <Input
                            id="edit-name"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-client">Client</Label>
                          <Input
                            id="edit-client"
                            value={editData.client}
                            onChange={(e) => setEditData({ ...editData, client: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-budget">Budget</Label>
                          <Input
                            id="edit-budget"
                            type="number"
                            value={editData.budget}
                            onChange={(e) => setEditData({ ...editData, budget: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-status">Status</Label>
                          <select
                            id="edit-status"
                            className="w-full px-3 py-2 border rounded-md"
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
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
                            onChange={(e) => setEditData({ ...editData, progress: parseInt(e.target.value) })}
                          />
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-green-600"
                          onClick={handleSaveEdit}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
