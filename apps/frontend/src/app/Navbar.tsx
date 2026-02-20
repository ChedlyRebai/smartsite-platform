<<<<<<< HEAD
import { Menu, ChevronDown, LayoutDashboard, Users, Calendar, Package, DollarSign, Shield, FileText, BarChart3, Briefcase, UserCog, Warehouse, AlertTriangle, MapPin, Bell, Clock, Settings } from 'lucide-react';
import React, { useState } from 'react'
import { useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Button } from "./components/ui/button";

// Role-based features configuration
const roleFeatures: Record<string, { label: string; icon: React.ElementType; description: string }[]> = {
  super_admin: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Overview and analytics" },
    { label: "User Management", icon: Users, description: "Manage system users" },
    { label: "Roles", icon: Settings, description: "Configure user roles" },
    { label: "Permissions", icon: Clock, description: "Set access permissions" },
    { label: "Sites", icon: MapPin, description: "Manage construction sites" },
    { label: "Projects", icon: Briefcase, description: "Project oversight" },
    { label: "Reports", icon: FileText, description: "Generate reports" },
    { label: "Analytics", icon: BarChart3, description: "Data analytics" },
  ],
  director: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Business overview" },
    { label: "Sites", icon: MapPin, description: "Site management" },
    { label: "Projects", icon: Briefcase, description: "Project tracking" },
    { label: "Team", icon: Users, description: "Team management" },
    { label: "Clients", icon: UserCog, description: "Client relations" },
    { label: "Finance", icon: DollarSign, description: "Financial overview" },
    { label: "Reports", icon: FileText, description: "Business reports" },
    { label: "Analytics", icon: BarChart3, description: "Performance analytics" },
    { label: "Map View", icon: MapPin, description: "Site locations" },
  ],
  project_manager: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Project overview" },
    { label: "Sites", icon: MapPin, description: "Site operations" },
    { label: "Projects", icon: Briefcase, description: "Project details" },
    { label: "Planning", icon: Calendar, description: "Schedule planning" },
    { label: "Team", icon: Users, description: "Team coordination" },
    { label: "Incidents", icon: AlertTriangle, description: "Issue tracking" },
    { label: "Reports", icon: FileText, description: "Progress reports" },
    { label: "Analytics", icon: BarChart3, description: "Project analytics" },
    { label: "Map View", icon: MapPin, description: "Site locations" },
  ],
  site_manager: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Site overview" },
    { label: "Sites", icon: MapPin, description: "Site management" },
    { label: "Planning", icon: Calendar, description: "Daily planning" },
    { label: "Team", icon: Users, description: "Crew management" },
    { label: "Materials", icon: Package, description: "Material tracking" },
    { label: "QHSE & Safety", icon: Shield, description: "Safety compliance" },
    { label: "Incidents", icon: AlertTriangle, description: "Incident reports" },
  ],
  works_manager: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Works overview" },
    { label: "Sites", icon: MapPin, description: "Site operations" },
    { label: "Projects", icon: Briefcase, description: "Project works" },
    { label: "Planning", icon: Calendar, description: "Work scheduling" },
    { label: "Team", icon: Users, description: "Workforce management" },
    { label: "Materials", icon: Package, description: "Material needs" },
    { label: "QHSE & Safety", icon: Shield, description: "Safety oversight" },
    { label: "Incidents", icon: AlertTriangle, description: "Work incidents" },
    { label: "Reports", icon: FileText, description: "Work reports" },
    { label: "Analytics", icon: BarChart3, description: "Performance data" },
    { label: "Map View", icon: MapPin, description: "Site locations" },
  ],
  accountant: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Financial overview" },
    { label: "Projects", icon: Briefcase, description: "Project budgets" },
    { label: "Clients", icon: UserCog, description: "Client billing" },
    { label: "Suppliers", icon: Warehouse, description: "Supplier payments" },
    { label: "Finance", icon: DollarSign, description: "Financial management" },
    { label: "Reports", icon: FileText, description: "Financial reports" },
    { label: "Analytics", icon: BarChart3, description: "Financial analytics" },
  ],
  procurement_manager: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Procurement overview" },
    { label: "Suppliers", icon: Warehouse, description: "Supplier management" },
    { label: "Materials", icon: Package, description: "Material procurement" },
  ],
  qhse_manager: [
    { label: "Dashboard", icon: LayoutDashboard, description: "QHSE overview" },
    { label: "Sites", icon: MapPin, description: "Site inspections" },
    { label: "QHSE & Safety", icon: Shield, description: "Safety management" },
    { label: "Incidents", icon: AlertTriangle, description: "Incident tracking" },
    { label: "Reports", icon: FileText, description: "Compliance reports" },
  ],
  client: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Project overview" },
    { label: "Projects", icon: Briefcase, description: "Your projects" },
    { label: "Reports", icon: FileText, description: "Progress reports" },
  ],
  subcontractor: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Work overview" },
  ],
  user: [
    { label: "Dashboard", icon: LayoutDashboard, description: "Your dashboard" },
  ],
};

