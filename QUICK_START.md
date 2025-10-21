# Quick Start Guide

Get the Packing Department app running in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Google account
- 10 minutes of your time

## Step 1: Clone & Install (2 minutes)

```bash
git clone <your-repo-url>
cd productionsystem
npm install
```

## Step 2: Google Cloud Setup (5 minutes)

### Create API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create new project: "Production System"
3. Enable "Google Sheets API"
4. Create credentials → API Key
5. Copy the key

### Create OAuth Client ID

1. Same page, create credentials → OAuth client ID
2. Web application
3. Authorized origins: `http://localhost:3001`
4. Copy the Client ID

## Step 3: Configure Environment (1 minute)

```bash
cd apps/packing
cp .env.example .env
```

Edit `.env`:
```env
VITE_GOOGLE_SHEETS_API_KEY=YOUR_API_KEY_HERE
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

## Step 4: Run! (1 minute)

```bash
npm run dev:packing
```

Open: http://localhost:3001

## Step 5: Test

1. Click "Sign In with Google"
2. Grant permissions
3. Fill the form:
   - Product Type: Sunflower Seeds
   - Seed Type: T6
   - Size: 100g
   - SKU: TEST-001
   - Bags: 10
4. Click "Record Packaging Entry"

Check your Google Sheet - you should see a new row!

## Next Steps

- Read `GOOGLE_SHEETS_SETUP.md` for detailed API setup
- Read `DEPLOYMENT_GUIDE.md` for Netlify deployment
- Read `README.md` for full documentation

## Troubleshooting

**"Failed to fetch"**
→ Check API key is correct and Sheets API is enabled

**OAuth error**
→ Verify `http://localhost:3001` is in authorized origins

**No active batch**
→ Ensure you have production data in the Production sheet

## Need Help?

Check the main README.md for detailed troubleshooting.

---

Happy coding! 🚀
