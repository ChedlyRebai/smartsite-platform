import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Permission } from "@/app/types";
import { getAllPermissions } from "@/app/action/permission.action";
import { getRoleById, updateRole } from "@/app/action/role.action";
import useRolePermissionsModal from "@/app/hooks/use-role-permissions-modal";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";


const RolePermissionsForm = () => {
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { roleId, onClose, onPermissionsChange, setRefreshData, isOpen } = useRolePermissionsModal();

  useEffect(() => {
    loadData();
  }, [roleId, isOpen]);

  useEffect(() => {
    // Set the refresh callback so it can be called from outside
    setRefreshData(() => loadData);
  }, []);

  const loadData = async () => {
    if (!roleId) return;

    setIsLoading(true);
    try {
      // Load all available permissions
      const permissionsRes = await getAllPermissions();
      if (permissionsRes.status === 200 && Array.isArray(permissionsRes.data)) {
        setAvailablePermissions(permissionsRes.data);
      }

      // Load current role data with permissions
      const roleRes = await getRoleById(roleId);
      if (roleRes.status === 200) {
        const permissionIds = Array.isArray(roleRes.data.permissions)
          ? roleRes.data.permissions.map((p: any) =>
              typeof p === "string" ? p : p._id
            )
          : [];
        setSelectedPermissions(permissionIds);
      }
    } catch (error: any) {
      toast.error("Failed to load permissions data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Group permissions by category (based on permission name)
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    
    availablePermissions.forEach((permission) => {
      // Use the permission name as category (e.g., "User Management")
      const category = permission.name || "Other";
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    
    return groups;
  }, [availablePermissions]);

  const handleSelectAllInCategory = (categoryPermissions: Permission[]) => {
    const categoryIds = categoryPermissions.map((p) => p._id);
    const allSelected = categoryIds.every((id) => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Deselect all in this category
      setSelectedPermissions((prev) => prev.filter((id) => !categoryIds.includes(id)));
    } else {
      // Select all in this category
      setSelectedPermissions((prev) => [...new Set([...prev, ...categoryIds])]);
    }
  };

  const getSelectedCountInCategory = (categoryPermissions: Permission[]) => {
    return categoryPermissions.filter((p) => selectedPermissions.includes(p._id)).length;
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === availablePermissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(availablePermissions.map((p) => p._id));
    }
  };

  const handleSave = async () => {
    if (!roleId) return;

    setIsSaving(true);
    try {
      const res = await updateRole(roleId, undefined, undefined, selectedPermissions);
      if (res.status === 200 || res.status === 204) {
        toast.success("Permissions updated successfully");
        onClose();
        onPermissionsChange();
      } else {
        toast.error(res.data || "Failed to update permissions");
      }
    } catch (error: any) {
      toast.error("Failed to save permissions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-sm text-gray-500">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field>
        <div className="flex justify-between items-center mb-2">
          <FieldLabel>Available Permissions</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedPermissions.length === availablePermissions.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>
        <FieldDescription>
          Selected: {selectedPermissions.length} of {availablePermissions.length}
        </FieldDescription>

        <div className="mt-4 max-h-96 overflow-y-auto border rounded-md">
          {availablePermissions.length === 0 ? (
            <div className="text-sm text-gray-500 p-4">No permissions available</div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedPermissions).map(([category, permissions]) => {
                const selectedCount = getSelectedCountInCategory(permissions);
                const allSelected = selectedCount === permissions.length;
                
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-semibold text-base">{category}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {selectedCount}/{permissions.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-end mb-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectAllInCategory(permissions)}
                            className="text-xs h-7"
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                        {permissions.map((permission) => (
                          <div
                            key={permission._id}
                            className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Checkbox
                              id={`permission-${permission._id}`}
                              checked={selectedPermissions.includes(permission._id)}
                              onCheckedChange={() => handleTogglePermission(permission._id)}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`permission-${permission._id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {permission.name}
                              </label>
                              {permission.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {permission.description}
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {permission.access && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    Access
                                  </span>
                                )}
                                {permission.create && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                    Create
                                  </span>
                                )}
                                {permission.update && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                    Update
                                  </span>
                                )}
                                {permission.delete && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                    Delete
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </Field>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default RolePermissionsForm;
