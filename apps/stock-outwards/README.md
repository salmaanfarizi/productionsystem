# Sales Van / Stock Outwards (retired)

**Retired in September 2026.** The site (salesvan.abusalim.sa) now shows a notice that points
to the Packing app, where the store team records despatches (Store Entry → Despatched).
The last activity in this app was in November 2025.

Archived data:
- "sales van master data" spreadsheet (route inventory, sales items, cash reconciliation)
- `Stock Outwards` and `Salesman Inventory` tabs in the Enhanced Production Tracking System

The previous code is in git history (before the "retire the Sales Van app" commit).

---

# Stock Outwards & Salesman Inventory Management

Combined application for managing:
- **Salesman Inventory**: Track daily salesman inventory snapshots (physical count, transfers, system stock)
- **Stock Outwards**: Track all outgoing stock movements (damaged, samples, returns, warehouse transfers, etc.)

## Features

### 🚚 Salesman Inventory
- Route-based inventory tracking (Al-Hasa 1-4, Wholesale)
- Product categories: Sunflower Seeds, Pumpkin Seeds, Melon Seeds, Popcorn
- Track: Physical stock, Transfers, Additional transfers, System stock
- Auto-calculate differences
- Save to Google Sheets

### 📊 Stock Outwards
- Track multiple outward categories:
  - 🚚 Salesman Transfers (auto-synced)
  - 🏭 Regional Warehouse Transfers
  - 💔 Damaged Goods
  - 🎁 Samples/Promotions
  - ↩️ Returns to Supplier
  - 🏢 Internal Use
  - 📦 Other
- Real-time filtering by category, product, region, date
- Summary statistics and category breakdown
- Sync salesman transfers from inventory snapshots

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Set `VITE_GOOGLE_SCRIPT_URL` to your deployed Google Apps Script URL
   - Set `VITE_GOOGLE_SHEETS_API_KEY` if syncing salesman transfers

3. **Google Apps Script**:
   - Deploy the Apps Script with handlers for:
     - `saveInventoryData` - Save salesman inventory
     - `getStockOutwards` - Get stock outwards records
     - `saveStockOutwards` - Save stock outwards entry

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Or from root:
   ```bash
   npm run dev:stock-outwards
   ```

## Deployment

### Production URL
- **Live Site**: https://salesvan.abusalim.sa
- **Netlify**: https://salesvan.netlify.app

### Build & Deploy

```bash
npm run build
```

Deploy `dist/` folder to Netlify using the included `netlify.toml` configuration.

## Integration

This app is part of the ARS Production System monorepo and shares:
- `/shared/utils/sheetsAPI.js` - Google Sheets integration
- `/shared/config/*` - Product configurations

## Usage

1. **Salesman Inventory Tab**:
   - Select route
   - Choose date
   - Expand product categories
   - Enter inventory counts
   - Save to sheets

2. **Stock Outwards Tab**:
   - View all outward movements
   - Filter by category/product/date
   - Add manual entries
   - Sync salesman transfers
   - View summary statistics
