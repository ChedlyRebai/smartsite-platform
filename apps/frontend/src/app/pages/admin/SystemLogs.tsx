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
import { toast } from "sonner";
import { AUTH_API_URL } from "@/lib/auth-api-url";

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
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [retentionDays, setRetentionDays] = useState<number>(365);
  const [archivedLogs, setArchivedLogs] = useState<Set<string>>(new Set());

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

  const loadLogs = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Token manquant, veuillez vous reconnecter.");
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

      const retention = await api.get("/audit-logs/retention", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRetentionDays(retention?.data?.retentionDays || 365);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur de chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const roleName = (user as any)?.role?.name || (user as any)?.role;
    if (roleName !== "super_admin") {
      toast.error("Accès réservé au Super Admin.");
      return;
    }
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Logs & Audit Trail</h1>
        <p className="text-gray-500 mt-1">Surveillance des actions et détection d'anomalies</p>
        <p className="text-xs text-gray-500 mt-1">
          Rétention automatique: {retentionDays} jours. Suppression manuelle désactivée.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <div>
              <Label>Utilisateur</Label>
              <Select value={filters.userId} onValueChange={(v) => setFilters((f) => ({ ...f, userId: v }))}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u.userId || ""}>
                      {u.userName || u.userCin || u.userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>CIN</Label>
              <Input
                placeholder="Rechercher par CIN..."
                value={filters.userCin}
                onChange={(e) => setFilters((f) => ({ ...f, userCin: e.target.value }))}
              />
            </div>
            <div>
              <Label>Action</Label>
              <Select value={filters.actionType} onValueChange={(v) => setFilters((f) => ({ ...f, actionType: v }))}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {actionTypes.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sévérité</Label>
              <Select value={filters.severity} onValueChange={(v) => setFilters((f) => ({ ...f, severity: v }))}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Début</Label>
              <Input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <Label>Fin</Label>
              <Input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div>
              <Label>Recherche</Label>
              <Input placeholder="mot-clé..." value={filters.keyword} onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={loadLogs}>Filtrer</Button>
            <Button
              variant="outline"
              onClick={() => {
                const logsToArchive = logs.filter(log => !archivedLogs.has(log._id));
                if (logsToArchive.length === 0) {
                  toast.error("Aucun nouveau log à archiver");
                  return;
                }

                const blob = new Blob([JSON.stringify(logsToArchive, null, 2)], { type: "application/json;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Marquer les logs comme archivés
                const newArchivedLogs = new Set(archivedLogs);
                logsToArchive.forEach(log => newArchivedLogs.add(log._id));
                setArchivedLogs(newArchivedLogs);

                toast.success(`${logsToArchive.length} logs archivés avec succès`);
              }}
            >
              Archiver JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const logsToArchive = logs.filter(log => !archivedLogs.has(log._id));
                if (logsToArchive.length === 0) {
                  toast.error("Aucun nouveau log à archiver");
                  return;
                }

                const header = "date,user,actionType,actionLabel,severity,status,resourceType,resourceId,ip,details,sessionDurationSec";
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

                // Marquer les logs comme archivés
                const newArchivedLogs = new Set(archivedLogs);
                logsToArchive.forEach(log => newArchivedLogs.add(log._id));
                setArchivedLogs(newArchivedLogs);

                toast.success(`${logsToArchive.length} logs archivés avec succès`);
              }}
            >
              Archiver CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const resetFilters = { userId: "all", userCin: "", actionType: "all", severity: "all", keyword: "", startDate: "", endDate: "" };
                setFilters(resetFilters);
                loadLogs();
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun log trouvé.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log._id} className={`p-3 border rounded-md flex items-center justify-between ${archivedLogs.has(log._id) ? 'bg-gray-50 opacity-75' : ''}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.actionLabel}</span>
                      {archivedLogs.has(log._id) && <Badge variant="secondary">Archivé</Badge>}
                      <Badge variant={severityVariant(log.severity)}>{log.severity || "normal"}</Badge>
                      <Badge variant={log.status === "failed" ? "destructive" : "secondary"}>{log.status || "success"}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString("fr-FR")} • {log.userName || log.userCin || "Système"} • {log.actionType}
                    </p>
                    {log.sessionDurationSec != null && (
                      <p className="text-xs text-gray-500">
                        Durée session: {formatSessionDuration(log.sessionDurationSec)}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedLog(log)}>Voir détails</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail du log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-2 text-sm">
              <p><strong>Action:</strong> {selectedLog.actionLabel}</p>
              <p><strong>Type:</strong> {selectedLog.actionType}</p>
              <p><strong>Utilisateur:</strong> {selectedLog.userName || selectedLog.userCin || "Système"}</p>
              <p><strong>Rôle:</strong> {selectedLog.userRole || "N/A"}</p>
              <p><strong>Ressource:</strong> {selectedLog.resourceType || "N/A"} {selectedLog.resourceId ? `(${selectedLog.resourceId})` : ""}</p>
              <p><strong>IP:</strong> {selectedLog.ipAddress || "N/A"}</p>
              <p><strong>Date:</strong> {new Date(selectedLog.createdAt).toLocaleString("fr-FR")}</p>
              <p><strong>Session ID:</strong> {selectedLog.sessionId || "N/A"}</p>
              <p><strong>Durée session:</strong> {formatSessionDuration(selectedLog.sessionDurationSec)}</p>
              <p><strong>Détails:</strong> {selectedLog.details || "N/A"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
