# Complete System Redesign - Production, Packing & Inventory

## 📋 Overview

This document outlines the complete three-department system with proper data flow and integration.

## 🏭 System Components

### 1. **Production App** (Port 3000)
- Records raw material processing
- Tracks: Product Type, Size Range (for Sunflower), Region, Bags, Salt, Diesel, Wastewater, Overtime
- Outputs: WIP (Work In Progress) inventory
- Calculates 2% normal loss

### 2. **Packing App** (Port 3001)
- Consumes WIP from Production
- Packs into retail SKUs (4402, 4401, 8001, etc.)
- Checks inventory levels vs minimum stock
- Suggests packing quantities
- Generates transfer PDFs
- Generates daily summary PDFs

### 3. **Inventory App** (Port 3002)
- Tracks finished goods by SKU and Region
- Monitors stock levels against minimums
- Receives transfers from Packing
- Shows real-time inventory

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ PRODUCTION APP                                              │
│ User enters: 100 bags × 25kg Sunflower (Riyadh Region)     │
│ System calculates:                                          │
│   - Raw Material: 2.500 T                                   │
│   - Loss (2%): 0.050 T                                      │
│   - WIP Output: 2.450 T                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ Writes to "Production Data" sheet
                      ↓ Creates WIP batch: WIP-SUN-251022-001
                      │
┌─────────────────────┴───────────────────────────────────────┐
│ WIP INVENTORY SHEET                                         │
│ WIP-SUN-251022-001 | Riyadh | 2.450 T | ACTIVE             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ Packing app reads available WIP
                      │
┌─────────────────────┴───────────────────────────────────────┐
│ PACKING APP                                                 │
│ 1. Shows WIP available: 2.450 T (Riyadh Region)            │
│ 2. Fetches current inventory from "Finished Goods Inventory"│
│    - SKU 4402 (200g): Current=350, Min=250 → OK            │
│    - SKU 4401 (100g): Current=150, Min=250 → Need 100!     │
│ 3. User packs:                                              │
│    - 100 bundles × SKU 4401 (100g) = 100kg                 │
│ 4. System:                                                  │
│    - Consumes 0.100 T from WIP-SUN-251022-001              │
│    - Generates Transfer PDF                                 │
│    - Updates WIP: Remaining = 2.350 T                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ Writes to "Packing Transfers" sheet
                      ↓ Updates "WIP Inventory" (consumption)
                      │
┌─────────────────────┴───────────────────────────────────────┐
│ FINISHED GOODS INVENTORY SHEET                              │
│ SKU  | Product  | Size  | Region | Stock | Min | Status    │
│ 4401 | Sunflower| 100g  | Riyadh | 250   | 250 | OK        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ Inventory app displays
                      │
┌─────────────────────┴───────────────────────────────────────┐
│ INVENTORY APP                                               │
│ Real-time dashboard showing:                                │
│ - Stock levels by SKU and Region                           │
│ - Items below minimum (highlighted in red)                 │
│ - Recent transfers from Packing                            │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Required Google Sheets

### Sheet 1: **Production Data** (existing)
Columns: Date, Product Type, Size Range, Region, Bags, Raw Material (T), Loss (T), WIP (T), Salt, Diesel, Wastewater, Overtime, Notes, Timestamp

### Sheet 2: **WIP Inventory** (existing)
Columns: WIP Batch ID, Date, Product Type, Size Range, Region, Initial WIP (T), Consumed (T), Remaining (T), Status, Created, Completed, Notes

### Sheet 3: **Packing Transfers** (NEW - need to create)
Columns:
- Transfer ID (e.g., TRF-251022-001)
- Date
- WIP Batch ID
- Region
- SKU
- Product Name
- Package Size
- Packaging Type (bundle/carton)
- Units Packed (bundles/cartons)
- Total Units (bags/boxes)
- Weight Consumed (T)
- Operator
- Shift
- Line
- Timestamp
- PDF Generated

### Sheet 4: **Finished Goods Inventory** (NEW - need to create)
Columns:
- SKU
- Product Type
- Package Size
- Unit Type
- Packaging Info
- Region (for Sunflower)
- Current Stock (bundles/cartons)
- Minimum Stock
- Status (OK/LOW/CRITICAL)
- Last Updated

### Sheet 5: **Daily Packing Summary** (NEW - need to create)
Columns:
- Date
- Total Transfers
- Total WIP Consumed (T)
- SKUs Packed (count)
- Regions Served
- PDF Generated
- Timestamp

### Sheet 6: **Batch Tracking** (existing)
Already has the structure

## 🎯 Key Features to Implement

### Packing App Features:

