# Google Sheet API Diagnosis - November 2025

## Current Status: ❌ API Key Issue

### Test Results

**Date**: 2025-11-03
**Spreadsheet**: https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit?usp=sharing

#### 1. Sharing Permissions ✅
- **Status**: WORKING
- The sheet is properly shared with "Anyone with the link"
- Sharing link is accessible

#### 2. API Key Access ❌
- **Status**: FAILED
- **Error**: 403 Forbidden
- **API Key**: `AIzaSyBXhap6yMJqBEp40cgJ5Kyhv7Ia_9wDzgs`
- **Test Endpoint**: `https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}`

```bash
# Test command used:
curl "https://sheets.googleapis.com/v4/spreadsheets/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo?key=AIzaSyBXhap6yMJqBEp40cgJ5Kyhv7Ia_9wDzgs"

# Result: 403 Forbidden
```

## Root Cause Analysis

The 403 error indicates one of the following issues with the API key:

### Possible Causes (in order of likelihood):

1. **Google Sheets API Not Enabled**
   - The API key exists but Google Sheets API is not enabled for the project
   - This is the most common cause of 403 errors

2. **API Key Restrictions Too Strict**
   - The API key has application restrictions (e.g., only allows certain referrers)
   - API restrictions might not include Google Sheets API

3. **API Key Expired or Revoked**
   - The API key may have been deleted or regenerated
   - The key in `.env.example` might be outdated

4. **Wrong Google Cloud Project**
   - The API key might be from a different project
   - The spreadsheet might not be accessible to this project

## Solution Steps

### Option 1: Enable Google Sheets API (Try This First)

1. Go to Google Cloud Console:
   ```
   https://console.cloud.google.com/apis/library
   ```

2. Select your project (the one containing the API key)

3. Search for "Google Sheets API"

4. Click "ENABLE" if it's not already enabled

5. Wait 2-3 minutes for changes to propagate

6. Test again:
   ```bash
   curl "https://sheets.googleapis.com/v4/spreadsheets/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/values/Sheet1?key=YOUR_API_KEY"
   ```

### Option 2: Check API Key Restrictions

1. Go to:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. Find your API key: `AIzaSyBXhap6yMJqBEp40cgJ5Kyhv7Ia_9wDzgs`

3. Click on the key name to edit

4. Check "API restrictions":
   - Should be: "Restrict key"
   - Should include: "Google Sheets API" in the list

5. Check "Application restrictions":
   - For testing: Set to "None"
   - For production: Add your domains to "HTTP referrers"

6. Click "SAVE"

### Option 3: Create New API Key

If the above don't work, create a fresh API key:

1. Go to:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. Click "+ CREATE CREDENTIALS" → "API key"

3. Copy the new API key immediately

4. Click "RESTRICT KEY":
   - Application restrictions: None (or add your domains)
   - API restrictions: Restrict key
   - Select: Google Sheets API

5. Click "SAVE"

6. Update all `.env` files with the new key:
   ```
   apps/raw-material/.env
   apps/production/.env
   apps/packing/.env
   apps/inventory/.env
   ```

## Verification Steps

After fixing the API key, verify it works:

### Test 1: Get Spreadsheet Metadata
```bash
curl "https://sheets.googleapis.com/v4/spreadsheets/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo?key=YOUR_NEW_API_KEY"
```

**Expected**: JSON response with sheet names and properties

### Test 2: Read Sheet Data
```bash
curl "https://sheets.googleapis.com/v4/spreadsheets/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/values/Sheet1?key=YOUR_NEW_API_KEY"
```

**Expected**: JSON response with sheet values

### Test 3: Use Diagnostic Script
```bash
# Update API key in check-sheet.js first
node check-sheet.js
```

**Expected**: List of all sheets with row counts and sample data

## Current Configuration

### Environment Files Status

All apps use `VITE_GOOGLE_SHEETS_API_KEY`:

- ✅ `apps/raw-material/.env.example` - Has API key
- ⚠️ `apps/production/.env.example` - Placeholder value
- ⚠️ `apps/packing/.env.example` - Placeholder value
- ⚠️ `apps/inventory/.env.example` - Placeholder value

### Spreadsheet Configuration

- **Spreadsheet ID**: `1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo`
- **Sharing**: ✅ Public (Anyone with link)
- **API Access**: ❌ Blocked (403 Forbidden)

## Next Steps

1. ✅ Share the spreadsheet publicly (COMPLETED)
2. ⏳ Fix API key configuration (PENDING - USER ACTION REQUIRED)
3. ⏳ Test API access
4. ⏳ Update all environment files with working API key
5. ⏳ Deploy updated configuration to Netlify

## Related Files

- `shared/utils/sheetsAPI.js` - Main API integration code
- `shared/utils/arsinvSync.js` - Uses API key for sync operations
- `check-sheet.js` - Diagnostic script
- `GOOGLE_SHEETS_SETUP.md` - Complete setup guide

## Support Links

- Google Cloud Console: https://console.cloud.google.com/
- API Credentials: https://console.cloud.google.com/apis/credentials
- API Library: https://console.cloud.google.com/apis/library
- Sheets API Docs: https://developers.google.com/sheets/api

---

**Last Updated**: 2025-11-03
**Status**: Waiting for API key fix
