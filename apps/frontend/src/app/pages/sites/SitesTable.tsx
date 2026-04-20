import { useState, useEffect } from 'react';
import { MapPin, Users, DollarSign, Calendar, ChevronDown, ChevronUp, Search, Building2, ChevronLeft, ChevronRight, Trash2, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { getProjectsWithSites, type ProjectWithSites, gestionProjectsApi } from '../../action/synced-project.action';
import { getAllSitesWithTeams } from '../../action/site.action';

interface SiteData {
  id: string;
  name: string;
  address: string;
  localisation: string;
  budget: number;
  status: string;
  progress: number;
  teams: any[];
  teamIds: any[];
  projectId?: string;
  clientName?: string;
}

interface ExpandedProject {
  id: string;
  name: string;
}

export default function SitesTable() {
  const [projectsWithSites, setProjectsWithSites] = useState<ProjectWithSites[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalSitesBudget, setTotalSitesBudget] = useState(0);
  const [totalProjectsBudget, setTotalProjectsBudget] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, sitesData] = await Promise.all([
        getProjectsWithSites(),
        getAllSitesWithTeams(),
      ]);
      setProjectsWithSites(projectsData);
      
      const activeProjects = projectsData.filter((p: ProjectWithSites) => p.status !== 'completed' && p.status !== 'archived');
      const activeProjectIds = new Set(activeProjects.map((p: ProjectWithSites) => p.id));
      
      const activeSitesData = (sitesData as SiteData[]).filter((site: SiteData) => {
        const siteProjectId = site.projectId;
        return siteProjectId && activeProjectIds.has(String(siteProjectId));
      });
      
      const sitesBudget = activeSitesData.reduce((sum: number, site: SiteData) => sum + (site.budget || 0), 0);
      const projectsBudget = activeProjects.reduce((sum: number, p: ProjectWithSites) => sum + (p.budget || 0), 0);
      setTotalSitesBudget(sitesBudget);
      setTotalProjectsBudget(projectsBudget);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveProject = async (projectId: string, isArchived: boolean) => {
    try {
      const newStatus = isArchived ? 'in_progress' : 'completed';
      await gestionProjectsApi.put(`/projects/${projectId}`, { status: newStatus });
      toast.success(isArchived ? 'Project Restored' : 'Project Archived');
      loadData();
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    try {
      await gestionProjectsApi.delete(`/projects/${projectId}`);
      toast.success('Project deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      planning: { label: 'Planning', variant: 'outline' },
      in_progress: { label: 'In Progress', variant: 'default' },
      on_hold: { label: 'On Hold', variant: 'destructive' },
      completed: { label: 'Completed', variant: 'secondary' },
    };
    const config = statusConfig[status] || statusConfig.planning;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredProjects = projectsWithSites.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const isArchived = p.status === 'completed' || p.status === 'archived';
    if (showArchived) {
      return matchesSearch && isArchived;
    }
    return matchesSearch && !isArchived;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{projectsWithSites.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {projectsWithSites.reduce((sum, p) => sum + p.sites.length, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Projects Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatBudget(totalProjectsBudget)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sites Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatBudget(totalSitesBudget)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showArchived ? "default" : "outline"}
          onClick={() => setShowArchived(!showArchived)}
          className="gap-2"
        >
          <Archive className="h-4 w-4" />
          {showArchived ? "Hide Archived" : "Show Archived"}
        </Button>
      </div>

      {/* Projects & Sites Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects and Sites Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Sites Budget</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.map((project) => {
                const isExpanded = expandedProjects.has(project.id);
                const projectSites = project.sites as SiteData[];
                
                return (
                  <>
                    <TableRow key={project.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProject(project.id)}
                          className="p-1 h-8 w-8"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatBudget(project.budget || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${project.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs">{project.progress || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{projectSites.length}</span>
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        {formatBudget(project.totalSitesBudget || 0)}
                      </TableCell>
                      <TableCell>
                        {project.clientName ||
                          (project.sites as SiteData[]).find(s => s.clientName)?.clientName ||
                          '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isArchived = project.status === 'completed';
                              handleArchiveProject(project.id, isArchived);
                            }}
                            className="h-8 w-8 p-0"
                            title={project.status === 'completed' ? 'Restore' : 'Archive'}
                          >
                            {project.status === 'completed' ? (
                              <span className="text-green-600 font-bold text-xs">↺</span>
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="h-8 w-8 p-0"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Sites Details */}
                    {isExpanded && projectSites.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0 bg-gray-50">
                          <div className="p-4">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-100">
                                  <TableHead>Site</TableHead>
                                  <TableHead>Location</TableHead>
                                  <TableHead>Client</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Budget</TableHead>
                                  <TableHead>Progress</TableHead>
                                  <TableHead>Teams</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {projectSites.map((site) => (
                                  <TableRow key={site.id} className="bg-white">
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        {site.name}
                                      </div>
                                    </TableCell>
                                    <TableCell>{site.localisation || site.address}</TableCell>
                                    <TableCell>{site.clientName || '-'}</TableCell>
                                    <TableCell>{getStatusBadge(site.status)}</TableCell>
                                    <TableCell className="text-green-600">
                                      {formatBudget(site.budget || 0)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="w-12 h-1.5 bg-gray-100 rounded-full">
                                          <div
                                            className="h-full bg-green-600"
                                            style={{ width: `${site.progress || 0}%` }}
                                          />
                                        </div>
                                        <span className="text-xs">{site.progress || 0}%</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span>
                                          {(site.teams?.length || 0) + (site.teamIds?.length || 0)}
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}