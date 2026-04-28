import type { Permission } from "../types";

export interface PermissionModuleGroup {
  key: string;
  label: string;
  items: Permission[];
}

const MATERIALS_SIDEBAR_LINKS: Array<{ href: string; name: string }> = [
  { href: "/materials", name: "Materials" },
  { href: "/stock-predictions", name: "Stock Predictions (AI)" },
  { href: "/anomalies-alerts", name: "Anomalies & Alerts" },
  { href: "/auto-orders", name: "Auto Orders" },
  { href: "/order-tracking-map", name: "Order Tracking Map" },
  { href: "/site-consumption", name: "Site Consumption" },
  { href: "/flow-log", name: "Flow Log" },
  { href: "/smart-score", name: "Smart Score" },
  { href: "/ml-training", name: "ML Training" },
];

/** Same href may appear under several permission modules from the API; hub routes only belong under Materials. */
function normalizeNavHref(href?: string): string {
  if (!href) return "";
  const t = href.trim();
  if (!t) return "";
  const withLeading = t.startsWith("/") ? t : `/${t}`;
  if (withLeading.length > 1 && withLeading.endsWith("/")) {
    return withLeading.slice(0, -1);
  }
  return withLeading;
}

const MATERIALS_HUB_HREFS = new Set(
  MATERIALS_SIDEBAR_LINKS.map((l) => normalizeNavHref(l.href)),
);

const normalizeModuleKey = (moduleValue?: string, hrefValue?: string) => {
  if (moduleValue && moduleValue.trim().length > 0) {
    return moduleValue.trim().toLowerCase().replace(/\s+/g, "_");
  }

  const cleanedHref = (hrefValue || "").trim().replace(/^\/+/, "");
  if (!cleanedHref) {
    return "general";
  }

  const firstSegment = cleanedHref.split("/")[0] || "general";
  return firstSegment.toLowerCase().replace(/-/g, "_");
};

const moduleLabel = (moduleValue?: string, hrefValue?: string) => {
  if (moduleValue && moduleValue.trim().length > 0) {
    return moduleValue.trim();
  }

  const cleanedHref = (hrefValue || "").trim().replace(/^\/+/, "");
  if (!cleanedHref) {
    return "General";
  }

  const firstSegment = cleanedHref.split("/")[0] || "general";
  return firstSegment
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const groupPermissionsByModule = (
  permissions: Permission[],
): PermissionModuleGroup[] => {
  const groupsMap = new Map<string, { label: string; items: Permission[] }>();
  const seenByHref = new Set<string>();

  for (const permission of permissions || []) {
    const key = normalizeModuleKey(permission.module, permission.href);
    const label = moduleLabel(permission.module, permission.href);
    const href = normalizeNavHref(permission.href);
    if (!href) continue;

    // Prevent duplicate links across all modules (same route shown multiple times)
    if (seenByHref.has(href)) {
      continue;
    }
    seenByHref.add(href);

    if (!groupsMap.has(key)) {
      groupsMap.set(key, { label, items: [] });
    }

    groupsMap.get(key)!.items.push(permission);
  }

  const result = Array.from(groupsMap.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      items: [...value.items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const materialsGroupIndex = result.findIndex((group) => group.key === "materials");
  const materialsTemplate = result[materialsGroupIndex]?.items?.[0] || result[0]?.items?.[0];
  const existingMaterialsByHref = new Map(
    (materialsGroupIndex >= 0 ? result[materialsGroupIndex].items : []).map((item) => [
      normalizeNavHref(item.href),
      { ...item, href: normalizeNavHref(item.href) },
    ]),
  );
  const normalizedMaterialItems = MATERIALS_SIDEBAR_LINKS.map(({ href, name }) => {
    const canonicalHref = normalizeNavHref(href);
    const existing = existingMaterialsByHref.get(canonicalHref);
    if (existing) return { ...existing, name, href: canonicalHref };
    return {
      _id: `materials-${canonicalHref}`,
      name,
      module: "Materials",
      href: canonicalHref,
      access: true,
      create: materialsTemplate?.create ?? false,
      delete: materialsTemplate?.delete ?? false,
      update: materialsTemplate?.update ?? false,
      description: name,
      createdAt: materialsTemplate?.createdAt || new Date(),
      updatedAt: materialsTemplate?.updatedAt || new Date(),
    };
  });

  if (materialsGroupIndex >= 0) {
    result[materialsGroupIndex] = {
      ...result[materialsGroupIndex],
      label: "Materials",
      items: normalizedMaterialItems,
    };
  } else {
    result.push({
      key: "materials",
      label: "Materials",
      items: normalizedMaterialItems,
    });
  }

  const sorted = result.sort((a, b) => {
    if (a.key === "materials") return -1;
    if (b.key === "materials") return 1;
    return a.label.localeCompare(b.label);
  });

  // Drop hub routes from any non-materials section (avoids the same page + wrong label, e.g. "Materials" x4)
  const pruned = sorted
    .map((group) => {
      if (group.key === "materials") return group;
      return {
        ...group,
        items: group.items.filter(
          (item) => !MATERIALS_HUB_HREFS.has(normalizeNavHref(item.href)),
        ),
      };
    })
    .filter((group) => group.key === "materials" || group.items.length > 0);

  return pruned;
};
