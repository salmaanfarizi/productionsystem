# Google Sheets Structure for Production System

## Overview
Complete structure for all sheets needed in the production system.

---

## 1. Production Data Sheet

**Purpose**: Record daily production entries with all details

**Columns** (17 total):

| Column | Name | Type | Description | Example |
|--------|------|------|-------------|---------|
| A | Date | Date | Production date | 2025-01-22 |
| B | Product Type | Text | Product name | Sunflower Seeds |
| C | Size Range | Text | Size (N/A if not applicable) | 220-230 |
| D | Variant/Region | Text | Region (N/A if not applicable) | Eastern Province Region |
| E | Bag Type & Quantity | Text | Bag info | 25KG (100 bags) |
| F | Raw Material Weight (T) | Number | Total raw material in tonnes | 2.500 |
| G | Normal Loss (T) | Number | 2% loss | 0.050 |
| H | WIP Output (T) | Number | After loss (F - G) | 2.450 |
| I | Salt Bags | Number | Number of salt bags | 5 |
| J | Salt Weight (kg) | Number | Total salt weight | 250 |
| K | Diesel Truck | Text | Truck capacity | 7000L |
| L | Diesel Liters | Number | Actual filled | 6500 |
| M | Wastewater Truck | Text | Truck capacity | 10000L |
| N | Wastewater Liters | Number | Actual collected | 9800 |
| O | Employee Overtime | Text | Overtime hours | Sikander: 2h, Ram: 1.5h |
| P | Notes | Text | Additional notes | Good production day |
| Q | Timestamp | DateTime | Entry timestamp | 2025-01-22 14:30:00 |

**Header Row** (Row 1):
```
Date | Product Type | Size Range | Variant/Region | Bag Type & Quantity | Raw Material Weight (T) | Normal Loss (T) | WIP Output (T) | Salt Bags | Salt Weight (kg) | Diesel Truck | Diesel Liters | Wastewater Truck | Wastewater Liters | Employee Overtime | Notes | Timestamp
```

---

## 2. WIP Inventory Sheet

**Purpose**: Track Work-In-Progress inventory with batch-like IDs

**Columns** (12 total):

| Column | Name | Type | Description | Example |
|--------|------|------|-------------|---------|
| A | WIP Batch ID | Text | Unique ID | WIP-SUN-250122-001 |
| B | Date | Date | Creation date | 2025-01-22 |
| C | Product Type | Text | Product name | Sunflower Seeds |
| D | Size Range | Text | Size | 220-230 |
| E | Variant/Region | Text | Region | Eastern Province |
| F | Initial WIP (T) | Number | Starting weight | 2.450 |
| G | Consumed (T) | Number | Used by packing | 0.500 |
| H | Remaining (T) | Number | Available (F - G) | 1.950 |
| I | Status | Text | ACTIVE/COMPLETE | ACTIVE |
| J | Created | DateTime | When created | 2025-01-22 08:00:00 |
| K | Completed | DateTime | When finished | (empty if active) |
| L | Notes | Text | Additional info | From production entry |

**Header Row** (Row 1):
```
WIP Batch ID | Date | Product Type | Size Range | Variant/Region | Initial WIP (T) | Consumed (T) | Remaining (T) | Status | Created | Completed | Notes
```

**Status Values**:
- `ACTIVE` - Still has remaining inventory
- `COMPLETE` - Fully consumed

**Batch ID Format**: `WIP-{PRODUCT_CODE}-{YYMMDD}-{SEQUENCE}`

Examples:
- `WIP-SUN-250122-001` (Sunflower, Jan 22 2025, sequence 1)
- `WIP-MEL-250122-001` (Melon, Jan 22 2025, sequence 1)
- `WIP-PUM-250122-001` (Pumpkin, Jan 22 2025, sequence 1)
- `WIP-PEA-250122-001` (Peanuts, Jan 22 2025, sequence 1)

---

## 3. Settings Sheet

**Purpose**: Configurable master data (for future changes without code updates)

### Tab 1: Products

| Column A | Column B |
|----------|----------|
| Product Code | Product Name |
| SUN | Sunflower Seeds |
| MEL | Melon Seeds |
| PUM | Pumpkin Seeds |
| PEA | Peanuts |

### Tab 2: Sunflower Sizes

| Column A |
|----------|
| Size Range |
| 200-210 |
| 210-220 |
| 220-230 |
| 230-240 |
| 240-250 |
| 250-260 |
| 260-270 |
| 270-280 |
| 280-290 |
| 290-300 |

### Tab 3: Sunflower Variants

| Column A |
|----------|
| Variant/Region |
| Eastern Province Region |
| Riyadh Region |
| Bahrain |
| Qatar |

### Tab 4: Employees

| Column A |
|----------|
| Employee Name |
| Sikander |
| Shihan |
| Ajmal Ihjas |
| Ram |
| Mushraf |
| Ugrah |

