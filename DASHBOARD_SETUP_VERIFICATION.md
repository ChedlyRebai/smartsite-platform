# Dashboard Setup & Verification Checklist

## ✅ Pre-Flight Checklist

Before testing the dashboard, ensure all components are properly configured:

### 1. Backend Services Configuration

#### MongoDB Connection
- [x] All microservices configured to use shared MongoDB
  - URI: `mongodb+srv://admin:admin@cluster0.6zcerbm.mongodb.net/smartsite`
  - Verified in:
    - `apps/backend/user-authentication/.env`
    - `apps/backend/gestion-site/.env`
    - `apps/backend/gestion-planing/.env`
    - `apps/backend/incident-management/.env`

#### Service Ports
- [x] Port 3000: user-authentication
- [x] Port 3001: gestion-site (with `/api` prefix)
- [x] Port 3002: gestion-planing
- [x] Port 3003: incident-management

### 2. Frontend Configuration

#### Environment Variables
- [x] Created `.env` file: `apps/frontend/.env`
  ```env
  VITE_AUTH_API_URL=http://localhost:3000
  VITE_GESTION_SITE_URL=http://localhost:3001/api
  VITE_PLANNING_URL=http://localhost:3002
  VITE_INCIDENT_URL=http://localhost:3003
  ```

#### TypeScript Paths
- [x] Verified path alias in `tsconfig.json`
  - `@/*` → `src/*` ✓

#### API Client Configuration
- [x] API URL exports verified:
  - `apps/frontend/src/lib/auth-api-url.ts`
  - `apps/frontend/src/lib/gestion-site-api-url.ts`
  - `apps/frontend/src/lib/planning-api-url.ts`
  - `apps/frontend/src/lib/incident-api-url.ts`

### 3. Dashboard Component Configuration

#### IntegratedPowerBiDashboard Component
- [x] Correct imports from `@/app/action/dashboard.action`
- [x] API functions imported:
  - `getSites()`
  - `getProjects()`
  - `getRecentIncidents()`
  - `getUrgentTasks()`
- [x] Data interfaces imported:
  - `Site`
  - `Project`
  - `Incident`
  - `Task`

#### Dashboard Router
- [x] Dashboard.tsx correctly routes super_admin to IntegratedPowerBiDashboard
- [x] Component renders on `http://localhost:5173/dashboard`

## 🚀 Startup Instructions

### Step 1: Start Backend Services

Start each microservice in a separate terminal:

```bash
# Terminal 1: User Authentication (Port 3000)
cd apps/backend/user-authentication
npm install
npm run start:dev

# Terminal 2: Gestion Site (Port 3001)
cd apps/backend/gestion-site
npm install
npm run start:dev

# Terminal 3: Gestion Planning (Port 3002)
cd apps/backend/gestion-planing
npm install
npm run start:dev

# Terminal 4: Incident Management (Port 3003)
cd apps/backend/incident-management
npm install
npm run start:dev
```

**Verification**: Each should log "listening on port XXXX"

### Step 2: Verify Backend Services are Accessible

```bash
# Test each endpoint (replace {token} with valid auth token)
curl -H "Authorization: Bearer {token}" http://localhost:3001/api/gestion-sites?limit=100
curl -H "Authorization: Bearer {token}" http://localhost:3002/projects/all
curl -H "Authorization: Bearer {token}" http://localhost:3002/tasks/urgent
curl -H "Authorization: Bearer {token}" http://localhost:3003/incidents
```

### Step 3: Start Frontend Development Server

```bash
cd apps/frontend
npm install
npm run dev
```

**Output**: Should show "Local: http://localhost:5173"

### Step 4: Navigate to Dashboard

1. Open browser: `http://localhost:5173/dashboard`
2. Log in with super_admin credentials
3. Dashboard should display with all 5 tabs:
   - Overview
   - Sites
   - Projects
   - Incidents
   - Tasks

## ✔️ Verification Steps

### Visual Verification

#### KPI Cards (Top Row)
- [ ] "Sites" card shows numerical value
- [ ] "Projects" card shows numerical value
- [ ] "Budget" card shows formatted currency
- [ ] "Progress" card shows percentage
- [ ] "Alerts" card shows incident count
- [ ] All cards have fade-in animations on load

