import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  MapPin,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const incidentsApi = axios.create({
  baseURL: "http://localhost:3003",
  timeout: 10000,
});

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

incidentsApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type DashboardBucket = {
  label: string;
  value: number;
};

type DashboardEntityStats = {
  label: string;
  total: number;
  open: number;
  critical: number;
  resolved: number;
};

type IncidentDashboardStats = {
  summary: {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    closed: number;
    critical: number;
    high: number;
    assigned: number;
    unassigned: number;
    resolutionRate: number;
  };
  bySeverity: DashboardBucket[];
  byStatus: DashboardBucket[];
  byType: DashboardBucket[];
  byUser: DashboardEntityStats[];
  byProject: DashboardEntityStats[];
  bySite: DashboardEntityStats[];
  trend: Array<{
    date: string;
    total: number;
    resolved: number;
    critical: number;
  }>;
  updatedAt: string;
};

type IncidentBiDashboardProps = {
  userCin?: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: "#ef4444",
  investigating: "#f59e0b",
  resolved: "#10b981",
  closed: "#64748b",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#b91c1c",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#64748b", "#3b82f6", "#8b5cf6"];

const formatEntityLabel = (label: string) => {
  if (label === "unassigned") return "Unassigned";
  if (label === "no-project") return "No Project";
  if (label === "no-site") return "No Site";
  return label;
};

export function IncidentBiDashboard({ userCin }: IncidentBiDashboardProps) {
  const [stats, setStats] = useState<IncidentDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await incidentsApi.get<IncidentDashboardStats>("/incidents/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load incident dashboard stats", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    let socket: Socket | null = null;

    try {
      socket = io("http://localhost:3004", {
        reconnection: true,
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        setIsLiveConnected(true);
        if (userCin) {
          socket?.emit("subscribe", { userCin });
        }
      });

      socket.on("disconnect", () => {
        setIsLiveConnected(false);
      });

      const refreshOnEvent = () => {
        fetchStats();
      };

      socket.on("incident:assigned", refreshOnEvent);
      socket.on("incident:resolved", refreshOnEvent);
      socket.on("incident:updated", refreshOnEvent);
      socket.on("incident:deleted", refreshOnEvent);
    } catch (error) {
      console.error("Incident BI websocket connection failed", error);
    }

    return () => {
      if (socket) {
        if (userCin) {
          socket.emit("unsubscribe", { userCin });
        }
        socket.disconnect();
      }
    };
  }, [fetchStats, userCin]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchStats();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [fetchStats]);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: "Total Incidents",
        value: stats.summary.total,
        icon: Activity,
        tone: "from-blue-600 to-cyan-500",
      },
      {
        title: "Open + Investigating",
        value: stats.summary.open + stats.summary.investigating,
        icon: AlertTriangle,
        tone: "from-rose-600 to-orange-500",
      },
      {
        title: "Resolved + Closed",
        value: stats.summary.resolved + stats.summary.closed,
        icon: CheckCircle2,
        tone: "from-emerald-600 to-lime-500",
      },
      {
        title: "Assigned Users",
        value: stats.byUser.filter((u) => u.label !== "unassigned").length,
        icon: Users,
        tone: "from-violet-600 to-fuchsia-500",
      },
      {
        title: "Projects Impacted",
        value: stats.byProject.filter((p) => p.label !== "no-project").length,
        icon: FolderKanban,
        tone: "from-indigo-600 to-blue-500",
      },
      {
        title: "Sites Impacted",
        value: stats.bySite.filter((s) => s.label !== "no-site").length,
        icon: MapPin,
        tone: "from-teal-600 to-cyan-500",
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-5">
      <Card className="border-none shadow-xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-blue-200">Incident BI</p>
              <h2 className="text-2xl font-bold">Live Incident Intelligence Dashboard</h2>
              <p className="text-blue-100 text-sm mt-1">
                Real-time analytics by user, project and site.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={isLiveConnected ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}
              >
                {isLiveConnected ? "Live socket connected" : "Polling fallback"}
              </Badge>
              {stats?.updatedAt && (
                <p className="text-xs text-blue-100">
                  Updated: {new Date(stats.updatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title} className="border-slate-200 shadow-md">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.tone}`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              {card.title === "Resolved + Closed" && stats && (
                <p className="text-xs text-emerald-700 mt-2">
                  Resolution rate: {stats.summary.resolutionRate}%
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading stats...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.bySeverity || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {(stats?.bySeverity || []).map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={SEVERITY_COLORS[entry.label] || "#64748b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading stats...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.byStatus || []}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={98}
                    paddingAngle={4}
                  >
                    {(stats?.byStatus || []).map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={STATUS_COLORS[entry.label] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">7-Day Incident Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading stats...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Resolved"
                  />
                  <Line
                    type="monotone"
                    dataKey="critical"
                    stroke="#dc2626"
                    strokeWidth={2}
                    name="Critical"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incident Types</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading stats...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.byType || []} layout="vertical" margin={{ left: 16, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="label" width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <EntityRanking title="Top Users" rows={stats?.byUser || []} kind="user" />
        <EntityRanking title="Top Projects" rows={stats?.byProject || []} kind="project" />
        <EntityRanking title="Top Sites" rows={stats?.bySite || []} kind="site" />
      </div>
    </div>
  );
}

type EntityRankingProps = {
  title: string;
  rows: DashboardEntityStats[];
  kind: "user" | "project" | "site";
};

function EntityRanking({ title, rows, kind }: EntityRankingProps) {
  const emptyText =
    kind === "user"
      ? "No user-level incidents yet"
      : kind === "project"
        ? "No project incidents yet"
        : "No site incidents yet";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="rounded-lg border bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {formatEntityLabel(row.label)}
                  </p>
                  <Badge className="bg-slate-900 text-white">{row.total}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <span>Open: {row.open}</span>
                  <span>Critical: {row.critical}</span>
                  <span>Resolved: {row.resolved}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
