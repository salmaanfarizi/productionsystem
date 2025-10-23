# Inventory Department App

## Status: Coming Soon

This app will provide real-time inventory monitoring and stock management.

## Planned Features

1. **Real-time Stock Dashboard**
   - Current stock levels by product
   - Active batch summary
   - Low stock alerts
   - Stock movement visualization

2. **Warehouse Management**
   - Stock location tracking
   - Transfer management
   - Stock adjustments
   - Physical count reconciliation

3. **Reports & Analytics**
   - Inventory turnover reports
   - Stock aging analysis
   - Consumption patterns
   - Waste/loss tracking

4. **Batch Monitoring**
   - All active batches at a glance
   - Batch status tracking
   - FIFO queue visualization
   - Batch completion history

## Data Sources

The app will read from multiple sheets:
- `Batch Master` - Current inventory levels
- `Batch Tracking` - Stock movements
- `Packing Consumption` - Consumption data
- `Batch History` - Historical data
- `Daily - Jul 2025` - Production input

## Dashboard Views

### 1. Stock Overview
```
Total Stock: 45.5T
├── Active Batches: 12
├── Products: 8 types
└── Low Stock Alerts: 2
```

### 2. Product Breakdown
```
Product         | Active | Remaining
----------------+--------+-----------
T6 - 100g      | 3      | 12.5T
T6 - 800g      | 2      | 8.3T
361 - 130g     | 1      | 2.1T
...
```

### 3. Batch Queue (FIFO)
```
Oldest → Newest
[BT6-250115-001] → [BT6-250118-002] → [BT6-250120-003]
```

## Charts & Visualizations

1. **Stock Level Trends** (Line chart)
2. **Consumption Rate** (Bar chart)
3. **Batch Status Distribution** (Pie chart)
4. **Product Mix** (Donut chart)

## To Build This App

1. Copy the structure from `apps/packing`
2. Create inventory-specific components:
   - `StockDashboard.jsx`
   - `BatchMonitor.jsx`
   - `StockReports.jsx`
   - `WarehouseView.jsx`
3. Add charting library (e.g., Chart.js or Recharts)
4. Configure for port 3002
5. Deploy to separate Netlify site

## Technology Additions

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0"
  }
}
```

## Related Documentation

- Main README: `../../README.md`
- Google Sheets Setup: `../../GOOGLE_SHEETS_SETUP.md`
- Sheets API: `../../shared/utils/sheetsAPI.js`
- Products Config: `../../shared/config/products.js`

---

For questions contact the development team.
