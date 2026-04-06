import React from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface BudgetInfluencePoint {
  step: number;
  label: string;
  title: string;
  approvedAt: string | null;
  incrementalSavingsTnd: number;
  cumulativePotentialReliefTnd: number;
  budgetSpentSnapshotTnd: number | null;
  siteBudgetTotalTnd: number | null;
}

interface Props {
  data: BudgetInfluencePoint[];
}

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';

export const BudgetInfluenceApprovalChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget impact curve (on approval)</CardTitle>
          <CardDescription>
            Approve at least one recommendation to see cumulative estimated savings (TND) and site spend captured at each
            approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-8 text-center">
          No approved recommendations yet for this site.
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((row) => ({
    ...row,
    spent: row.budgetSpentSnapshotTnd ?? undefined,
    cumulative: row.cumulativePotentialReliefTnd,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget impact curve (on approval)</CardTitle>
        <CardDescription>
          Orange line: cumulative estimated savings (TND) unlocked as you approve recommendations. Blue line: site budget
          spent at the snapshot taken on each approval (from captured metrics).
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[320px]">
        <div
          role="img"
          aria-label="Line chart showing cumulative estimated savings and budget spent at each recommendation approval"
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{ value: 'TND', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: 'Spent (TND)', angle: 90, position: 'insideRight', style: { fontSize: 10 } }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as BudgetInfluencePoint & { spent?: number; cumulative: number };
                return (
                  <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                    <p className="font-semibold text-popover-foreground">{p.title}</p>
                    <p className="text-muted-foreground mt-1">{p.label}</p>
                    {p.approvedAt && (
                      <p className="text-muted-foreground">{new Date(p.approvedAt).toLocaleString('en-US')}</p>
                    )}
                    <p className="mt-2">
                      Cumulative potential relief: <strong>{fmt(p.cumulativePotentialReliefTnd)} TND</strong>
                    </p>
                    {p.step > 0 && (
                      <p>
                        This approval (increment): <strong>{fmt(p.incrementalSavingsTnd)} TND</strong>
                      </p>
                    )}
                    {p.budgetSpentSnapshotTnd != null && (
                      <p>
                        Budget spent (snapshot): <strong>{fmt(p.budgetSpentSnapshotTnd)} TND</strong>
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulative"
              name="Cumulative est. savings (TND)"
              stroke="#ea580c"
              strokeWidth={2}
              dot={{ r: 4, fill: '#ea580c' }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="spent"
              name="Budget spent at snapshot (TND)"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563eb' }}
              connectNulls
              activeDot={{ r: 6 }}
            />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="sr-only" aria-live="polite">
          <p>Budget impact summary by approval step:</p>
          <ul>
            {chartData.map((p) => (
              <li key={`${p.label}-${p.step}`}>
                {p.label}: cumulative estimated savings {fmt(p.cumulativePotentialReliefTnd)} TND
                {p.budgetSpentSnapshotTnd != null
                  ? `, budget spent snapshot ${fmt(p.budgetSpentSnapshotTnd)} TND.`
                  : "."}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
