# ⚠️ GOOGLE SHEET UPDATE REQUIRED

## Critical Issue Found

The **Packing Transfers** sheet structure needs to be updated to support the new Packet Label feature.

---

## Current vs. Required Structure

### ❌ Current Structure (17 columns - OUTDATED)
```
A  | Transfer ID
B  | Date
C  | Time
D  | WIP Batch ID
E  | Region
F  | SKU
G  | Product Name
H  | Package Size
I  | Packaging Type
J  | Units Packed
K  | Total Units
L  | Weight Consumed (T)
M  | Operator
N  | Shift
O  | Line
P  | Notes
Q  | Timestamp
```

### ✅ Required Structure (18 columns - UPDATED)
```
A  | Transfer ID
B  | Date
C  | Time
D  | WIP Batch ID
E  | Region
F  | SKU
G  | Product Name
H  | Package Size
I  | Packaging Type
J  | Units Packed
K  | Total Units
L  | Weight Consumed (T)
M  | Operator
N  | Shift
O  | Line
P  | Notes
Q  | Timestamp
R  | Packet Label          ← NEW COLUMN!
```

---

## What Changed?

**Column R: Packet Label** - NEW!
- **Format**: `DDMMDD-REGION-SEQ`
- **Example**: `241025-RR-001`, `241025-ER-002`, `251025-RR-001`
- **Purpose**: Unique label for each packing batch
- **Components**:
  - DD: WIP production day (e.g., 24)
  - MM: Month (e.g., 10 for October)
  - DD: Packing day (e.g., 25)
  - REGION: Region code (RR=Riyadh, ER=Eastern Province, etc.)
  - SEQ: Sequence number (001, 002, 003...)

**Why it's needed**:
- Users requested batch labels for packet printing
- Each packing needs a unique label per region and date
- Sequence auto-increments per region/date combination

---

## How to Update Your Google Sheet

### Step 1: Open Your Spreadsheet
Go to: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit

### Step 2: Add Column R to "Packing Transfers" Sheet

#### Option A: If Sheet Exists (Recommended)
1. Open the "Packing Transfers" sheet
2. Click on column R header
3. Right-click → Insert 1 column right
4. In cell **R1**, enter: `Packet Label`
5. Format column R:
   - Select column R
   - Format → Text (not number)
   - Optional: Make header bold and blue background

#### Option B: If Sheet Doesn't Exist Yet (Create New)
1. Click **+** at bottom to create new sheet
2. Name it: **Packing Transfers**
3. Paste this header row (18 columns):
   ```
   Transfer ID	Date	Time	WIP Batch ID	Region	SKU	Product Name	Package Size	Packaging Type	Units Packed	Total Units	Weight Consumed (T)	Operator	Shift	Line	Notes	Timestamp	Packet Label
   ```
4. Format the sheet:
   - View → Freeze → 1 row
   - Column L: Format → Number → 3 decimals
   - Column Q: Format → Date time
   - Column R: Format → Text
   - Row 1: Bold, light blue background

### Step 3: Verify the Update

After adding column R, your header should look like this:
```
| Transfer ID | Date | Time | WIP Batch ID | Region | SKU | Product Name | Package Size | Packaging Type | Units Packed | Total Units | Weight Consumed (T) | Operator | Shift | Line | Notes | Timestamp | Packet Label |
```

**Column count should be: 18 (not 17)**

---

## Example Data Row

After the update, a typical packing entry will look like:

```
TRF-251025-001 | 2025-10-25 | 10:30 AM | WIP-SUN-251024-001 | Riyadh | SUN-4401 | Sunflower Seeds | 100 g | bundle | 100 | 500 | 0.100 | Ahmad | Morning | Line 2 | - | 2025-10-25T10:30:15Z | 241025-RR-001
```

Notice the last column: `241025-RR-001` (Packet Label)

---

## What Happens if You Don't Update?

### ❌ Without Column R:
- Code will write 18 values to a 17-column sheet
- Data will overflow or cause errors
- Packet labels won't be stored
- Sequence calculation will fail (always return 1)
- Users will get duplicate labels

### ✅ With Column R:
- Data writes correctly
- Packet labels stored for each packing
- Sequence increments properly (001, 002, 003...)
- Each region/date gets unique sequences
- Labels can be queried for reprinting

---

## Testing After Update

### Test 1: Manual Check
1. Open "Packing Transfers" sheet
2. Count columns in header row
3. Verify count = **18** (not 17)
4. Verify column R header = "Packet Label"

### Test 2: Packing App Test
1. Open Packing app: https://packingars.netlify.app
2. Authenticate with Google
3. Create a test packing entry
4. After submission:
   - ✅ Batch Label Popup should show (e.g., "241025-RR-001")
   - ✅ Check sheet - new row should have packet label in column R
   - ✅ Create another packing from same region
   - ✅ Second label should be "241025-RR-002" (sequence incremented)

### Test 3: Sequence Incrementation
Create 3 packings from Riyadh region on same day:
- First: `241025-RR-001` ✅
- Second: `241025-RR-002` ✅
- Third: `241025-RR-003` ✅

Create 1 packing from Eastern Province on same day:
- First: `241025-ER-001` ✅ (different region, starts at 001)

Create 1 packing from Riyadh next day:
- First: `251025-RR-001` ✅ (new date, sequence resets)

---

## Region Codes Reference

| Region | Code |
|--------|------|
| Riyadh / Riyadh Region | RR |
| Eastern Province / Eastern Province Region | ER |
| Madinah / Madinah Region | MDR |
| Makkah / Makkah Region | MKR |
| Qassim / Qassim Region | QR |
| Asir / Asir Region | AR |
| Hail / Hail Region | HR |
| Tabuk / Tabuk Region | TR |
| Najran / Najran Region | NR |
| Jazan / Jazan Region | JR |
| Al Baha / Al Baha Region | BR |
| Northern Borders / Northern Borders Region | NBR |
| Al Jouf / Al Jouf Region | JFR |
| Bahrain | BH |
| Qatar | QA |
| Default (if region not found) | XX |

---

## Summary Checklist

Before deploying the updated Packing app:

- [ ] Open "Packing Transfers" sheet in Google Sheets
- [ ] Add column R with header "Packet Label"
- [ ] Verify total columns = 18
- [ ] Format column R as Text
- [ ] Deploy updated Packing app
- [ ] Test packing entry creates label
- [ ] Test sequence increments correctly
- [ ] Test different regions get different sequences
- [ ] Test next day resets sequence

---

## Files Modified in Latest Commit

The following files were updated to support Packet Label:

- `apps/packing/src/components/PackingFormNew.jsx`
  - Now generates packet label before saving
  - Queries existing labels to calculate sequence
  - Writes 18 columns (including packet label)
- `apps/packing/src/components/BatchLabelPopup.jsx`
  - Displays packet label after packing
  - Provides print button for label
- `shared/utils/packetLabelGenerator.js`
  - Generates labels in DDMMDD-REGION-SEQ format
  - Calculates next sequence number
  - Maps regions to codes

---

**IMPORTANT**: Update the Google Sheet BEFORE deploying the new version to avoid errors!

**Last Updated**: October 25, 2025
**Commit**: 8128c2e
**Feature**: Packet Label Generation
