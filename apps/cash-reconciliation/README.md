# Cash Reconciliation & Payment Tracking

Cash collection and reconciliation system for tracking daily payments from salesmen across multiple routes.

## Features

### 💵 Cash Collection
- Record daily cash collections from salesmen
- Multiple payment methods: Cash, Bank Transfer, Check, Card
- Route-based tracking (Al-Hasa 1-4, Wholesale)
- Invoice number reference
- Bank and check details tracking
- Real-time recording to Google Sheets

### 🧾 Cash Reconciliation
- View all cash collections with filtering
- Status tracking (Pending, Reconciled, Disputed)
- Summary statistics by payment method
- Date range filtering
- Route-based filtering
- Payment method breakdown

### 📊 Payment Tracking
- Grouped views by Route, Salesman, or Date
- Payment method breakdowns
- Status overview (pending vs reconciled)
- Total amount tracking
- Visual summary cards

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Set `VITE_SPREADSHEET_ID` to your ARSinv/Sales Google Sheets ID
   - Set `VITE_GOOGLE_SHEETS_API_KEY` for reading data
   - Set `VITE_GOOGLE_CLIENT_ID` for OAuth write access

3. **Google Sheets Setup**:
   - Create a sheet named "Cash Collection" in your spreadsheet
   - Headers:
     - Date | Time | Route | Salesman Name | Payment Method | Amount
     - Invoice Numbers | Reference Number | Bank Name | Check Number | Notes
     - Status | Timestamp

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Or from root:
   ```bash
   npm run dev:cash-reconciliation
   ```

## Deployment

### Production URL
- **Live Site**: https://cash.abusalim.sa (configure in Netlify)
- **Netlify**: [Your Netlify URL]

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

1. **Cash Collection Tab**:
   - Select date and route
   - Enter salesman name
   - Choose payment method
   - Enter amount and reference details
   - Add notes if needed
   - Click "Record Collection"

2. **Reconciliation Tab**:
   - View all collections
   - Filter by status, route, or date
   - See payment method breakdown
   - Monitor pending vs reconciled

3. **Payment Tracking Tab**:
   - Group collections by route, salesman, or date
   - View payment method breakdowns
   - Monitor collection trends
   - Track reconciliation status

## Payment Methods

- **Cash** 💵: Physical cash collected
- **Bank Transfer** 🏦: Electronic bank transfers (requires bank name)
- **Check** 📝: Check payments (requires bank name and check number)
- **Card** 💳: Card payments

## Status Types

- **Pending** ⏳: Collection recorded but not yet reconciled
- **Reconciled** ✅: Collection verified and reconciled
- **Disputed** ❌: Collection has discrepancies

## Future Enhancements

- Outstanding payment tracking
- Invoice linking with sales data
- Automated reconciliation with sales van transfers
- Email notifications for large discrepancies
- Export to PDF/Excel
- Cash flow reports and analytics
