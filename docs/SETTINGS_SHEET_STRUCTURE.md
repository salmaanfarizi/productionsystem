# Settings Sheet Structure

## Overview
The Settings sheet uses a **column-based layout** for easy data entry. This structure allows you to add new products by simply adding columns instead of inserting rows.

## Sheet Structure

The Settings sheet in your Google Spreadsheet should be structured as follows:

| Row | Column A | Column B | Column C | Column D | Column E | ... |
|-----|----------|----------|----------|----------|----------|-----|
| 1   | SKU      | SS-200G  | SS-100G  | PS-15G   | PC-CHEESE| ... |
| 2   | Min Level| 100      | 150      | 50       | 200      | ... |
| 3   | Max Level| 500      | 800      | 300      | 1000     | ... |
| 4   | Reorder  | 200      | 300      | 100      | 400      | ... |

### Row Definitions

- **Row 1: SKU Codes** - Product SKU identifiers (e.g., SS-200G, SS-100G, PS-15G)
- **Row 2: Min Level** - Minimum stock level threshold
- **Row 3: Max Level** - Maximum stock level threshold
- **Row 4: Reorder Point** - Recommended reorder point (optional)

### Stock Level Status

Based on the current stock quantity and the Min/Max levels defined in the Settings sheet, the system will automatically calculate the stock status:

| Status | Condition | Color | Action Required |
|--------|-----------|-------|-----------------|
| 🔴 **Critical** | Current < 20% of Min | Red | **Immediate reorder required** |
| 🟠 **Low Stock** | Current < 50% of Min | Orange | **Reorder soon** |
| 🟡 **Below Minimum** | Current < Min | Yellow | **Reorder recommended** |
| 🟢 **Optimal Level** | Min ≤ Current ≤ Max | Green | No action needed |
| 🔵 **Above Maximum** | Max < Current ≤ 150% of Max | Blue | Monitor stock |
| 🟣 **Overstock** | Current > 150% of Max | Purple | **Consider redistribution** |

## Adding New Products

To add a new product to the settings:

1. Open your Google Spreadsheet
2. Go to the **Settings** sheet
3. Find the next available column (e.g., Column F if E is the last used)
4. Add the product details:
   - Row 1: SKU code (e.g., `MS-15G`)
   - Row 2: Minimum level (e.g., `100`)
   - Row 3: Maximum level (e.g., `500`)
   - Row 4: Reorder point (e.g., `200`)

## Example

```
A         | B        | C        | D       | E          | F
----------|----------|----------|---------|------------|----------
SKU       | SS-200G  | SS-100G  | PS-15G  | PC-CHEESE  | MS-15G
Min Level | 100      | 150      | 50      | 200        | 100
Max Level | 500      | 800      | 300     | 1000       | 500
Reorder   | 200      | 300      | 100     | 400        | 200
```

## Benefits of Column-Based Layout

1. **Easy to Add Products**: Simply add a new column instead of inserting rows
2. **Clear Visibility**: All settings for a product are in a single column
3. **No Formula Disruption**: Adding columns doesn't break formulas in other sheets
4. **Scalable**: Can easily accommodate hundreds of products
5. **Simple Updates**: Quick to find and update settings for specific products

## Integration with Apps

The following apps read from the Settings sheet:

- **Inventory Dashboard** - Displays stock level alerts based on these settings
- **Raw Material App** - Uses min/max levels for alerts (future)
- **Stock Outwards App** - May use reorder points for recommendations (future)

## Notes

- If no settings are defined for a SKU, the system will use default values
- Settings are cached for 1 hour to improve performance
- Changes to the Settings sheet may take up to 1 hour to reflect (or trigger a manual refresh)
- All numeric values should be positive numbers
- Leave cells empty or set to 0 if no threshold is required
