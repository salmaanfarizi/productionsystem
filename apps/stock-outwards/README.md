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

```bash
npm run build
```

Deploy `dist/` folder to Netlify, Vercel, or any static host.

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
