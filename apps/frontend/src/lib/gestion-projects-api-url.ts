/**
 * Base URL du microservice **gestion-projects** (Nest, sans préfixe global).
 * Défaut local : PORT 3010 → http://localhost:3010
 */
const rawGestionProjectsApiUrl =
  ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).
    env?.VITE_GESTION_PROJECTS_URL || "").trim() || "http://localhost:3010";

export const GESTION_PROJECTS_API_URL = rawGestionProjectsApiUrl.replace(
  /\/api\/?$/,
  "",
);
