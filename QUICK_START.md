# Quick Start Guide - Production System Redesign

## ✅ What's Been Done

The Production and Packing apps have been completely redesigned with the new WIP Inventory system:

- ✅ Production app with 8 comprehensive sections
- ✅ WIP Inventory batch generation system
- ✅ Packing app updated to consume from WIP Inventory
- ✅ All changes committed and pushed to git

## 📋 What You Need to Do Next

### Step 1: Create New Google Sheets

You need to create **2 new sheets** in your existing Google Spreadsheet.

**Open your spreadsheet**: https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit

#### 1.1 Create "Production Data" Sheet

1. Click the **+** button at the bottom to add a new sheet
2. Name it: **Production Data**
3. Copy and paste this header row (Row 1):

```
Date	Product Type	Size Range	Variant/Region	Bag Type & Quantity	Raw Material Weight (T)	Normal Loss (T)	WIP Output (T)	Salt Bags	Salt Weight (kg)	Diesel Truck	Diesel Liters	Wastewater Truck	Wastewater Liters	Employee Overtime	Notes	Timestamp
```

4. Format the sheet:
   - View → Freeze → 1 row (freeze header)
   - Select columns F, G, H → Format → Number → 3 decimal places
   - Select column Q → Format → Date time

#### 1.2 Create "WIP Inventory" Sheet

1. Add another new sheet (click **+** button)
2. Name it: **WIP Inventory**
3. Copy and paste this header row (Row 1):

```
WIP Batch ID	Date	Product Type	Size Range	Variant/Region	Initial WIP (T)	Consumed (T)	Remaining (T)	Status	Created	Completed	Notes
```

4. Format the sheet:
   - View → Freeze → 1 row
   - Select columns F, G, H → Format → Number → 3 decimal places
   - Select columns J, K → Format → Date time

### Step 2: Test the Production App

1. Navigate to production app:
   ```bash
   cd ~/Documents/productionsystem/apps/production
   npm install
   npm run dev
   ```

2. Open: http://localhost:3000

3. **Sign in** with Google OAuth

4. **Fill out a test production entry**:
   - Date: Today
   - Product Type: **Sunflower Seeds**
   - Size Range: **220-230** (field appears automatically!)
   - Variant/Region: **Eastern Province Region** (field appears automatically!)
   - Bag Type: **25 kg**
   - Number of Bags: **100**
   - (Optional) Salt Bags: 5
   - Click **"Record Production"**

5. **Verify in Google Sheets**:
   - "Production Data" sheet should have 1 new row
   - "WIP Inventory" sheet should have WIP batch: `WIP-SUN-251022-001`
   - "Batch Tracking" sheet should have 1 log entry

### Step 3: Test Other Products (No Size/Variant)

Try a product that doesn't have size or variant:

1. In Production app, create another entry:
   - Product Type: **Melon Seeds**
   - Notice: Size and Variant fields are **hidden** (conditional display!)
   - Bag Type: **25 kg**
   - Number of Bags: **50**
   - Submit

2. Verify:
   - Production Data shows "N/A" for Size Range and Variant
   - WIP Inventory has batch: `WIP-MEL-251022-001`

### Step 4: Test the Packing App

1. Navigate to packing app:
   ```bash
   cd ~/Documents/productionsystem/apps/packing
   npm run dev
   ```

2. Open: http://localhost:3001

3. The packing app now reads from "WIP Inventory"
   - It should show the WIP batches you created above
   - Try recording a packing entry
   - Verify WIP Inventory is updated (Consumed and Remaining columns)

## 🔍 Key Features of New Production App

### 8 Comprehensive Sections

1. **Basic Information**
   - Date, Product Type
   - Size Range (only for Sunflower)
   - Variant/Region (only for Sunflower)

2. **Raw Material Input**
   - Bag Type: 25 kg or 20 kg
   - Number of Bags

3. **Production Output** (auto-calculated)
   - Raw Material Weight (T)
   - Normal Loss 2% (T)
   - WIP Output (T)

4. **Salt Consumption**
   - Salt Bags (50 kg each)
   - Total Salt Weight (auto-calculated)

5. **Employee Overtime**
   - 6 employees: Sikander, Shihan, Ajmal Ihjas, Ram, Mushraf, Ugrah
   - Hours input for each

6. **Diesel Filling**
   - Truck selection: 7000L, 6000L, 12000L, 15000L
   - Liters filled

7. **Wastewater Collection**
   - Truck selection: 10000L, 22000L
   - Liters collected

8. **Notes**
   - Additional information

### Product Configuration

- **Products**: Sunflower Seeds, Melon Seeds, Pumpkin Seeds, Peanuts
- **Size Ranges**: Only for Sunflower (200-210, 210-220, ..., 290-300)
- **Variants**: Only for Sunflower (Eastern Province Region, Riyadh Region, Bahrain, Qatar)
- **Normal Loss**: 2% automatically calculated

### WIP Batch ID Format

```
WIP-{PRODUCT_CODE}-{YYMMDD}-{SEQUENCE}

Examples:
WIP-SUN-251022-001  (Sunflower, Oct 22 2025, seq 1)
WIP-MEL-251022-001  (Melon, Oct 22 2025, seq 1)
WIP-PUM-251022-002  (Pumpkin, Oct 22 2025, seq 2)
WIP-PEA-251022-001  (Peanuts, Oct 22 2025, seq 1)
```

## 📊 Data Flow

```
Production App
  ↓ Records to "Production Data" sheet
  ↓ Creates WIP Batch in "WIP Inventory" sheet
  ↓ Logs to "Batch Tracking" sheet

Packing App
  ↓ Reads from "WIP Inventory" (FIFO)
  ↓ Records to "Packing Consumption"
  ↓ Updates "WIP Inventory" (reduces Remaining)
  ↓ Logs to "Batch Tracking"

Inventory App
  ↓ Reads from "WIP Inventory"
  ↓ Shows real-time stock levels
```

## 🐛 Troubleshooting

**"No active batch available"** (Packing App)
- Create a production entry first
- Check "WIP Inventory" sheet exists with correct headers
- Verify WIP batch has Status = "ACTIVE"

**Size/Variant fields not showing**
- Only Sunflower Seeds should show these fields
- Other products (Melon, Pumpkin, Peanuts) should hide them
- Clear browser cache if fields don't update

**Calculations not working**
- Check Bag Quantity is a valid number
- 2% loss should appear after entering quantity
- Salt weight calculates as: bags × 50kg

## 📚 More Documentation

- **GOOGLE_SHEETS_STRUCTURE.md** - Complete sheet specifications
- **THREE_APPS_DEPLOYMENT.md** - Deploy to Netlify
- **shared/config/production.js** - Product configuration

---

**Last Updated**: October 2025