// Application services/features for the dropdown
const appServices = [
  { label: "Dashboard", icon: LayoutDashboard, description: "Overview and analytics", href: "/dashboard" },
  { label: "Sites", icon: MapPin, description: "Manage construction sites", href: "/sites" },
  { label: "Projects", icon: Briefcase, description: "Project management", href: "/projects" },
  { label: "Planning", icon: Calendar, description: "Schedule planning", href: "/planning" },
  { label: "Team", icon: Users, description: "Team management", href: "/team" },
  { label: "Clients", icon: UserCog, description: "Client relations", href: "/clients" },
  { label: "Suppliers", icon: Warehouse, description: "Supplier management", href: "/suppliers" },
  { label: "Materials", icon: Package, description: "Material tracking", href: "/materials" },
  { label: "Finance", icon: DollarSign, description: "Financial management", href: "/finance" },
  { label: "QHSE & Safety", icon: Shield, description: "Safety compliance", href: "/qhse" },
  { label: "Incidents", icon: AlertTriangle, description: "Incident tracking", href: "/incidents" },
  { label: "Reports", icon: FileText, description: "Generate reports", href: "/reports" },
  { label: "Analytics", icon: BarChart3, description: "Data analytics", href: "/analytics" },
  { label: "Map View", icon: MapPin, description: "Site locations", href: "/map" },
];

const navigation = [
  { name: "Product", href: "#" },
  { name: "Resources", href: "#" },
  { name: "Company", href: "#" },
];

interface NavbarProps {
  userRole?: string;
}

const Navbar = ({ userRole = "user" }: NavbarProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const features = roleFeatures[userRole] || roleFeatures.user;
    const navigate = useNavigate();

    const handleServiceClick = (href: string) => {
      navigate(href);
    };
=======
import { Menu } from 'lucide-react';
import React, { useState } from 'react'
const navigation = [
  { name: "Produit", href: "#" },
  { name: "Fonctionnalités", href: "#" },
  { name: "Ressources", href: "#" },
  { name: "Entreprise", href: "#" },
];


const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
>>>>>>> origin/main

  return (
     <header className="absolute inset-x-0 top-0 z-50">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">SmartSite</span>
              <img
                className="h-8 w-auto"
                src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                alt=""
              />
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
<<<<<<< HEAD
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12 items-center">
=======
              <span className="sr-only">Ouvrir le menu principal</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
>>>>>>> origin/main
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                {item.name}
              </a>
            ))}
<<<<<<< HEAD

            {/* Features Dropdown - Application Services */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 text-sm font-semibold leading-6 text-gray-900 hover:bg-transparent">
                  Features
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-80 max-h-96 overflow-y-auto">
                <DropdownMenuLabel className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Our Services ({appServices.length})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {appServices.map((service, index) => {
                  const Icon = service.icon;
                  return (
                    <DropdownMenuItem
                      key={index}
                      className="flex items-start gap-3 py-3 cursor-pointer"
                      onClick={() => handleServiceClick(service.href)}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{service.label}</span>
                        <span className="text-xs text-gray-500">{service.description}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a
              href="/login"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Login <span aria-hidden="true">&rarr;</span>
=======
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a
              href="#"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Connexion <span aria-hidden="true">&rarr;</span>
>>>>>>> origin/main
            </a>
          </div>
        </nav>
      </header>

  )
}

export default Navbar