# Settings Sheet Structure (v2.0 - Column-Based)

## Overview

The Settings sheet uses a **column-based layout** for easy data entry and scalability. Each column header defines the type of data, and you add values by adding more rows.

**Key Benefits:**
- Add new data by simply adding rows (never breaks)
- Easy to maintain and update
- Clear visibility of all settings
- No formula disruption

---

## Main Settings Sheet Structure

### Column Headers (Row 1)

Your Settings sheet should have these column headers in Row 1:

| Column | Header Name | Description |
|--------|-------------|-------------|
| A | Products | Product type names |
| B | Product Codes | Product codes (e.g., SUNFLOWER) |
| C | Batch Prefix | Batch ID prefix (e.g., SUN) |
| D | Varieties (Sunflower) | Seed varieties for Sunflower |
| E | Varieties (Melon) | Seed varieties for Melon |
| F | Varieties (Pumpkin) | Seed varieties for Pumpkin |
| G | Varieties (Peanuts) | Seed varieties for Peanuts |
| H | Sunflower Sizes | Size ranges (e.g., 200-210) |
| I | Regions | Region/Variant names |
| J | Region Codes | Region codes (e.g., EASTERN) |
| K | Employees | Employee names |
| L | Bag Codes | Bag type codes (e.g., 25KG) |
| M | Bag Labels | Bag display labels |
| N | Bag Weights | Weight per bag in kg |
| O | Diesel Truck Labels | Diesel truck names |
| P | Diesel Truck Capacities | Diesel capacity in liters |
| Q | Wastewater Truck Labels | Wastewater truck names |
| R | Wastewater Truck Capacities | Wastewater capacity in liters |
| S | Route Codes | Delivery route codes |
| T | Route Names | Delivery route names |
| U | Route Regions | Route region assignment |
| V | Config Keys | System configuration keys |
| W | Config Values | System configuration values |

---

## Example Settings Sheet

```
| Products        | Product Codes | Batch Prefix | Varieties (Sunflower) | Varieties (Melon) | Varieties (Pumpkin) | Sunflower Sizes | Regions          | Region Codes | Employees | Bag Codes | Bag Labels | Bag Weights | Diesel Truck Labels | Diesel Truck Capacities | Config Keys          | Config Values |
|-----------------|---------------|--------------|----------------------|-------------------|---------------------|-----------------|------------------|--------------|-----------|-----------|------------|-------------|---------------------|-------------------------|----------------------|---------------|
| Sunflower Seeds | SUNFLOWER     | SUN          | T6                   | Shabah            | Shine Skin          | 200-210         | Eastern Province | EASTERN      | Sikander  | 25KG      | 25 kg      | 25          | Small (6,000 L)     | 6000                    | NORMAL_LOSS_PERCENT  | 2             |
| Melon Seeds     | MELON         | MEL          | 361                  | Roomy             | Lady Nail           | 210-220         | Riyadh           | RIYADH       | Shihan    | 20KG      | 20 kg      | 20          | Medium (7,000 L)    | 7000                    | SALT_BAG_WEIGHT      | 50            |
| Pumpkin Seeds   | PUMPKIN       | PUM          | 363                  |                   |                     | 220-230         | Bahrain          | BAHRAIN      | Ajmal     | OTHER     | Other      | 0           | Large (15,000 L)    | 15000                   | LOW_STOCK_THRESHOLD  | 100           |
| Peanuts         | PEANUTS       | PEA          | 601                  |                   |                     | 230-240         | Qatar            | QATAR        | Ram       |           |            |             |                     |                         |                      |               |
|                 |               |              | S9                   |                   |                     | 240-250         |                  |              | Mushraf   |           |            |             |                     |                         |                      |               |
|                 |               |              |                      |                   |                     | 250-260         |                  |              | Ugrah     |           |            |             |                     |                         |                      |               |
```

---

## How to Add New Data

### Adding a New Product
1. Find the next empty row in the Products section
2. Fill in: Products, Product Codes, Batch Prefix columns

### Adding a New Employee
1. Find the Employees column (K)
2. Add the employee name in the next empty row

### Adding a New Seed Variety
1. Find the appropriate variety column (D-G based on product type)
2. Add the variety name in the next empty row

### Adding a New Region
1. Find Regions (I) and Region Codes (J) columns
2. Add both values in the next empty row

### Adding a New Sunflower Size
1. Find Sunflower Sizes column (H)
2. Add the size range in the next empty row

### Adding System Configuration
1. Find Config Keys (V) and Config Values (W) columns
2. Add key and value in the next empty row

---

## Supported Configuration Keys

| Config Key | Description | Default |
|------------|-------------|---------|
| NORMAL_LOSS_PERCENT | Production loss percentage | 2 |
| SALT_BAG_WEIGHT | Weight of salt bag in kg | 50 |
| LOW_STOCK_THRESHOLD | Low stock alert threshold | 100 |

---

## Flexible Column Headers

The system recognizes multiple variations of column headers:

| Setting | Accepted Headers |
|---------|------------------|
| Products | `Products`, `Product Names`, `Product` |
| Product Codes | `Product Codes`, `Product Code`, `Codes` |
| Batch Prefix | `Batch Prefix`, `BatchPrefix`, `Prefix` |
| Sunflower Sizes | `Sunflower Sizes`, `Sizes`, `Size Ranges` |
| Regions | `Regions`, `Region Names`, `Region` |
| Region Codes | `Region Codes`, `Region Code` |
| Employees | `Employees`, `Employee Names`, `Employee` |
| Bag Codes | `Bag Codes`, `Bag Code`, `Bag Type` |
| Bag Labels | `Bag Labels`, `Bag Label` |
| Bag Weights | `Bag Weights`, `Bag Weight`, `Weight (kg)` |
| Config Keys | `Config Keys`, `Config Key`, `Setting` |
| Config Values | `Config Values`, `Config Value`, `Value` |

---

## Stock Level Settings (SKU-Based)

For Finished Goods stock levels, use a separate section or sheet:

| Row | Column A | Column B | Column C | Column D | Column E |
|-----|----------|----------|----------|----------|----------|
| 1   | SKU      | SS-200G  | SS-100G  | PS-15G   | PC-CHEESE|
| 2   | Min Level| 100      | 150      | 50       | 200      |
| 3   | Max Level| 500      | 800      | 300      | 1000     |
| 4   | Reorder  | 200      | 300      | 100      | 400      |

### Stock Level Status Colors

| Status | Condition | Color | Action Required |
|--------|-----------|-------|-----------------|
| Critical | Current < 20% of Min | Red | Immediate reorder required |
| Low Stock | Current < 50% of Min | Orange | Reorder soon |
| Below Minimum | Current < Min | Yellow | Reorder recommended |
| Optimal Level | Min <= Current <= Max | Green | No action needed |
| Above Maximum | Max < Current <= 150% of Max | Blue | Monitor stock |
| Overstock | Current > 150% of Max | Purple | Consider redistribution |

---

## Integration with Apps

The following apps read from the Settings sheet:

| App | Settings Used |
|-----|---------------|
| **Production** | Products, Seed Varieties, Sizes, Regions, Employees, Bag Types, Trucks, Config |
| **Packing** | Products, Regions (for batch labels) |
| **Inventory Dashboard** | Stock level settings (Min/Max) |
| **Raw Material** | Products, Config |
| **Stock Outwards** | Products, Regions |

---

## Notes

- Settings are cached for 30 seconds for performance
- Empty cells are ignored (different columns can have different row counts)
- Column order doesn't matter - headers are matched by name
- Case-insensitive header matching
- Duplicate values are automatically filtered out
