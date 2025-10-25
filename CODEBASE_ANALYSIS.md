# Production System - Codebase Analysis & Architecture Overview

## 1. PROJECT OVERVIEW

### What is this project?
This is a **three-department production management system** for a seed/food processing company (ARS - likely Arabia Seeds or similar). It's designed to track products from production through packing to final inventory across multiple regional locations in Saudi Arabia.

### Business Purpose
- **Production Department**: Records daily production of seeds (Sunflower, Melon, Pumpkin, Popcorn) in various package sizes
- **Packing Department**: Consumes WIP (Work-In-Progress) batches from production and packages them for distribution
- **Inventory Department**: Tracks stock levels of finished goods and WIP inventory in real-time

### Key Business Features
- Multi-regional operations (Riyadh, Eastern Province, Makkah, Madinah, etc. - 13 Saudi regions)
- Product variety support (Sunflower with seeds T6, 361, 363, 601, S9; Melon with Shabah/Roomy varieties; Pumpkin; Popcorn)
- FIFO (First In First Out) batch consumption for inventory management
- Automatic WIP batch creation from production data
- Packing label generation with region codes (RR=Riyadh, ER=Eastern, etc.)

---

## 2. TECHNOLOGY STACK

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.4
- **PDF Export**: jsPDF 3.0.3
- **Package Manager**: npm workspaces (monorepo)
- **Deployment**: Netlify

### Backend/Data
- **Database**: Google Sheets (using Sheets API v4)
- **Backend Script**: Google Apps Script (for batch automation)
- **Authentication**: Google OAuth 2.0
- **API**: RESTful calls to Google Sheets API

### Architecture Pattern
- **Monorepo Structure**: npm workspaces with 3 independent Vite apps
- **Shared Code**: `/shared` directory with:
  - `/config`: Product definitions, packaging configurations
  - `/utils`: Google Sheets integration, batch generators, PDF generators, label generators

---

## 3. APPLICATION STRUCTURE

### Three Interconnected Apps

#### 1. Production App (`apps/production`)
- **Port**: 3000 (local), productionars.netlify.app (production)
- **Purpose**: Daily production data entry
- **Features**:
  - Form for entering daily production (product type, seed variety, size, quantity, weight)
  - Auto-generated batch IDs (WIP-{PREFIX}-{YYMMDD}-{SEQ})
  - Real-time Google Sheets sync
  - PDF export of daily production summary
  - Google OAuth required for write access
- **Key Components**:
  - `ProductionForm.jsx`: Form for entry
  - `ProductionSummary.jsx`: Daily summary dashboard with PDF export

#### 2. Packing App (`apps/packing`)
- **Port**: 3001 (local), packingars.netlify.app (production)
- **Purpose**: Daily packing operations
- **Features**:
  - Consumes WIP batches from production
  - Records packaging operations (units packed, weight consumed)
  - Auto-generates packet labels in format: DDMMDD-REGION-SEQ
  - FIFO batch consumption (oldest batches first)
  - Low stock alerts with item shortages
  - Batch label popup after packing submission
  - Google OAuth required
- **Key Components**:
  - `PackingFormNew.jsx`: Packing entry form
  - `DailySummary.jsx`: Daily packing summary
  - `BatchLabelPopup.jsx`: Shows generated packet labels
  - `LowStockAlert.jsx`: Alert for items below minimum stock

#### 3. Inventory App (`apps/inventory`)
- **Port**: 3002 (local), inventoryars.netlify.app (production)
- **Purpose**: Real-time inventory monitoring
- **Features**:
  - WIP (Work-In-Progress) batch monitoring
  - Finished goods inventory tracking
  - Stock level dashboard with status (OK, LOW, CRITICAL, OUT)
  - Product breakdown by type and size
  - Read-only access (no authentication needed, uses API key only)
- **Key Components**:
  - `BatchMonitor.jsx`: WIP batch status
  - `StockDashboard.jsx`: Inventory levels
  - `ProductBreakdown.jsx`: Product analysis

---

## 4. DATA FLOW & ARCHITECTURE

### Current Integration Flow
```
Production App
    ↓
Creates Production Data row in Google Sheets
    ↓
Google Apps Script (BatchTracking.js) auto-triggers
    ↓
Creates WIP Batch in WIP Inventory sheet
    ↓
Packing App reads WIP batches
    ↓
Records packing transfers
    ↓
Google Apps Script updates:
  • WIP Inventory (consumption)
  • Packing Transfers (records)
  • Finished Goods Inventory (stock increase)
  • Batch Tracking (audit trail)
    ↓
Inventory App displays real-time data
```

### Google Sheets Structure
Currently uses **ONE spreadsheet** with multiple sheets:
1. **Production Data** - Production entries (18 columns)
2. **WIP Inventory** - Work-in-progress batches (13 columns)
3. **Batch Tracking** - Audit trail of all movements (13 columns)
4. **Packing Transfers** - Packing operation records (14 columns)
5. **Finished Goods Inventory** - Retail stock levels (9 columns)

**Current Spreadsheet ID**: `1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo`

---

## 5. EXISTING REPOSITORY-RELATED FEATURES

### Regional/Location Management
- **Region Code Mapping** (in `packetLabelGenerator.js`):
  - 13 Saudi regions with unique codes
  - Used in packet label generation
  - Enables location-based tracking
