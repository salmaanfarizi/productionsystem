# Raw Material Management App

A comprehensive raw material inventory management system with stock tracking, expiry alerts, and Google Sheets integration.

## Features

### 📦 Stock Management
- **Stock In**: Record material purchases with supplier, batch number, and expiry date
- **Stock Out**: Track material usage for production with full audit trail
- **Multi-Batch Tracking**: Manage multiple batches per material with individual expiry dates

### 🏷️ Material Categories
1. **Base Item**
   - Sunflower Seeds, Pumpkin Seeds, Melon Seeds, Raw Corn, Raw Peanut

2. **Flavours and Additives**
   - Salt, Butter Flavour, Cheese Flavour, Vegetable Oil

3. **Packing Material**
   - Cartons and Boxes, Packing Roll, Packing Cover

### ⏰ Smart Alerts
- **Expiry Tracking**: Automatic alerts for materials expiring within 30 days
- **Expired Items**: Red highlights for expired stock
- **Batch-Level Visibility**: See expiry dates for each batch

### 📊 Real-time Reporting
- Current stock levels by material and category
- Transaction history with full audit trail
- Cost tracking (unit price and total cost)
- Category filtering and search

### 🔄 Production Integration
- Links to production batches via transaction notes
- Full traceability from raw material to finished product
- Stock out tracking for production usage

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (amber/orange theme)
- **Authentication**: Google OAuth 2.0
- **Backend**: Google Sheets API
- **Deployment**: Netlify

## Setup Instructions

### 1. Environment Configuration

Create `.env` file in `apps/raw-material/`:

```bash
cp .env.example .env
```

Add your credentials:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_SHEET_ID=your-google-sheet-id
```

### 2. Google Sheets Setup

Follow the detailed guide in `RAW_MATERIAL_SHEETS_SETUP.md` to create the required sheets:

- **Raw Material Inventory** (13 columns)
- **Raw Material Transactions** (14 columns)

### 3. Install Dependencies

```bash
npm install
```

### 4. Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3003`

### 5. Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Google Sheets Structure

### Raw Material Inventory
Tracks current stock with batch and expiry information.

```
Date | Material Name | Category | Unit | Quantity | Supplier | Batch Number |
Expiry Date | Unit Price | Total Cost | Status | Created At | Notes
```

### Raw Material Transactions
Complete audit trail of all stock movements.

```
Timestamp | Transaction Date | Transaction Type | Material Name | Category |
Unit | Stock In Qty | Stock Out Qty | Supplier | Batch Number |
Unit Price | Total Cost | Notes | User
```

## Usage Guide

### Recording Stock In

1. Select "Stock In" transaction type
2. Choose category and material
3. Enter quantity (with appropriate unit)
4. Add supplier information (optional)
5. Enter batch number (optional)
6. Set expiry date (optional but recommended)
7. Add unit price for cost tracking
8. Click "Record Stock In"

### Recording Stock Out

1. Select "Stock Out" transaction type
2. Choose category and material
3. Enter quantity to be used
4. Add notes (e.g., "For production batch WIP-SUN-250118-001")
5. Click "Record Stock Out"

### Viewing Inventory

- Filter by category using the category buttons
- Toggle "Show only expiring/expired items" for quick alerts
- View total stock across all batches
- See nearest expiry date for each material
- Check recent transactions in the sidebar

## Alerts & Warnings

### Expiry Warnings
- **Yellow Badge**: Item expiring within 30 days
- **Red Badge**: Item already expired
- **Green Badge**: Item is good (expiry > 30 days away)

### Stock Display
- Materials are grouped by name with total quantity
- Batch count shown for multi-batch items
- Category labels for easy identification

## Integration Points

### With Production App
When raw materials are used in production:
1. Record a "Stock Out" transaction
2. Reference the production batch in notes
3. Full traceability maintained

### With Inventory App
Raw materials that become finished goods can be tracked through the entire supply chain.

## Deployment

### Using Netlify (Recommended)

1. **Using the deployment script:**
   ```bash
   ./deploy-raw-material.sh
   ```

2. **Manual deployment:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Set environment variables in Netlify:**
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_SHEET_ID`

### Deploy All Apps
To deploy all four apps at once:
```bash
./deploy-all-apps.sh
```

## File Structure

```
apps/raw-material/
├── src/
│   ├── components/
│   │   ├── AuthButton.jsx          # Google authentication
│   │   ├── RawMaterialForm.jsx     # Stock In/Out form
│   │   └── RawMaterialList.jsx     # Inventory display & alerts
│   ├── App.jsx                      # Main app component
│   ├── main.jsx                     # React entry point
│   └── index.css                    # Tailwind styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── README.md
```

## Shared Configuration

Located in `shared/config/rawMaterials.js`:

```javascript
- RAW_MATERIAL_CATEGORIES
- CATEGORY_ITEMS
- TRANSACTION_TYPES
- MATERIAL_UNITS
- Helper functions
```

## Security Considerations

🔒 **Important Security Notes:**

1. Never commit `.env` files (already in `.gitignore`)
2. Use environment variables for all sensitive data
3. Google Sheets should have proper access controls
4. Enable 2FA on Google accounts
5. Regularly review OAuth token access
6. Keep dependencies updated

## Troubleshooting

### Authentication Issues
- Verify `VITE_GOOGLE_CLIENT_ID` is correct
- Check OAuth consent screen is configured
- Clear browser cache and try again

### Data Not Appearing
- Verify `VITE_SHEET_ID` matches your Google Sheet
- Check sheet names are exactly: "Raw Material Inventory" and "Raw Material Transactions"
- Ensure sheet permissions are set to "Editor"

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (v16+ recommended)
- Clear `node_modules` and reinstall if needed

## Future Enhancements

Potential features for future versions:
- [ ] Automated low stock alerts (email/SMS)
- [ ] Purchase order generation
- [ ] Supplier management
- [ ] Cost analysis and reporting
- [ ] Barcode scanning for stock in/out
- [ ] Mobile app version
- [ ] Advanced analytics dashboard

## Support

For issues or questions:
1. Check the main project README
2. Review `RAW_MATERIAL_SHEETS_SETUP.md`
3. See `NETLIFY_DEPLOYMENT_GUIDE.md` for deployment help

## License

Part of the Production System project.
