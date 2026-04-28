import { useState, useEffect } from 'react';
import { MapPin, Users, DollarSign, Calendar, ChevronDown, ChevronUp, Search, Building2, ChevronLeft, ChevronRight, Trash2, Archive } from 'lucide-react';
import { IncidentBadge } from '../../components/IncidentBadge';
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
      const projectsData = await getProjectsWithSites();
      setProjectsWithSites(projectsData);

      // Compute stats from the unified projectsData (already contains sites)
      const activeProjects = projectsData.filter(
        (p: ProjectWithSites) => p.status !== 'completed' && p.status !== 'archived'
      );

      const projectsBudget = activeProjects.reduce(
        (sum: number, p: ProjectWithSites) => sum + (p.budget || 0),
        0
      );
      const sitesBudget = activeProjects.reduce(
        (sum: number, p: ProjectWithSites) => sum + (p.totalSitesBudget || 0),
        0
      );

      setTotalProjectsBudget(projectsBudget);
      setTotalSitesBudget(sitesBudget);
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

  // Reset to page 1 when search or archive filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showArchived]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Page numbers to show (max 5 around current)
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

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
      {/* ── Header banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white shadow-xl px-6 py-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-blue-200">Sites BI</p>
            <h2 className="text-2xl font-bold">Welcome to Smart Site — Sites Overview</h2>
            <p className="text-blue-100 text-sm mt-1">Real-time analytics across all projects and sites.</p>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Active Projects",
            value: projectsWithSites.filter(p => p.status !== 'completed' && p.status !== 'archived').length,
            sub: `${projectsWithSites.length} total incl. archived`,
            tone: "from-blue-600 to-cyan-500",
            icon: Building2,
          },
          {
            title: "Total Sites",
            value: projectsWithSites
              .filter(p => p.status !== 'completed' && p.status !== 'archived')
              .reduce((sum, p) => sum + p.sites.length, 0),
            sub: `${projectsWithSites.reduce((sum, p) => sum + p.sites.length, 0)} total incl. archived`,
            tone: "from-violet-600 to-fuchsia-500",
            icon: MapPin,
          },
        ].map((card) => (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.tone} p-5 shadow-lg hover:shadow-xl transition-shadow duration-300`}
          >
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -right-1 -bottom-6 h-16 w-16 rounded-full bg-white/10" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{card.title}</p>
                <p className="mt-2 text-3xl font-extrabold text-white leading-none">{card.value}</p>
                <p className="text-xs text-white/60 mt-1">{card.sub}</p>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
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
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <button
                            onClick={() => toggleProject(project.id)}
                            className="font-semibold text-lg text-blue-700 hover:underline hover:text-blue-900 cursor-pointer bg-transparent border-none p-0 text-left"
                          >
                            {project.name}
                          </button>
                          {project.status === 'completed' && (
                            <Badge variant="secondary" className="ml-2">Archived</Badge>
                          )}
                          <IncidentBadge projectId={project.id} size="sm" />
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
                        {(() => {
                          const clients = Array.from(
                            new Set(
                              [
                                project.clientName,
                                ...(project.sites as SiteData[]).map(s => s.clientName),
                              ]
                                .filter(Boolean)
                                .map(c => c!.trim())
                                .filter(c => c.length > 0)
                            )
                          );
                          if (clients.length === 0) return '-';
                          return (
                            <div className="flex flex-wrap gap-1">
                              {clients.map((client, i) => (
                                <span
                                  key={i}
                                  className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
                                >
                                  {client}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
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
                    {isExpanded && projectSites.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0 bg-gray-50">
                          <div className="p-6 text-center text-gray-500 text-sm">
                            No sites assigned to this project yet.
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
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
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              {filteredProjects.length === 0
                ? 'No projects'
                : `Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredProjects.length)} of ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
                title="First page"
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers().map((page, i) =>
                page === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page as number)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
                title="Last page"
              >
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}