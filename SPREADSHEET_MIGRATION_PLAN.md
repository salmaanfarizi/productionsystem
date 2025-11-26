# Google Sheets Consolidation Migration Plan

## Current State: Two-Spreadsheet Architecture

### Spreadsheet #1: Production System
- **ID**: `1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo`
- **Apps**: Production, Packing, Inventory, Raw Material
- **Sheets**: Daily Production, Batch Master, Batch Tracking, Packing Consumption, Raw Material Inventory, etc.

### Spreadsheet #2: ARSinv/Sales System
- **ID**: `1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0`
- **Apps**: Stock Outwards, Cash Reconciliation
- **Sheets**: INVENTORY_SNAPSHOT, Stock Outwards, Cash Collection

---

## Proposed State: Unified Single-Spreadsheet Architecture

### ARS Production & Sales System (Unified Spreadsheet)
- **Use**: Production spreadsheet as the master (`1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo`)
- **All Apps**: Production, Packing, Inventory, Raw Material, Stock Outwards, Cash Reconciliation
- **All Sheets**: Combined from both spreadsheets with sheet-level permissions

---

## Migration Steps

### Phase 1: Preparation (1-2 days)

#### Step 1.1: Backup Current Data
```bash
# Create backups of both spreadsheets
1. Export Production spreadsheet to Google Drive folder "Backups/YYYYMMDD"
2. Export ARSinv spreadsheet to same backup folder
3. Download local CSV exports of all sheets
4. Document current sheet structures
```

#### Step 1.2: Plan Sheet Organization
```
Production Spreadsheet (Target)
├── 🏭 PRODUCTION (existing)
│   ├── Daily Production - [Month Year]
│   ├── Batch Master
│   ├── Batch Tracking
│   ├── Packing Consumption
│   └── Batch History
│
├── 🌾 RAW MATERIALS (existing)
│   ├── Raw Material Inventory
│   └── Raw Material Transactions
│
├── 🚚 SALES & OUTWARDS (migrate from ARSinv)
│   ├── INVENTORY_SNAPSHOT
│   ├── Stock Outwards
│   └── Salesman Transfers
│
├── 💰 CASH RECONCILIATION (migrate from ARSinv)
│   └── Cash Collection
│
└── 📊 REPORTS (new - optional)
    └── Dashboard Summary
```

#### Step 1.3: Document Dependencies
- List all formulas that reference external spreadsheet
- Document all API integrations
- Map all environment variables across apps

### Phase 2: Copy Sheets (1 day)

#### Step 2.1: Copy ARSinv Sheets to Production Spreadsheet
1. Open ARSinv spreadsheet
2. For each sheet:
   - Right-click sheet tab → "Copy to" → Select Production spreadsheet
   - Verify all data copied correctly
   - Check formula references are intact

#### Step 2.2: Verify Data Integrity
- Compare row counts between source and destination
- Spot-check data in random rows
- Verify formulas calculate correctly
- Check date formats and number formats

### Phase 3: Set Up Permissions (1 day)

#### Step 3.1: Sheet Protection Setup

**Production Sheets** (Production team only):
```
1. Right-click "Daily Production" → Protect sheet
2. Set permissions: "Only certain people can edit"
3. Add: production@abusalim.sa, manager@abusalim.sa
4. Repeat for: Batch Master, Batch Tracking, Packing Consumption
```

**Sales Sheets** (Sales team only):
```
1. Right-click "INVENTORY_SNAPSHOT" → Protect sheet
2. Add: sales@abusalim.sa, manager@abusalim.sa
3. Repeat for: Stock Outwards, Salesman Transfers
```

**Cash Sheets** (Finance only):
```
1. Right-click "Cash Collection" → Protect sheet
2. Add: finance@abusalim.sa, manager@abusalim.sa
```

#### Step 3.2: Hide Sensitive Sheets
```
1. Right-click "Cash Collection" → Hide sheet (for non-finance users)
2. Right-click "Salesman Transfers" → Hide sheet (for non-sales users)
```

### Phase 4: Update Applications (2-3 days)

#### Step 4.1: Update Environment Variables

**For ALL apps**, update to single spreadsheet ID:
```bash
# Old (varies by app)
VITE_SPREADSHEET_ID=1UYeOfBCs... (production apps)
VITE_SPREADSHEET_ID=1o3rmIC2m... (sales/cash apps)

# New (same for all apps)
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

**Remove deprecated variables**:
```bash
# Remove these from all apps
VITE_ARSINV_SPREADSHEET_ID=... # No longer needed
```

#### Step 4.2: Update Code References

**Files to update**:
1. `shared/config/outwardsConfig.js`:
   ```javascript
   // Remove ARSINV_CONFIG or update to use main spreadsheet
   export const ARSINV_CONFIG = {
     SPREADSHEET_ID: import.meta.env.VITE_SPREADSHEET_ID, // Use main spreadsheet
     SHEET_NAME: 'INVENTORY_SNAPSHOT',
     // ... rest stays same
   };
   ```

2. `shared/utils/arsinvSync.js`:
   ```javascript
   // Update to read from main spreadsheet
   // Or deprecate this file entirely (no longer need cross-spreadsheet sync)
   ```

3. Update all apps' `.env.example` files to reference single spreadsheet

#### Step 4.3: Test Each App Locally
```bash
# Test production app
npm run dev:production
# Verify: Can read/write production data

# Test packing app
npm run dev:packing
# Verify: Can read batches, write packing data

