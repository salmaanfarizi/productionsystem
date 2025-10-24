# Legacy Files

This directory contains legacy/deprecated files kept for reference purposes.

## Files

### batch-tracking-improved.gs
- **Version**: v2.0
- **Status**: DEPRECATED - Use `google-apps-script/BatchTracking.js` instead
- **Description**: Legacy batch tracking system without seed variety support
- **Reason for Deprecation**: Replaced by v3.0 which includes:
  - Seed variety support (T6, 361, 363, 601, S9)
  - Updated sheet structure
  - Better integration with the three-app system

### Google Apps Script HTML Files

The following HTML files are legacy Google Apps Script web app outputs kept for reference:

- **Dashboard.html** (563 lines) - Legacy dashboard interface
- **PackingForm.html** (668 lines) - Legacy packing form interface
- **Analytics.html** (555 lines) - Legacy analytics interface
- **BatchSearch.html** (767 lines) - Legacy batch search interface

**Status**: REFERENCE ONLY - These were replaced by the React-based applications in the `apps/` directory

**Current System**: The production system now uses three separate React + Vite applications:
- `apps/packing` - Packing Department App
- `apps/production` - Production Department App
- `apps/inventory` - Inventory Department App

## Current Production Version

Use **`google-apps-script/BatchTracking.js`** (v3.0) for all new deployments.
