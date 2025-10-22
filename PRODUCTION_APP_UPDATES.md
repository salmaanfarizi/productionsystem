# Production App - Complete Redesign

## Status: IN PROGRESS ⚠️

I'm redesigning the Production app based on your requirements. Here's what's changing:

---

## ✅ Completed

### 1. Product Configuration (`shared/config/production.js`)
Created comprehensive configuration file with:

**Products**:
- Sunflower Seeds (with size ranges and variants)
- Melon Seeds (no size/variant)
- Pumpkin Seeds (no size/variant)
- Peanuts (no size/variant)

**Sunflower Specifics**:
- Size Ranges: 200-210, 210-220, 220-230, 230-240, 240-250, 250-260, 260-270, 270-280, 280-290, 290-300
- Variants: Eastern Province Region, Riyadh Region, Bahrain, Qatar

**Bag Types**:
- 25 kg bags
- 20 kg bags

**Salt**:
- 50 kg bags

**Employees (for overtime)**:
- Sikander
- Shihan
- Ajmal Ihjas
- Ram
- Mushraf
- Ugrah

**Diesel Trucks**:
- 7,000 L
- 6,000 L
- 12,000 L
- 15,000 L

**Wastewater Trucks**:
- 10,000 L
- 22,000 L

**Business Logic**:
- 2% normal loss calculation (Raw → WIP)

---

## 🚧 In Progress

### 2. Production Form Component
Creating comprehensive form with sections:

1. **Basic Information**
   - Date
   - Product Type (dropdown)
   - Size Range (conditional - only for Sunflower)
   - Variant/Region (conditional - only for Sunflower)

2. **Raw Material Input**
   - Bag Type (25kg or 20kg)
   - Number of Bags
   - Auto-calculated Total Weight

3. **Production Output Display**
   - Raw Material Weight
   - 2% Normal Loss
   - WIP Output (Raw - Loss)

4. **Salt Consumption**
   - Number of 50kg bags
   - Auto-calculated total salt weight

5. **Employee Overtime**
   - 6 employees with hours input fields

6. **Diesel Filling**
   - Truck capacity selector
   - Liters filled

7. **Wastewater Collection**
   - Truck capacity selector
   - Liters collected

8. **Notes**
   - Free text field

### 3. Google Sheets Structure

**Need to create/update these sheets:**

####  "Production Data" Sheet
Columns:
1. Date
2. Product Type
3. Size Range (N/A for non-sunflower)
4. Variant/Region (N/A for non-sunflower)
5. Bag Type & Quantity
6. Raw Material Weight (T)
7. Normal Loss (T)
8. WIP Output (T)
9. Salt Bags
10. Salt Weight (kg)
11. Diesel Truck
12. Diesel Liters
13. Wastewater Truck
14. Wastewater Liters
15. Employee Overtime
16. Notes
17. Timestamp

#### "WIP Inventory" Sheet
Columns:
1. Date
2. Product Type
3. Size Range
4. Variant
5. WIP Weight (T)
6. Source
7. Notes
8. Timestamp

---

## ⏭️ Next Steps

### Step 1: Complete Form Component
I need to finish writing the comprehensive production form component file.

### Step 2: Update Google Sheets
You'll need to:
1. Create "Production Data" sheet with proper columns
2. Create "WIP Inventory" sheet with proper columns
3. Optionally create "Settings" sheet for configurable data

### Step 3: Test Complete Workflow
1. Record a Sunflower production (should show size & variant fields)
2. Record a Peanuts production (should NOT show size & variant)
3. Verify 2% loss calculation
4. Check all data saves to sheets correctly

---

## Configurability

To make items configurable in the future, we should create a "Settings" sheet with these tabs:

1. **Products** - List of product types
2. **Sunflower Sizes** - Size ranges
3. **Sunflower Variants** - Regional variants
4. **Employees** - Employee names
5. **Diesel Trucks** - Truck capacities
6. **Wastewater Trucks** - Truck capacities
7. **Parameters** - Normal loss percentage, etc.

The app would read from these sheets on load instead of hardcoded values.

---

## Questions for You

Before I continue, please confirm:

1. **Google Sheets**: Should I create new sheets or use existing ones?
   - Do you already have "Daily - Jul 2025" sheet or should we create new "Production Data"?

2. **Batch System**: Do you still want automatic batch creation from production data?
   - Or should production just go to WIP inventory?

3. **Packing Integration**: The packing app currently expects batches from "Batch Master"
   - Should we keep that or change it to read from "WIP Inventory"?

4. **Settings Sheet**: Do you want the configurable settings sheet now or later?

---

## How to Test Current Progress

```bash
cd ~/Documents/productionsystem/apps/production

# Pull latest changes
cd ~/Documents/productionsystem
git pull origin claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4

# Check new config file
cat shared/config/production.js

# The form component is being updated...
```

---

**Status**: Waiting for your confirmation on questions above before proceeding.

I can either:
- **Option A**: Complete the redesign as planned (create new sheets, full rebuild)
- **Option B**: Integrate with existing batch system (modify existing approach)
- **Option C**: Hybrid approach (keep batches, add new production fields)

**Which option do you prefer?**
