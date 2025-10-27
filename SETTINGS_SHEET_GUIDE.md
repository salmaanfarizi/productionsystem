# Settings Sheet Structure

## Overview
The Settings sheet allows you to configure all apps without changing code. All apps will read from this single sheet for configuration values.

---

## Sheet Name: `Settings`

### Column Structure (8 columns):

| Column | Name | Description | Example |
|--------|------|-------------|---------|
| A | App | Which app uses this setting | Production, Packing, Inventory, Raw Material, All |
| B | Category | Setting category | Bag Types, Trucks, Products, etc |
| C | Key | Setting identifier | DIESEL_TRUCK_SMALL, BAG_25KG, etc |
| D | Value | The actual value | 6000, 25, Eastern Province |
| E | Unit | Unit of measurement (optional) | L, KG, Days, % |
| F | Display Label | Human-readable label | Small Truck (6,000 L) |
| G | Active | Is this setting active? | TRUE, FALSE |
| H | Notes | Additional info | Used for production entry |

---

## Settings Data

### Production App Settings

#### Bag Types
```
App           Category    Key         Value   Unit   Display Label        Active   Notes
Production    Bag Types   BAG_25KG    25      KG     25 kg               TRUE     Standard bag
Production    Bag Types   BAG_20KG    20      KG     20 kg               TRUE     Alternative bag
Production    Bag Types   BAG_OTHER   0       KG     Other (Enter)       TRUE     Custom weight
```

#### Diesel Trucks
```
Production    Trucks      DIESEL_SMALL    6000    L    Small (6,000 L)     TRUE    Standard small
Production    Trucks      DIESEL_MEDIUM   7000    L    Medium (7,000 L)    TRUE    Standard medium
Production    Trucks      DIESEL_LARGE    15000   L    Large (15,000 L)    TRUE    Large capacity
```

#### Wastewater Trucks
```
Production    Trucks      WASTE_SMALL     10000   L    Small (10,000 L)    TRUE    Small wastewater
Production    Trucks      WASTE_LARGE     22000   L    Large (22,000 L)    TRUE    Large wastewater
```

#### Shifts
```
Production    Shifts      SHIFT_MORNING   Morning         Morning Shift       TRUE    6 AM - 2 PM
Production    Shifts      SHIFT_EVENING   Evening         Evening Shift       TRUE    2 PM - 10 PM
Production    Shifts      SHIFT_NIGHT     Night           Night Shift         TRUE    10 PM - 6 AM
```

---

### Packing App Settings

#### Regions
```
App       Category    Key                 Value               Display Label       Active   Notes
Packing   Regions     REGION_EASTERN      Eastern Province    Eastern Province    TRUE     Main region
Packing   Regions     REGION_RIYADH       Riyadh             Riyadh              TRUE     Central region
Packing   Regions     REGION_BAHRAIN      Bahrain            Bahrain             TRUE     Export region
Packing   Regions     REGION_QATAR        Qatar              Qatar               TRUE     Export region
```

#### Stock Thresholds
```
Packing   Thresholds  LOW_STOCK_LEVEL     20      %      Low Stock Alert         TRUE     Alert at 20%
Packing   Thresholds  CRITICAL_LEVEL      10      %      Critical Level          TRUE     Alert at 10%
Packing   Thresholds  AUTO_REFRESH        30      Sec    Auto Refresh Interval   TRUE     Refresh every 30s
```

#### Batch Code Settings
```
Packing   Batch       PREFIX_EASTERN      ER              Eastern Region Code     TRUE     ER prefix
Packing   Batch       PREFIX_RIYADH       RY              Riyadh Region Code      FALSE    Not used yet
Packing   Batch       SEQUENCE_START      1               Starting Sequence       TRUE     Daily sequence
```

---

### Inventory App Settings

#### Stock Status Thresholds
```
App         Category    Key                 Value   Unit   Display Label       Active   Notes
Inventory   Status      STATUS_OK_MIN       110     %      OK Threshold        TRUE     >= 110% of min
Inventory   Status      STATUS_LOW_MIN      100     %      Low Threshold       TRUE     < 110%, >= 100%
Inventory   Status      STATUS_CRITICAL     100     %      Critical Threshold  TRUE     < 100% of min
```

#### Warehouses
```
Inventory   Warehouses  WH_DAMMAM          Dammam Store    Dammam Store        TRUE     Regional warehouse
Inventory   Warehouses  WH_RIYADH          Riyadh Store    Riyadh Store        TRUE     Regional warehouse
Inventory   Warehouses  WH_MAIN            Main Warehouse  Main Warehouse      TRUE     Primary facility
```

#### Salesmen (Dynamic - can add/remove)
```
Inventory   Salesmen    SALESMAN_1         Ahmed           Ahmed               TRUE     Sales rep 1
Inventory   Salesmen    SALESMAN_2         Mohammed        Mohammed            TRUE     Sales rep 2
Inventory   Salesmen    SALESMAN_3         Khalid          Khalid              TRUE     Sales rep 3
```

---

### Raw Material App Settings

#### Material Categories
```
App              Category        Key                     Value                       Active   Notes
Raw Material     Categories      CAT_BASE                Base Item                   TRUE     Seeds, corn, etc
Raw Material     Categories      CAT_FLAVOURS            Flavours and Additives      TRUE     Salt, flavours, oil
Raw Material     Categories      CAT_PACKING             Packing Material            TRUE     Boxes, rolls, covers
```