1. **Smart Product Selection**
   ```
   Step 1: Select Product Type (Sunflower/Pumpkin/Melon/Popcorn)
   Step 2: IF Sunflower → Select Region (Eastern Province/Riyadh/Bahrain/Qatar)
   Step 3: System shows available WIP for that product+region
   Step 4: Select SKU from dropdown (filtered by product type)
   Step 5: System shows:
          - Current inventory: 150 bundles
          - Minimum required: 250 bundles
          - RECOMMENDED: Pack 100 bundles ⚠️
   Step 6: Enter quantity (pre-filled with recommendation)
   Step 7: Submit → PDF generated, inventory updated
   ```

2. **Inventory Integration**
   - Fetch current stock from "Finished Goods Inventory" sheet
   - Compare against minimum stock levels
   - Show color-coded status: 🟢 OK | 🟡 LOW | 🔴 CRITICAL
   - Auto-suggest packing quantities

3. **PDF Generation**
   - **Transfer PDF** (per entry):
     ```
     TRANSFER DOCUMENT
     Transfer ID: TRF-251022-001
     Date: 22 Oct 2025, 10:30 AM

     FROM: WIP Inventory (WIP-SUN-251022-001)
     TO: Finished Goods Inventory

     PRODUCT DETAILS:
     SKU: 4401
     Product: Sunflower Seeds (100g bags)
     Region: Riyadh
     Packaging: Bundle (5 bags)

     QUANTITY:
     Bundles Packed: 100
     Total Bags: 500
     Weight Consumed: 0.100 T

     OPERATOR: Ahmad
     SHIFT: Morning
     LINE: Line 2

     ─────────────────────────
     Authorized Signature
     ```

   - **Daily Summary PDF**:
     ```
     DAILY PACKING SUMMARY
     Date: 22 Oct 2025

     TOTAL WIP CONSUMED: 1.250 T
     TOTAL TRANSFERS: 8

     BREAKDOWN BY PRODUCT:
     • Sunflower Seeds: 0.850 T (5 transfers)
     • Pumpkin Seeds: 0.250 T (2 transfers)
     • Melon Seeds: 0.150 T (1 transfer)

     BREAKDOWN BY REGION:
     • Eastern Province: 0.600 T
     • Riyadh: 0.650 T

     BREAKDOWN BY SKU:
     SKU 4401: 300 bundles (1500 bags)
     SKU 4402: 200 bundles (1000 bags)
     SKU 1116: 50 cartons (600 bags)
     ...

     ─────────────────────────
     Generated: 22 Oct 2025, 11:59 PM
     ```

### Inventory App Features:

1. **Real-time Dashboard**
   - Stock levels by SKU
   - Color-coded status indicators
   - Filter by: Product Type, Region, Status
   - Recent transfers from Packing

2. **Alerts**
   - Items below minimum stock
   - Items approaching minimum (within 10%)
   - Out of stock items

## 🔧 Implementation Steps

### Phase 1: Packing App Redesign (Priority)
1. ✅ Create retail product catalog (`shared/config/retailProducts.js`)
2. ⏳ Redesign PackingForm.jsx with new flow
3. ⏳ Add inventory level fetching
4. ⏳ Add recommendation logic
5. ⏳ Implement PDF generation (using jsPDF library)

### Phase 2: Google Sheets Setup
1. ⏳ Create "Packing Transfers" sheet
2. ⏳ Create "Finished Goods Inventory" sheet
3. ⏳ Create "Daily Packing Summary" sheet
4. ⏳ Add initial inventory data

### Phase 3: Inventory App Update
1. ⏳ Read from "Finished Goods Inventory"
2. ⏳ Display stock levels with status
3. ⏳ Add filtering and search
4. ⏳ Add alerts for low stock

### Phase 4: Integration & Testing
1. ⏳ Test complete flow: Production → Packing → Inventory
2. ⏳ Test PDF generation
3. ⏳ Test inventory recommendations
4. ⏳ Test daily summary

## 📝 Next Steps

**QUESTION FOR YOU:**

Before proceeding with the full implementation, please confirm:

1. **Are the 17 retail SKUs correct?** (6 Sunflower, 3 Pumpkin, 2 Melon, 3 Popcorn)

2. **Minimum stock levels**:
   - Only for Sunflower Seeds (Eastern Province & Riyadh)?
   - Do other products have minimums too?

3. **Regions**:
   - Sunflower has 4 regions in production (Eastern Province, Riyadh, Bahrain, Qatar)
   - But minimum stock only for 2 regions (Eastern Province, Riyadh)
   - Is this correct?

4. **PDF Requirements**:
   - Should transfer PDF be auto-downloaded after each packing entry?
   - Should daily summary be generated automatically at end of day, or manually?

5. **Popcorn**:
   - In production app, we don't have "Popcorn" as a product
   - Should we add it to Production app?
   - Or does Popcorn come from elsewhere?

6. **Current Inventory Data**:
   - Do you have existing inventory data to import?
   - Or start with zero stock?

Please answer these questions so I can proceed with the complete implementation correctly!

---

**Status**: ✅ Catalog created, ⏳ Awaiting confirmation to proceed with Packing & Inventory updates
