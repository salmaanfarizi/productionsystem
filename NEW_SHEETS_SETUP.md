# New Google Sheets Required - Updated

## Summary of Sheets Needed

Based on user confirmations:
1. ✅ Production Data (already created)
2. ✅ WIP Inventory (already created)
3. **NEW**: Packing Transfers
4. **NEW**: Finished Goods Inventory
5. **NEW**: Daily Packing Summary

---

## Sheet 3: Packing Transfers

**Purpose**: Records every packing operation with transfer details

**Header Row** (17 columns):
```
Transfer ID	Date	Time	WIP Batch ID	Region	SKU	Product Name	Package Size	Packaging Type	Units Packed	Total Units	Weight Consumed (T)	Operator	Shift	Line	Notes	Timestamp
```

**Column Details**:
- **A: Transfer ID** - Format: `TRF-YYMMDD-SEQ` (e.g., TRF-251022-001)
- **B: Date** - Date format (YYYY-MM-DD)
- **C: Time** - Time format (HH:MM AM/PM)
- **D: WIP Batch ID** - Reference to WIP Inventory (e.g., WIP-SUN-251022-001)
- **E: Region** - For Sunflower: Eastern Province/Riyadh/Bahrain/Qatar, For others: N/A
- **F: SKU** - Product code (e.g., SUN-4401, PUM-8001)
- **G: Product Name** - Full name (e.g., Sunflower Seeds)
- **H: Package Size** - Size (e.g., 100 g, 15 g, Cheese)
- **I: Packaging Type** - bundle/carton/sack
- **J: Units Packed** - Number of bundles/cartons/sacks
- **K: Total Units** - Total individual bags/boxes (calculated: J × packaging quantity)
- **L: Weight Consumed (T)** - Tonnes consumed from WIP
- **M: Operator** - Operator name
- **N: Shift** - Morning/Afternoon/Night
- **O: Line** - Production line
- **P: Notes** - Additional information
- **Q: Timestamp** - ISO datetime

**Formatting**:
- Freeze row 1
- Column L: Number format, 3 decimal places
- Column Q: DateTime format
- Color: Light blue background for header

**Example Data**:
```
TRF-251022-001	2025-10-22	10:30 AM	WIP-SUN-251022-001	Riyadh	SUN-4401	Sunflower Seeds	100 g	bundle	100	500	0.100	Ahmad	Morning	Line 2	-	2025-10-22T10:30:15Z
```

---

## Sheet 4: Finished Goods Inventory

**Purpose**: Current stock levels of retail products by SKU and Region

**Header Row** (10 columns):
```
SKU	Product Type	Package Size	Unit Type	Packaging Info	Region	Current Stock	Minimum Stock	Status	Last Updated
```

**Column Details**:
- **A: SKU** - Unique product code (e.g., SUN-4401, PUM-8001)
- **B: Product Type** - Sunflower Seeds/Pumpkin Seeds/Melon Seeds/Popcorn
- **C: Package Size** - Size (100 g, 200 g, 15 g, etc.)
- **D: Unit Type** - bag/box/sack
- **E: Packaging Info** - "bundle = 5 bags", "carton = 12 bags", etc.
- **F: Region** - For Sunflower: Eastern Province/Riyadh/Bahrain/Qatar; For others: N/A
- **G: Current Stock** - Number of bundles/cartons (start with 0)
- **H: Minimum Stock** - Target minimum (for Sunflower in Eastern/Riyadh only)
- **I: Status** - OK/LOW/CRITICAL/OUT (formula-based)
- **J: Last Updated** - ISO datetime

**Formatting**:
- Freeze row 1
- Column G, H: Number format
- Column I: Conditional formatting:
  - RED if Current Stock = 0 (OUT)
  - ORANGE if Current Stock < Minimum Stock (CRITICAL)
  - YELLOW if Current Stock < Minimum Stock × 1.1 (LOW)
  - GREEN if Current Stock >= Minimum Stock × 1.1 (OK)
- Column J: DateTime format

**Formula for Status (Column I)**:
```
=IF(G2=0,"OUT",IF(G2<H2,"CRITICAL",IF(G2<H2*1.1,"LOW","OK")))
```

**Initial Data Rows** (start with 0 stock, user will import later):

For Sunflower Seeds (need rows for each SKU × Region combination):
```
SUN-4402	Sunflower Seeds	200 g	bag	bundle = 5 bags	Eastern Province	0	400	OUT
SUN-4402	Sunflower Seeds	200 g	bag	bundle = 5 bags	Riyadh	0	250	OUT
SUN-4401	Sunflower Seeds	100 g	bag	bundle = 5 bags	Eastern Province	0	400	OUT
SUN-4401	Sunflower Seeds	100 g	bag	bundle = 5 bags	Riyadh	0	250	OUT
SUN-1129	Sunflower Seeds	25 g	bag	bundle = 6 bags	Eastern Province	0	400	OUT
SUN-1129	Sunflower Seeds	25 g	bag	bundle = 6 bags	Riyadh	0	250	OUT
SUN-1116	Sunflower Seeds	800 g	bag	carton = 12 bags	Eastern Province	0	150	OUT
SUN-1116	Sunflower Seeds	800 g	bag	carton = 12 bags	Riyadh	0	50	OUT
SUN-1145	Sunflower Seeds	130 g	box	carton = 6 boxes	Eastern Province	0	100	OUT
SUN-1145	Sunflower Seeds	130 g	box	carton = 6 boxes	Riyadh	0	50	OUT
SUN-1126	Sunflower Seeds	10 KG	sack	—	Eastern Province	0	0	OK
SUN-1126	Sunflower Seeds	10 KG	sack	—	Riyadh	0	0	OK
```

