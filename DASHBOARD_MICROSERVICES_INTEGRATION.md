# Dashboard Microservices Integration Guide

## Overview

The dashboard retrieves all its data from NestJS microservices that connect to a shared MongoDB database. This document explains the complete data flow from the frontend through the microservices to MongoDB.

## Database Configuration

All microservices use the same MongoDB Atlas connection:

```
mongodb+srv://admin:admin@cluster0.6zcerbm.mongodb.net/smartsite
```

### Connected Services

1. **user-authentication** (Port 3000)
   - Database: smartsite
   - Collections: users, roles, permissions
   - File: `.env` → MONGODB_URI

2. **gestion-site** (Port 3001)
   - Database: smartsite
   - Collections: sites, projects, tasks
   - File: `.env` → MONGODB_URI

3. **gestion-planing** (Port 3002)
   - Database: smartsite
   - Collections: projects, tasks, milestones
   - File: `.env` → MONGODB_URI

4. **incident-management** (Port 3003)
   - Database: smartsite
   - Collections: incidents, alerts
   - File: `.env` → MONGODB_URI

## Frontend Configuration

The frontend is configured via `apps/frontend/.env`:

```env
VITE_AUTH_API_URL=http://localhost:3000
VITE_GESTION_SITE_URL=http://localhost:3001/api
VITE_PLANNING_URL=http://localhost:3002
VITE_INCIDENT_URL=http://localhost:3003
```

These variables are consumed by the API URL configuration files in `apps/frontend/src/lib/`:

- `auth-api-url.ts` → Exports `AUTH_API_URL`
- `gestion-site-api-url.ts` → Exports `GESTION_SITE_API_URL`
- `planning-api-url.ts` → Exports `PLANNING_API_URL`
- `incident-api-url.ts` → Exports `INCIDENT_API_URL`

## Data Flow Architecture

### 1. Dashboard Component Initialization

```
IntegratedPowerBiDashboard.tsx
├── useEffect hook calls API functions
└── Promise.all([getSites(), getProjects(), getRecentIncidents(), getUrgentTasks()])
```

### 2. API Layer (dashboard.action.ts)

The dashboard uses four main API functions:

