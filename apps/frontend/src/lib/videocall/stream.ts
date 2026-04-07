export function extractStreamUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    console.log("Decoded Stream token payload:", payload);
    const userId = payload?.user_id ?? payload?.userId ?? payload?.sub;
    console.log("Extracted user ID from token payload new one:", userId);
    return userId ? String(userId) : null;
  } catch {
    return null;
  }
}
