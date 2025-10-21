# Batch Tracking System v2.0 - Documentation

## Table of Contents
1. [Overview](#overview)
2. [What's New](#whats-new)
3. [Installation](#installation)
4. [Features](#features)
5. [User Guide](#user-guide)
6. [Technical Details](#technical-details)
7. [Troubleshooting](#troubleshooting)

## Overview

The Integrated Batch Tracking System v2.0 is a comprehensive solution for tracking production batches from creation through consumption in packing operations. It provides:

- Automated batch generation from production data
- FIFO (First-In-First-Out) batch consumption tracking
- Real-time inventory management
- Complete traceability and reporting
- Modern, user-friendly web interface

## What's New

### Major Improvements Over v1.0

#### 1. **No More Hardcoded Spreadsheet IDs**
- System now automatically uses the active spreadsheet
- More portable and easier to deploy

#### 2. **Modern HTML User Interface**
- Interactive dashboard with real-time updates
- Intuitive forms with validation
- Visual charts and analytics
- Mobile-responsive design

#### 3. **Enhanced Error Handling**
- Comprehensive input validation
- Graceful error recovery
- User-friendly error messages
- Detailed logging for troubleshooting

#### 4. **Improved Data Management**
- Efficient data access patterns
- Automatic data validation
- Safe number parsing
- Consistent date formatting

#### 5. **Better User Experience**
- Loading indicators during operations
- Progress bars for batch consumption
- Auto-calculation of totals
- Quick-fill buttons for common values
- Search and filter functionality

#### 6. **Advanced Features**
- Batch search with multiple criteria
- Visual analytics dashboard
- Product consumption analysis
- Status tracking with color coding
- Export-ready reports

## Installation

### Step 1: Setup Google Apps Script

1. Open your Google Spreadsheet
2. Go to **Extensions > Apps Script**
3. Delete any existing code in `Code.gs`
4. Copy the entire contents of `batch-tracking-improved.gs`
5. Paste it into the Apps Script editor
6. Save the project (name it "Batch Tracking System v2")

### Step 2: Add HTML Files

For each HTML file (Dashboard.html, PackingForm.html, Analytics.html, BatchSearch.html):

1. In the Apps Script editor, click **File > New > HTML file**
2. Name the file exactly as shown (e.g., "Dashboard" for Dashboard.html)
3. Copy and paste the corresponding HTML code
4. Save the file

Your file structure should look like:
```
batch-tracking-improved.gs
Dashboard.html
PackingForm.html
Analytics.html
BatchSearch.html
```

### Step 3: Initialize the System

1. Refresh your spreadsheet
2. You'll see a new menu: **Batch System**
3. Click **Batch System > Initialize System**
4. Authorize the script when prompted
5. Wait for confirmation message

The system will create the following sheets:
- Batch Master
- Batch Tracking
- Packing Consumption
- Batch History

### Step 4: Configure Production Sheet

Ensure your production sheet name matches the configuration:
- Default: `Daily - Jul 2025`
- To change: Edit `BATCH_CONFIG.SHEETS.PRODUCTION` in the code

## Features

### 1. Dashboard
Access: **Batch System > Dashboard**

Features:
- Overview statistics (Total, Active, Complete, Remaining weight)
- Active batches list with status
- Quick actions buttons
- Filter by seed type and size
- Real-time updates

### 2. Process Production
Access: **Batch System > Process Today's Production**

Features:
- Automatically scans production sheet for today's entries
- Creates new batches for new products
- Adds weight to existing batches for continued production
- Marks processed rows to prevent duplicates
- Shows summary of batches created

### 3. Packing Consumption
Access: **Batch System > Packing Consumption**

Features:
- User-friendly form with validation
- Real-time batch availability check
- Automatic weight calculation
- Quick-fill buttons for standard package sizes
- FIFO batch consumption
- Automatic batch completion when depleted
- Multi-batch consumption support

### 4. Batch Search
Access: **Batch System > Search Batches**

Features:
- Full-text search across all batch data
- Filter by status, seed type, size, variant
- Detailed batch information modal
- Progress visualization
- Sortable results

### 5. Analytics
Access: **Batch System > Analytics**

Features:
- Overview metrics
- Status distribution chart
- Weight by product analysis
- Weight by variant analysis
- Product summary with consumption percentages

## User Guide

### Creating Batches from Production

1. Enter production data in your production sheet
2. Click **Batch System > Process Today's Production**
3. Review the summary of batches created
4. Check the Dashboard to see active batches

**What Happens:**
- System scans for unprocessed production entries
- Creates new batch with unique ID (format: BT6-250120-001)
- Adds weight to existing batch if same product is running
- Links batch to production rows for traceability

### Recording Packing Consumption

1. Click **Batch System > Packing Consumption**
2. Select seed type, size, and variant
3. Check available batch information
4. Enter SKU and package details
5. Use quick-fill buttons or manual entry for package size
6. Enter number of packages
7. Review auto-calculated total weight
8. Add operator info and notes (optional)
9. Click **Submit Consumption**

**What Happens:**
- System finds oldest active batch (FIFO)
- Deducts weight from batch
- If batch depleted, marks as complete and moves to next batch
- Records consumption details with timestamp
- Updates all related sheets

### Searching for Batches

1. Click **Batch System > Search Batches**
2. Enter search term (batch ID, product, etc.)
3. Apply filters as needed
4. Click on any batch card for detailed information
5. Use "Clear All Filters" to reset

### Viewing Analytics

1. Click **Batch System > Analytics**
2. Review metrics and charts
3. Analyze weight distribution
4. Check consumption patterns
5. Use "Refresh Analytics" for latest data

## Technical Details

### Batch ID Format

```
{PREFIX}-{YYMMDD}-{SEQ}

Example: BT6-250120-001
- BT6: Seed type prefix (configured in BATCH_CONFIG.BATCH_PREFIX)
- 250120: Date (Jan 20, 2025)
- 001: Sequence number for the day
```

### Data Validation

The system validates:
- Required fields (seed type, size, weight, SKU)
- Numeric values (weights, quantities)
- Batch availability before consumption
- Sufficient inventory before processing

### Status Types

- **ACTIVE**: Batch has remaining inventory
- **COMPLETE**: Batch fully consumed
- **ON_HOLD**: Batch temporarily paused (manual)

### FIFO Logic

When consuming batches:
1. System finds oldest active batch for product
2. Consumes from that batch first
3. If batch depleted, moves to next oldest
4. Continues until requested quantity fulfilled

### Traceability

Each batch records:
- Production date and time
- Source production rows
- All weight additions
- All consumption events
- Operator information
- Timestamps for all actions

## Troubleshooting

### Common Issues

#### "Required sheets not found"
**Solution:** Run **Batch System > Initialize System**

#### "No active batches available"
**Solution:** Process production data first using **Process Today's Production**

#### "Insufficient batch quantity"
**Solution:**
- Check available inventory in Dashboard
- Process more production
- Verify product specifications match

#### Batch not appearing in Dashboard
**Solution:**
- Click "Refresh Data"
- Check batch status (may be complete)
- Verify filters are not excluding it

#### Authorization errors
**Solution:**
- Re-authorize the script
- Check user permissions on spreadsheet
- Ensure script is saved

### Data Issues

#### Duplicate batches
**Solution:**
- Check production sheet column Q for batch IDs
- Don't reprocess already-processed rows
- Use search to find existing batches

#### Incorrect weights
**Solution:**
- Verify production data accuracy
- Check unit consistency (tonnes)
- Review Batch Tracking sheet for history

### Performance Issues

#### Slow loading
**Solution:**
- Archive old completed batches
- Limit number of active batches
- Close unused sidebar panels

## Best Practices

### Daily Operations

1. **Morning:**
   - Open Dashboard to review overnight batches
   - Process previous day's production if needed

2. **During Production:**
   - Process production data in batches (daily recommended)
   - Monitor active batches for upcoming depletions

3. **Packing Operations:**
   - Record consumption as it happens
   - Verify batch availability before starting run
   - Add notes for any irregularities

4. **End of Day:**
   - Review Analytics for consumption patterns
   - Check for any on-hold batches
   - Verify all consumption recorded

### Data Maintenance

- **Weekly:** Review and archive completed batches
- **Monthly:** Export Batch History for records
- **Quarterly:** Analyze trends in Analytics dashboard

### Tips for Accuracy

1. Always process production on the same day when possible
2. Record packing consumption immediately
3. Use notes field for special circumstances
4. Verify package calculations before submitting
5. Keep product specifications consistent

## API Reference

### Available Functions (for advanced users)

#### Core Functions
- `initializeBatchSystem()` - Setup batch sheets
- `generateProductionBatch(rowNumber)` - Create batch from production row
- `processPackingConsumption(data)` - Record consumption
- `getBatchDetails(batchId)` - Get batch information
- `searchBatches(searchTerm)` - Find batches
- `getBatchStatistics()` - Get analytics data

#### Utility Functions
- `getActiveBatchList(filters)` - Get filtered batch list
- `getProductOptions()` - Get dropdown options
- `validateData(data, requiredFields)` - Validate input
- `safeParseFloat(value, default)` - Safe number parsing

## Support

For issues or questions:
1. Check this documentation
2. Review the Troubleshooting section
3. Check Google Apps Script logs (View > Logs)
4. Contact your system administrator

## Version History

### v2.0 (Current)
- Complete UI overhaul with HTML dashboards
- Enhanced error handling and validation
- Improved performance and data access
- Advanced search and filtering
- Visual analytics
- No hardcoded spreadsheet IDs

### v1.0
- Basic batch tracking
- Alert-based UI
- Manual processes
- Limited reporting

---

**Last Updated:** 2025-01-20
**Version:** 2.0
**Author:** Claude Code
