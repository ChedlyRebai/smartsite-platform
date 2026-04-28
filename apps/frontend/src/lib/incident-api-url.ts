/**
 * Base URL du microservice **incident-management**.
 * - Via API Gateway : http://localhost:9001/incidents
 * - Direct          : http://localhost:3003
 */
export const INCIDENT_API_URL =
  (import.meta.env.VITE_INCIDENT_URL as string | undefined)?.trim() ??
  'http://localhost:9001/incidents';
