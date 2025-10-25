# Troubleshooting Apps Showing Nothing

## Quick Fixes

### Production App - Empty Summary/Batches

**Problem**: Today's summary and recent batches show nothing

**Causes**:
1. Google Sheet "Daily - Jul 2025" doesn't exist or is empty
2. Google Sheet "Batch Master" doesn't exist or is empty  
3. Column names don't match exactly
4. API Key not set or wrong Spreadsheet ID

**Fix**:
- Check sheet names exist: "Daily - Jul 2025" and "Batch Master"
- Verify data exists in sheets
- Check Netlify environment variables are correct
- See full guide in repository

### Inventory App - WIP Not Showing

**Problem**: WIP inventory section empty

**Cause**: No ACTIVE batches in "Batch Master" sheet

**Fix**: Add batches with Status = "ACTIVE" in "Batch Master" sheet

### Inventory App - Status Shows "?"

**Problem**: Status column shows "?" instead of OK/LOW/CRITICAL

**Cause**: "Status" column in "Finished Goods Inventory" sheet is empty or has wrong values

**Fix**: Status must be exactly one of: OK, LOW, CRITICAL, OUT

See TROUBLESHOOTING_EMPTY_SHEETS_FULL.md for complete guide
