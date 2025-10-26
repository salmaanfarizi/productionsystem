# Environment Variables Reference
## All Three Apps - Netlify Configuration

---

## 📋 Quick Reference

| App | Required Variables | Optional Variables |
|-----|-------------------|-------------------|
| **Production** | `VITE_SPREADSHEET_ID` | None |
| **Packing** | `VITE_SPREADSHEET_ID` | None |
| **Inventory** | `VITE_SPREADSHEET_ID`<br>`VITE_GOOGLE_SHEETS_API_KEY` | `VITE_ARSINV_SPREADSHEET_ID` |

---

## 🏭 Production App

### Netlify Site Settings → Environment Variables

```bash
# Required: Your main production Google Spreadsheet ID
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

**Where to find Spreadsheet ID:**
- Open your Google Spreadsheet
- Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
- Copy the long ID between `/d/` and `/edit`

**What it does:**
- Connects Production app to Google Sheets
- Enables production data entry
- Creates WIP batches

---

## 📦 Packing App

### Netlify Site Settings → Environment Variables

```bash
# Required: Same spreadsheet as Production app
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

**What it does:**
- Reads WIP batches from Google Sheets
- Records packing transfers
- Updates finished goods inventory
- Generates batch labels

---

## 📊 Inventory App (Most Important!)

### Netlify Site Settings → Environment Variables

```bash
# Required: Your main production spreadsheet
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo

# Required: Google Sheets API Key for arsinv sync
# Get from: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_SHEETS_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuv

# Optional: Arsinv (Salesman App) Spreadsheet ID
# Defaults to salmaanfarizi's arsinv if not set
VITE_ARSINV_SPREADSHEET_ID=1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0
```

**What each does:**

1. **VITE_SPREADSHEET_ID**
   - Your main production spreadsheet
   - Displays Finished Goods inventory
   - Shows WIP inventory
   - Reads/writes Stock Outwards (manual entries)

2. **VITE_GOOGLE_SHEETS_API_KEY** ⭐ NEW!
   - Enables "Sync Salesman Data" button
   - Fetches transfers from arsinv spreadsheet
   - Required for Stock Outwards auto-sync
   - **Without this, sync button won't appear!**

3. **VITE_ARSINV_SPREADSHEET_ID**
   - Points to arsinv (Salesman App) spreadsheet
   - Optional - defaults to public arsinv sheet
   - Only change if using a different arsinv instance

---

## 🔑 How to Get Google Sheets API Key

### Step 1: Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Create new project or select existing
3. Project name: "ARS Production System" (or your choice)

### Step 2: Enable Google Sheets API

1. Navigation → APIs & Services → Library
2. Search: "Google Sheets API"
3. Click "ENABLE"

### Step 3: Create API Key

1. Navigation → APIs & Services → Credentials
2. Click "CREATE CREDENTIALS" → "API key"
3. Copy the generated key (starts with `AIza...`)
4. **Save it securely!**

### Step 4: Restrict API Key (Recommended)

1. Click the edit icon next to your new API key
2. **Application restrictions:**
   - Select "HTTP referrers (web sites)"
   - Add allowed domains:
     ```
     https://inventoryars.netlify.app/*
     https://packingars.netlify.app/*
     https://productionars.netlify.app/*
     ```
3. **API restrictions:**
   - Select "Restrict key"
   - Choose "Google Sheets API" only
4. Click "SAVE"

### Step 5: Add to Netlify

1. Go to Netlify Dashboard
2. Select Inventory app site
3. Site Settings → Environment Variables
4. Click "Add a variable"
5. Key: `VITE_GOOGLE_SHEETS_API_KEY`
6. Value: Paste your API key
7. Click "Create variable"

---

## 📝 Setting Environment Variables in Netlify

### Via Web UI (Easiest)

1. **Login to Netlify**: https://app.netlify.com/
2. **Select Site**: Click on Production/Packing/Inventory app
3. **Navigate**: Site settings → Build & deploy → Environment
4. **Add Variable**:
   - Click "Add a variable" or "Edit variables"
   - Key: `VITE_SPREADSHEET_ID`
   - Value: Your spreadsheet ID
   - Click "Save"
5. **Repeat** for other variables

### Via Netlify CLI

```bash
# Set for Production app
netlify env:set VITE_SPREADSHEET_ID "your-id-here" --context production

# Set for Inventory app
netlify env:set VITE_SPREADSHEET_ID "your-id-here" --context production
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your-api-key" --context production
netlify env:set VITE_ARSINV_SPREADSHEET_ID "arsinv-id" --context production
```

---

## ✅ Verification Checklist

After setting environment variables:

### Production App
- [ ] `VITE_SPREADSHEET_ID` is set
- [ ] Can submit production data
- [ ] Data appears in Google Sheets

### Packing App
- [ ] `VITE_SPREADSHEET_ID` is set
- [ ] WIP batches load in dropdown
- [ ] Can record transfers

### Inventory App
- [ ] `VITE_SPREADSHEET_ID` is set
- [ ] `VITE_GOOGLE_SHEETS_API_KEY` is set
- [ ] **"Sync Salesman Data" button appears**
- [ ] Can click sync and fetch arsinv data
- [ ] Can add manual outwards entries

---

## 🐛 Troubleshooting

### Variables Not Taking Effect

**Solution**: Redeploy the site
```bash
# Clear cache and trigger new deploy
netlify deploy --prod --dir=dist
```

Or in Netlify UI:
1. Deploys → Trigger deploy → Clear cache and deploy site

### Sync Button Not Appearing

**Issue**: `VITE_GOOGLE_SHEETS_API_KEY` not set or incorrect

**Check**:
1. Verify variable is set in Netlify
2. Key name is exactly `VITE_GOOGLE_SHEETS_API_KEY`
3. API key is valid (starts with `AIza`)
4. Redeploy after adding variable

### API Key Errors

**Error**: "API key not valid"

**Solutions**:
1. Check API key is copied correctly (no spaces)
2. Verify Google Sheets API is enabled
3. Check API key restrictions allow your domain
4. Try creating a new unrestricted key for testing

### Wrong Spreadsheet Loading

**Issue**: App shows different/empty data

**Solution**:
1. Verify `VITE_SPREADSHEET_ID` matches your production sheet
2. Check spreadsheet sharing permissions
3. Clear browser cache and hard refresh

---

## 🔐 Security Best Practices

1. **Never commit .env files to Git**
   - Add `.env*` to `.gitignore`
   - Use `.env.example` for templates only

2. **Restrict API Keys**
   - Set HTTP referrer restrictions
   - Restrict to only Google Sheets API
   - Regularly rotate keys

3. **Separate Environments**
   - Use different keys for development/production
   - Create separate Google Cloud projects if needed

4. **Monitor Usage**
   - Check Google Cloud Console for API usage
   - Set up billing alerts

---

## 📞 Need Help?

- **Netlify Env Vars Docs**: https://docs.netlify.com/environment-variables/
- **Google Sheets API Docs**: https://developers.google.com/sheets/api
- **Deployment Guide**: See `NETLIFY_DEPLOYMENT_GUIDE.md`
- **Stock Outwards Setup**: See `STOCK_OUTWARDS_SETUP.md`

---

**Last Updated**: October 26, 2025
**Version**: 1.0
