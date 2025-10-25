# Issues and Feature Requests - Implementation Plan

Based on user feedback, here are the issues to fix and features to add:

---

## 🐛 Issues to Fix

### 1. Production App - Summary/Batches Empty
**Status**: This is a data/configuration issue, not a code bug

**Root Cause Options**:
- Sheet "Daily - Jul 2025" doesn't exist or is empty
- Sheet "Batch Master" doesn't exist or has no data
- API Key not configured
- Wrong Spreadsheet ID

**Solution**: See TROUBLESHOOTING_EMPTY_SHEETS.md

---

### 2. Inventory App - WIP Inventory Not Showing
**Status**: Data issue

**Root Cause**: No batches with Status = "ACTIVE" in "Batch Master" sheet

**Solution**: Add data to Google Sheets

---

### 3. Inventory App - Minimum Stock Shows "?", Status Shows "?"
**Status**: Data issue

**Root Cause**: "Status" column in "Finished Goods Inventory" has invalid/empty values

**Expected Values**: OK, LOW, CRITICAL, OUT
**Solution**: Fix Status column in Google Sheets

---

## ✨ Features to Add

### Feature 1: PDF Generation for Production App
**Request**: "It is better that you have a PDF generation for production too"

**Implementation Plan**:
1. Add jsPDF library to production app (already in packing)
2. Create ProductionPDFGenerator component
3. Add "Export PDF" button to ProductionSummary
4. Include:
   - Today's production summary
   - List of entries for the day
   - Batch numbers created
   - Total weight produced

**Files to Create/Modify**:
- `apps/production/package.json` - Add jsPDF dependency
- `apps/production/src/components/ProductionPDFGenerator.jsx` - New file
- `apps/production/src/components/ProductionSummary.jsx` - Add export button

**Priority**: Medium
**Complexity**: Low (similar to packing PDF)

---

### Feature 2: Low Stock Alert Popup in Packing App
**Request**: "I need to see on the screen what all items to be produced to achieve minimum level as a pop-up or something whenever I open the app"

**Implementation Plan**:
1. Read "Finished Goods Inventory" sheet
2. Filter items where Current Stock < Minimum Stock
3. Show modal/popup on app load if low stock items exist
4. Display:
   - Product name
   - Current stock
   - Minimum stock
   - Quantity needed to reach minimum
5. Add "Don't show again today" option (localStorage)
6. Add manual button to re-open alert

**Files to Create/Modify**:
- `apps/packing/src/components/LowStockAlert.jsx` - New component
- `apps/packing/src/App.jsx` - Add alert on mount

**Priority**: HIGH
**Complexity**: Medium

---

### Feature 3: Batch Number Generator for Packet Printing
**Request**: "I need to generate a batch number to print on the packets according to the quantity left from the WIP and it should be changed accordingly and it is also pop up in the screen as batch number to print"

**Implementation Plan**:
1. When packing entry is submitted:
   - Calculate which WIP batch(es) were consumed
   - Get WIP batch ID(s)
   - Generate print label batch number
2. Show popup after submission with:
   - Batch number(s) to print on packets
   - WIP source batch ID
   - Quantity packed
   - Print-friendly format
3. Add "Print Label" button to generate PDF label
4. Label should include:
   - Product name + size
   - Batch number (from WIP)
   - Production date
   - Quantity
   - Barcode (optional)

**Files to Create/Modify**:
- `apps/packing/src/components/BatchLabelPopup.jsx` - New component
- `apps/packing/src/components/BatchLabelPDF.jsx` - New PDF generator
- `apps/packing/src/components/PackingFormNew.jsx` - Show popup after submit
- `shared/utils/batchGenerator.js` - Add label generation logic

**Priority**: HIGH
**Complexity**: High

---

## 📋 Implementation Order

1. ✅ **DONE**: Troubleshooting documentation
2. **NEXT**: Feature 2 - Low Stock Alert (HIGH priority, medium complexity)
3. **THEN**: Feature 3 - Batch Label Generator (HIGH priority, high complexity)
4. **FINALLY**: Feature 1 - Production PDF (Medium priority, low complexity)

---

## ⏱️ Time Estimates

- Feature 2 (Low Stock Alert): 30-45 minutes
- Feature 3 (Batch Labels): 60-90 minutes
- Feature 1 (Production PDF): 20-30 minutes

**Total**: ~2-3 hours of development

---

## 🚀 Next Steps

1. Get confirmation on requirements
2. Implement features in order of priority
3. Test each feature
4. Commit and deploy
5. Verify on live sites

---

Last Updated: October 24, 2025
