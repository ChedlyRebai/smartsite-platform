import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  createPermission,
  getPermissionById,
  updatePermission,
} from "@/app/action/permission.action";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import useAddPermissionModal from "@/app/hooks/use-permission-Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const PERMISSION_CATEGORIES = [
  // Core
  { name: "Dashboard", href: "/dashboard" },
  { name: "Home", href: "/home" },
  { name: "Profile", href: "/profile" },

  // Communication
  { name: "Chat", href: "/chat" },
  { name: "Group Chat", href: "/group-chat" },
  { name: "Calls", href: "/call" },
  { name: "Notifications", href: "/notifications" },
  { name: "Call Notifications", href: "/notifcall" },

  // Projects & Planning
  { name: "Projects", href: "/projects" },
  { name: "Project Milestones", href: "/project-milestone" },
  { name: "Milestone Tasks", href: "/milestone-tasks" },
  { name: "Planning", href: "/planning" },
  { name: "My Milestones", href: "/my-mil" },
  { name: "My Tasks", href: "/my-task" },

  // Teams
  { name: "Team", href: "/team" },
  { name: "My Team Members", href: "/my-team-members" },

  // Sites
  { name: "Sites", href: "/sites" },
  { name: "My Sites", href: "/my-sites" },
  { name: "My Affected Sites", href: "/my-affected-sites" },

  // Clients & Suppliers
  { name: "Clients", href: "/clients" },
  { name: "Suppliers", href: "/suppliers" },
  { name: "Supplier Evaluation", href: "/suppliers-evaluation" },
  { name: "Supplier Comparison", href: "/suppliers-comparison" },

  // Catalog & Materials
  { name: "Catalog", href: "/catalog" },
  { name: "Materials", href: "/materials" },
  { name: "Supplier Materials", href: "/supplier-materials" },
  { name: "Material Suppliers", href: "/material-suppliers" },

  // Finance
  { name: "Finance", href: "/finance" },
  { name: "Payments", href: "/payments" },

  // QHSE & Safety
  { name: "QHSE", href: "/qhse" },
  { name: "Incidents", href: "/incidents" },

  // Insights
  { name: "Reports", href: "/reports" },
  { name: "Analytics", href: "/analytics" },

  // Map
  { name: "Map View", href: "/map" },

  // Admin
  { name: "User Management", href: "/users" },
  { name: "Pending Approvals", href: "/admin/pending-users" },
  { name: "System Logs", href: "/admin/system-logs" },
  { name: "Super Admin Projects", href: "/super-admin-projects" },

  // Optimization
  { name: "Resource Optimization", href: "/resource-optimization" },

  // Misc
  { name: "User Guide", href: "/user-guide" },
  { name: "Checkout Simulator", href: "/checkout-simulator" },
];