- **Region Selection** in production & packing forms
- **Region-based Filtering** in inventory app

### Google Sheets Integration Features
- **Read Operations**: API key-based read access (public spreadsheet)
- **Write Operations**: OAuth 2.0-based write access (requires authentication)
- **Sheet Management**: Multiple sheets within single spreadsheet
- **Batch Tracking**: Complete audit trail of all data movements
- **Automated Synchronization**: Google Apps Script handles batch creation

### Data Linking/Relationships
1. **Production ↔ WIP Batches**: Production rows link to auto-created WIP batches
2. **WIP ↔ Packing**: Packing operations reference WIP batch IDs (FIFO consumption)
3. **Packing ↔ Finished Goods**: Completed packing updates finished goods inventory
4. **Batch Tracking**: All movements logged in audit trail

---

## 6. WHAT "CONNECTING REPOSITORIES" LIKELY MEANS

Based on the codebase analysis, "connecting repositories" probably refers to one of:

### Option A: Multiple Spreadsheets Support ⭐ (MOST LIKELY)
**Current State**: All apps point to a single hardcoded spreadsheet ID
```javascript
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

**Future Goal**: Support multiple independent Google Sheets for:
- **Multiple factories/locations** (separate sheets per facility)
- **Different product lines** (separate sheets per product category)
- **Regional databases** (each region has own spreadsheet)
- **Enterprise scaling** (allows company growth without re-architecture)

**Implementation would include**:
- Add spreadsheet selector/configuration UI
- Support multiple SPREADSHEET_IDs per app
- Cross-spreadsheet data aggregation (inventory dashboard showing all locations)
- Spreadsheet management interface (add/remove/switch between sheets)

### Option B: Cross-App Repository Linking
Allow apps to reference data from other deployed instances
- Production app in one region links to Packing in another
- Inter-location batch transfers
- Distributed manufacturing network

### Option C: Git Repository Integration
Link to external Git repositories for:
- Configuration management
- Backup synchronization
- Version control of spreadsheet schemas

### Option D: Multi-Database Support
Extend beyond Google Sheets to other data sources:
- Support multiple backend databases
- Allow switching between cloud providers
- Hybrid on-premise + cloud setup

---

## 7. CURRENT DEPLOYMENT CONFIGURATION

### Netlify Deployment
Three separate Netlify sites deployed from single GitHub repo:
- `productionars.netlify.app` → `apps/production`
- `packingars.netlify.app` → `apps/packing`
- `inventoryars.netlify.app` → `apps/inventory`

All three apps share:
- Same Google Sheets API Key
- Same Spreadsheet ID
- Same OAuth Client ID (for authentication)

---

## 8. RECENT FEATURES IMPLEMENTED

### Low Stock Alert System
- Automatic popup when app loads
- Shows items below minimum stock
- Filterable by region and product type
- "Don't show today" option

### Packet Label Generation
- Auto-generates labels: DDMMDD-REGION-SEQ format
- Region codes map to 13 Saudi regions
- Sequence tracking per region per day
- Integrates with batch label popup

### PDF Exports
- Production summary PDF export
- Batch label PDF for printing
- Timestamp and metadata included

---

## 9. KEY FILES & LOCATIONS

### Configuration
- `/shared/config/products.js` - Product definitions, packaging configs
- `/shared/config/production.js` - Production configuration
- `apps/*/​.env.example` - Environment templates

### Core Utilities
- `/shared/utils/sheetsAPI.js` - Google Sheets API integration
- `/shared/utils/batchGenerator.js` - Batch ID generation logic
- `/shared/utils/packetLabelGenerator.js` - Packet label generation
- `/shared/utils/pdfGenerator.js` - PDF export utilities

### Google Apps Script
- `/google-apps-script/BatchTracking.js` - Main backend automation script
- Handles WIP creation, batch consumption, inventory updates

### Documentation
- Multiple deployment guides for Netlify/ARS setup
- Troubleshooting guides for empty sheets and OAuth issues
- Android app access guide

---

## 10. DEVELOPMENT WORKFLOW

### Local Development
```bash
npm install                    # Install all workspaces
npm run dev:production        # Run on port 3000
npm run dev:packing           # Run on port 3001
npm run dev:inventory         # Run on port 3002
npm run build:all             # Build all apps
```

### Environment Setup
Each app needs `.env` file with:
- `VITE_GOOGLE_SHEETS_API_KEY`
- `VITE_GOOGLE_CLIENT_ID` (production & packing only)
- `VITE_SPREADSHEET_ID`

### Deployment Process
1. Push to GitHub
2. Netlify auto-triggers builds for each site
3. All three apps rebuild independently
4. Features immediately available at production URLs

---

## SUMMARY

This is a sophisticated **production management system** with:
- ✅ Real-time multi-app synchronization via Google Sheets
- ✅ Regional/location awareness
- ✅ Complete audit trail and batch tracking
- ✅ Automated batch lifecycle management
- ✅ Modern responsive web interface
- ✅ Professional PDF reporting
- ✅ Mobile-optimized UI

The "connect repositories" feature would likely enable the system to scale from single-location to **multi-factory operations** by allowing multiple independent Google Sheets to be managed from a unified interface, or enable inter-location data sharing and aggregation.