#### Tabs Content

**Overview Tab**
- [ ] Site Distribution pie chart is visible
- [ ] Incident Severity bar chart is visible
- [ ] Charts have data (not empty)

**Sites Tab**
- [ ] List of sites is displayed
- [ ] Search box is functional
- [ ] Columns show: Name, Location, Status, Budget
- [ ] Can filter sites by typing in search

**Projects Tab**
- [ ] Project Progress bar chart is visible
- [ ] Individual project cards show below chart
- [ ] Each card displays: Name, Progress, Status, Priority
- [ ] Progress bars are animated

**Incidents Tab**
- [ ] List of incidents is color-coded
- [ ] Red badges = critical
- [ ] Orange badges = high
- [ ] Yellow badges = medium
- [ ] Green badges = low
- [ ] Severity and Status badges are visible

**Tasks Tab**
- [ ] List of urgent tasks is displayed
- [ ] Priority badges are colored appropriately
- [ ] Deadline dates are shown
- [ ] Status indicators are visible

### Console Verification

1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors:
   - [ ] No 404 errors for API calls
   - [ ] No 401 Unauthorized errors (token issue)
   - [ ] No CORS errors
   - [ ] No undefined variable errors

4. Go to Network tab
5. Reload dashboard
6. Look for these API calls:
   - [ ] `GET http://localhost:3001/api/gestion-sites?limit=100` → Status 200
   - [ ] `GET http://localhost:3002/projects/all` → Status 200
   - [ ] `GET http://localhost:3002/tasks/urgent` → Status 200
   - [ ] `GET http://localhost:3003/incidents` → Status 200

### Data Flow Verification

#### In Browser Console
```javascript
// Check if sites data is available
const sites = await fetch('http://localhost:3001/api/gestion-sites?limit=100', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json())
console.log('Sites:', sites)

// Check if projects data is available
const projects = await fetch('http://localhost:3002/projects/all', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json())
console.log('Projects:', projects)

// Check if incidents data is available
const incidents = await fetch('http://localhost:3003/incidents', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json())
console.log('Incidents:', incidents)

// Check if tasks data is available
const tasks = await fetch('http://localhost:3002/tasks/urgent', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json())
console.log('Tasks:', tasks)
```

### MongoDB Data Verification

Connect to MongoDB and verify data exists:

```bash
# Connect to MongoDB
mongosh "mongodb+srv://admin:admin@cluster0.6zcerbm.mongodb.net/smartsite"

# In MongoDB shell
use smartsite

# Check collections exist
db.getCollectionNames()

# Count documents
db.sites.countDocuments()        # Should be > 0
db.projects.countDocuments()     # Should be > 0
db.incidents.countDocuments()    # Should be > 0
db.tasks.countDocuments()        # Should be > 0

# Sample data
db.sites.findOne()
db.projects.findOne()
db.incidents.findOne()
db.tasks.findOne()
```

## 🔧 Troubleshooting

### Dashboard shows no data

**Symptom**: KPI cards show 0, charts are empty

**Solutions**:
1. Verify all 4 backend services are running
   ```bash
   lsof -i :3000  # Check if ports are listening
   lsof -i :3001
   lsof -i :3002
   lsof -i :3003
   ```

2. Check `.env` file exists and has correct URLs
   ```bash
   cat apps/frontend/.env
   ```

3. Verify authentication token is valid
   - Open DevTools → Application → LocalStorage
   - Look for `access_token` or `smartsite-auth`
   - Token should not be expired

4. Check browser console for API errors
   - Network tab should show 200 status for all API calls
   - Check Response tab for error messages

5. Verify MongoDB is accessible
   ```bash
   mongosh "mongodb+srv://admin:admin@cluster0.6zcerbm.mongodb.net/smartsite" --eval "db.version()"
   ```

### 401 Unauthorized errors

**Symptom**: Network tab shows 401 status for API calls

**Solutions**:
1. Log out and log back in to refresh token
2. Check token is being sent in Authorization header
3. Verify backend services are configured to accept same token
4. Check token expiration in browser console:
   ```javascript
   const auth = JSON.parse(localStorage.getItem('smartsite-auth'))
   console.log('Token expires:', auth?.state?.user?.expiresAt)
   ```