const PermissionForms = ({ type }: { type: "add" | "edit" }) => {
  const [isCustomCategory, setIsCustomCategory] = React.useState(false);

  const toModuleLabel = (rawValue?: string) => {
    const normalized = String(rawValue || "")
      .trim()
      .replace(/^\/+/, "")
      .replace(/[\-_]+/g, " ")
      .replace(/\s+/g, " ");

    if (!normalized) {
      return "General";
    }

    return normalized
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const deriveModuleFromHref = (href?: string) => {
    const cleanedHref = (href || "").trim().replace(/^\/+/, "");
    if (!cleanedHref) return "General";
    return toModuleLabel(cleanedHref.split("/")[0]);
  };

  const moduleSuggestions = React.useMemo(() => {
    const baseSuggestions = [
      "General",
      "Admin",
      "Core",
      "Communication",
      "Planning",
      "Team",
      "Sites",
      "Clients",
      "Procurement",
      "Materials",
      "Finance",
      "Qhse",
      "Insights",
      "Optimization",
      "Misc",
    ];

    const derivedFromCategories = PERMISSION_CATEGORIES.map((category) =>
      deriveModuleFromHref(category.href),
    );

    return Array.from(new Set([...baseSuggestions, ...derivedFromCategories])).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, []);

  let formSchema;
  if (type === "edit") {
    formSchema = z.object({
      name: z
        .string()
        .min(3, "Name must be at least 3 characters.")
        .max(50, "Name must be at most 50 characters.")
        .optional(),
      module: z.string().optional(),
      href: z.string(),
      description: z
        .string()
        .max(200, "Description must be at most 200 characters.")
        .optional(),
      access: z.boolean().optional(),
      create: z.boolean().optional(),
      update: z.boolean().optional(),
      delete: z.boolean().optional(),
    });
  } else {
    formSchema = z.object({
      name: z
        .string()
        .min(3, "Name must be at least 3 characters.")
        .max(50, "Name must be at most 50 characters."),
      category: z.string().optional(),
      module: z.string().optional(),
      description: z
        .string()
        .max(200, "Description must be at most 200 characters.")
        .optional(),
      href: z.string(),
      access: z.boolean().optional(),
      create: z.boolean().optional(),
      update: z.boolean().optional(),
      delete: z.boolean().optional(),
    });
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      module: "General",
      description: "",
      href: "",
      access: false,
      create: false,
      update: false,
      delete: false,
    },
  });

  const { id, onClose, onPermissionChange } = useAddPermissionModal();

  useEffect(() => {
    loadPermissionData();
    if (type === "edit" && id) {
      loadPermissionData();
    }
  }, [type, id]);

  const loadPermissionData = async () => {
    try {
      const res = await getPermissionById(id as string);
      if (res?.status === 200) {
        console.log("Permission data loaded:", res.data);
        const matchedCategory = PERMISSION_CATEGORIES.find(
          (cat) => cat.name === res.data.name,
        );

        form.reset({
          name: res.data.name || "",
          category: matchedCategory ? res.data.name : "Custom",
          module: res.data.module || deriveModuleFromHref(res.data.href),
          description: res.data.description || "",
          href: res.data.href || "",
          access: res.data.access || false,
          create: res.data.create || false,
          update: res.data.update || false,
          delete: res.data.delete || false,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load permission data. Please try again.");
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    const selectedCategory = PERMISSION_CATEGORIES.find(
      (cat) => cat.name === categoryName,
    );

    if (selectedCategory) {
      setIsCustomCategory(false);
      form.setValue("name", selectedCategory.name);
      form.setValue("href", selectedCategory.href);
      form.setValue("module", deriveModuleFromHref(selectedCategory.href));
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "add") {
        if (!data.name || data.name.trim().length === 0) {
          toast.error("Permission name is required.");
          return;
        }

        const payload = {
          name: data.name,
          module: data.module || deriveModuleFromHref(data.href),
          description: data.description,
          access: data.access,
          href: data.href,
          create: data.create,
          update: data.update,
          delete: data.delete,
        };

        const response = await createPermission(payload);
        console.log("data", data);
        if (response?.status === 201) {
          toast.success("Permission created successfully");
          form.reset();
          onClose();
          onPermissionChange();
          loadPermissionData();
        } else {
          toast.error(response?.data || "Failed to create permission");
        }
      } else {
        const response = await updatePermission(id as string, data);
        if (response?.status === 200 || response?.status === 204) {
          toast.success("Permission updated successfully");
          form.reset();
          onClose();
          onPermissionChange();
          loadPermissionData();
        } else {
          toast.error(response?.data || "Failed to update permission");
        }
      }
    } catch (error) {
      toast.error("Failed to save permission. Please try again.");
    }
  };

  return (
    <>
      <form
        className=""
        id="form-permission-demo"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          {type === "add" && (
            <Controller
              name="category"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-permission-category">
                    Permission Category *
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCategoryChange(value);
                    }}
                  >
                    <SelectTrigger id="form-permission-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSION_CATEGORIES.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-permission-name">
                  Permission Name *
                </FieldLabel>
                <Input
                  {...field}
                  id="form-permission-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g., User Management"
                  autoComplete="off"
                  disabled={type === "add" && !isCustomCategory}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="href"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-permission-href">Href *</FieldLabel>
                <Input
                  {...field}
                  id="form-permission-href"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g., /users"
                  autoComplete="off"
                  disabled={type === "add" && !isCustomCategory}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="module"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-permission-module">Module *</FieldLabel>
                <Input
                  {...field}
                  id="form-permission-module"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g., admin, projects, finance"
                  list={type === "add" ? "module-suggestions" : undefined}
                  autoComplete="off"
                />
                {type === "add" && (
                  <datalist className="bg-white" id="module-suggestions">
                    {moduleSuggestions.map((moduleName) => (
                      <option className="bg-white" key={moduleName} value={moduleName} />
                    ))}
                  </datalist>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-permission-description">
                  Description
                </FieldLabel>
                <Textarea
                  {...field}
                  id="form-permission-description"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter a description for this permission"
                  rows={3}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="access"
              control={form.control}
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="items-center justify-between"
                >
                  <FieldLabel htmlFor="form-permission-access">
                    Access
                  </FieldLabel>
                  <Switch
                    id="form-permission-access"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="create"
              control={form.control}
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="items-center justify-between"
                >
                  <FieldLabel htmlFor="form-permission-create">
                    Create
                  </FieldLabel>
                  <Switch
                    id="form-permission-create"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="update"
              control={form.control}
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="items-center justify-between"
                >
                  <FieldLabel htmlFor="form-permission-update">
                    Update
                  </FieldLabel>
                  <Switch
                    id="form-permission-update"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="delete"
              control={form.control}
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="items-center justify-between"
                >
                  <FieldLabel htmlFor="form-permission-delete">
                    Delete
                  </FieldLabel>
                  <Switch
                    id="form-permission-delete"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </form>

      <Field className="justify-end" orientation="horizontal">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" form="form-permission-demo">
          Submit
        </Button>
      </Field>
    </>
  );
};

export default PermissionForms;