# Test inventory app
npm run dev:inventory
# Verify: Can read all inventory, stock outwards data

# Test stock outwards app
npm run dev:stock-outwards
# Verify: Can read/write INVENTORY_SNAPSHOT and Stock Outwards

# Test cash reconciliation app
npm run dev:cash-reconciliation
# Verify: Can read/write Cash Collection sheet

# Test raw material app
npm run dev:raw-material
# Verify: Can read/write raw materials data
```

### Phase 5: Deploy to Production (1 day)

#### Step 5.1: Update Netlify Environment Variables

For **each Netlify site** (6 sites total):
```
1. Go to https://app.netlify.com/
2. For each site (production, packing, inventory, raw, salesvan, cash):
   a. Site settings → Environment variables
   b. Update VITE_SPREADSHEET_ID to: 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
   c. Remove VITE_ARSINV_SPREADSHEET_ID (if present)
   d. Save changes
```

#### Step 5.2: Deploy All Apps
```bash
# Trigger redeployment of all apps
git add .
git commit -m "Migrate to unified spreadsheet architecture"
git push origin main

# Or redeploy manually in Netlify UI for each site
```

#### Step 5.3: Monitor Deployments
- Check each deployment succeeds
- Test each app in production
- Monitor for errors in Netlify logs

### Phase 6: Testing & Verification (1-2 days)

#### Step 6.1: End-to-End Testing

**Test Production Flow**:
1. Record production data → Verify in "Daily Production" sheet
2. Check batch created in "Batch Master"
3. Record packing → Verify batch consumption
4. Check inventory updates correctly

**Test Sales Flow**:
1. Record salesman inventory → Verify in "INVENTORY_SNAPSHOT"
2. Sync transfers to stock outwards → Verify syncing works
3. Check finished goods reduction in inventory app

**Test Cash Flow**:
1. Record cash collection → Verify in "Cash Collection" sheet
2. Check reconciliation view loads correctly
3. Test payment tracking groups correctly

#### Step 6.2: User Acceptance Testing
- Have production team test production/packing apps
- Have sales team test salesvan/stock outwards app
- Have finance test cash reconciliation app
- Collect feedback and fix any issues

### Phase 7: Cleanup (1 day)

#### Step 7.1: Archive Old ARSinv Spreadsheet
```
1. Rename ARSinv spreadsheet to: "ARSinv - ARCHIVED - YYYYMMDD"
2. Move to "Archives" folder in Google Drive
3. Remove all sharing permissions (keep for manager only)
4. Add note: "Migrated to unified spreadsheet on YYYY-MM-DD"
```

#### Step 7.2: Remove Deprecated Code
```bash
# Optional: Remove arsinvSync.js if no longer needed
rm shared/utils/arsinvSync.js

# Update imports in apps that used it
# Remove ARSINV_CONFIG from outwardsConfig.js if not needed
```

#### Step 7.3: Update Documentation
- Update all README files
- Update environment variable docs
- Update deployment guides
- Archive this migration plan

---

## Rollback Plan

If migration fails, rollback steps:

### Rollback Step 1: Revert Environment Variables
```
In Netlify, for affected apps:
1. Change VITE_SPREADSHEET_ID back to original value
2. Re-add VITE_ARSINV_SPREADSHEET_ID if removed
3. Redeploy apps
```

### Rollback Step 2: Restore ARSinv Spreadsheet Access
```
1. Re-share ARSinv spreadsheet with sales/finance team
2. Restore API key permissions if changed
```

### Rollback Step 3: Revert Code Changes
```bash
git revert [migration-commit-hash]
git push origin main
```

---

## Timeline Summary

| Phase | Duration | Responsibility |
|-------|----------|---------------|
| 1. Preparation | 1-2 days | Dev Team + Manager |
| 2. Copy Sheets | 1 day | Dev Team |
| 3. Set Permissions | 1 day | Manager |
| 4. Update Apps | 2-3 days | Dev Team |
| 5. Deploy | 1 day | Dev Team |
| 6. Testing | 1-2 days | All Teams |
| 7. Cleanup | 1 day | Dev Team |
| **Total** | **7-11 days** | |

---

## Benefits After Migration

✅ **Simpler Configuration**: Only 1 spreadsheet ID to manage
✅ **Better Integration**: All data in one place, easier cross-sheet formulas
✅ **Easier Permissions**: Centralized access control
✅ **Lower Complexity**: No cross-spreadsheet syncing needed
✅ **Easier Backups**: One file to backup
✅ **Better Performance**: Fewer API calls across spreadsheets

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during copy | High | Create backups before migration, verify row counts |
| Permission issues | Medium | Test with different user accounts before go-live |
| App downtime | High | Deploy during off-hours, have rollback plan ready |
| Formula breakage | Medium | Test all formulas after copying sheets |
| User confusion | Low | Provide training, update documentation |

---

## Decision: When to Migrate?

**Migrate Now If**:
- You have time for 1-2 weeks of testing
- Current system is stable
- All apps are working correctly
- You have backups and rollback plan

**Wait to Migrate If**:
- Currently in busy production period
- Recent major changes still being tested
- Limited dev resources available
- Need to add more features first

**Recommendation**:
Start migration after Cash Reconciliation app is fully tested and deployed (2-4 weeks from now). This allows you to test the new app with current architecture, then migrate when stable.

---

**Document Version**: 1.0
**Created**: 2025-01-26
**Last Updated**: 2025-01-26
**Owner**: Dev Team
