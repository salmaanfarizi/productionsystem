# Production System - Three Department Web Applications

A modern, real-time production management system with three interconnected web applications for **Production**, **Packing**, and **Inventory** departments.

## 🏗️ Architecture

```
Production Department → Records daily production data
         ↓
    [Google Sheets Database]
         ↓
Packing Department → Consumes production with auto batch generation
         ↓
    [Batch Tracking & Inventory Updates]
         ↓
Inventory Department → Real-time monitoring & reports
```

## 📦 Applications

### 1. **Packing App** (`apps/packing`)
- **Purpose**: Daily packaging data entry with automatic batch number generation
- **Features**:
  - Real-time Google Sheets integration
  - Automatic batch ID generation (format: `PKG-YYMMDD-SEQ`)
  - Unit conversion system (bags → bundles/cartons)
  - FIFO (First In First Out) batch consumption
  - Real-time batch status monitoring
  - Multi-batch consumption support

### 2. **Production App** (`apps/production`)
- **Purpose**: Daily production data entry and tracking
- **Features**:
  - Real-time Google Sheets integration
  - Google OAuth authentication for write access
  - Production data entry form
  - Production summary dashboard
  - Links to automatic WIP batch creation
  - Production quality tracking

### 3. **Inventory App** (`apps/inventory`)
- **Purpose**: Real-time inventory monitoring and warehouse management
- **Features**:
  - WIP (Work-In-Progress) batch monitoring
  - Finished goods inventory tracking
  - Product breakdown by type and size
  - Stock level dashboard
  - Real-time data from Google Sheets (read-only)
  - No authentication required (uses API key only)

## 🎯 Product Configuration

### Supported Products

| Product Type | Package Sizes | Primary Unit | Secondary Unit | Conversion |
|--------------|---------------|--------------|----------------|------------|
| **Sunflower Seeds** | 25g | Bag | Bundle | 6 bags = 1 bundle |
| | 100g, 200g | Bag | Bundle | 5 bags = 1 bundle |
| | 130g | Box | Carton | 6 boxes = 1 carton |
| | 800g | Bag | Carton | 12 bags = 1 carton |
| | 10kg | Sack | - | No conversion |
| **Melon Seeds** | All except 10kg | Box | Carton | 6 boxes = 1 carton |
| | 10kg | Sack | - | No conversion |
| **Pumpkin Seeds** | All except 10kg | Box | Carton | 6 boxes = 1 carton |
| | 10kg | Sack | - | No conversion |
| **Popcorn** | All sizes | Bag | Carton | 8 bags = 1 carton |

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Google Account
- Google Cloud Project with Sheets API enabled

### Step 1: Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Click "New Project"
   - Name it: "Production System"

2. **Enable Google Sheets API**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key

4. **Create OAuth 2.0 Client ID**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized JavaScript origins:
     - `http://localhost:3001` (for development)
     - `https://your-packing-app.netlify.app` (for production)
   - Copy the Client ID

### Step 2: Google Sheets Setup

1. **Open your production spreadsheet**:
   - URL: https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit

2. **Ensure these sheets exist**:
   - `Daily - Jul 2025` (Production data)
   - `Batch Master` (Batch records)
   - `Batch Tracking` (Audit trail)
   - `Packing Consumption` (Packaging records)
   - `Batch History` (Archived batches)

3. **Make spreadsheet accessible**:
   - Click "Share"
   - Change to "Anyone with the link can view" (for API key access)
   - OR grant specific access to your Google account (for OAuth)

### Step 3: Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd productionsystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   For **Packing App**:
   ```bash
   cd apps/packing
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
   ```

4. **Run the development server**
   ```bash
   npm run dev:packing
   ```

   Open: http://localhost:3001

### Step 4: Netlify Deployment

#### Option A: Deploy via Netlify UI

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Netlify**
   - Go to: https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Connect to your GitHub repository
   - Configure build settings:
     - **Base directory**: `apps/packing`
     - **Build command**: `npm run build`
     - **Publish directory**: `apps/packing/dist`

3. **Add environment variables**
   - Go to: Site settings → Environment variables
   - Add:
     - `VITE_GOOGLE_SHEETS_API_KEY`
     - `VITE_GOOGLE_CLIENT_ID`
     - `VITE_SPREADSHEET_ID`

