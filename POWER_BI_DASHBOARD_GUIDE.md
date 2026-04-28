# Professional Power BI Dashboard - Quick Start Guide

## ⭐ NOUVEAU - Dashboard Remplacé

**L'ancien dashboard a été complètement remplacé par le nouveau Integrated Power BI Dashboard!**

### Sur une seule vue à `/dashboard`

Quand vous accédez à `/dashboard` en tant que super_admin, vous verrez maintenant directement:

```
✅ Nouveau Integrated Power BI Dashboard 
   (remplace complètement l'ancien SuperAdminDashboard)
```

### Contenu Préservé

Tous les contenus de votre ancien dashboard sont conservés avec le nouveau design:

| Ancien | Nouveau |
|--------|---------|
| Sites list | Sites tab avec recherche + cards animées |
| Projects chart | Projects tab avec charts + cards détaillés |
| Incidents list | Incidents tab avec couleurs par sévérité |
| Urgent tasks | Tasks tab avec priorités et dates |
| KPI cards | 5 KPI cards animés en haut |
| Stats | Métriques en temps réel + calculs |

### Vue Principale (Défaut)

À `/dashboard`, vous verrez:

```
┌─────────────────────────────────────────────────────────────────┐
│  Demo    |    Analytics    (Boutons en haut-droite)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎨 New Integrated Power BI Dashboard                            │
│     - Sites (searchable)                                         │
│     - Projects with progress                                     │
│     - Incidents by severity                                      │
│     - Urgent tasks                                               │
│     - Real-time metrics                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Boutons de Navigation

En haut-droite du dashboard principal:

- **"Demo"** (BLEU) → Professional Power BI Dashboard (avec sample data)
- **"Analytics"** (VIOLET) → Advanced Power BI Dashboard (API Power BI backend)

---

## Features & Animations

### ✨ Professional View Animations
- **KPI Cards**: Smooth scale and hover animations
- **Icons**: Rotating on hover with scale effects
- **Charts**: Fade-in animations as data loads
- **Containers**: Staggered animations for visual flow
- **Metrics**: Spring animations for numeric values

### 📊 Advanced View Data Integration
- **Real-Time KPIs**:
  - Active Recommendations
  - Live Savings (TND)
  - CO₂ Reduction (kg)
  - ROI (%)
  - Efficiency Rate (%)
  - Active Alerts Count

- **Chart Data**:
  - Recommendations trend (7 days)
  - Type distribution
  - Status breakdown
  - Alerts analysis
  - Predictive forecasts

- **Auto-Refresh**: Updates every 30 seconds

---

## How to Access

### For Super Admin Users:
```
1. Navigate to: http://localhost:5173/dashboard
2. You'll see the NEW Integrated Power BI Dashboard immediately
3. It displays all your sites, projects, incidents, and tasks
4. Use the top-right buttons to switch views:
   - "Demo" → Professional Dashboard with sample data
   - "Analytics" → Advanced Dashboard with Power BI API
   - "← Back to Main" → Return to Integrated Dashboard
```

### Main Dashboard - 5 Tabs:
```
1. Overview → Site distribution + incident severity charts
2. Sites → All sites with search + budget info
3. Projects → Project progress bars + detailed cards
4. Incidents → Color-coded by severity + status tracking
5. Tasks → Urgent tasks with priority + deadlines
```

### Top Metrics (Always Visible):
```
[Sites: X]  [Projects: X]  [Budget: XX M]  [Progress: XX%]  [Alerts: X]
```

### **RECOMMENDED: Start with Integrated Dashboard**
```
The Integrated Dashboard is the perfect replacement for your old dashboard:
- Shows all your sites
- Displays all your projects
- Lists all incidents
- Manages urgent tasks
- All with modern animations and beautiful UI
```

### Site Selection & Search (Integrated View):
```
1. Open Integrated Power BI Dashboard
2. Go to "Sites" tab
3. Search for any site by name or location
4. View all site details and budget information
```

---

## Components Created

### 1. IntegratedPowerBiDashboard.tsx ⭐ NEW
**Path**: `apps/frontend/src/app/components/IntegratedPowerBiDashboard.tsx`
- **Replaces your old dashboard with modern UI**
- Integrates with existing API actions:
  - `getSites()` - Fetches all your sites
  - `getProjects()` - Fetches all your projects
  - `getRecentIncidents()` - Fetches all incidents
  - `getUrgentTasks()` - Fetches urgent tasks
- Real data from your platform (not sample)
- 5 tabs for different views:
  1. **Overview**: Site distribution pie chart, Incident severity analysis
  2. **Sites**: Complete site list with search, budget info, status badges
  3. **Projects**: Project progress bar chart, individual project cards
  4. **Incidents**: Incident list with severity colors, status tracking
  5. **Tasks**: Urgent tasks list with priority and deadline info

### Key Metrics Displayed (Real Data):
- **Total Sites**: Sum of all sites
- **Active Sites**: Sites with "in_progress" status
- **Total Projects**: Count of all projects
- **Active Projects**: Projects not in "completed" status
- **Budget**: Total allocated budget from all sites
- **Average Progress**: Average completion percentage across all projects
- **Critical Incidents**: Count of incidents with "critical" severity

### 2. ProfessionalPowerBiDashboard.tsx
**Path**: `apps/frontend/src/app/components/ProfessionalPowerBiDashboard.tsx`
- Standalone professional dashboard component
- Uses sample data for immediate viewing
- Perfect for demos and presentations
- Fully animated with motion library

### 3. PowerBiAdvancedDashboard.tsx
**Path**: `apps/frontend/src/app/components/PowerBiAdvancedDashboard.tsx`
- Production-ready dashboard component
- Integrates with backend Power BI API
- Fetches real data from `/api/power-bi/dashboard-data/:siteId`
- Supports multi-site monitoring
- Auto-refresh capabilities

### 4. Enhanced Dashboard Router
**Path**: `apps/frontend/src/app/pages/dashboards/Dashboard.tsx`
- Added state management for view switching (integrated, professional, advanced)
- Integrated button controls for dashboard selection
- Maintains role-based routing for non-admin users

---

## Customization Options

### Changing Refresh Interval
In `PowerBiAdvancedDashboard.tsx`:
```typescript
// Change this line (currently 30000ms = 30 seconds)
const interval = setInterval(fetchData, 30000);
```

### Modifying Colors & Gradients
Edit the gradient strings in component files:
```typescript
color: 'from-blue-600 to-cyan-600'  // Change these colors
bgColor: 'from-blue-50 to-cyan-50'  // Background color
```

### Adding More Metrics
Update the API response or modify sample data:
```typescript
// In Professional Dashboard
const sampleKPIData = [
  // Add new metrics here
]

