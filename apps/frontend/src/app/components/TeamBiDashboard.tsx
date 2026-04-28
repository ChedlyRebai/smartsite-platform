import { useMemo } from "react";
import {
  CheckCircle2,
  Users,
  Building2,
  UserX,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";

type TeamData = {
  _id: string;
  name: string;
  members?: any[];
  isActive: boolean;
};

type Props = {
  teams: TeamData[];
};

export function TeamBiDashboard({ teams }: Props) {
  const summary = useMemo(() => {
    const total = teams.length;
    const active = teams.filter((t) => t.isActive).length;
    const inactive = total - active;
    const totalMembers = teams.reduce(
      (s, t) => s + (t.members?.length || 0),
      0
    );
    const avgMembers =
      total > 0 ? Math.round((totalMembers / total) * 10) / 10 : 0;
    const teamsWithMembers = teams.filter(
      (t) => (t.members?.length || 0) > 0
    ).length;

    return { total, active, inactive, totalMembers, avgMembers, teamsWithMembers };
  }, [teams]);

  const cards = [
    {
      title: "Total Teams",
      value: summary.total,
      icon: Building2,
      tone: "from-blue-600 to-cyan-500",
    },
    {
      title: "Active Teams",
      value: summary.active,
      icon: CheckCircle2,
      tone: "from-emerald-600 to-lime-500",
    },
    {
      title: "Inactive Teams",
      value: summary.inactive,
      icon: UserX,
      tone: "from-amber-500 to-orange-400",
    },
    {
      title: "Total Members",
      value: summary.totalMembers,
      icon: Users,
      tone: "from-violet-600 to-fuchsia-500",
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header banner ── */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-blue-200">
                Teams BI
              </p>
              <h2 className="text-2xl font-bold">
                Welcome to Smart Site Teams
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Real-time overview of all teams and members.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-slate-200 shadow-md">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {card.value}
                  </p>
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
