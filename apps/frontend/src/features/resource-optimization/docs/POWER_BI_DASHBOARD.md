# Power BI Intelligence Dashboard

## Overview

The **Power BI Intelligence Dashboard** is a real-time analytics and visualization system integrated directly into the SmartSite platform. It provides AI-powered insights, predictive analytics, and live monitoring of recommendations and alerts across all construction sites.

## Key Features

### 🚀 Real-Time Monitoring
- Live tracking of recommendations (pending, approved, implemented)
- Real-time alert monitoring with severity classification
- Instant updates every 5-30 seconds via WebSocket-like polling
- Live savings and CO₂ reduction metrics

### 📊 Interactive Visualizations
- **Overview Tab**: KPI cards, real-time metrics, sustainability index
- **Trends Tab**: 30-day recommendation trends, hourly alert patterns, weekly performance
- **Recommendations Tab**: Distribution by type, status, priority; top-performing recommendations
- **Alerts Tab**: Category breakdown, severity analysis, response time metrics
- **Predictive Tab**: AI-powered risk assessment, optimization opportunities, 7-day forecasts

### 🔮 Predictive Analytics
- Next week savings forecast based on historical data
- Risk probability assessment for potential issues
- Automated optimization opportunity detection
- ROI and efficiency score projections

### 💡 Business Insights
- ROI tracking and optimization recommendations
- Budget variance analysis
- Sustainability index calculation
- Resource allocation insights

## Architecture

```
┌────────────────────────────────────────────────┐
│         Frontend (React + Recharts)             │
│  PowerBiDashboard.tsx - Main Dashboard UI      │
│  usePowerBiDashboard() - Data fetching hooks   │
└─────────────────┬──────────────────────────────┘
                  │ HTTP/SSE
┌─────────────────▼──────────────────────────────┐
│     Backend (NestJS - Resource Optimization)   │
│  PowerBiController  →  REST endpoints          │
│  PowerBiService     →  Data aggregation        │
│  Recommendation/Alert Models (MongoDB)         │
└────────────────────────────────────────────────┘
```

## API Endpoints

### Dashboard Data
```
GET /api/power-bi/dashboard-data/:siteId?refresh=true
```
Returns comprehensive dashboard data including:
- Real-time metrics
- Historical trends (30 days)
- KPI calculations
- Predictive insights

### Streaming Data
```
GET /api/power-bi/recommendations-stream/:siteId
GET /api/power-bi/alerts-stream/:siteId
```
Returns latest data for real-time updates (refetch every 5s).

### Performance Metrics
```
GET /api/power-bi/performance-metrics/:siteId?period=7d
```
Period options: `1d`, `7d`, `30d`, `90d`

## Integration with Existing System

The Power BI dashboard is fully integrated with the existing resource optimization system:

1. **Data Sources**:
   - Recommendations collection (MongoDB)
   - Alerts collection (MongoDB)
   - Reporting service for aggregated data

2. **Dependencies**:
   - Uses existing `Recommendation` and `Alert` schemas
   - Leverages `ReportingService` for baseline metrics
   - Integrates with `useResourceOptimization` hooks

3. **Microservices Communication**:
   - Pulls site data from gestion-site service (port 3001)
   - Fetches user/team data from auth service (port 3000)
   - Retrieves task data from planning service (port 3002)

## Setup & Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Resource Optimization Service (Backend)
VITE_RESOURCE_OPTIMIZATION_URL=http://localhost:3007

# Other Microservices (already configured)
VITE_GESTION_SITE_URL=http://localhost:3001
VITE_AUTH_API_URL=http://localhost:3000
VITE_PLANNING_URL=http://localhost:3002
```

### Backend Installation

1. Navigate to the resource-optimization backend:
   ```bash
   cd apps/backend/resource-optimization
   ```

2. Install dependencies (if not already):
   ```bash
   npm install
   ```

3. Build and start the service:
   ```bash
   npm run build
   npm run start:dev
   ```

The Power BI module is automatically registered in `app.module.ts`.

### Frontend Usage

#### In Dashboard Page
The Power BI tab is already integrated into the main `ResourceOptimizationDashboard`:

```typescript
// Available at routes:
// /resource-optimization          (all sites)
// /resource-optimization/:siteId  (site-specific)
// /power-bi/:siteId               (direct Power BI access)
```

#### Standalone Component
Import and use the `PowerBiDashboard` component directly:

```tsx
import { PowerBiDashboard } from '@/features/resource-optimization/components/PowerBiDashboard';

function MyPage() {
  return (
    <PowerBiDashboard
      siteId="site123"
      refreshInterval={30000} // 30 seconds
    />
  );
}
```

#### Custom Hooks
Access Power BI data programmatically:

```typescript
import {
  usePowerBiDashboard,
  usePowerBiRecommendationsStream,
  usePowerBiAlertsStream,
  usePowerBiPerformanceMetrics,
} from '@/features/resource-optimization/hooks/useResourceApi';

// Full dashboard
const { data, isLoading, error } = usePowerBiDashboard('site123');

// Real-time streams
const { data: recommendations } = usePowerBiRecommendationsStream('site123');
const { data: alerts } = usePowerBiAlertsStream('site123');

// Performance metrics
const { data: metrics } = usePowerBiPerformanceMetrics('site123', '7d');
```

## Real-Time Features

### Auto-Refresh Configuration
- Overview tab: Refreshes every 30 seconds (default)
- Streaming data: Updates every 5 seconds
- Manual refresh button available

### Performance Optimization
- Data is cached with TanStack Query
- Refetch intervals prevent excessive API calls
- Smart invalidation on mutations

## Customization

### Adding New KPI Cards
Edit `PowerBiDashboard.tsx` and add new cards in the KPI section.

### Modifying Charts
Charts use Recharts library. Customize by editing the chart components in the tab sections.

### Custom Metrics
Extend `PowerBiDashboardData` interface in `power-bi.service.ts` to include additional metrics.

## Testing

### Backend Tests
```bash
cd apps/backend/resource-optimization
npm run test
```

### Frontend Tests
```bash
cd apps/frontend
npm run test
```

## Performance Notes

- The dashboard fetches aggregated data to minimize database load
- Indexes are recommended on `siteId`, `status`, `createdAt` fields
- For large datasets, consider implementing data aggregation pipelines

## Future Enhancements

- [ ] WebSocket support for true real-time updates
- [ ] Export to PDF/Excel functionality
- [ ] Custom date range selection
- [ ] Drill-down capabilities for individual recommendations
- [ ] Multi-site comparison view
- [ ] Automated insight generation (NLP summaries)
- [ ] Integration with Microsoft Power BI Embedded

## Support

For issues or questions, contact the development team or open an issue on GitHub.