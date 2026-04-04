import type { Task } from "../action/dashboard.action";

/**
 * Recherche sur type, description, signaleur, et nom d'incident
 * (title, incidentName, name, nom selon l'API).
 */
export function incidentMatchesSearch(incident: unknown, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  if (!incident || typeof incident !== "object") return false;

  const o = incident as Record<string, unknown>;
  const type = String(o.type ?? "").toLowerCase();
  const description = String(o.description ?? "").toLowerCase();
  const reportedBy = String(o.reportedBy ?? "").toLowerCase();

  const nameFields = [o.title, o.incidentName, o.name, o.nom].map((v) =>
    v != null ? String(v).toLowerCase() : "",
  );
  const matchesIncidentName = nameFields.some((n) => n.includes(t));

  return (
    type.includes(t) ||
    description.includes(t) ||
    reportedBy.includes(t) ||
    matchesIncidentName
  );
}

export function taskMatchesSearch(task: Task, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return String(task.title ?? "").toLowerCase().includes(t);
}