// In Advanced Dashboard
// Fetches from: GET /api/power-bi/dashboard-data/:siteId
```

---

## Performance Notes

✅ **Optimized for**:
- Smooth animations with motion library
- Responsive design (mobile to 4K)
- Efficient re-renders with React hooks
- Auto-cleanup of intervals
- Error handling and loading states

⚠️ **Best Practices**:
- Use Advanced Dashboard for production data
- Use Professional Dashboard for demos
- Check browser console for any API errors
- Ensure backend Power BI service is running

---

## Data Integration from Old Dashboard

### Where Old Dashboard Data Comes From
The **Integrated Dashboard** pulls data from the same APIs your old dashboard used:

```typescript
// Data Sources
1. Sites → getSites() API
2. Projects → getProjects() API  
3. Incidents → getRecentIncidents() API
4. Tasks → getUrgentTasks() API

// These are the same API calls used in your old SuperAdminDashboard!
```

### Side-by-Side Comparison

| Feature | Old Dashboard | Integrated Dashboard |
|---------|---------------|----------------------|
| Sites Display | ✓ Basic list | ✓ Beautiful cards + search |
| Projects | ✓ Chart only | ✓ Chart + detailed cards |
| Incidents | ✓ Text list | ✓ Color-coded, sortable list |
| Tasks | ✓ Text list | ✓ Priority tags + dates |
| Animations | ✗ None | ✓ Smooth transitions |
| Refresh | Manual only | ✓ Auto + manual |
| Search | ✗ No | ✓ Real-time search |
| Real-time Metrics | ✓ KPI cards | ✓ Animated KPI cards |
| Mobile Responsive | ✓ Basic | ✓ Fully responsive |
| Data Source | Same APIs | **Same APIs** |

### All Your Old Data Is Here!
✅ All sites are displayed  
✅ All projects are shown  
✅ All incidents are listed  
✅ All tasks are managed  
✅ Same data structure  
✅ Same calculations  
✅ Same refresh logic  

**The only difference: Modern UI + Beautiful Animations!**

### Dashboard Not Loading
1. Check if backend service is running on correct port
2. Verify `VITE_RESOURCE_OPTIMIZATION_URL` env variable
3. Check browser console for API errors

### Data Not Updating
1. Verify site ID is valid in your database
2. Check backend Power BI API responses
3. Review browser network tab for API calls

### Animations Not Smooth
1. Ensure motion library is properly installed
2. Check browser performance (animations may throttle)
3. Verify motion library version (12.23.24+)

---

## API Integration

### Backend Endpoints Used
```
GET /api/power-bi/dashboard-data/:siteId
- Returns PowerBiDashboardData interface
- Real-time metrics, KPIs, trends, alerts
- Called every 30 seconds for auto-refresh

GET /api/sites
- Returns list of available sites
- Used for site selector dropdown
```

### Expected Data Structure
```typescript
interface PowerBiDashboardData {
  realTimeMetrics: {
    activeRecommendations: number;
    pendingApprovals: number;
    liveSavings: number;
    liveCO2Reduction: number;
    activeAlerts: number;
    criticalAlerts: number;
  };
  trends: {
    recommendationsByDay: Array<{day: string, count: number}>;
    alertsByHour: Array<{hour: string, count: number}>;
  };
  kpis: {
    roi: number;
    efficiencyScore: number;
    sustainabilityIndex: number;
    budgetVariance: number;
  };
  // ... more properties
}
```

---

## Next Steps

1. **Customize Colors**: Update gradient colors to match your brand
2. **Add More Charts**: Extend with additional visualizations
3. **Real-time Updates**: Implement WebSocket for true real-time data
4. **Export Reports**: Add PDF export functionality
5. **Alerts**: Add notification system for critical metrics

---

## Support & Documentation

- **Animation Library**: [Motion Documentation](https://motion.dev)
- **Recharts**: [Recharts Docs](https://recharts.org)
- **Tailwind CSS**: [Tailwind Docs](https://tailwindcss.com)
- **React Query**: Used for data fetching in Advanced Dashboard

---

Enjoy your professional Power BI dashboard! 🎉
