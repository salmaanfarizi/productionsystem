# Google Sheets API Setup Guide

Complete step-by-step guide to set up Google Sheets API for the Production System.

## Part 1: Create Google Cloud Project

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create New Project
1. Click the project dropdown at the top
2. Click "NEW PROJECT"
3. Enter project name: **Production System**
4. Click "CREATE"
5. Wait for project creation (takes ~30 seconds)
6. Select your new project from the dropdown

## Part 2: Enable Google Sheets API

### Step 1: Navigate to API Library
1. In the left sidebar, click "APIs & Services" → "Library"
2. Or go directly to: https://console.cloud.google.com/apis/library

### Step 2: Enable Sheets API
1. Search for: **Google Sheets API**
2. Click on "Google Sheets API"
3. Click the blue "ENABLE" button
4. Wait for activation

## Part 3: Create API Credentials

### A. Create API Key (for Read-Only Access)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS" → "API key"
3. A dialog shows your new API key
4. **IMPORTANT**: Copy and save this key immediately
5. Click "RESTRICT KEY" (recommended)
6. Under "API restrictions":
   - Select "Restrict key"
   - Check "Google Sheets API"
7. Click "SAVE"

**Your API Key will look like**:
```
AIzaSyABC123...xyz789
```

### B. Create OAuth 2.0 Client ID (for Write Access)

1. Still in Credentials page, click "+ CREATE CREDENTIALS" → "OAuth client ID"

2. If you see "Configure Consent Screen" first:
   - Click "CONFIGURE CONSENT SCREEN"
   - Select "External"
   - Click "CREATE"
   - Fill in:
     - App name: **Production System**
     - User support email: (your email)
     - Developer contact: (your email)
   - Click "SAVE AND CONTINUE"
   - Click "SAVE AND CONTINUE" again (skip scopes)
   - Click "SAVE AND CONTINUE" again (skip test users)
   - Click "BACK TO DASHBOARD"

3. Now create OAuth Client ID:
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Name: **Packing App Client**

4. Add Authorized JavaScript origins:
   ```
   http://localhost:3001
   http://localhost:3000
   http://localhost:3002
   ```
   (Add your Netlify URL later after deployment)

5. Click "CREATE"
6. **IMPORTANT**: Copy the Client ID
   - Format: `123456789-abc...xyz.apps.googleusercontent.com`

## Part 4: Configure Google Spreadsheet

### Step 1: Open Your Spreadsheet
1. Go to: https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit

### Step 2: Set Sharing Permissions

**Option A: Public Access (Easier, less secure)**
1. Click "Share" button (top right)
2. Click "Change to anyone with the link"
3. Set to: "Anyone with the link" → "Viewer"
4. Click "Done"

**Option B: Restricted Access (More secure)**
1. Click "Share" button
2. Add your Google account email
3. Set permission: "Editor"
4. Click "Send"

### Step 3: Get Spreadsheet ID

The spreadsheet ID is in the URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
                                        ↑ This part ↑
```

Your spreadsheet ID:
```
1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

## Part 5: Configure Environment Variables

### For Packing App

1. Go to your project folder:
   ```bash
   cd apps/packing
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and fill in:
   ```env
   VITE_GOOGLE_SHEETS_API_KEY=AIzaSyABC123...xyz789
   VITE_GOOGLE_CLIENT_ID=123456789-abc...xyz.apps.googleusercontent.com
   VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
   ```

4. Save the file

### For Netlify Deployment

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your site
3. Go to "Site settings" → "Environment variables"
4. Click "Add a variable"
5. Add these three variables:

```
Key: VITE_GOOGLE_SHEETS_API_KEY
Value: AIzaSyABC123...xyz789

Key: VITE_GOOGLE_CLIENT_ID
Value: 123456789-abc...xyz.apps.googleusercontent.com

Key: VITE_SPREADSHEET_ID
Value: 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

6. Click "Save"
7. Trigger a new deploy

## Part 6: Update OAuth After Deployment

After deploying to Netlify:

1. Copy your Netlify site URL (e.g., `https://packing-app-xyz.netlify.app`)

2. Go back to Google Cloud Console → Credentials

3. Click on your OAuth 2.0 Client ID

4. Under "Authorized JavaScript origins", click "ADD URI"

5. Add your Netlify URL:
   ```
   https://packing-app-xyz.netlify.app
   ```

6. Click "SAVE"

## Part 7: Test the Setup

### Test API Key (Read Access)

Open browser console and run:
```javascript
fetch('https://sheets.googleapis.com/v4/spreadsheets/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/values/Batch%20Master!A1:M10?key=YOUR_API_KEY')
  .then(r => r.json())
  .then(console.log)
```

Expected result: JSON data with your sheet values

### Test OAuth (Write Access)

1. Open your app: http://localhost:3001
2. Click "Sign In with Google"
3. Grant permissions
4. Try submitting a packing entry

Expected result: New row added to "Packing Consumption" sheet

## Troubleshooting

### Error: "API key not valid"
- Double-check the API key is copied correctly
- Ensure Google Sheets API is enabled
- Wait a few minutes for changes to propagate

### Error: "The caller does not have permission"
- Check spreadsheet sharing settings
- Ensure you're signed in with the correct Google account
- Verify OAuth scope includes `https://www.googleapis.com/auth/spreadsheets`

### Error: "Origin not allowed"
- Add your domain to OAuth Authorized JavaScript origins
- Include both `http://localhost:3001` and your Netlify URL
- Wait a few minutes for changes to propagate

### Error: "Requested entity was not found"
- Verify the spreadsheet ID is correct
- Check the sheet name matches exactly (case-sensitive)
- Ensure the sheet exists in your spreadsheet

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Restrict API key** to only Google Sheets API
3. **Use environment variables** in Netlify, not hardcoded values
4. **Review OAuth consent screen** before publishing
5. **Monitor API usage** in Google Cloud Console

## API Quotas

Free tier limits:
- **Read requests**: 100 per 100 seconds per user
- **Write requests**: 100 per 100 seconds per user

To increase limits:
1. Go to: https://console.cloud.google.com/apis/api/sheets.googleapis.com/quotas
2. Request quota increase if needed

## Need Help?

- Google Sheets API Docs: https://developers.google.com/sheets/api
- Google Cloud Console: https://console.cloud.google.com/
- OAuth 2.0 Guide: https://developers.google.com/identity/protocols/oauth2

---

**Last Updated**: January 2025
