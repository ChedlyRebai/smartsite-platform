# SmartSite Platform - Complete User Scenario Guide

## Overview
This document describes a complete logical scenario connecting all pages in the SmartSite construction management platform. The platform supports multiple user roles with role-specific navigation and permissions.

---

## Table of Contents
1. [Public Flow](#public-flow)
2. [Authentication Flow](#authentication-flow)
3. [Super Admin Complete Scenario](#super-admin-complete-scenario)
4. [Director Scenario](#director-scenario)
5. [Project Manager Scenario](#project-manager-scenario)
6. [Site Manager Scenario](#site-manager-scenario)
7. [Accountant Scenario](#accountant-scenario)
8. [QHSE Manager Scenario](#qhse-manager-scenario)
9. [Procurement Manager Scenario](#procurement-manager-scenario)
10. [Cross-Page Interactions](#cross-page-interactions)

---

## Public Flow

### Page: Home2 (Landing Page)
**Route:** `/`

The user starts at the public landing page which showcases the SmartSite platform features.

**User Actions:**
- View platform features and benefits
- Navigate to Pricing page to view subscription plans

### Page: Pricing
**Route:** `/pricing`

Displays subscription plans and pricing tiers.

**User Actions:**
- View different pricing plans
- Click "Get Started" to navigate to Registration

---

## Authentication Flow

### Page: Register
**Route:** `/register`

New user registration page.

**User Actions:**
1. Fill in registration form (email, password, personal information)
2. Submit registration
3. **System:** Creates pending user account
4. Redirects to Login page

### Page: Login
**Route:** `/login`

Authentication page for existing users.

**User Actions:**
1. Enter credentials (email/password)
2. Click login button
3. **System:** Validates credentials
4. Redirects to Dashboard (role-based)

---

## Super Admin Complete Scenario

### Entry Point: Dashboard
**Route:** `/dashboard`

The Super Admin dashboard displays:
- Overview statistics (total users, projects, sites, etc.)
- Quick access to key metrics
- Recent activities

**Navigation Flow:**

```
Dashboard
    ├──→ Sites (Manage all construction sites)
    │       └──→ View site details, add/edit sites
    │
    ├──→ Projects (Manage all projects)
    │       └──→ View project details, progress tracking
    │
    ├──→ Planning (Strategic planning)
    │
    ├──→ Team (View all team members)
    │
    ├──→ Clients (Manage client accounts)
    │
    ├──→ Suppliers (Manage supplier relationships)
    │
    ├──→ Materials (Inventory management)
    │
    ├──→ Finance (Financial overview)
    │
    ├──→ QHSE & Safety (Safety management)
    │
    ├──→ Incidents (Incident tracking & reporting)
    │
    ├──→ Reports (Generate reports)
    │
    ├──→ Analytics (Business intelligence)
    │
    ├──→ Map View (Geographic visualization)
    │
    ├──→ Notifications (View all notifications)
    │
    ├──→ Permissions (Manage system permissions)
    │       Route: /permissions
    │       Purpose: Define granular permissions for roles
    │
    ├──→ Roles (Manage user roles)
    │       Route: /roles
    │       Purpose: Create and configure roles
    │
    ├──→ User Management (Manage all users)
    │       Route: /users
    │       Purpose: CRUD operations on users
    │
    ├──→ Pending Approvals (Review pending users)
    │       Route: /admin/pending-users
    │       Purpose: Approve/reject new user registrations
    │
    └──→ Profile (View/edit personal profile)
            Route: /profile
```

### Detailed Scenarios

#### Scenario 1: New User Registration Approval
```
1 user visits /register
2.. New Fills registration form → Submit
3. User redirected to /login
4. Admin receives notification
5. Admin navigates to /admin/pending-users
6. Reviews pending user details
7. Approves or rejects user
8. If approved → User can now login
```

#### Scenario 2: Role & Permission Management
```
1. Admin navigates to /roles
2. Views existing roles (Director, Project Manager, etc.)
3. Creates new role or edits existing
4. Assigns permissions to role
5. Navigates to /permissions
6. Configures detailed permission matrix
7. Changes take effect immediately
```

#### Scenario 3: Creating a New Project
```
1. Admin navigates to /projects
2. Clicks "Add New Project"
3. Fills project details (name, client, budget, dates)
4. Assigns project manager
5. Creates associated sites
6. Project appears in planning
```

---

## Director Scenario

### Entry Point: Dashboard
**Route:** `/dashboard`

Director dashboard shows business metrics and overview.

**Navigation Flow:**

```
Dashboard
    ├──→ Sites (View all sites)
    │
    ├──→ Projects (Oversee all projects)
    │
    ├──→ Team (View organizational structure)
    │
    ├──→ Clients (View client relationships)
    │
    ├──→ Finance (Financial overview and reports)
    │
    ├──→ Reports (Business reports)
    │
    ├──→ Analytics (Business analytics)
    │
    ├──→ Map View (Project locations)
    │
    ├──→ Notifications
    │
    └──→ Profile
```

---

## Project Manager Scenario

### Entry Point: Dashboard
**Route:** `/dashboard`

PM dashboard shows assigned projects and tasks.

**Navigation Flow:**

```
Dashboard
    ├──→ Projects (Manage assigned projects)
    │       └──→ View project details
    │       └──→ Update project status
    │       └──→ Add milestones
    │
    ├──→ Planning (Schedule management)
    │       └──→ Create/update task schedules
    │       └──→ Assign resources
    │
    ├──→ Sites (View assigned sites)
    │
    ├──→ Team (View project team members)
    │
    ├──→ Incidents (Report and track incidents)
    │
    ├──→ Reports (Generate project reports)
    │
    ├──→ Analytics (Project analytics)
    │
    ├──→ Map View (View project locations)
    │
    ├──→ Notifications
    │
    └──→ Profile
```

### Detailed Scenario: Project Management
```
1. PM logs in → Dashboard
2. Navigates to /projects
3. Views list of assigned projects
4. Selects a project to view details
5. Updates project progress
6. Navigates to /planning to schedule tasks
7. Assigns team members to tasks
8. Checks /incidents for any reported issues
9. Generates report via /reports
10. Reviews analytics in /analytics
```

---

## Site Manager Scenario

### Entry Point: Dashboard
**Route:** `/dashboard`

Site Manager dashboard focuses on daily operations.

**Navigation Flow:**

```
Dashboard
    ├──→ Sites (Manage assigned sites)
    │       └──→ View site details
    │       └──→ Update site status
    │
    ├──→ Planning (Daily site planning)
    │
    ├──→ Team (Site team management)
    │
    ├──→ Materials (Site materials inventory)
    │
    ├──→ QHSE & Safety (Safety compliance)
    │
    ├──→ Incidents (Report safety incidents)
    │
    ├──→ Reports (Site reports)
    │
    ├──→ Notifications
    │
    └──→ Profile
```

### Detailed Scenario: Site Operations
```
1. SM logs in → Dashboard
2. Views daily site overview
3. Navigates to /sites
4. Selects today's site
5. Checks /planning for daily tasks
6. Reviews /team for available workers
7. Checks /materials inventory
8. Reviews /qhse compliance status
9. Reports any incidents via /incidents
10. Generates daily report via /reports
```

---

## Accountant Scenario

### Entry Point: Dashboard
**Route:** `/dashboard`

Accountant dashboard shows financial metrics.

**Navigation Flow:**

```
Dashboard
    ├──→ Projects (View project budgets)
    │
    ├──→ Clients (View client billing info)
    │
    ├──→ Suppliers (Manage supplier payments)
    │
    ├──→ Finance (Financial management)
    │       └──→ View expenses
    │       └──→ Track payments
    │       └──→ Generate invoices
    │
    ├──→ Reports (Financial reports)
    │
    ├──→ Analytics (Financial analytics)
    │
    ├──→ Notifications
    │
    └──→ Profile
```

---

## QHSE Manager Scenario

### Entry Point: Dashboard
**Route:** `/dashboard`

QHSE dashboard shows safety metrics and compliance.

**Navigation Flow:**

```
Dashboard
    ├──→ Sites (Safety compliance at sites)
    │
    ├──→ Planning (Safety planning)
    │
    ├──→ Team (Safety training tracking)
    │
    ├──→ QHSE & Safety (QHSE management)
    │       └──→ Safety policies
    │       └──→ Compliance tracking
    │       └──→ Certifications
    │
    ├──→ Incidents (Incident management)
    │       └──→ Report incidents
    │       └──→ Investigate causes
    │       └──→ Track corrective actions
    │
    ├──→ Reports (Safety reports)
    │
    ├──→ Notifications
    │
    └──→ Profile
```

### Detailed Scenario: Incident Management
```
1. QHSE Manager receives incident notification
2. Navigates to /incidents
3. Views incident details
4. Conducts investigation
5. Documents findings
6. Creates corrective actions
7. Tracks resolution
8. Generates incident report via /reports
9. Updates QHSE dashboard
```

---

## Procurement Manager Scenario

### Entry Point: Dashboard
**Route:** `/dashboard`

Procurement dashboard shows procurement metrics.

**Navigation Flow:**

```
Dashboard
    ├──→ Suppliers (Manage supplier relationships)
    │       └──→ Add/edit suppliers
    │       └──→ Rate supplier performance
    │
    ├──→ Materials (Manage materials inventory)
    │       └──→ Track stock levels
    │       └──→ Create purchase orders
    │
    ├──→ Notifications
    │
    └──→ Profile
```

### Detailed Scenario: Procurement Process
```
1. PM or Site Manager requests materials
2. Procurement Manager receives notification
3. Navigates to /materials
4. Checks inventory levels
5. Navigates to /suppliers
6. Compares supplier prices
7. Creates purchase order
8. Tracks delivery
9. Updates inventory
```

---

## Cross-Page Interactions

### Notification-Driven Navigation
```
1. User receives notification (bell icon in header)
2. Clicks notification icon → /notifications
3. Views list of notifications
4. Clicks specific notification
5. Navigates to relevant page (context-specific)
```

### Profile-Based Navigation
```
1. User clicks profile dropdown (header)
2. Selects "Profile" → /profile
3. Views personal information
4. Can edit profile details
5. Returns to previous page
```

### Map Integration
```
1. User navigates to /map
2. Views all project sites on map
3. Clicks on site marker
4. Views site details popup
5. Can navigate to site page directly
```

---

## User Role Navigation Summary

| Page | Super Admin | Director | PM | Site Manager | Accountant | QHSE | Procurement |
|------|-------------|----------|-----|--------------|------------|------|--------------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sites | ✓ | ✓ | ✓ | ✓ | - | ✓ | - |
| Projects | ✓ | ✓ | ✓ | - | ✓ | - | - |
| Planning | ✓ | - | ✓ | ✓ | - | ✓ | - |
| Team | ✓ | ✓ | ✓ | ✓ | - | ✓ | - |
| Clients | ✓ | ✓ | - | - | ✓ | - | - |
| Suppliers | ✓ | - | - | - | ✓ | - | ✓ |
| Materials | ✓ | - | - | ✓ | - | - | ✓ |
| Finance | ✓ | ✓ | - | - | ✓ | - | - |
| QHSE | ✓ | - | - | ✓ | - | ✓ | - |
| Incidents | ✓ | - | ✓ | ✓ | - | ✓ | - |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| Analytics | ✓ | ✓ | ✓ | - | ✓ | - | - |
| Map | ✓ | ✓ | ✓ | - | - | - | - |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Users | ✓ | - | - | - | - | - | - |
| Roles | ✓ | - | - | - | - | - | - |
| Permissions | ✓ | - | - | - | - | - | - |
| Pending Users | ✓ | - | - | - | - | - | - |
| Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Complete User Journey Example

### Example: Managing a Construction Project

```
Step 1: Project Creation
- Super Admin logs in → Dashboard
- Navigates to /projects
- Creates new project with client assignment

Step 2: Team Assignment
- Project Manager logs in → Dashboard
- Navigates to /team
- Views available team members
- Assigns Site Manager and workers

Step 3: Site Setup
- Site Manager logs in → Dashboard
- Navigates to /sites
- Configures site details
- Sets up site-specific materials

Step 4: Planning
- Project Manager navigates to /planning
- Creates project schedule
- Assigns tasks to team members

Step 5: Procurement
- Procurement Manager navigates to /materials
- Checks inventory
- Creates purchase orders via /suppliers

Step 6: Execution
- Site Manager reviews daily /planning
- Assigns tasks to workers
- Tracks progress
- Reports issues via /incidents if needed

Step 7: Safety Compliance
- QHSE Manager reviews /qhse
- Conducts safety inspections
- Updates safety records

Step 8: Financial Tracking
- Accountant monitors /finance
- Tracks expenses
- Generates financial reports

Step 9: Reporting
- Director reviews /reports and /analytics
- Makes strategic decisions
- Views project status on /map

Step 10: Notifications
- All users check /notifications
- Stay updated on project activities
- Take required actions
```

---

## Conclusion

This scenario demonstrates how all pages in the SmartSite platform interconnect through a logical flow. Each user role has specific navigation paths based on their responsibilities, with cross-page interactions enabling complete project lifecycle management from planning to execution to reporting.
