# Production Department App

Daily production for the roasting line, at production.abusalim.sa.

## Tabs

1. **📝 Daily log**: one entry per day. It records the shift, the raw seed used per seed line and
   destination (20 kg sacks), salt, diesel, waste-water trips, overtime and waste. It writes to the
   `Production Log` tab.
2. **📅 Month**: the monthly production report. It reads `Production Days` and `Seed Use`, shows
   the app vs sheet check during the trial, and prints on A4.
3. **📦 Batches (old)**: the earlier batch form. It writes `Production Data`, `WIP Inventory`
   and `Batch Tracking`, which the Packing app's Batch Packing tab uses.

The database tabs are created and filled by the store sync Apps Script project; see
[`google-apps-script/STORE_SYNC_SETUP.md`](../../google-apps-script/STORE_SYNC_SETUP.md) → "Daily production".

## Development

```bash
npm run dev:production
```

Needs `VITE_GOOGLE_CLIENT_ID`, `VITE_SPREADSHEET_ID` and `VITE_GOOGLE_SHEETS_API_KEY`
(see `.env.example`).