4. **Update OAuth Authorized Origins**
   - After deployment, copy your Netlify URL (e.g., `https://your-app.netlify.app`)
   - Go back to Google Cloud Console → Credentials
   - Edit your OAuth 2.0 Client ID
   - Add your Netlify URL to "Authorized JavaScript origins"

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
cd apps/packing
netlify deploy --prod
```

## 📊 Google Sheets Structure

### Production Sheet (`Daily - Jul 2025`)
```
Column A: Date
Column B: Production Type
Column C: Seed Type (T6, 361, 363, 601, S9)
Column D: Size
Column E: (other fields)
Column F: Variant
Column G: Quantity
Column H: Weight (Tonnes)
...
Column Q (17): Batch ID (auto-filled)
```

### Batch Master Sheet
```
Column A: Batch ID (e.g., BT6-250120-001)
Column B: Production Date
Column C: Seed Type
Column D: Size
Column E: Production Variant
Column F: Initial Weight (T)
Column G: Consumed Weight (T)
Column H: Remaining Weight (T)
Column I: Status (ACTIVE/COMPLETE/ON_HOLD)
Column J: Start Time
Column K: Complete Time
Column L: Linked Production Rows
Column M: Notes
```

### Packing Consumption Sheet
```
Column A: Timestamp
Column B: Batch ID
Column C: SKU
Column D: Package Size
Column E: Packages Produced
Column F: Weight Consumed (T)
Column G: Remaining Batch Weight (T)
Column H: Operator
Column I: Shift
Column J: Line
Column K: Notes
```

## 🔐 Security Notes

1. **API Keys**: Never commit `.env` files to Git
2. **OAuth Scopes**: App only requests `spreadsheets` scope
3. **Token Storage**: Access tokens stored in localStorage (expires after 1 hour)
4. **Sheet Permissions**: Ensure spreadsheet has appropriate sharing settings

## 🛠️ Development

### Project Structure
```
productionsystem/
├── apps/
│   ├── packing/          # Packing Department App ✅
│   ├── production/       # Production App (TODO)
│   └── inventory/        # Inventory App (TODO)
├── shared/
│   ├── config/
│   │   └── products.js   # Product configurations
│   └── utils/
│       ├── sheetsAPI.js  # Google Sheets integration
│       └── batchGenerator.js  # Batch logic
├── package.json          # Workspace config
└── README.md
```

### Available Scripts

```bash
# Development
npm run dev:packing      # Run packing app (port 3001)
npm run dev:production   # Run production app (port 3000)
npm run dev:inventory    # Run inventory app (port 3002)

# Build
npm run build:packing    # Build packing app
npm run build:production # Build production app
npm run build:inventory  # Build inventory app
npm run build:all        # Build all apps
```

## 🎨 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database**: Google Sheets (via Sheets API v4)
- **Authentication**: Google OAuth 2.0
- **Deployment**: Netlify
- **Package Manager**: npm workspaces

## 📝 Batch Number Format

```
Format: PREFIX-YYMMDD-SEQ

Examples:
  BT6-250121-001    → T6 seeds, Jan 21 2025, sequence 1
  B361-250121-002   → 361 seeds, Jan 21 2025, sequence 2
  PKG-250122-001    → Generic package, Jan 22 2025, sequence 1
```

### Prefix Mapping
- `BT6` → T6 seeds
- `B361` → 361 seeds
- `B363` → 363 seeds
- `B601` → 601 seeds
- `BS9` → S9 seeds
- `PKG` → Default/Generic

## 🐛 Troubleshooting

### "Failed to fetch" error
- Check if Google Sheets API is enabled
- Verify API key is correct
- Ensure spreadsheet is shared publicly or with your account

### OAuth errors
- Verify Client ID is correct
- Check authorized JavaScript origins include your domain
- Clear browser cache and localStorage

### Batch not auto-generating
- Ensure Production sheet has data in correct format
- Check Batch Master sheet exists
- Verify seed type matches BATCH_PREFIX configuration

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Google Cloud Console for API errors
3. Inspect browser console for JavaScript errors
4. Check Netlify deploy logs

## 📄 License

Proprietary - Internal Use Only

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintained by**: Production Team
