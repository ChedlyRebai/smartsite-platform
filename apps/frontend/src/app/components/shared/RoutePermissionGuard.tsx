import { getMynavigationAccess } from "@/app/action/permission.action";
import { useAuthStore } from "@/app/store/authStore";
import type { Permission } from "@/app/types";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

type RoutePermissionGuardProps = {
  children: ReactNode;
};

const ALWAYS_ALLOWED_AUTHENTICATED_PATHS = new Set([
  "/reset-password-first-login",
  "/change-password-first-login",
  "/materials",
  "/stock-predictions",
  "/anomalies-alerts",
  "/auto-orders",
  "/order-tracking-map",
  "/site-consumption",
  "/flow-log",
  "/ml-training",
]);

const normalizePath = (path: string) => {
  if (!path) return "/";
  const trimmed = path.trim();
  if (!trimmed) return "/";

  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
};

const normalizePermissionHref = (href?: string) => {
  if (!href) return "";
  const trimmed = href.trim();
  if (!trimmed) return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalizePath(withLeadingSlash);
};

const hasPermissionForPath = (pathname: string, permissions: Permission[]) => {
  const currentPath = normalizePath(pathname);

  if (ALWAYS_ALLOWED_AUTHENTICATED_PATHS.has(currentPath)) {
    return true;
  }

  return permissions.some((permission) => {
    if (!permission?.access) {
      return false;
    }

    const allowedHref = normalizePermissionHref(permission.href);
    if (!allowedHref) {
      return false;
    }

    if (currentPath === allowedHref) {
      return true;
    }

    return currentPath.startsWith(`${allowedHref}/`);
  });
};

export default function RoutePermissionGuard({
  children,
}: RoutePermissionGuardProps) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const token = user?.access_token;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["route-permissions", user?.id],
    queryFn: getMynavigationAccess,
    enabled: Boolean(token),
    staleTime: 60 * 1000,
    retry: 1,
  });

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Checking access...
      </div>
    );
  }

  if (isError) {
    return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
  }

  const permissions = Array.isArray(data) ? data : [];
  const allowed = hasPermissionForPath(location.pathname, permissions);

  if (!allowed) {
    return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
