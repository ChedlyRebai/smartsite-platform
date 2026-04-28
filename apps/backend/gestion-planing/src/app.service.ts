import { Injectable } from '@nestjs/common';
import { MilestoneService } from './milestone/milestone.service';
import { TaskService } from './task/task.service';

type LeanTask = {
  _id: unknown;
  title?: string;
  priority?: string;
  progress?: number;
  endDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  projectId?: string;
  milestoneId?: unknown;
  status?: { name?: string } | unknown;
};

type LeanMilestone = {
  _id: unknown;
  title?: string;
  description?: string;
  projectId?: string;
  siteId?: string;
  createdBy?: string;
  updatedBy?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  tasks?: (LeanTask | string)[];
};

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function idString(id: unknown): string {
  if (id == null) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id !== null) {
    const obj = id as {
      _id?: unknown;
      toString?: () => string;
      toHexString?: () => string;
    };

    // Handle MongoDB ObjectId safely without recursion.
    if (typeof obj.toHexString === 'function') {
      return obj.toHexString();
    }

    // Some populated docs expose an _id field; avoid self-recursion.
    if (obj._id != null && obj._id !== id) {
      return idString(obj._id);
    }

    if (typeof obj.toString === 'function') {
      return String(obj.toString());
    }
  }
  return String(id);
}

function taskStageLabel(status: LeanTask['status']): string {
  if (status && typeof status === 'object' && 'name' in status) {
    const n = (status as { name?: string }).name;
    return n ? String(n) : 'en_cours';
  }
  return 'en_cours';
}

function normalizePriority(p?: string): string {
  if (!p) return 'medium';
  const x = p.toLowerCase();
  if (['urgent', 'high', 'medium', 'low'].includes(x)) return x;
  return 'medium';
}

function maxPriorityStr(tasks: LeanTask[]): string {
  let best = 'low';
  let rank = PRIORITY_RANK.low;
  for (const t of tasks) {
    const p = normalizePriority(t.priority);
    const r = PRIORITY_RANK[p] ?? 4;
    if (r < rank) {
      rank = r;
      best = p;
    }
  }
  return best;
}

function avgProgress(tasks: LeanTask[]): number {
  if (!tasks.length) return 0;
  const sum = tasks.reduce((s, t) => s + (Number(t.progress) || 0), 0);
  return Math.round(sum / tasks.length);
}

function deriveProjectStatus(
  milestones: LeanMilestone[],
  tasks: LeanTask[],
  progress: number,
): string {
  const now = Date.now();
  if (tasks.length > 0 && progress >= 100) return 'terminé';

  const endDates = milestones
    .map((m) => m.endDate)
    .filter(Boolean)
    .map((d) => new Date(d as Date | string).getTime());
  const latestEnd = endDates.length ? Math.max(...endDates) : null;
  if (latestEnd != null && latestEnd < now && progress < 100) return 'en_retard';

  const overdueTask = tasks.some((t) => {
    if (!t.endDate) return false;
    return new Date(t.endDate).getTime() < now && (Number(t.progress) || 0) < 100;
  });
  if (overdueTask) return 'en_retard';

  return 'en_cours';
}

function mapTaskToDto(t: LeanTask, projectKey: string): Record<string, unknown> {
  const deadline = t.endDate
    ? new Date(t.endDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return {
    _id: idString(t._id),
    title: t.title ?? 'Tâche',
    status: taskStageLabel(t.status),
    priority: normalizePriority(t.priority),
    deadline,
    projectId: t.projectId || projectKey,
    createdAt: t.createdAt
      ? new Date(t.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: t.updatedAt
      ? new Date(t.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

@Injectable()
export class AppService {
  constructor(
    private readonly milestoneService: MilestoneService,
    private readonly taskService: TaskService,
  ) {}

  getHello(): string {
    return 'Hello World!s';
  }

  async getAllProjectsForSuperAdmin() {
    const milestones = (await this.milestoneService.findAllForDashboard()) as LeanMilestone[];

    const groups = new Map<string, LeanMilestone[]>();
    for (const m of milestones) {
      const key = (m.projectId && String(m.projectId).trim()) || idString(m._id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }

    const result: Record<string, unknown>[] = [];

    for (const [projectKey, ms] of groups) {
      const allTasks: LeanTask[] = [];
      for (const m of ms) {
        const raw = m.tasks || [];
        for (const t of raw) {
          if (t && typeof t === 'object') allTasks.push(t as LeanTask);
        }
      }

      const progress = avgProgress(allTasks);
      const status = deriveProjectStatus(ms, allTasks, progress);
      const priority = maxPriorityStr(allTasks);

      const endDates = ms.map((m) => m.endDate).filter(Boolean);
      const deadline =
        endDates.length > 0
          ? new Date(
              Math.max(
                ...endDates.map((d) => new Date(d as Date | string).getTime()),
              ),
            )
          : new Date();

      const pmLabel = ms[0]?.createdBy || ms[0]?.updatedBy || '—';
      const title =
        ms.length > 1
          ? `${ms[0]?.title ?? 'Jalons'} (+${ms.length - 1} jalon${ms.length > 2 ? 's' : ''})`
          : ms[0]?.title ?? `Projet ${projectKey}`;

      const description =
        ms.map((m) => m.description).filter(Boolean).join(' · ') || '';

      const createdAt = ms
        .map((m) => m.createdAt)
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(a as Date).getTime() - new Date(b as Date).getTime(),
        )[0];
      const updatedAt = ms
        .map((m) => m.updatedAt)
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b as Date).getTime() - new Date(a as Date).getTime(),
        )[0];

      result.push({
        _id: projectKey,
        name: title,
        description,
        status,
        progress,
        priority,
        deadline: deadline.toISOString().slice(0, 10),
        assignedTo: ms[0]?.createdBy ?? '',
        assignedToName: pmLabel,
        assignedToRole: 'project_manager',
        tasks: allTasks.map((t) => mapTaskToDto(t, projectKey)),
        createdAt: createdAt
          ? new Date(createdAt as Date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        updatedAt: updatedAt
          ? new Date(updatedAt as Date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        projectManagerName: pmLabel,
        budget: 0,
      });
    }

    return result;
  }

  async getUrgentTasksForDashboard() {
    const tasks = (await this.taskService.findUrgentForDashboard()) as LeanTask[];
    return tasks.map((t) =>
      mapTaskToDto(t, t.projectId || idString(t.milestoneId)),
    );
  }
}
