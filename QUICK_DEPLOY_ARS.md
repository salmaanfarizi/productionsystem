# Quick Deploy Guide - ARS Sites

Fast reference for deploying to your three custom Netlify sites.

---

## 🎯 Your Target URLs

- 🏭 https://productionars.netlify.app
- 📦 https://packingars.netlify.app
- 📊 https://inventoryars.netlify.app

---

## ⚡ Deploy via Netlify UI (5 min per app)

### Production App

1. **Netlify** → Add new site → Import from GitHub
2. **Config**:
   - Name: `productionars`
   - Base: `apps/production`
   - Build: `npm run build`
   - Publish: `apps/production/dist`
3. **Deploy** → Site settings → Env variables → Add:
   ```
   VITE_GOOGLE_SHEETS_API_KEY
   VITE_GOOGLE_CLIENT_ID
   VITE_SPREADSHEET_ID
   ```
4. **Redeploy**: Deploys → Trigger deploy

### Packing App

Same as above but:
- Name: `packingars`
- Base: `apps/packing`
- Publish: `apps/packing/dist`

### Inventory App

Same as above but:
- Name: `inventoryars`
- Base: `apps/inventory`
- Publish: `apps/inventory/dist`
- **Only 2 env vars**: API_KEY + SPREADSHEET_ID (no CLIENT_ID)

---

## 🔐 Update OAuth (One Time)

Google Cloud Console → Credentials → OAuth Client ID → Add origins:
```
https://productionars.netlify.app
https://packingars.netlify.app
https://inventoryars.netlify.app
```

Wait 10 minutes, then test!

---

## ✅ Test Each App

**Production**: https://productionars.netlify.app
- Sign in → Record production → Check Google Sheets

**Packing**: https://packingars.netlify.app
- Sign in → Record packing → Check Google Sheets

**Inventory**: https://inventoryars.netlify.app
- Loads instantly (no sign in) → View stats

---

## 📋 Checklist

- [ ] productionars deployed + env vars + OAuth
- [ ] packingars deployed + env vars + OAuth
- [ ] inventoryars deployed + env vars (no OAuth)
- [ ] All three tested and working

---

**Full details**: See `DEPLOY_TO_ARS.md`