### Tab 5: Diesel Trucks

| Column A | Column B |
|----------|----------|
| Capacity (L) | Label |
| 7000 | 7,000 L |
| 6000 | 6,000 L |
| 12000 | 12,000 L |
| 15000 | 15,000 L |

### Tab 6: Wastewater Trucks

| Column A | Column B |
|----------|----------|
| Capacity (L) | Label |
| 10000 | 10,000 L |
| 22000 | 22,000 L |

### Tab 7: Parameters

| Column A | Column B |
|----------|----------|
| Parameter | Value |
| Normal Loss % | 2 |
| Salt Bag Weight (kg) | 50 |
| Bag Type 1 Weight (kg) | 25 |
| Bag Type 2 Weight (kg) | 20 |

---

## 4. Packing Consumption Sheet (Existing - Update)

**Purpose**: Record packaging consumption from WIP

**Updated Columns**:

| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | Timestamp | DateTime | When consumed |
| B | WIP Batch ID | Text | Which WIP batch (changed from "Batch ID") |
| C | SKU | Text | Product SKU |
| D | Package Size | Text | Package size |
| E | Packages Produced | Number | Number of packages |
| F | Weight Consumed (T) | Number | Consumed weight |
| G | Remaining WIP (T) | Number | WIP remaining |
| H | Operator | Text | Operator name |
| I | Shift | Text | Shift |
| J | Line | Text | Line number |
| K | Notes | Text | Notes |

**Key Change**: Column B now references "WIP Batch ID" instead of "Batch ID"

---

## 5. Batch Tracking Sheet (Keep for Audit)

**Purpose**: Audit trail of all operations

**Columns**:

| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | Timestamp | DateTime | When action occurred |
| B | Batch/WIP ID | Text | Identifier |
| C | Product Type | Text | Product |
| D | Size | Text | Size |
| E | Variant | Text | Variant |
| F | Action | Text | CREATED/CONSUMED/COMPLETED |
| G | Weight Change (T) | Number | Change amount |
| H | Running Total (T) | Number | Total after |
| I | Department | Text | Production/Packing |
| J | User | Text | Who did it |
| K | Reference | Text | Reference info |
| L | Notes | Text | Details |

---

## Setup Instructions

### Step 1: Create New Sheets

In your Google Spreadsheet, create these sheets:

1. **Production Data** (copy header from above)
2. **WIP Inventory** (copy header from above)
3. **Settings** (with 7 tabs as detailed above)

### Step 2: Update Existing Sheets

**Packing Consumption**:
- Change column B header from "Batch ID" to "WIP Batch ID"

**Batch Tracking**:
- Change column B header from "Batch ID" to "Batch/WIP ID"

### Step 3: Format Sheets

**Production Data**:
- Freeze row 1 (header)
- Format columns F, G, H as Number (3 decimal places)
- Format column Q as DateTime

**WIP Inventory**:
- Freeze row 1
- Format columns F, G, H as Number (3 decimal places)
- Format columns J, K as DateTime
- Add data validation for column I: ACTIVE, COMPLETE

**Settings**:
- Freeze row 1 in all tabs
- Format as tables with alternating colors

### Step 4: Set Permissions

Make sure the spreadsheet is:
- Shared with "Anyone with the link - Viewer" (for API key access)
- OR shared with your Google account as Editor (for OAuth)

---

## Data Flow

```
1. Production App
   ↓ Records to "Production Data"
   ↓ Creates entry in "WIP Inventory"

2. WIP Inventory
   ↓ Batch with ACTIVE status

3. Packing App
   ↓ Reads from "WIP Inventory" (FIFO)
   ↓ Records to "Packing Consumption"
   ↓ Updates "WIP Inventory" (reduces Remaining)

4. When WIP Remaining = 0
   ↓ Status changes to COMPLETE
```

---

## Migration from Old System

If you have existing data in "Batch Master":

**Option 1**: Keep both systems
- Old batches stay in "Batch Master"
- New production uses "WIP Inventory"
- Packing app reads from both (WIP first, then Batch Master)

**Option 2**: Migrate data
- Copy existing ACTIVE batches to "WIP Inventory"
- Archive old "Batch Master" sheet
- Packing app only reads "WIP Inventory"

**Recommendation**: Option 1 (safer - don't lose data)

---

## Testing Checklist

After creating sheets:

- [ ] Production Data sheet created with headers
- [ ] WIP Inventory sheet created with headers
- [ ] Settings sheet created with 7 tabs
- [ ] All tabs populated with initial data
- [ ] Packing Consumption updated (column B header)
- [ ] Spreadsheet shared properly
- [ ] Can read data via API (test with Inventory app)
- [ ] Can write data via OAuth (test with Production app)

---

**Last Updated**: January 2025