### 404 Not Found errors

**Symptom**: Network tab shows 404 for API calls

**Solutions**:
1. Verify `.env` URLs are correct:
   - Should NOT have trailing slashes
   - VITE_GESTION_SITE_URL should have `/api` suffix
   - Others should NOT have `/api` suffix

2. Verify backend service routes are correct:
   ```bash
   # Check gestion-site service routing
   grep -r "gestion-sites" apps/backend/gestion-site/src/
   
   # Check planning service routing
   grep -r "projects/all" apps/backend/gestion-planing/src/
   ```

3. Test endpoints directly:
   ```bash
   curl http://localhost:3001/api/gestion-sites?limit=100
   curl http://localhost:3002/projects/all
   ```

### CORS errors

**Symptom**: Browser console shows CORS blocked error

**Solutions**:
1. Verify each backend service has CORS enabled
2. Check NestJS @EnableCors() decorator is applied
3. Verify frontend URL is whitelisted in CORS config
4. May need to add to backend main.ts:
   ```typescript
   app.enableCors({
     origin: 'http://localhost:5173',
     credentials: true,
   })
   ```

### Animations not working

**Symptom**: Cards appear instantly without animation

**Solutions**:
1. Verify motion/react library is installed:
   ```bash
   npm list motion
   ```

2. Check ImportedComponent uses motion.div:
   ```typescript
   import { motion } from 'motion/react'
   ```

3. Restart dev server to reload animations

### Charts not displaying data

**Symptom**: Charts render but show no data points

**Solutions**:
1. Verify data is being fetched (check DevTools Network tab)
2. Check data format matches expected interface
3. Look for console errors in browser
4. Verify Recharts is installed:
   ```bash
   npm list recharts
   ```

## 📊 Data Refresh

### Manual Refresh
- Click the refresh button (circular arrow icon) in top-right of dashboard
- Dashboard will re-fetch all data from microservices

### Auto-Refresh
- Advanced Dashboard tab has 30-second auto-refresh
- Integrated dashboard manually refreshes only

### Real-time Updates
- To add real-time updates, implement WebSocket connection
- Currently uses polling (on-demand refresh)

## 📝 Testing Scenarios

### Scenario 1: New Site Creation
1. Create a new site in gestion-site service
2. Click refresh button on dashboard
3. Verify new site appears in Sites tab
4. Verify site count increases in KPI card

### Scenario 2: Project Progress Update
1. Update a project's progress in planning service
2. Click refresh button
3. Verify progress bar updates in Projects tab
4. Verify average progress in KPI card changes

### Scenario 3: Critical Incident
1. Create incident with severity="critical" in incident-management
2. Click refresh button
3. Verify red badge appears in Incidents tab
4. Verify "Alerts" KPI increases

### Scenario 4: Urgent Task Creation
1. Create task with priority="urgent" in planning service
2. Click refresh button
3. Verify task appears in Tasks tab
4. Verify task details are complete

## 🎯 Performance Verification

### Dashboard Load Time
- Should load and display data within 2-3 seconds
- Monitor Network tab for:
  - Total requests: 4 API calls
  - Total size: Should be reasonable (< 1MB typical)
  - Load time: Each API should respond in < 1 second

### Animation Performance
- All animations should be smooth (60 FPS)
- Monitor using DevTools → Performance tab
- Should not see frame drops during animations

### Memory Usage
- Dashboard should not cause memory leaks
- Monitor Memory tab over time
- Usage should remain stable during extended use

## 📞 Getting Support

If dashboard still doesn't work after all checks:

1. Save full error messages from console
2. Verify MongoDB connection:
   ```bash
   mongosh "mongodb+srv://admin:admin@cluster0.6zcerbm.mongodb.net/smartsite"
   db.stats()
   ```

3. Check each microservice logs for errors
4. Verify network connectivity to all services:
   ```bash
   ping localhost:3001  # or use curl
   curl -v http://localhost:3001/api/gestion-sites?limit=1
   ```

5. Review `DASHBOARD_MICROSERVICES_INTEGRATION.md` for detailed architecture
