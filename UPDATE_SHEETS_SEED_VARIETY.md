# URGENT: Update Google Sheets - Add Seed Variety Column

## What Changed?

Added **Seed Variety (Crop Type)** field to Production app for ALL products:
- **Sunflower Seeds**: T6, 361, 363, 601, S9
- **Melon Seeds**: Shabah, Roomy
- **Pumpkin Seeds**: Shine Skin, Lady Nail
- **Peanuts**: (none for now)

This requires updating 3 Google Sheets to add a new column.

---

## ⚠️ CRITICAL: Update These Sheets NOW

### 1. Production Data Sheet

**Action**: Insert new column C "Seed Variety"

**Steps**:
1. Open: https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit
2. Go to "Production Data" sheet
3. **Right-click column C header** (Size Range)
4. Click **"Insert 1 column left"**
5. **Click on new column C** header
6. Type: **Seed Variety**

**New Header Order** (18 columns total):
```
A: Date
B: Product Type
C: Seed Variety          ← NEW!
D: Size Range            ← Was C
E: Variant/Region        ← Was D
F: Bag Type & Quantity   ← Was E
G: Raw Material Weight (T)
H: Normal Loss (T)
I: WIP Output (T)
J: Salt Bags
K: Salt Weight (kg)
L: Diesel Truck
M: Diesel Liters
N: Wastewater Truck
O: Wastewater Liters
P: Employee Overtime
Q: Notes
R: Timestamp
```

---

### 2. WIP Inventory Sheet

**Action**: Insert new column D "Seed Variety"

**Steps**:
1. Go to "WIP Inventory" sheet
2. **Right-click column D header** (Size Range)
3. Click **"Insert 1 column left"**
4. **Click on new column D** header
5. Type: **Seed Variety**

**New Header Order** (13 columns total):
```
A: WIP Batch ID
B: Date
C: Product Type
D: Seed Variety          ← NEW!
E: Size Range            ← Was D
F: Variant/Region        ← Was E
G: Initial WIP (T)       ← Was F
H: Consumed (T)          ← Was G
I: Remaining (T)         ← Was H
J: Status                ← Was I
K: Created               ← Was J
L: Completed             ← Was K
M: Notes                 ← Was L
```

---

### 3. Batch Tracking Sheet

**Action**: Insert new column D "Seed Variety"

**Steps**:
1. Go to "Batch Tracking" sheet
2. **Right-click column D header** (Size Range)
3. Click **"Insert 1 column left"**
4. **Click on new column D** header
5. Type: **Seed Variety**

**New Header Order** (13 columns total):
```
A: Timestamp
B: Batch/WIP ID
C: Product Type
D: Seed Variety          ← NEW!
E: Size Range            ← Was D
F: Variant/Region        ← Was E
G: Action                ← Was F
H: Weight Change (T)     ← Was G
I: Running Total (T)     ← Was H
J: Department            ← Was I
K: User                  ← Was J
L: Reference             ← Was K
M: Notes                 ← Was L
```

---

## ✅ Verification

After updating all 3 sheets, verify:

1. **Production Data** has 18 columns (A through R)
2. **WIP Inventory** has 13 columns (A through M)
3. **Batch Tracking** has 13 columns (A through M)
4. Column C in all sheets is "Seed Variety"
5. All other columns shifted right by 1

---

## 🧪 Test After Updating

1. **Pull latest code**:
   ```bash
   cd ~/Documents/productionsystem
   git pull origin claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4
   ```

2. **Test Production app**:
   ```bash
   cd apps/production
   npm run dev
   ```

3. **Create test entry**:
   - Product Type: **Sunflower Seeds**
   - **Seed Variety: T6** ← Should appear!
   - Size Range: 220-230
   - Region: Riyadh
   - Bags: 100 × 25kg
   - Submit

4. **Verify in sheets**:
   - ✅ "Production Data" column C shows: **T6**
   - ✅ "WIP Inventory" column D shows: **T6**
   - ✅ "Batch Tracking" column D shows: **T6**

---

## 🎯 Expected Behavior

**For ALL products**, after selecting Product Type:
- **Seed Variety dropdown appears**
- **Sunflower**: T6, 361, 363, 601, S9
- **Melon**: Shabah, Roomy
- **Pumpkin**: Shine Skin, Lady Nail
- **Peanuts**: (none yet - field hidden)

**Only for Sunflower**:
- Size Range and Variant/Region fields still appear
- Order: Product Type → Seed Variety → Size Range → Variant/Region

---

## ❌ What Happens If You Don't Update Sheets?

If you try to use the app without updating sheets:
- Data will be misaligned in columns
- Size Range will show in Seed Variety column
- Existing data might get corrupted
- **DO NOT use the app until sheets are updated!**

---

## 📞 Questions?

- **What is Seed Variety?** = Crop type/strain (T6, Shabah, Shine Skin, etc.)
- **What is Size Range?** = Seed count per 50g (220-230 means 220-230 seeds per 50g) - Sunflower only
- **What is Variant/Region?** = Destination region (Eastern Province, Riyadh, etc.) - Sunflower only

---

**Status**: ⚠️ **UPDATE SHEETS BEFORE USING APP**

**Time Required**: ~5 minutes

**Difficulty**: Easy (just insert 3 columns)