#### Expiry & Stock Settings
```
Raw Material     Alerts          EXPIRY_WARNING_DAYS     30      Days    Expiry Warning      TRUE     Warn 30 days before
Raw Material     Alerts          LOW_STOCK_THRESHOLD     20      %       Low Stock Alert     TRUE     Alert at 20%
Raw Material     Alerts          AUTO_DEDUCT             TRUE            Auto Deduct         TRUE     Auto-deduct materials
```

#### Sunflower Seeds Configuration
```
Raw Material     Sunflower       GRADE_T6                T6                  T6 Grade            TRUE     Standard grade
Raw Material     Sunflower       GRADE_361               361                 361 Grade           TRUE     Premium grade
Raw Material     Sunflower       GRADE_363               363                 363 Grade           TRUE     Premium grade
Raw Material     Sunflower       GRADE_601               601                 601 Grade           TRUE     Special grade
Raw Material     Sunflower       GRADE_S9                S9                  S9 Grade            TRUE     Special grade
Raw Material     Sunflower       SIZE_230_240            230-240             230-240 per 50g     TRUE     Small size
Raw Material     Sunflower       SIZE_240_250            240-250             240-250 per 50g     TRUE     Medium size
Raw Material     Sunflower       SIZE_250_260            250-260             250-260 per 50g     TRUE     Medium-Large
Raw Material     Sunflower       SIZE_260_270            260-270             260-270 per 50g     TRUE     Large size
Raw Material     Sunflower       SIZE_270_280            270-280             270-280 per 50g     TRUE     Large size
Raw Material     Sunflower       WEIGHT_20KG             20 kg               20 kg bags          TRUE     Small bags
Raw Material     Sunflower       WEIGHT_25KG             25 kg               25 kg bags          TRUE     Standard bags
Raw Material     Sunflower       WEIGHT_50KG             50 kg               50 kg bags          TRUE     Large bags
```

---

### Global Settings (All Apps)

#### System Configuration
```
App     Category    Key                     Value                       Display Label       Active   Notes
All     System      COMPANY_NAME            ARS Productions             Company Name        TRUE     Used in reports
All     System      TIMEZONE                Asia/Riyadh                 Timezone            TRUE     Saudi Arabia time
All     System      DATE_FORMAT             DD/MM/YYYY                  Date Format         TRUE     Display format
All     System      CURRENCY                SAR                         Currency            TRUE     Saudi Riyal
```

#### Google Sheets Configuration
```
All     Sheets      SPREADSHEET_ID          [Your Spreadsheet ID]       Spreadsheet ID      TRUE     Main spreadsheet
All     Sheets      AUTO_BACKUP             TRUE                        Auto Backup         TRUE     Daily backups
All     Sheets      BACKUP_RETENTION        30          Days            Backup Retention    TRUE     Keep 30 days
```

---

## How Apps Will Read Settings

### Example JavaScript Code:

```javascript
// Read settings from Google Sheets
async function getSettings(app, category) {
  const rawData = await readSheetData('Settings');
  const parsed = parseSheetData(rawData);

  return parsed.filter(row =>
    (row['App'] === app || row['App'] === 'All') &&
    row['Category'] === category &&
    row['Active'] === 'TRUE'
  );
}

// Example: Get all diesel truck options
const dieselTrucks = await getSettings('Production', 'Trucks');
// Returns: [
//   { Key: 'DIESEL_SMALL', Value: '6000', DisplayLabel: 'Small (6,000 L)' },
//   { Key: 'DIESEL_MEDIUM', Value: '7000', DisplayLabel: 'Medium (7,000 L)' },
//   { Key: 'DIESEL_LARGE', Value: '15000', DisplayLabel: 'Large (15,000 L)' }
// ]

// Example: Get sunflower grades
const sunflowerGrades = await getSettings('Raw Material', 'Sunflower');
```

---

## Setup Instructions

### Step 1: Create Settings Sheet

1. Open your Google Spreadsheet
2. Create new sheet named **`Settings`**
3. Add header row:
   ```
   App | Category | Key | Value | Unit | Display Label | Active | Notes
   ```

### Step 2: Add Initial Data

Copy and paste the data from sections above into your Settings sheet.

### Step 3: Format the Sheet

- **Freeze row 1** (header)
- **Column G (Active)**: Data validation → List: TRUE, FALSE
- **Column A (App)**: Data validation → List: Production, Packing, Inventory, Raw Material, All
- Add color coding:
  - Header row: Dark blue background, white text
  - Production rows: Light blue
  - Packing rows: Light green
  - Inventory rows: Light purple
  - Raw Material rows: Light orange
  - All rows: Light gray

---

## Benefits

✅ **No code changes** - Update settings without redeploying
✅ **Centralized** - All app configs in one place
✅ **Easy to manage** - Add/remove options via spreadsheet
✅ **Audit trail** - See all changes in sheet history
✅ **Flexible** - Active/Inactive toggle for easy testing
✅ **Documentation** - Notes column for context

---

## Adding New Settings

To add a new setting:

1. Add new row to Settings sheet
2. Set App, Category, Key, Value
3. Set Active = TRUE
4. Update app code to read the new setting
5. Deploy app

Example: Adding a new shift

```
Production | Shifts | SHIFT_AFTERNOON | Afternoon | Afternoon Shift | TRUE | 12 PM - 8 PM
```

---

## Next Steps

1. **Create the Settings sheet** using this structure
2. **Test reading settings** in one app first
3. **Gradually migrate** hardcoded configs to Settings sheet
4. **Update documentation** as you add new settings
