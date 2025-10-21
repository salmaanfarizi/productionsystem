# Production Department App

## Status: Coming Soon

This app will handle daily production data entry for the Production department.

## Planned Features

1. **Daily Production Entry Form**
   - Date selection
   - Product type and seed type selection
   - Quantity and weight input
   - Production variant tracking
   - Batch creation automation

2. **Production Dashboard**
   - Daily production summary
   - Production targets vs actual
   - Quality metrics
   - Equipment status

3. **Batch Generation**
   - Automatic batch creation from production data
   - Batch ID generation
   - Link production rows to batches
   - Weight aggregation for same products

4. **Real-time Google Sheets Sync**
   - Write to `Daily - Jul 2025` sheet
   - Auto-create `Batch Master` entries
   - Update `Batch Tracking` logs

## Data Structure

### Production Sheet Columns
```
A: Date
B: Production Type
C: Seed Type (T6, 361, 363, 601, S9)
D: Size
E: (custom field)
F: Variant
G: Quantity
H: Weight (Tonnes)
...
Q: Batch ID (auto-generated)
```

## To Build This App

1. Copy the structure from `apps/packing`
2. Create production-specific components:
   - `ProductionForm.jsx`
   - `ProductionDashboard.jsx`
   - `BatchCreator.jsx`
3. Configure for port 3000
4. Deploy to separate Netlify site

## Related Documentation

- Main README: `../../README.md`
- Google Sheets Setup: `../../GOOGLE_SHEETS_SETUP.md`
- Batch Generator: `../../shared/utils/batchGenerator.js`
- Products Config: `../../shared/config/products.js`

---

For questions contact the development team.
