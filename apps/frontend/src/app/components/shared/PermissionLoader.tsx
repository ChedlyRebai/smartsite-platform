import { getAllPermissions } from "@/app/action/permission.action";
import { usePermissionStore } from "@/app/hooks/permission.store";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

type PermissionLoaderProps = {
  children: ReactNode;
};

export const PermissionLoader = ({ children }: PermissionLoaderProps) => {
  const setPermissions = usePermissionStore((s) => s.setPermissions);

  const { isLoading, data } = useQuery({
    queryKey: ["permissions"],
    // Backend returns the permissions array directly
    queryFn: getAllPermissions,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (Array.isArray(data)) {
      setPermissions(data);
    }
  }, [data, setPermissions]);

  if (isLoading) return <div>Loading permissions...</div>;

  return children;
};