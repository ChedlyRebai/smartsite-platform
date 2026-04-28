import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useAuthStore } from "../../store/authStore";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { AUTH_API_URL } from "@/lib/auth-api-url";
import { useTranslation } from "@/app/hooks/useTranslation";

type AuditLog = {
  _id: string;
  userId?: string;
  userCin?: string;
  userName?: string;
  userRole?: string;
  actionType: string;
  actionLabel: string;
  resourceType?: string;
  resourceId?: string;
  status?: string;
  severity?: string;
  ipAddress?: string;
  details?: string;
  sessionId?: string;
  sessionDurationSec?: number;
  createdAt: string;
};

const api = axios.create({ baseURL: AUTH_API_URL });

function getAuthToken(): string | null {
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
}

function severityVariant(severity?: string): "default" | "destructive" | "secondary" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "important") return "default";
  return "secondary";
}

function formatSessionDuration(seconds?: number): string {
  if (seconds == null || Number.isNaN(seconds)) return "N/A";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function SystemLogs() {
  const user = useAuthStore((s) => s.user);
  const { t, language } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [retentionDays, setRetentionDays] = useState<number>(365);
  const [archivedLogs, setArchivedLogs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);

  const locale =
    language === "fr" ? "fr-FR" : language === "ar" ? "ar-TN" : "en-GB";

  const [filters, setFilters] = useState({
    userId: "all",
    userCin: "",
    actionType: "all",
    severity: "all",
    keyword: "",
    startDate: "",
    endDate: "",
  });

  const users = useMemo(
    () =>
      Array.from(new Map(logs.filter((l) => l.userId).map((l) => [l.userId as string, l])).values()),
    [logs],
  );
  const actionTypes = useMemo(() => Array.from(new Set(logs.map((l) => l.actionType))), [logs]);

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error(
          t("systemLogs.toast.missingToken", "Token manquant, veuillez vous reconnecter."),
        );
        return;
      }
      const params: Record<string, string> = {};
      if (filters.userId !== "all") params.userId = filters.userId;
      if (filters.userCin.trim()) params.userCin = filters.userCin.trim();
      if (filters.actionType !== "all") params.actionType = filters.actionType;
      if (filters.severity !== "all") params.severity = filters.severity;
      if (filters.keyword.trim()) params.keyword = filters.keyword.trim();
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get("/audit-logs", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data || []);
      setCurrentPage(1); // Reset to first page when loading new logs

      const retention = await api.get("/audit-logs/retention", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRetentionDays(retention?.data?.retentionDays || 365);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          t("systemLogs.toast.loadError", "Erreur lors du chargement des logs"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const roleName = (user as any)?.role?.name || (user as any)?.role;
    if (roleName !== "super_admin") {
      toast.error(
        t("systemLogs.toast.superAdminOnly", "Accès réservé au Super Admin."),
      );
      return;
    }
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Logs & Audit Trail</h1>
            <p className="text-blue-100 mt-2">Monitor system activities and user actions</p>
            <p className="text-xs text-blue-200 mt-2">
              Auto-retention: {retentionDays} days • Manual deletion disabled
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{logs.length}</div>
            <p className="text-blue-100 text-sm">Total Logs</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
          <CardTitle className="text-lg">Advanced Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="font-semibold text-slate-700 mb-2 block">User</Label>
              <Select value={filters.userId} onValueChange={(v) => setFilters((f) => ({ ...f, userId: v }))}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u.userId || ""}>
                      {u.userName || u.userCin || "System"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold text-slate-700 mb-2 block">Action Type</Label>
              <Select value={filters.actionType} onValueChange={(v) => setFilters((f) => ({ ...f, actionType: v }))}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold text-slate-700 mb-2 block">Severity</Label>
              <Select value={filters.severity} onValueChange={(v) => setFilters((f) => ({ ...f, severity: v }))}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold text-slate-700 mb-2 block">CIN</Label>
              <Input
                placeholder="Search by CIN..."
                value={filters.userCin}
                onChange={(e) => setFilters((f) => ({ ...f, userCin: e.target.value }))}
                className="border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="font-semibold text-slate-700 mb-2 block">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="border-slate-200"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700 mb-2 block">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="border-slate-200"
              />
            </div>
            <div>
              <Label className="font-semibold text-slate-700 mb-2 block">Keyword</Label>
              <Input
                placeholder="Search keyword..."
                value={filters.keyword}
                onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                className="border-slate-200"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={loadLogs}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const logsToArchive = logs.filter((log) => !archivedLogs.has(log._id));
                if (logsToArchive.length === 0) {
                  toast.error("No new logs to archive");
                  return;
                }
                const blob = new Blob([JSON.stringify(logsToArchive, null, 2)], {
                  type: "application/json;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                const newArchivedLogs = new Set(archivedLogs);
                logsToArchive.forEach((log) => newArchivedLogs.add(log._id));
                setArchivedLogs(newArchivedLogs);
                toast.success(`${logsToArchive.length} logs archived successfully`);
              }}
              className="border-slate-200"
            >
              📥 Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const logsToArchive = logs.filter((log) => !archivedLogs.has(log._id));
                if (logsToArchive.length === 0) {
                  toast.error("No new logs to archive");
                  return;
                }
                const header =
                  "date,user,actionType,actionLabel,severity,status,resourceType,resourceId,ip,details,sessionDurationSec";
                const rows = logsToArchive.map((l) =>
                  [
                    new Date(l.createdAt).toISOString(),
                    `"${(l.userName || l.userCin || "").replace(/"/g, '""')}"`,
                    l.actionType || "",
                    `"${(l.actionLabel || "").replace(/"/g, '""')}"`,
                    l.severity || "",
                    l.status || "",
                    l.resourceType || "",
                    l.resourceId || "",
                    l.ipAddress || "",
                    `"${(l.details || "").replace(/"/g, '""')}"`,
                    l.sessionDurationSec ?? "",
                  ].join(","),
                );
                const csv = [header, ...rows].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                const newArchivedLogs = new Set(archivedLogs);
                logsToArchive.forEach((log) => newArchivedLogs.add(log._id));
                setArchivedLogs(newArchivedLogs);
                toast.success(`${logsToArchive.length} logs archived successfully`);
              }}
              className="border-slate-200"
            >
              📊 Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const resetFilters = {
                  userId: "all",
                  userCin: "",
                  actionType: "all",
                  severity: "all",
                  keyword: "",
                  startDate: "",
                  endDate: "",
                };
                setFilters(resetFilters);
              }}
              className="border-slate-200"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Section */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
          <CardTitle className="flex items-center justify-between">
            <span>Activity Logs ({logs.length})</span>
            <span className="text-xs font-normal text-slate-500">
              Page {currentPage} of {totalPages || 1}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-slate-600">Loading logs...</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No logs found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentLogs.map((log) => (
                <div
                  key={log._id}
                  className={`p-4 border rounded-lg transition-all ${
                    archivedLogs.has(log._id)
                      ? "bg-slate-50 border-slate-200 opacity-60"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          {log.actionLabel || log.actionType}
                        </span>
                        <Badge className={`${
                          log.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : log.severity === "important"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-800"
                        }`}>
                          {log.severity || "normal"}
                        </Badge>
                        <Badge className={`${
                          log.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {log.status || "success"}
                        </Badge>
                        {archivedLogs.has(log._id) && (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 font-medium">USER</p>
                          <p className="text-slate-700">
                            {log.userName || log.userCin || "System"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">TYPE</p>
                          <p className="text-slate-700">{log.actionType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">DATE</p>
                          <p className="text-slate-700">
                            {new Date(log.createdAt).toLocaleString(locale)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">IP</p>
                          <p className="text-slate-700">
                            {log.ipAddress || "N/A"}
                          </p>
                        </div>
                      </div>
                      {log.sessionDurationSec != null && (
                        <p className="text-xs text-slate-500 mt-2">
                          Session duration: {formatSessionDuration(log.sessionDurationSec)}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLog(log)}
                      className="border-slate-200 ml-4"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {logs.length > logsPerPage && (
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">
            Showing <span className="font-bold">{indexOfFirstLog + 1}</span> to{" "}
            <span className="font-bold">
              {Math.min(indexOfLastLog, logs.length)}
            </span>{" "}
            of <span className="font-bold">{logs.length}</span> logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-slate-200"
            >
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                return i + startPage;
              }).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => paginate(page)}
                  className="w-8 h-8 p-0 border-slate-200"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-slate-200"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("systemLogs.detailsTitle", "Détails du log")}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-2 text-sm">
              <p>
                <strong>{t("systemLogs.details.action", "Action")}:</strong>{" "}
                {selectedLog.actionLabel}
              </p>
              <p>
                <strong>{t("systemLogs.details.type", "Type")}:</strong>{" "}
                {selectedLog.actionType}
              </p>
              <p>
                <strong>{t("systemLogs.details.user", "User")}:</strong>{" "}
                {selectedLog.userName ||
                  selectedLog.userCin ||
                  t("systemLogs.system", "System")}
              </p>
              <p>
                <strong>{t("systemLogs.details.role", "Role")}:</strong>{" "}
                {selectedLog.userRole || "N/A"}
              </p>
              <p>
                <strong>{t("systemLogs.details.resource", "Resource")}:</strong>{" "}
                {selectedLog.resourceType || "N/A"}{" "}
                {selectedLog.resourceId ? `(${selectedLog.resourceId})` : ""}
              </p>
              <p>
                <strong>{t("systemLogs.details.ip", "IP")}:</strong>{" "}
                {selectedLog.ipAddress || "N/A"}
              </p>
              <p>
                <strong>{t("systemLogs.details.date", "Date")}:</strong>{" "}
                {new Date(selectedLog.createdAt).toLocaleString(locale)}
              </p>
              <p>
                <strong>{t("systemLogs.details.sessionId", "Session ID")}:</strong>{" "}
                {selectedLog.sessionId || "N/A"}
              </p>
              <p>
                <strong>
                  {t("systemLogs.details.sessionDuration", "Session duration")}:
                </strong>{" "}
                {formatSessionDuration(selectedLog.sessionDurationSec)}
              </p>
              <p>
                <strong>{t("systemLogs.details.details", "Details")}:</strong>{" "}
                {selectedLog.details || "N/A"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
