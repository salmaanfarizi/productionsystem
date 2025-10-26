# Batch Tracking Sheet Misalignment - FIXED

## Issue Reported
"batch tracking sheet is misaligned while recording packing"

## Root Cause Analysis

The Batch Tracking sheet was receiving **misaligned data** from Production and Packing apps due to **column count mismatch**.

### Expected Structure (per GOOGLE_SHEETS_STRUCTURE.md)
Batch Tracking should have **12 columns (A-L)**:

| Column | Name | Example |
|--------|------|---------|
| A | Timestamp | 2025-10-26T10:30:15Z |
| B | Batch/WIP ID | WIP-SUN-251024-001 |
| C | Product Type | Sunflower Seeds |
| D | Size | 5-6 mm |
| E | Variant | Riyadh |
| F | Action | CREATED/CONSUMED |
| G | Weight Change (T) | -0.100 |
| H | Running Total (T) | 1.400 |
| I | Department | Production/Packing |
| J | User | Ahmad |
| K | Reference | Transfer: TRF-251026-001 |
| L | Notes | Packed 100 bundles... |

---

## Problems Found

### Problem 1: Production App Writing 13 Columns ❌

**File**: `apps/production/src/components/ProductionForm.jsx`
**Line**: 264-279

**BEFORE (Wrong - 13 values)**:
```javascript
const trackingRow = [
  new Date().toISOString(),
  batchId,
  productType,
  seedVariety || 'N/A',  // ❌ EXTRA COLUMN NOT IN SPEC!
  sizeRange,
  variant,
  action,
  weightChange.toFixed(3),
  runningTotal.toFixed(3),
  department,
  user,
  reference,
  notes
];
```

**Impact**:
- Production wrote **13 values** instead of 12
- Extra `seedVariety` column shifted all subsequent data right by 1 column
- When Packing wrote 12 values, data appeared in wrong columns

**Example Misalignment**:
```
Production writes:
A: Timestamp
B: Batch ID
C: Product Type
D: Seed Variety ← EXTRA!
E: Size          ← Should be D!
F: Variant       ← Should be E!
G: Action        ← Should be F!
... all shifted right by 1

Packing writes:
A: Timestamp
B: Batch ID
C: Product Type
D: Size          ← Correct position
E: Variant       ← Correct position
F: Action        ← Correct position
... aligned correctly

Result: Columns don't match!
```

---

### Problem 2: Packing App Writing Empty Running Total ❌

**File**: `apps/packing/src/components/PackingFormNew.jsx`
**Line**: 422-435

**BEFORE (Wrong - empty Running Total)**:
```javascript
const trackingRow = [
  now.toISOString(),
  wipBatch['WIP Batch ID'],
  selectedProduct.productType,
  wipBatch['Size Range'],
  wipBatch['Variant/Region'],
  'CONSUMED',
  `-${calculatedWeight.toFixed(3)}`,
  '',  // ❌ EMPTY! Should calculate running total
  'Packing',
  formData.operator || 'Unknown',
  `Transfer: ${transferId}`,
  `Packed ${formData.unitsPacked} ${selectedProduct.packaging.type}s...`
];
```

**Impact**:
- Column H (Running Total) always showed empty in Batch Tracking
- Made it difficult to track WIP remaining after each packing operation
- Inconsistent with Production app which calculated and stored running totals

---

## Solutions Implemented ✅

### Fix 1: Remove Extra Column from Production

**File**: `apps/production/src/components/ProductionForm.jsx:264-279`

**AFTER (Fixed - 12 values)**:
```javascript
const trackingRow = [
  new Date().toISOString(),
  batchId,
  productType,
  // seedVariety removed! ✅
  sizeRange,
  variant,
  action,
  weightChange.toFixed(3),
  runningTotal.toFixed(3),
  department,
  user,
  reference,
  notes
];
```

**Result**:
- Production now writes **12 columns** (matches spec)
- All data aligns correctly with sheet structure
- `seedVariety` information is still captured in the WIP Batch ID and can be inferred from Product Type + Variant

---

### Fix 2: Calculate Running Total in Packing

**File**: `apps/packing/src/components/PackingFormNew.jsx:421-436`

