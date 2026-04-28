# Power BI Dashboard - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB running (default: `mongodb://localhost:27017/smartsite-optimization`)
- Backend and frontend services installed

## 5-Minute Setup

### 1. Start the Backend
```bash
cd apps/backend/resource-optimization
npm run build
npm run start:dev
```
The service runs on `http://localhost:3007` by default.

### 2. Start the Frontend
```bash
cd apps/frontend
npm install
npm run dev
```
The frontend runs on `http://localhost:5173` (Vite default).

### 3. Access the Dashboard
Open your browser and navigate to:
```
http://localhost:5173/resource-optimization/:siteId
```
Replace `:siteId` with an actual site ID from your database, OR use:
```
http://localhost:5173/power-bi/:siteId
```

## Quick Verification Checklist

✅ **Backend Running**
- Service starts without errors
- Port 3007 listening
- PowerBiModule loaded in logs

✅ **Frontend Running**
- Vite dev server active
- No console errors
- React components rendering

✅ **Dashboard Loads**
- 6 KPI cards visible at top
- 5 tabs: Overview, Trends, Recommendations, Power BI, Alerts
- Power BI tab shows complex charts
- Real-time metrics updating

✅ **Real-Time Updates**
- Wait 30 seconds → Dashboard refetches automatically
- Or click "Refresh" button
- KPI counts change if data changes in DB

✅ **Navigation Works**
- Click between tabs
- Quick access cards redirect correctly
- Back to All Sites button works

## Testing Without Real Data

If you have no data in MongoDB yet, you can seed test data:

### Seed Recommendations
```javascript
// In MongoDB shell or Compass
db.recommendations.insertMany([
  {
    siteId: "your-site-id",
    type: "energy",
    title: "Reduce HVAC consumption",
    description: "Optimize heating/cooling schedule",
    status: "implemented",
    estimatedSavings: 15000,
    estimatedCO2Reduction: 2500,
    priority: 8,
    confidenceScore: 85,
    actionItems: ["Adjust thermostat", "Install smart sensors"],
    createdAt: new Date("2026-04-01"),
    implementedAt: new Date("2026-04-15")
  },
  {
    siteId: "your-site-id",
    type: "budget",
    title: "Contractor bidding optimization",
    description: "Implement competitive bidding for materials",
    status: "approved",
    estimatedSavings: 25000,
    estimatedCO2Reduction: 1800,
    priority: 9,
    confidenceScore: 92,
    actionItems: ["Prepare RFPs", "Review vendor proposals"],
    createdAt: new Date("2026-04-20"),
    approvedAt: new Date("2026-04-21")
  }
]);
```

### Seed Alerts
```javascript
db.alerts.insertMany([
  {
    siteId: "your-site-id",
    type: "energy",
    severity: "critical",
    title: "Energy spike detected",
    message: "Electricity consumption exceeded threshold by 300%",
    isRead: false,
    status: "active",
    createdAt: new Date()
  }
]);
```

## Common Issues & Solutions

### Issue: "Failed to fetch Power BI data"
**Solution**: Verify backend is running on port 3007 and environment variables are set.

### Issue: No charts rendering
**Solution**: Check browser console for Recharts errors. Ensure data arrays are not empty.

### Issue: CORS errors
**Solution**: Add CORS configuration to backend `main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### Issue: "Cannot find module 'recharts'"
**Solution**: Install Recharts in frontend:
```bash
cd apps/frontend
npm install recharts
```

### Issue: Dashboard tabs not showing Power BI
**Solution**: Ensure you added the `powerbi` tab and component as shown in the implementation guide.

## Performance Tuning

### Reduce Polling Frequency
In `PowerBiDashboard.tsx`, change:
```typescript
refreshInterval={30000} // 30 seconds
// ↓
refreshInterval={60000} // 1 minute (or 0 to disable)
```

### Optimize MongoDB Queries
Add indexes:
```javascript
// In MongoDB
db.recommendations.createIndex({ siteId: 1, status: 1, createdAt: -1 })
db.alerts.createIndex({ siteId: 1, status: 1, severity: 1 })
```

### Enable Query Caching
Ensure TanStack Query cache times are appropriate:
```typescript
staleTime: 5 * 60 * 1000, // 5 minutes
cacheTime: 10 * 60 * 1000, // 10 minutes
```

## Expected Output

When working correctly, you should see:

**KPI Cards Row:**
- Active Recommendations: 2+ (based on seed)
- Pending Approvals: 1+
- Critical Alerts: 0-1
- Live Savings: 15,000+ TND
- CO₂ Reduction: 2,500+ kg
- ROI/Sustainability % values

**Power BI Tab:**
- 5 interactive charts
- Risk assessment section
- Optimization opportunities
- Performance forecast cards

**Real-Time Behavior:**
- Refresh button spins during fetch
- Auto-refresh every 30s (indicator in last updated timestamp)
- Streaming tabs would update every 5s (if enabled)

## Next Steps

1. ✅ Verify basic functionality
2. ✅ Add real site data (from production or seeds)
3. ✅ Configure email alerts for critical notifications
4. ✅ Set up monitoring/logging for errors
5. ✅ Consider WebSocket upgrade for true real-time
6. ✅ Integrate with Microsoft Power BI Embedded (optional)

## Support Documentation

- Backend API Docs: `api-reference.md`
- Frontend Components: `docs/FRONTEND_ARCHITECTURE.md`
- Full Implementation: `POWER_BI_IMPLEMENTATION_SUMMARY.md`
- Technical Deep Dive: `TECHNICAL_ARCHITECTURE.md`

## Success Criteria

The Power BI dashboard is considered **successfully deployed** when:
- ✅ Dashboard loads at `/power-bi/:siteId`
- ✅ All 5 tabs render without errors
- ✅ Real-time metrics update on refresh
- ✅ Charts display correctly with data
- ✅ KPI calculations are accurate
- ✅ No console errors on frontend
- ✅ Backend endpoints return 200 OK
- ✅ TypeScript compiles without errors

Enjoy your intelligent, real-time Power BI dashboard! 🚀