For Bahrain and Qatar (no minimum stock):
```
SUN-4402	Sunflower Seeds	200 g	bag	bundle = 5 bags	Bahrain	0	0	OK
SUN-4402	Sunflower Seeds	200 g	bag	bundle = 5 bags	Qatar	0	0	OK
... (repeat for all 6 SKUs × 2 regions)
```

For other products (no region, no minimum for now):
```
PUM-8001	Pumpkin Seeds	15 g	box	carton = 6 boxes	N/A	0	0	OK
PUM-8002	Pumpkin Seeds	110 g	box	carton = 6 boxes	N/A	0	0	OK
PUM-1142	Pumpkin Seeds	10 KG	sack	—	N/A	0	0	OK
MEL-9001	Melon Seeds	15 g	box	carton = 6 boxes	N/A	0	0	OK
MEL-9002	Melon Seeds	110 g	box	carton = 6 boxes	N/A	0	0	OK
POP-1701	Popcorn	Cheese	bag	carton = 8 bags	N/A	0	0	OK
POP-1702	Popcorn	Butter	bag	carton = 8 bags	N/A	0	0	OK
POP-1703	Popcorn	Lightly Salted	bag	carton = 8 bags	N/A	0	0	OK
```

**Total rows needed**: 12 (Sunflower × Eastern/Riyadh) + 12 (Sunflower × Bahrain/Qatar) + 8 (others) = **32 rows**

---

## Sheet 5: Daily Packing Summary

**Purpose**: Aggregated daily statistics for reporting

**Header Row** (9 columns):
```
Date	Total Transfers	Total WIP Consumed (T)	SKUs Packed	Products Breakdown	Regions Breakdown	Top SKU	PDF Generated	Timestamp
```

**Column Details**:
- **A: Date** - Date format (YYYY-MM-DD)
- **B: Total Transfers** - Count of transfers for the day
- **C: Total WIP Consumed (T)** - Sum of weight consumed
- **D: SKUs Packed** - Count of unique SKUs packed
- **E: Products Breakdown** - Text: "Sunflower: 0.850T (5), Pumpkin: 0.250T (2)"
- **F: Regions Breakdown** - Text: "Eastern Province: 0.600T, Riyadh: 0.650T"
- **G: Top SKU** - Most packed SKU code
- **H: PDF Generated** - TRUE/FALSE
- **I: Timestamp** - When summary was generated

**Formatting**:
- Freeze row 1
- Column C: Number format, 3 decimal places
- Column I: DateTime format

**Example Data**:
```
2025-10-22	8	1.250	6	Sunflower: 0.850T (5), Pumpkin: 0.250T (2), Melon: 0.150T (1)	Eastern Province: 0.600T, Riyadh: 0.650T	SUN-4401	TRUE	2025-10-22T23:59:30Z
```

---

## Quick Setup Instructions

### Step 1: Open Your Spreadsheet
https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit

### Step 2: Create "Packing Transfers" Sheet
1. Click **+** at bottom
2. Name: **Packing Transfers**
3. Paste header row (17 columns)
4. Format:
   - View → Freeze → 1 row
   - Column L: Format → Number → 3 decimals
   - Column Q: Format → Date time

### Step 3: Create "Finished Goods Inventory" Sheet
1. Click **+** at bottom
2. Name: **Finished Goods Inventory**
3. Paste header row (10 columns)
4. Paste 32 initial data rows (see above)
5. Add formula to column I (Status):
   - In cell I2: `=IF(G2=0,"OUT",IF(G2<H2,"CRITICAL",IF(G2<H2*1.1,"LOW","OK")))`
   - Copy formula down to all rows
6. Format:
   - View → Freeze → 1 row
   - Column G, H: Format → Number
   - Column I: Format → Conditional formatting:
     - Rule 1: Text contains "OUT" → Red background
     - Rule 2: Text contains "CRITICAL" → Orange background
     - Rule 3: Text contains "LOW" → Yellow background
     - Rule 4: Text contains "OK" → Green background

### Step 4: Create "Daily Packing Summary" Sheet
1. Click **+** at bottom
2. Name: **Daily Packing Summary**
3. Paste header row (9 columns)
4. Format:
   - View → Freeze → 1 row
   - Column C: Format → Number → 3 decimals
   - Column I: Format → Date time

---

## Notes

- **Packing app** will auto-update "Packing Transfers" and "Finished Goods Inventory"
- **Daily summary** is generated manually by clicking button in Packing app
- **Inventory app** reads from "Finished Goods Inventory" to display stock levels
- All sheets use **ISO 8601 timestamps** for consistency
- **Start with zero stock** - user will import actual data later

---

**Next**: Create these 3 sheets, then test the updated Packing app!