**AFTER (Fixed - calculated Running Total)**:
```javascript
// Calculate running total after consumption
const newRunningTotal = wipRemaining - calculatedWeight;

const trackingRow = [
  now.toISOString(),
  wipBatch['WIP Batch ID'],
  selectedProduct.productType,
  wipBatch['Size Range'],
  wipBatch['Variant/Region'],
  'CONSUMED',
  `-${calculatedWeight.toFixed(3)}`,
  newRunningTotal.toFixed(3),  // ✅ Calculated!
  'Packing',
  formData.operator || 'Unknown',
  `Transfer: ${transferId}`,
  `Packed ${formData.unitsPacked} ${selectedProduct.packaging.type}s...`
];
```

**Calculation Logic**:
- `wipRemaining` = Current WIP batch remaining weight (from WIP Inventory)
- `calculatedWeight` = Weight consumed in this packing operation
- `newRunningTotal` = `wipRemaining - calculatedWeight`
- Example: 1.500T - 0.100T = 1.400T

**Result**:
- Column H now shows actual remaining WIP weight after consumption
- Provides audit trail of WIP depletion
- Matches Production app's behavior

---

## Example: Before vs After

### Before (Misaligned) ❌

**Production entry creates WIP batch**:
| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2025-10-26T08:00 | WIP-001 | Sunflower | **Roasted** | 5-6mm | Riyadh | CREATED | 2.000 | 2.000 | Production | User | ... | ... | ← 13 cols

**Packing entry consumes WIP**:
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2025-10-26T10:00 | WIP-001 | Sunflower | 5-6mm | Riyadh | CONSUMED | -0.100 | *empty* | Packing | Ahmad | ... | ... | ← 12 cols

**Problem**: Packing's "5-6mm" lands in column D, but Production's "5-6mm" is in column E!

---

### After (Aligned) ✅

**Production entry creates WIP batch**:
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2025-10-26T08:00 | WIP-001 | Sunflower | 5-6mm | Riyadh | CREATED | 2.000 | 2.000 | Production | User | ... | ... | ← 12 cols

**Packing entry consumes WIP**:
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2025-10-26T10:00 | WIP-001 | Sunflower | 5-6mm | Riyadh | CONSUMED | -0.100 | **1.900** | Packing | Ahmad | ... | ... | ← 12 cols

**Fixed**:
- Both write 12 columns ✅
- Data aligns perfectly ✅
- Running total calculated ✅

---

## Testing Checklist

After deploying this fix:

- [ ] **Test Production Entry**
  1. Create a production entry
  2. Check Batch Tracking sheet
  3. Verify 12 columns written (no extra column)
  4. Verify Running Total shows WIP weight

- [ ] **Test Packing Entry**
  1. Create a packing entry
  2. Check Batch Tracking sheet
  3. Verify 12 columns written
  4. Verify Running Total shows remaining WIP (wipRemaining - consumed)

- [ ] **Verify Alignment**
  1. Compare Production and Packing rows in Batch Tracking
  2. Verify column D contains Size/Size Range for both
  3. Verify column E contains Variant/Region for both
  4. Verify column H contains calculated Running Total for both

---

## Impact

### Benefits ✅
- **Consistent data structure** across Production and Packing apps
- **Accurate running totals** for WIP tracking
- **Correct column alignment** in Batch Tracking sheet
- **Better audit trail** with actual remaining weights

### Breaking Changes ⚠️
- None - Both apps now write correct 12-column format
- Old data in sheet (if any) may have 13 columns from Production
- New data will have 12 columns (correctly aligned)
- No need to modify existing sheet structure - just deploy updated apps

---

## Files Modified

1. **apps/production/src/components/ProductionForm.jsx**
   - Line 269: Removed `seedVariety || 'N/A'` from trackingRow
   - Now writes 12 columns matching spec

2. **apps/packing/src/components/PackingFormNew.jsx**
   - Line 422: Added calculation `const newRunningTotal = wipRemaining - calculatedWeight;`
   - Line 431: Changed from `''` to `newRunningTotal.toFixed(3)`
   - Now writes calculated running total instead of empty string

---

## Commit

```
Commit: 99055c9
Branch: claude/investigate-project-issues-011CURBwVpKVZaje5WGHbeHR
Message: Fix Batch Tracking sheet misalignment
```

---

## Next Steps

1. **Deploy updated apps** to Netlify
2. **Test both Production and Packing apps** with new entries
3. **Verify Batch Tracking sheet** shows aligned data
4. **Optional**: Clean up old misaligned data if needed (manual sheet editing)

---

Last Updated: October 26, 2025
Fixed By: Claude Code
Issue: Batch Tracking sheet misalignment while recording packing