#### getSites()
- **Endpoint**: `GET /gestion-sites?limit=100`
- **Base URL**: GESTION_SITE_API_URL (http://localhost:3001/api)
- **Full URL**: http://localhost:3001/api/gestion-sites?limit=100
- **Returns**: Site[]
- **Normalization**: Handles differences in API response format
  - Maps `nom` → `name`
  - Maps `localisation`/`adresse` → `localisation`
  - Maps `isActif` → `status`

```typescript
export interface Site {
  _id: string;
  name: string;
  localisation: string;
  status: string;
  budget: number;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
}
```

#### getProjects()
- **Endpoint**: `GET /projects/all`
- **Base URL**: PLANNING_API_URL (http://localhost:3002)
- **Full URL**: http://localhost:3002/projects/all
- **Returns**: Project[]

```typescript
export interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  priority: string;
  deadline: string;
  assignedTo: string;
  assignedToName: string;
  assignedToRole: string;
  tasks: unknown[];
  createdAt: string;
  updatedAt: string;
  projectManagerName: string;
  budget?: number;
}
```

#### getUrgentTasks()
- **Endpoint**: `GET /tasks/urgent`
- **Base URL**: PLANNING_API_URL (http://localhost:3002)
- **Full URL**: http://localhost:3002/tasks/urgent
- **Returns**: Task[]

```typescript
export interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### getRecentIncidents(limit = 5)
- **Endpoint**: `GET /incidents`
- **Base URL**: INCIDENT_API_URL (http://localhost:3003)
- **Full URL**: http://localhost:3003/incidents
- **Returns**: Incident[]
- **Normalization**: Validates severity and status values
  - severity: "critical" | "high" | "medium" | "low"
  - status: "resolved" | "open" | "investigating"

```typescript
export interface Incident {
  _id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "resolved" | "open" | "investigating";
  description: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3. Authentication Flow

All API requests include Bearer token authentication:

```typescript
// Get token from storage (multiple fallback locations)
const token = localStorage.getItem("access_token") || 
              localStorage.getItem("smartsite-auth")?.state?.user?.access_token

// Add to request headers
Authorization: `Bearer ${token}`
```

### 4. Data Aggregation in Dashboard

Once all data is fetched, the dashboard calculates real-time metrics:

```typescript
// Real-time Metrics Calculation
totalSites = sites.length
activeSites = sites.filter(s => s.status === 'in_progress').length
totalProjects = projects.length
activeProjects = projects.filter(p => p.status === 'active').length
totalBudget = sites.reduce((sum, s) => sum + s.budget, 0)
avgProgress = projects.length > 0 
  ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length 
  : 0
criticalIncidents = incidents.filter(i => i.severity === 'critical').length
```

### 5. UI Presentation (IntegratedPowerBiDashboard)

The dashboard displays the data across 5 tabs:

**Tab 1: Overview**
- Site distribution pie chart (based on sites.length and activeSites)
- Incident severity bar chart (count by severity level)

**Tab 2: Sites**
- Searchable table of all sites
- Columns: Name, Location, Status, Budget
- Real-time filter as user types

**Tab 3: Projects**
- Project progress bar chart
- Individual project cards with status/priority badges

**Tab 4: Incidents**
- Color-coded incident list
- Severity and status badges
- Critical incidents highlighted in red

**Tab 5: Tasks**
- Urgent tasks with priority badges
- Deadline display
- Status indicators

## Complete Request Flow Example

When the dashboard loads for a super_admin user:

```
1. Browser: http://localhost:5173/dashboard
   ↓
2. Dashboard.tsx recognizes super_admin role
   ↓
3. Renders IntegratedPowerBiDashboard
   ↓
4. useEffect triggers Promise.all() with 4 API calls:
   ├─ GET http://localhost:3001/api/gestion-sites?limit=100
   │  + Authorization: Bearer {token}
   │  ↓ gestion-site microservice
   │  ↓ Queries MongoDB: db.sites.find()
   │  ↓ Returns normalized Site[]
   │
   ├─ GET http://localhost:3002/projects/all
   │  + Authorization: Bearer {token}
   │  ↓ gestion-planing microservice
   │  ↓ Queries MongoDB: db.projects.find()
   │  ↓ Returns Project[]
   │
   ├─ GET http://localhost:3002/tasks/urgent
   │  + Authorization: Bearer {token}
   │  ↓ gestion-planing microservice
   │  ↓ Queries MongoDB: db.tasks.find({ priority: 'urgent' })
   │  ↓ Returns Task[]
   │
   └─ GET http://localhost:3003/incidents
      + Authorization: Bearer {token}
      ↓ incident-management microservice
      ↓ Queries MongoDB: db.incidents.find()
      ↓ Returns Incident[]
   ↓
5. Dashboard calculates metrics from aggregated data
   ↓
6. UI renders 5 tabs with animations (motion library)
```

## Deployment Considerations

### Local Development
- All microservices must be running on specified ports
- MongoDB Atlas cluster must be accessible
- `.env` file in frontend must match backend service ports

### Production
- Update `.env` with production service URLs
- Ensure firewall allows connections to MongoDB Atlas
- Verify CORS settings in each microservice
- Update authentication token storage mechanism if needed

### Docker / Containerized Environment
- Services communicate via internal network names (e.g., `gestion-site:3001`)
- Frontend must resolve service hostnames correctly
- MongoDB URI remains the same (Atlas)

## Troubleshooting

### Dashboard shows no data
1. Verify all microservices are running
2. Check `.env` file URLs match service ports
3. Verify token is valid in localStorage
4. Check browser console for specific API errors
5. Verify MongoDB credentials and network access

### API Errors
- **401 Unauthorized**: Token missing or invalid
- **404 Not Found**: Service not running or endpoint incorrect
- **503 Service Unavailable**: MongoDB connection issue
- **CORS Error**: Frontend URL not allowed in microservice CORS config

### MongoDB Connection Issues
- Verify connection string: `mongodb+srv://admin:admin@cluster0.6zcerbm.mongodb.net/smartsite`
- Check MongoDB Atlas network access whitelist
- Verify username/password credentials
- Ensure smartsite database exists

## API Endpoints Reference

### Gestion Site Service (Port 3001)
- `GET /api/gestion-sites?limit=100` - Get all sites
- Base URL in code: `GESTION_SITE_API_URL`

### Planning Service (Port 3002)
- `GET /projects/all` - Get all projects
- `GET /tasks/urgent` - Get urgent tasks
- Base URL in code: `PLANNING_API_URL`

### Incident Management Service (Port 3003)
- `GET /incidents` - Get all incidents
- Base URL in code: `INCIDENT_API_URL`

### User Authentication Service (Port 3000)
- Used for token generation and validation
- Base URL in code: `AUTH_API_URL`

## Key Files

### Frontend
- `apps/frontend/.env` - Environment variables
- `apps/frontend/src/lib/*-api-url.ts` - API URL exports
- `apps/frontend/src/app/action/dashboard.action.ts` - API client functions
- `apps/frontend/src/app/components/IntegratedPowerBiDashboard.tsx` - Dashboard UI
- `apps/frontend/src/app/pages/dashboards/Dashboard.tsx` - Router component

### Backend
- `apps/backend/{service}/.env` - MongoDB and API keys configuration
- `apps/backend/gestion-site/src/` - Site management service
- `apps/backend/gestion-planing/src/` - Planning/projects service
- `apps/backend/incident-management/src/` - Incident management service
- `apps/backend/user-authentication/src/` - Authentication service

## Testing the Integration

To test if the dashboard is correctly fetching from microservices:

1. **Check MongoDB Data**
   ```bash
   # Connect to MongoDB Atlas and verify collections
   mongosh "mongodb+srv://admin:admin@cluster0.6zcerbm.mongodb.net/smartsite"
   use smartsite
   db.sites.find().count()           # Should show site count
   db.projects.find().count()        # Should show project count
   db.incidents.find().count()       # Should show incident count
   db.tasks.find().count()           # Should show task count
   ```

2. **Test API Endpoints Directly**
   ```bash
   # Replace {token} with actual bearer token
   curl -H "Authorization: Bearer {token}" http://localhost:3001/api/gestion-sites?limit=100
   curl -H "Authorization: Bearer {token}" http://localhost:3002/projects/all
   curl -H "Authorization: Bearer {token}" http://localhost:3003/incidents
   ```

3. **Monitor Dashboard Console**
   - Open browser DevTools Console
   - Navigate to dashboard
   - Check for API errors or successful responses

4. **Verify Data Population**
   - All KPI cards should show numerical values > 0
   - Charts should display data
   - Tables should have rows
   - Animations should work smoothly
