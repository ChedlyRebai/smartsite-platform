import { Briefcase, AlertCircle, ChevronLeft, ChevronRight, Search, X, Calendar } from "lucide-react";
import { IncidentBadge } from "../../components/IncidentBadge";
import { ProjectBiDashboard } from "../../components/ProjectBiDashboard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "../../components/ui/dialog";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { toast } from "sonner";
import { getSyncedProjectsWithDetails, type SyncedProject } from "../../action/synced-project.action";

const API_URL = (import.meta as any).env?.VITE_GESTION_PROJECTS_URL ?? "http://localhost:3010/api";

export default function Projects() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || { name: "super_admin" as const };
  const canManageProjects = user && canEdit(userRole.name, "projects");

  const [projects, setProjects] = useState<SyncedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const PAGE_SIZE = 6;

  const [searchName, setSearchName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [newProject, setNewProject] = useState({ name: "", budget: "", siteCount: 0, startDate: "", endDate: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedSites] = useState<string[]>([]);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SyncedProject | null>(null);
  const [editData, setEditData] = useState({ name: "", budget: "", siteCount: 0, status: "", progress: 0, startDate: "", endDate: "" });

  // Teams data for View Details
  const [projectTeams, setProjectTeams] = useState<{ teamName: string; members: { _id: string; firstName?: string; lastName?: string; name?: string }[] }[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const SITE_API_URL = (import.meta as any).env?.VITE_GESTION_SITE_URL ?? "http://localhost:3001/api";

  const loadProjects = async (page = currentPage) => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: PAGE_SIZE, page };
      if (searchName.trim()) params.search = searchName.trim();
      if (dateFrom) params.startDateFrom = dateFrom;
      if (dateTo) params.startDateTo = dateTo;
      const response = await axios.get(`${API_URL}/projects`, { params });
      setProjects(response.data.projects || []);
      setTotalPages((response.data.totalPages ?? Math.ceil((response.data.total || 0) / PAGE_SIZE)) || 1);
      setTotalProjects(response.data.total || 0);
    } catch {
      try {
        const syncedProjects = await getSyncedProjectsWithDetails();
        setProjects(syncedProjects);
        setTotalPages(1);
        setTotalProjects(syncedProjects.length);
      } catch {
        toast.error("Failed to load projects");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(currentPage); }, [currentPage, searchName, dateFrom, dateTo]);

  const handleSearchChange = (v: string) => { setSearchName(v); setCurrentPage(1); };
  const handleDateFromChange = (v: string) => { setDateFrom(v); setCurrentPage(1); };
  const handleDateToChange = (v: string) => { setDateTo(v); setCurrentPage(1); };
  const handleClearFilters = () => { setSearchName(""); setDateFrom(""); setDateTo(""); setCurrentPage(1); };
  const hasActiveFilters = searchName || dateFrom || dateTo;

  const handleAddProject = async () => {
    setCreateError(null);
    if (!newProject.name || !newProject.budget) { setCreateError("Project name and budget are required."); return; }
    if (newProject.siteCount < 1) { setCreateError("You must specify at least 1 site to create a project."); return; }
    if (newProject.startDate && newProject.endDate && newProject.startDate >= newProject.endDate) {
      setCreateError("End date must be after start date."); return;
    }
    try {
      await axios.post(`${API_URL}/projects`, {
        name: newProject.name, budget: parseFloat(newProject.budget),
        siteCount: newProject.siteCount, sites: selectedSites, status: "planning", priority: "medium",
        startDate: newProject.startDate || undefined, endDate: newProject.endDate || undefined,
      });
      await loadProjects(currentPage);
      setNewProject({ name: "", budget: "", siteCount: 0, startDate: "", endDate: "" });
      setCreateError(null);
      toast.success("Project created successfully!");
    } catch { toast.error("Failed to create project"); }
  };

  const AUTH_API_URL = (import.meta as any).env?.VITE_AUTH_API_URL?.trim() ?? "http://localhost:3000";

  const handleViewDetails = async (project: SyncedProject) => {
    setSelectedProject(project);
    setViewDetailsOpen(true);
    setProjectTeams([]);
    setTeamsLoading(true);
    try {
      // Fetch sites for this project
      const sitesRes = await axios.get(`${SITE_API_URL}/gestion-sites`, {
        params: { projectId: project._id, limit: 100 }
      });
      const sites: any[] = sitesRes.data?.data || sitesRes.data || [];

      // For each site, fetch its teams with populated members
      const teamsData: { teamName: string; members: { _id: string; firstName?: string; lastName?: string; name?: string; email?: string }[] }[] = [];
      const seenTeamIds = new Set<string>();

      await Promise.all(
        sites.map(async (site: any) => {
          const siteId = site._id || site.id;
          if (!siteId) return;
          try {
            const teamsRes = await axios.get(`${SITE_API_URL}/gestion-sites/${siteId}/teams`);
            const teams: any[] = teamsRes.data || [];

            await Promise.all(teams.map(async (team: any) => {
              const teamId = team._id || team.id;
              if (seenTeamIds.has(teamId)) return;
              seenTeamIds.add(teamId);

              // members can be ObjectIds or objects
              const memberIds: string[] = (team.members || []).map((m: any) =>
                typeof m === "string" ? m : m._id || m.id || m
              ).filter(Boolean);

              // Fetch member details if they are just IDs
              const populatedMembers = await Promise.all(
                memberIds.map(async (memberId: string) => {
                  // If already an object with name, return as-is
                  const raw = (team.members || []).find((m: any) =>
                    (m._id || m.id) === memberId
                  );
                  if (raw && (raw.firstName || raw.lastName || raw.name)) return raw;

                  // Otherwise fetch from auth API
                  try {
                    const userRes = await axios.get(`${AUTH_API_URL}/users/${memberId}`);
                    return userRes.data;
                  } catch {
                    return { _id: memberId, name: memberId };
                  }
                })
              );

              teamsData.push({
                teamName: team.name || team.teamCode || "Team",
                members: populatedMembers.filter(Boolean),
              });
            }));
          } catch { /* site may have no teams */ }
        })
      );
      setProjectTeams(teamsData);
    } catch {
      setProjectTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await axios.delete(`${API_URL}/projects/${id}`);
      const newPage = projects.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      await loadProjects(newPage);
      toast.success("Project deleted successfully!");
    } catch { toast.error("Failed to delete project"); }
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setEditData({
      name: project.name, budget: project.budget?.toString() || "",
      siteCount: project.siteCount || 0, status: project.status, progress: project.progress,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
    });
    setEditOpen(true);
  };

  const handleExportPdf = async () => {
    try {
      toast.info("Generating PDF...");

      // Helper: format number as 12.000 DT (dot as thousands separator)
      const fmtBudget = (n: number) =>
        n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " DT";

      // Helper: safe ASCII status label (no special chars)
      const statusLabel2 = (s: string) => {
        const map: Record<string, string> = {
          planning: "Planning",
          in_progress: "In Progress",
          en_cours: "In Progress",
          completed: "Completed",
          termine: "Completed",
          on_hold: "On Hold",
          cancelled: "Cancelled",
          en_retard: "Delayed",
        };
        return map[s] || s || "-";
      };

      // 1. Fetch all projects
      const projRes = await axios.get(`${API_URL}/projects`, { params: { limit: 1000, page: 1 } });
      const allProjects: any[] = projRes.data?.projects || projRes.data?.data || projRes.data || [];

      // 2. Fetch all sites
      const SITE_URL = (import.meta as any).env?.VITE_GESTION_SITE_URL ?? "http://localhost:3001/api";
      const siteRes = await axios.get(`${SITE_URL}/gestion-sites`, { params: { limit: 1000 } });
      const allSites: any[] = siteRes.data?.data || siteRes.data || [];

      // 3. Group sites by projectId
      const sitesByProject: Record<string, any[]> = {};
      allSites.forEach((s: any) => {
        const pid = s.projectId || "none";
        if (!sitesByProject[pid]) sitesByProject[pid] = [];
        sitesByProject[pid].push(s);
      });

      // 4. Load logo as base64
      const logoBase64 = await fetch("/logo.png")
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            })
        )
        .catch(() => null);

      // 5. Build PDF
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // ── Header banner ──
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 36, "F");

      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 10, 5, 24, 24);
      }

      const textX = logoBase64 ? 40 : 14;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SmartSite - Projects Report", textX, 17);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      const now = new Date();
      doc.text(
        `Generated: ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}   |   Total projects: ${allProjects.length}`,
        textX, 25
      );

      let y = 44;

      // ── Summary box ──
      const totalProjectBudget = allProjects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
      // Only sum sites that belong to one of the fetched projects
      const projectIds = new Set(allProjects.map((p: any) => String(p._id || p.id)));
      const totalSiteBudget = allSites
        .filter((s: any) => projectIds.has(String(s.projectId)))
        .reduce((sum: number, s: any) => sum + (Number(s.budget) || 0), 0);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(10, y, pageW - 20, 20, 3, 3, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(10, y, pageW - 20, 20, 3, 3, "S");

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", 15, y + 6);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Projects Budget: ${fmtBudget(totalProjectBudget)}`, 15, y + 14);
      doc.text(`Total Sites Budget: ${fmtBudget(totalSiteBudget)}`, pageW / 2 + 5, y + 14);

      y += 28;

      // ── Per project ──
      for (const project of allProjects) {
        if (y > pageH - 50) { doc.addPage(); y = 16; }

        const pid = project._id || project.id;
        const sites = sitesByProject[pid] || [];
        const projectSitesBudget = sites.reduce((s: number, site: any) => s + (Number(site.budget) || 0), 0);

        // Project title bar
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(10, y, pageW - 20, 11, 2, 2, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(project.name || "Unnamed Project", 15, y + 7.5);

        // Status badge (right side)
        const statusColors: Record<string, [number, number, number]> = {
          planning: [234, 179, 8],
          in_progress: [59, 130, 246],
          en_cours: [59, 130, 246],
          completed: [16, 185, 129],
          on_hold: [100, 116, 139],
          cancelled: [239, 68, 68],
          en_retard: [239, 68, 68],
        };
        const sc = statusColors[project.status] || [100, 116, 139];
        const stLabel = statusLabel2(project.status);
        doc.setFontSize(7);
        const stW = doc.getTextWidth(stLabel) + 6;
        doc.setFillColor(...sc);
        doc.roundedRect(pageW - 12 - stW, y + 2.5, stW, 6, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(stLabel, pageW - 12 - stW + 3, y + 7);

        y += 14;

        // Project meta line
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const startD = project.startDate ? new Date(project.startDate).toLocaleDateString("fr-FR") : "-";
        const endD = project.endDate ? new Date(project.endDate).toLocaleDateString("fr-FR") : "-";
        doc.text(
          `Budget: ${fmtBudget(project.budget || 0)}   |   Sites: ${project.siteCount || sites.length}   |   Progress: ${project.progress || 0}%   |   ${startD} to ${endD}`,
          15, y
        );
        y += 7;

        // Sites table
        if (sites.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [["Site Name", "Location", "Client", "Budget (DT)", "Status", "Progress"]],
            body: sites.map((s: any) => [
              s.nom || s.name || "-",
              s.localisation || s.adresse || "-",
              s.clientName || "-",
              fmtBudget(s.budget || 0),
              statusLabel2(s.status || ""),
              `${s.progress || 0}%`,
            ]),
            foot: [[
              { content: `${sites.length} site(s)`, colSpan: 3, styles: { fontStyle: "bold", fillColor: [226, 232, 240] } },
              { content: `Total: ${fmtBudget(projectSitesBudget)}`, colSpan: 3, styles: { fontStyle: "bold", halign: "right", fillColor: [226, 232, 240] } },
            ]],
            theme: "grid",
            headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 8, fontStyle: "bold", cellPadding: 3 },
            footStyles: { textColor: [15, 23, 42], fontSize: 8, cellPadding: 3 },
            bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
              0: { cellWidth: 38 },
              1: { cellWidth: 34 },
              2: { cellWidth: 28 },
              3: { cellWidth: 32, halign: "right" },
              4: { cellWidth: 24 },
              5: { cellWidth: 18, halign: "center" },
            },
            margin: { left: 10, right: 10 },
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        } else {
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(10, y, pageW - 20, 8, 1, 1, "F");
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(8);
          doc.text("No sites assigned to this project.", 15, y + 5.5);
          y += 14;
        }
      }

      // ── Footer on every page ──
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, pageH - 10, pageW, 10, "F");
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("SmartSite Platform - Confidential", 10, pageH - 4);
        doc.text(`Page ${i} / ${totalPages}`, pageW - 10, pageH - 4, { align: "right" });
      }

      doc.save(`smartsite-projects-${now.toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.name || !editData.budget) { toast.error("Name and budget are required"); return; }
    if (editData.siteCount < 1) { toast.error("Number of sites must be at least 1"); return; }
    try {
      await axios.put(`${API_URL}/projects/${selectedProject?._id}`, {
        name: editData.name, budget: parseFloat(editData.budget),
        siteCount: editData.siteCount, status: editData.status, progress: editData.progress,
        startDate: editData.startDate || undefined, endDate: editData.endDate || undefined,
      });
      await loadProjects(currentPage);
      setEditOpen(false);
      toast.success("Project updated successfully!");
    } catch { toast.error("Failed to update project"); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours": case "in_progress": return "bg-blue-100 text-blue-800";
      case "planning": return "bg-yellow-100 text-yellow-800";
      case "terminé": case "completed": return "bg-green-100 text-green-800";
      case "en_retard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabel = (s: string) =>
    s === "en_cours" ? "In Progress" : s === "planning" ? "Planning" : s === "terminé" ? "Completed" : s;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 mt-1">Manage all construction projects</p>
        </div>
        {canManageProjects ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPdf}>Export PDF</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  + New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-800">
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-gray-900">Create New Project</DialogTitle>
                      <DialogDescription className="text-sm text-gray-500">Add a new construction project</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Project Name</Label>
                    <Input placeholder="e.g., Downtown Office Tower" value={newProject.name} className="border-gray-200 focus:border-gray-400"
                      onChange={(e) => { setNewProject({ ...newProject, name: e.target.value }); setCreateError(null); }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Budget (DT)</Label>
                    <Input type="number" placeholder="e.g., 1500000" value={newProject.budget} className="border-gray-200 focus:border-gray-400"
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Number of Sites</Label>
                    <Input type="number" min="1" placeholder="e.g., 5" value={newProject.siteCount} className="border-gray-200 focus:border-gray-400"
                      onChange={(e) => { setNewProject({ ...newProject, siteCount: parseInt(e.target.value) || 0 }); setCreateError(null); }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Date</Label>
                      <Input
                        type="date"
                        value={newProject.startDate}
                        min={new Date().toISOString().split("T")[0]}
                        className="border-gray-200 focus:border-gray-400"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (newProject.endDate && val > newProject.endDate) {
                            setCreateError("Start date cannot be after end date.");
                          } else {
                            setCreateError(null);
                          }
                          setNewProject({ ...newProject, startDate: val });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">End Date</Label>
                      <Input
                        type="date"
                        value={newProject.endDate}
                        min={newProject.startDate
                          ? (() => { const d = new Date(newProject.startDate); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()
                          : new Date().toISOString().split("T")[0]}
                        className="border-gray-200 focus:border-gray-400"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (newProject.startDate && val <= newProject.startDate) {
                            setCreateError("End date must be after start date.");
                          } else {
                            setCreateError(null);
                          }
                          setNewProject({ ...newProject, endDate: val });
                        }}
                      />
                    </div>
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
                  <Button className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold" onClick={handleAddProject}>
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">+ New Project (No Permission)</Button>
        )}
      </div>

      {/* BI Dashboard */}
      <ProjectBiDashboard />

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-end bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-gray-500 mb-1 block">Search by name</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Project name..." value={searchName} className="pl-9"
              onChange={(e) => handleSearchChange(e.target.value)} />
          </div>
        </div>
        <div className="min-w-[160px]">
          <Label className="text-xs text-gray-500 mb-1 block">Start date from</Label>
          <Input type="date" value={dateFrom} onChange={(e) => handleDateFromChange(e.target.value)} />
        </div>
        <div className="min-w-[160px]">
          <Label className="text-xs text-gray-500 mb-1 block">Start date to</Label>
          <Input type="date" value={dateTo} onChange={(e) => handleDateToChange(e.target.value)} />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="flex items-center gap-1 text-gray-500 hover:text-red-600">
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No projects found</div>
        ) : (
          projects.map((project, idx) => {
            const progress = project.progress || 0;
            // Subtle accent palette — soft, not loud
            const accents = [
              { bar: "from-blue-400 to-cyan-400",    icon: "from-blue-500 to-cyan-500",    bg: "bg-blue-50/60",   ring: "ring-blue-100" },
              { bar: "from-violet-400 to-purple-400", icon: "from-violet-500 to-purple-500", bg: "bg-violet-50/60", ring: "ring-violet-100" },
              { bar: "from-emerald-400 to-teal-400",  icon: "from-emerald-500 to-teal-500",  bg: "bg-emerald-50/60",ring: "ring-emerald-100" },
              { bar: "from-amber-400 to-orange-400",  icon: "from-amber-500 to-orange-500",  bg: "bg-amber-50/60",  ring: "ring-amber-100" },
              { bar: "from-rose-400 to-pink-400",     icon: "from-rose-500 to-pink-500",     bg: "bg-rose-50/60",   ring: "ring-rose-100" },
              { bar: "from-sky-400 to-indigo-400",    icon: "from-sky-500 to-indigo-500",    bg: "bg-sky-50/60",    ring: "ring-sky-100" },
            ];
            const accent = accents[idx % accents.length];
            const progressBar = progress >= 75 ? "from-emerald-400 to-green-400"
                              : progress >= 40 ? "from-blue-400 to-cyan-400"
                              : "from-amber-400 to-orange-400";

            return (
            <div
              key={project._id}
              className={`group relative flex flex-col ${accent.bg} dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl ring-1 ${accent.ring} dark:ring-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Top accent bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${accent.bar}`} />

              <div className="flex flex-col flex-1 p-6 gap-5">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => navigate(`/projects/${project._id}/sites`)}
                  >
                    <div className={`shrink-0 p-3 rounded-xl bg-gradient-to-br ${accent.icon} shadow-md`}>
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-snug truncate group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">View sites →</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                      {statusLabel(project.status)}
                    </span>
                    <IncidentBadge projectId={project._id} size="sm" />
                  </div>
                </div>

                {/* ── Stats pills ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5 bg-white/70 dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Budget</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white truncate">
                      {(project.budget || 0).toLocaleString()} DT
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 bg-white/70 dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Sites</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {project.siteCount || 0} sites
                    </span>
                  </div>
                </div>

                {/* ── Dates ── */}
                {((project as any).startDate || (project as any).endDate) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span>
                      {(project as any).startDate && new Date((project as any).startDate).toLocaleDateString()}
                      {(project as any).startDate && (project as any).endDate && " → "}
                      {(project as any).endDate && new Date((project as any).endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* ── Progress ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-500 uppercase tracking-wide">Progress</span>
                    <span className="font-extrabold text-gray-700 dark:text-gray-200 text-sm">{progress}%</span>
                  </div>
                  <div className="w-full bg-white/60 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${progressBar} transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-2 mt-auto pt-1">
                  {/* View Details */}
                  <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
                    <DialogTrigger asChild onClick={() => handleViewDetails(project)}>
                      <Button size="sm" variant="outline" className="flex-1 bg-white/80 hover:bg-blue-50 border-gray-200 hover:border-blue-300 hover:text-blue-700 font-semibold text-xs transition-colors">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Project Details</DialogTitle>
                      </DialogHeader>
                      {selectedProject && (
                        <div className="space-y-3">
                          <div><p className="text-sm text-gray-500">Name</p><p className="font-semibold">{selectedProject.name}</p></div>
                          <div><p className="text-sm text-gray-500">Project Manager</p><p className="font-semibold">{selectedProject.projectManagerName}</p></div>
                          <div><p className="text-sm text-gray-500">Budget</p><p className="font-semibold">{(selectedProject.budget || 0).toLocaleString()} DT</p></div>
                          <div><p className="text-sm text-gray-500">Priority</p><p className="font-semibold">{selectedProject.priority}</p></div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                              {statusLabel(selectedProject.status)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Progress: {selectedProject.progress}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full" style={{ width: `${selectedProject.progress}%` }} />
                            </div>
                          </div>
                          <div><p className="text-sm text-gray-500">Sites</p><p className="font-semibold">{selectedProject.siteCount || 0} sites</p></div>

                          {/* Teams & Members */}
                          <div className="border-t pt-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span>👥</span> Teams & Members
                              {teamsLoading && <span className="text-xs text-gray-400 font-normal">(loading...)</span>}
                            </p>
                            {!teamsLoading && projectTeams.length === 0 && (
                              <p className="text-sm text-gray-400 italic">No teams assigned to this project's sites</p>
                            )}
                            {projectTeams.map((team, idx) => (
                              <div key={idx} className="mb-3 bg-gray-50 rounded-lg p-3">
                                <p className="text-sm font-semibold text-blue-700 mb-1">🏗 {team.teamName}</p>
                                {team.members.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">No members</p>
                                ) : (
                                  <ul className="space-y-1">
                                    {team.members.map((m: any, mi: number) => (
                                      <li key={mi} className="text-xs text-gray-600 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                          {(m.firstName?.[0] || m.name?.[0] || "?").toUpperCase()}
                                        </span>
                                        {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.name || m.email || m._id}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                            {!teamsLoading && projectTeams.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Total: {projectTeams.reduce((sum, t) => sum + t.members.length, 0)} member(s) across {projectTeams.length} team(s)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Edit */}
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild onClick={() => handleEditProject(project)}>
                      <Button size="sm" variant="outline" className="flex-1 bg-white/80 hover:bg-green-50 border-gray-200 hover:border-green-300 hover:text-green-700 font-semibold text-xs transition-colors">
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader className="pb-2 border-b border-indigo-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                            <Briefcase className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <DialogTitle className="text-lg font-bold text-gray-900">Edit Project</DialogTitle>
                            <DialogDescription className="text-sm text-gray-500">Update project information</DialogDescription>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Project Name</Label>
                          <Input value={editData.name} className="border-blue-200"
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Budget (DT)</Label>
                          <Input type="number" value={editData.budget} className="border-green-200"
                            onChange={(e) => setEditData({ ...editData, budget: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Number of Sites</Label>
                          <Input type="number" min="1" value={editData.siteCount} className="border-purple-200"
                            onChange={(e) => setEditData({ ...editData, siteCount: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Status</Label>
                          <select className="w-full px-3 py-2 border border-yellow-200 rounded-md bg-white text-gray-800"
                            value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                            <option value="planning">🟡 Planning</option>
                            <option value="in_progress">🔵 In Progress</option>
                            <option value="completed">🟢 Completed</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">
                            Progress — <span className="text-cyan-600 font-bold">{editData.progress}%</span>
                          </Label>
                          <input type="range" min="0" max="100" value={editData.progress} className="w-full accent-cyan-500"
                            onChange={(e) => setEditData({ ...editData, progress: parseInt(e.target.value) })} />
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all" style={{ width: `${editData.progress}%` }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Start Date</Label>
                            <Input type="date" value={editData.startDate} className="border-orange-200"
                              onChange={(e) => setEditData({ ...editData, startDate: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-red-700 uppercase tracking-wide">End Date</Label>
                            <Input type="date" value={editData.endDate} className="border-red-200"
                              onChange={(e) => setEditData({ ...editData, endDate: e.target.value })} />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold" onClick={handleSaveEdit}>
                            Save Changes
                          </Button>
                          <Button className="flex-1 bg-red-500 hover:bg-red-600 font-semibold" onClick={() => handleDeleteProject(selectedProject?._id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalProjects)} of {totalProjects} projects
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 p-0 ${page === currentPage ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}>
                {page}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
