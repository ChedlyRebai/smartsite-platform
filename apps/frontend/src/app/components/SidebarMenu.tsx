import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem, NavItemChild } from "@/app/utils/roleConfig";
import type { RoleType } from "@/app/types";
import { Badge } from "@/components/ui/badge";

function isRouteActive(pathname: string, href: string): boolean {
  if (!href) return false;
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function filterChildrenForRole(
  children: NavItemChild[] | undefined,
  roleName: RoleType,
): NavItemChild[] {
  if (!children?.length) return [];
  return children.filter((c) => c.roles.includes(roleName));
}

interface SidebarMenuItemProps {
  item: NavItem;
  isCollapsed?: boolean;
  roleName: RoleType;
}

export function SidebarMenuItem({
  item,
  isCollapsed = false,
  roleName,
}: SidebarMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const visibleChildren = filterChildrenForRole(item.children, roleName);
  const hasChildren = visibleChildren.length > 0;

  const hasActiveChild = visibleChildren.some((child) =>
    isRouteActive(pathname, child.href),
  );
  const isParentActive =
    !!item.href && isRouteActive(pathname, item.href);

  useEffect(() => {
    if (hasActiveChild) {
      setIsExpanded(true);
    }
  }, [hasActiveChild]);

  const isItemExpanded = isExpanded || hasActiveChild;
  const itemId = `sidebar-group-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const submenuId = `${itemId}-submenu`;

  const toggleExpanded = () => {
    if (hasChildren) setIsExpanded(!isExpanded);
  };

  if (!hasChildren && item.href) {
    const active = isRouteActive(pathname, item.href);
    return (
      <Link
        to={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          active &&
            "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-border/60",
        )}
      >
        {item.icon && (
          <item.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 opacity-80 group-hover:opacity-100",
              active && "text-sidebar-primary opacity-100",
            )}
          />
        )}
        {!isCollapsed && <span className="truncate">{item.label}</span>}
        {!isCollapsed && active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
        )}
      </Link>
    );
  }

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          id={itemId}
          aria-expanded={isItemExpanded}
          aria-controls={submenuId}
          onClick={toggleExpanded}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
            "text-sidebar-foreground/90 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
            (hasActiveChild || isParentActive) && "text-sidebar-foreground",
          )}
        >
          {item.icon && (
            <item.icon className="h-[18px] w-[18px] shrink-0 opacity-85" />
          )}
          {!isCollapsed && (
            <>
              <span className="truncate flex-1">{item.label}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isItemExpanded && "rotate-180",
                )}
              />
            </>
          )}
        </button>

        {!isCollapsed && isItemExpanded && (
          <div
            id={submenuId}
            role="group"
            aria-labelledby={itemId}
            className="ml-2 space-y-0.5 border-l border-sidebar-border/80 pl-3 py-1"
          >
            {visibleChildren.map((child, index) => {
              const childActive = isRouteActive(pathname, child.href);
              return (
                <Link
                  key={`${child.href}-${index}`}
                  to={child.href}
                  aria-current={childActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md py-2 pr-2 pl-1 text-sm transition-colors",
                    "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                    childActive &&
                      "bg-sidebar-accent text-sidebar-accent-foreground font-medium text-sidebar-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 shrink-0 rounded-full bg-sidebar-border",
                      childActive && "bg-primary scale-125",
                    )}
                  />
                  <span className="truncate flex-1">{child.label}</span>
                  {childActive && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] uppercase tracking-wide px-1.5 py-0 font-semibold"
                    >
                      Active
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}

interface SidebarMenuProps {
  items: NavItem[];
  isCollapsed?: boolean;
  roleName: RoleType;
}

export function SidebarMenu({
  items,
  isCollapsed = false,
  roleName,
}: SidebarMenuProps) {
  return (
    <div className="space-y-6">
      <div>
        {!isCollapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            Menu
          </p>
        )}
        <nav aria-label="Primary navigation" className="space-y-1">
          {items.map((item, index) => (
            <SidebarMenuItem
              key={`${item.label}-${index}`}
              item={item}
              isCollapsed={isCollapsed}
              roleName={roleName}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
