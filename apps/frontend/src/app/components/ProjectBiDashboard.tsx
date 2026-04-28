import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";

const API_URL =
  (import.meta as any).env?.VITE_GESTION_PROJECTS_URL ?? "http://localhost:3010/api";

const projectsApi = axios.create({ baseURL: API_URL, timeout: 10000 });

// ─── Types ────────────────────────────────────────────────────────────────────

type RawProject = {
  _id: string;
  status: string;
  budget?: number;
  actualCost?: number;
  progress?: number;
  siteCount?: number;
};

type Summary = {
  total: number;
  planning: number;
  inProgress: number;
  completed: number;
  totalBudget: number;
  totalActualCost: number;
  avgProgress: number;
  totalSites: number;
  budgetUtilisation: number;
  updatedAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeSummary(projects: RawProject[]): Summary {
  const total = projects.length;
  const planning = projects.filter((p) => p.status === "planning").length;
  const inProgress = projects.filter((p) =>
    ["in_progress", "en_cours"].includes(p.status)
  ).length;
  const completed = projects.filter((p) =>
    ["completed", "terminé"].includes(p.status)
  ).length;
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalActualCost = projects.reduce((s, p) => s + (p.actualCost || 0), 0);
  const avgProgress =
    total > 0
      ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / total)
      : 0;
  const totalSites = projects.reduce((s, p) => s + (p.siteCount || 0), 0);
  const budgetUtilisation =
    totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0;

  return {
    total,
    planning,
    inProgress,
    completed,
    totalBudget,
    totalActualCost,
    avgProgress,
    totalSites,
    budgetUtilisation,
    updatedAt: new Date().toISOString(),
  };
}

function fmt(n: number) {
  return n.toLocaleString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectBiDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await projectsApi.get("/projects", {
        params: { limit: 1000, page: 1 },
      });
      const raw: RawProject[] =
        res.data?.projects || res.data?.data || res.data || [];
      setSummary(computeSummary(raw));
    } catch (err) {
      console.error("ProjectBiDashboard: failed to load projects", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = window.setInterval(fetchStats, 30_000);
    return () => window.clearInterval(interval);
  }, [fetchStats]);

  const statCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        title: "Total Projects",
        value: summary.total,
        icon: Briefcase,
        tone: "from-blue-600 to-cyan-500",
        sub: null,
      },
      {
        title: "In Progress",
        value: summary.inProgress,
        icon: Activity,
        tone: "from-indigo-600 to-blue-500",
        sub: null,
      },
      {
        title: "Completed",
        value: summary.completed,
        icon: CheckCircle2,
        tone: "from-emerald-600 to-lime-500",
        sub: null,
      },
      {
        title: "Planning",
        value: summary.planning,
        icon: Clock,
        tone: "from-amber-500 to-yellow-400",
        sub: null,
      },
      {
        title: "Total Sites",
        value: summary.totalSites,
        icon: MapPin,
        tone: "from-teal-600 to-cyan-500",
        sub: null,
      },
    ];
  }, [summary]);

  return (
    <div className="space-y-5">
      {/* ── Header banner ── */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-blue-200">
                Projects BI
              </p>
              <h2 className="text-2xl font-bold">
                Welcome to Smart Site Projects
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Real-time analytics across all construction projects.
              </p>
            </div>
            <div />
          </div>
        </CardContent>
      </Card>

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="border-slate-200 shadow-md">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {isLoading ? "—" : card.value}
                  </p>
                  {card.sub && (
                    <p className="text-xs text-violet-700 mt-1">{card.sub}</p>
                  )}
                </div>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.tone}`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
