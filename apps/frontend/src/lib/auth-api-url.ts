/**
 * Base URL de l'API user-authentication (Nest).
 * Surcharge via VITE_AUTH_API_URL pour s'aligner sur le port reel en dev.
 */
export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL?.trim() || "http://localhost:3000";
