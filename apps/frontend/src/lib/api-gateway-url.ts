/**
 * Base URL de l'API Gateway.
 * Peut etre surchargee via VITE_API_GATEWAY_URL.
 */
export const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL?.trim() || 'http://localhost:9001';