# Deployment Guide - Netlify

Step-by-step guide to deploy the Packing Department app to Netlify.

## Prerequisites

- ✅ Google Cloud Project configured (see `GOOGLE_SHEETS_SETUP.md`)
- ✅ API Key and OAuth Client ID ready
- ✅ GitHub account
- ✅ Netlify account (free tier is fine)

## Step 1: Push to GitHub

1. **Initialize Git repository** (if not already done):
   ```bash
   cd /home/user/productionsystem
   git init
   git branch -M main
   ```

2. **Create `.gitignore`** (already done):
   ```
   node_modules/
   dist/
   .env
   .env.local
   ```

3. **Commit your code**:
   ```bash
   git add .
   git commit -m "Initial commit: Packing Department app with batch auto-generation"
   ```

4. **Create GitHub repository**:
   - Go to: https://github.com/new
   - Repository name: `production-system`
   - Visibility: Private (recommended)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

5. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/production-system.git
   git push -u origin main
   ```

## Step 2: Deploy to Netlify (UI Method)

### Create New Site

1. Go to: https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Click "Deploy with GitHub"
4. Authorize Netlify to access your GitHub account
5. Select your repository: `production-system`

### Configure Build Settings

**Base directory**: `apps/packing`
**Build command**: `npm run build`
**Publish directory**: `apps/packing/dist`

Click "Deploy site"

### Add Environment Variables

After initial deployment:

1. Go to: Site settings → Environment variables
2. Click "Add a variable"
3. Add these three variables:

```
Key: VITE_GOOGLE_SHEETS_API_KEY
Value: [Your API Key from Google Cloud Console]

Key: VITE_GOOGLE_CLIENT_ID
Value: [Your Client ID].apps.googleusercontent.com

Key: VITE_SPREADSHEET_ID
Value: 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

4. Click "Save"

### Trigger Redeploy

1. Go to: Deploys
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Wait for deployment to complete (~2 minutes)

## Step 3: Update OAuth Authorized Origins

After deployment, you'll get a URL like: `https://your-site-name.netlify.app`

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized JavaScript origins", click "ADD URI"
4. Add your Netlify URL:
   ```
   https://your-site-name.netlify.app
   ```
5. Click "SAVE"
6. Wait 5 minutes for changes to propagate

## Step 4: Test Your Deployment

1. Open your Netlify URL
2. Click "Sign In with Google"
3. Grant permissions
4. Fill in the packing form
5. Submit an entry
6. Check your Google Sheet for the new row

## Alternative: Deploy via Netlify CLI

### Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Login

```bash
netlify login
```

### Deploy from Packing App Directory

```bash
cd apps/packing
netlify init
```

Follow the prompts:
- Create & configure a new site
- Your build command: `npm run build`
- Directory to deploy: `dist`
- Base directory: `apps/packing`

### Set Environment Variables

```bash
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your-api-key"
netlify env:set VITE_GOOGLE_CLIENT_ID "your-client-id"
netlify env:set VITE_SPREADSHEET_ID "1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo"
```

### Deploy

```bash
netlify deploy --prod
```

## Step 5: Custom Domain (Optional)

### Add Custom Domain

1. In Netlify: Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain: `packing.yourcompany.com`
4. Follow DNS configuration instructions

### Update OAuth

Don't forget to add your custom domain to Google OAuth authorized origins!

## Continuous Deployment

Netlify automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update packing form validation"
git push origin main

# Netlify will automatically detect and deploy
```

## Deploy Multiple Apps

To deploy Production and Inventory apps separately:

### Production App
1. Create new site in Netlify
2. Base directory: `apps/production`
3. Build command: `npm run build`
4. Publish directory: `apps/production/dist`

### Inventory App
1. Create new site in Netlify
2. Base directory: `apps/inventory`
3. Build command: `npm run build`
4. Publish directory: `apps/inventory/dist`

Each app gets its own:
- Netlify site URL
- Environment variables
- OAuth authorized origin

## Monitoring Deployments

### View Build Logs

1. Go to: Deploys
2. Click on any deployment
3. View deployment log for errors

### Common Build Errors

**Error: "Missing environment variables"**
- Solution: Add all VITE_* variables in Site settings

**Error: "Build command failed"**
- Solution: Check base directory is set correctly
- Ensure `package.json` exists in base directory

**Error: "OAuth error in production"**
- Solution: Add Netlify URL to authorized origins
- Wait 5-10 minutes for changes to propagate

## Rollback Deployment

If something goes wrong:

1. Go to: Deploys
2. Find a previous working deployment
3. Click "..." → "Publish deploy"

## Environment-Specific Builds

### Development
```bash
npm run dev:packing
# Runs on http://localhost:3001
```

### Production
```bash
npm run build:packing
# Creates optimized build in dist/
```

### Preview
```bash
netlify deploy
# Creates preview deployment (not production)
```

## Security Checklist

Before going live:

- [ ] API Key restricted to Google Sheets API only
- [ ] OAuth consent screen configured
- [ ] Spreadsheet has appropriate sharing permissions
- [ ] Environment variables set in Netlify (not hardcoded)
- [ ] `.env` files in `.gitignore`
- [ ] HTTPS enabled (Netlify does this automatically)
- [ ] OAuth origins include only your domains

## Performance Optimization

### Enable Gzip Compression
Already enabled by Netlify automatically

### Cache Static Assets
Add to `netlify.toml`:
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Minification
Already done by Vite build

## Troubleshooting

### Site Not Loading
1. Check Netlify deploy logs
2. Verify build completed successfully
3. Check browser console for errors

### OAuth Not Working
1. Verify Client ID in environment variables
2. Check authorized origins include Netlify URL
3. Clear browser cache and try again
4. Wait 10 minutes after updating OAuth settings

### Can't Write to Sheets
1. Verify OAuth scope includes spreadsheets
2. Check if signed in with correct Google account
3. Verify spreadsheet sharing permissions

## Support

For Netlify-specific issues:
- Docs: https://docs.netlify.com/
- Support: https://answers.netlify.com/

For Google Cloud issues:
- See: `GOOGLE_SHEETS_SETUP.md`

---

**Last Updated**: January 2025
