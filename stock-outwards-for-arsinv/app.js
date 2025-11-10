/**
 * Stock Outwards Management System
 * Combines salesman transfers and other outward stock movements
 */

class StockOutwardsApp {
  constructor() {
    this.outwardsList = [];
    this.salesmanTransfers = [];
    this.filteredOutwards = [];
    this.loading = false;
    this.syncing = false;
    this.showForm = false;
    this.lastSync = null;

    this.filters = {
      category: 'all',
      productType: 'all',
      region: 'all',
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    };

    this.formData = {
      date: new Date().toISOString().split('T')[0],
      category: OUTWARDS_CATEGORIES.DAMAGED,
      sku: '',
      productType: '',
      packageSize: '',
      region: '',
      quantity: '',
      customer: '',
      warehouse: '',
      invoiceRef: '',
      notes: ''
    };

    this.availableSKUs = [];
  }

  /**
   * Initialize the application
   */
  async init() {
    this.renderUI();
    this.setupEventListeners();
    await this.loadOutwards();
    this.loadLastSyncTime();
    this.applyFilters();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Filter change listeners
    document.getElementById('filterCategory').addEventListener('change', (e) => {
      this.filters.category = e.target.value;
      this.applyFilters();
    });

    document.getElementById('filterProductType').addEventListener('change', (e) => {
      this.filters.productType = e.target.value;
      this.applyFilters();
    });

    document.getElementById('filterRegion').addEventListener('change', (e) => {
      this.filters.region = e.target.value;
      this.applyFilters();
    });

    document.getElementById('filterDateFrom').addEventListener('change', (e) => {
      this.filters.dateFrom = e.target.value;
      this.applyFilters();
    });

    document.getElementById('filterDateTo').addEventListener('change', (e) => {
      this.filters.dateTo = e.target.value;
      this.applyFilters();
    });

    // Form listeners
    document.getElementById('formProductType').addEventListener('change', (e) => {
      this.formData.productType = e.target.value;
      this.updateAvailableSKUs();
    });
  }

  /**
   * Render main UI structure
   */
  renderUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="container">
        ${this.renderHeader()}
        ${this.renderSummaryCards()}
        ${this.renderCategoryBreakdown()}
        ${this.renderActionButtons()}
        ${this.renderManualEntryForm()}
        ${this.renderFilters()}
        ${this.renderOutwardsTable()}
      </div>

      <div id="toast" class="toast"></div>
      <div id="loadingOverlay" class="loading-overlay">
        <div class="spinner"></div>
      </div>
    `;
  }

  /**
   * Render header
   */
  renderHeader() {
    return `
      <div class="header">
        <h1>📦 Stock Outwards Management</h1>
        <p class="subtitle">Track all outgoing stock movements</p>
      </div>
    `;
  }

  /**
   * Render summary cards
   */
  renderSummaryCards() {
    const summary = this.calculateSummary();

    return `
      <div class="summary-grid">
        <div class="summary-card purple">
          <div class="summary-label">Total Transactions</div>
          <div class="summary-value">${summary.total}</div>
        </div>
        <div class="summary-card red">
          <div class="summary-label">Total Quantity Out</div>
          <div class="summary-value">${summary.totalQuantity}</div>
        </div>
        <div class="summary-card blue">
          <div class="summary-label">Unique Products</div>
          <div class="summary-value">${summary.uniqueProducts}</div>
        </div>
        <div class="summary-card green">
          <div class="summary-label">Salesman Transfers</div>
          <div class="summary-value">${summary.salesmanTransfers}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render category breakdown
   */
  renderCategoryBreakdown() {
    const summary = this.calculateSummary();

    const categoriesHTML = OUTWARDS_TYPES.map(category => {
      const metadata = CATEGORY_METADATA[category];
      const count = summary.byCategory[category] || 0;

      return `
        <div class="category-stat">
          <div class="category-icon">${metadata.icon}</div>
          <div class="category-name">${category}</div>
          <div class="category-count">${count}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="card">
        <h3>By Category</h3>
        <div class="category-breakdown">
          ${categoriesHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render action buttons
   */
  renderActionButtons() {
    const arsinvConfigured = CONFIG.GOOGLE_SHEETS_API_KEY !== '';
    const syncButtonHTML = arsinvConfigured ? `
      <button class="btn btn-blue" onclick="app.syncSalesmanData()" ${this.syncing ? 'disabled' : ''}>
        🔄 ${this.syncing ? 'Syncing...' : 'Sync Salesman Data'}
      </button>
    ` : '';

    const lastSyncHTML = this.lastSync ? `
      <div class="last-sync-info">
        Last sync: ${this.lastSync.toLocaleString()} | Salesman transfers: ${this.salesmanTransfers.length}
      </div>
    ` : '';

    return `
      <div class="action-section">
        <div class="action-buttons">
          ${syncButtonHTML}
          <button class="btn btn-primary" onclick="app.toggleForm()">
            ${this.showForm ? '❌ Cancel' : '➕ Add Manual Entry'}
          </button>
        </div>
        ${lastSyncHTML}
      </div>
    `;
  }

  /**
   * Render manual entry form
   */
  renderManualEntryForm() {
    if (!this.showForm) return '';

    const categoryOptions = OUTWARDS_TYPES
      .filter(cat => cat !== OUTWARDS_CATEGORIES.SALESMAN_TRANSFER)
      .map(category => {
        const metadata = CATEGORY_METADATA[category];
        return `<option value="${category}">${metadata.icon} ${category} - ${metadata.description}</option>`;
      }).join('');

    const productTypeOptions = Object.values(PRODUCT_TYPES).map(type =>
      `<option value="${type}">${type}</option>`
    ).join('');

    const skuOptions = this.availableSKUs.map(product =>
      `<option value="${product.sku}">${product.code} - ${product.size} (${product.unit})</option>`
    ).join('');

    const regionOptions = REGIONS.map(region =>
      `<option value="${region}">${region}</option>`
    ).join('');

    const warehouseField = this.formData.category === OUTWARDS_CATEGORIES.REGIONAL_WAREHOUSE ? `
      <div class="form-group">
        <label>Warehouse *</label>
        <select id="formWarehouse" required>
          <option value="">Select Warehouse</option>
          ${REGIONAL_WAREHOUSES.map(w => `<option value="${w}">${w}</option>`).join('')}
        </select>
      </div>
    ` : '';

    return `
      <div class="card form-card">
        <h3>Record Stock Outwards (Manual)</h3>
        <form id="outwardsForm" class="outwards-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Date *</label>
              <input type="date" id="formDate" value="${this.formData.date}" required />
            </div>

            <div class="form-group">
              <label>Category *</label>
              <select id="formCategory" required>
                ${categoryOptions}
              </select>
              <small>Note: Salesman Transfers are auto-synced and cannot be entered manually</small>
            </div>

            <div class="form-group">
              <label>Product Type *</label>
              <select id="formProductType" required>
                <option value="">Select Product Type</option>
                ${productTypeOptions}
              </select>
            </div>

            <div class="form-group">
              <label>SKU *</label>
              <select id="formSKU" required ${!this.formData.productType ? 'disabled' : ''}>
                <option value="">Select SKU</option>
                ${skuOptions}
              </select>
              ${!this.formData.productType ? '<small>Select product type first</small>' : ''}
            </div>

            <div class="form-group">
              <label>Package Size</label>
              <input type="text" id="formPackageSize" placeholder="e.g., 200g" />
            </div>

            <div class="form-group">
              <label>Region</label>
              <select id="formRegion">
                <option value="">Select Region</option>
                ${regionOptions}
              </select>
            </div>

            ${warehouseField}

            <div class="form-group">
              <label>Quantity *</label>
              <input type="number" id="formQuantity" placeholder="0" min="0" step="1" required />
            </div>

            <div class="form-group">
              <label>Customer/Recipient</label>
              <input type="text" id="formCustomer" placeholder="Customer name" />
            </div>

            <div class="form-group">
              <label>Reference Number</label>
              <input type="text" id="formInvoiceRef" placeholder="REF-001" />
            </div>

            <div class="form-group full-width">
              <label>Notes</label>
              <textarea id="formNotes" rows="2" placeholder="Additional notes"></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="app.toggleForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Outwards</button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Render filters
   */
  renderFilters() {
    const categoryOptions = OUTWARDS_TYPES.map(category => {
      const metadata = CATEGORY_METADATA[category];
      return `<option value="${category}">${metadata.icon} ${category}</option>`;
    }).join('');

    const productTypeOptions = Object.values(PRODUCT_TYPES).map(type =>
      `<option value="${type}">${type}</option>`
    ).join('');

    const regionOptions = REGIONS.map(region =>
      `<option value="${region}">${region}</option>`
    ).join('');

    return `
      <div class="card">
        <h3>Filters</h3>
        <div class="filters-grid">
          <div class="filter-group">
            <label>Category</label>
            <select id="filterCategory">
              <option value="all">All Categories</option>
              ${categoryOptions}
            </select>
          </div>

          <div class="filter-group">
            <label>Product Type</label>
            <select id="filterProductType">
              <option value="all">All Products</option>
              ${productTypeOptions}
            </select>
          </div>

          <div class="filter-group">
            <label>Region</label>
            <select id="filterRegion">
              <option value="all">All Regions</option>
              ${regionOptions}
              <option value="N/A">N/A (Non-regional)</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Date From</label>
            <input type="date" id="filterDateFrom" value="${this.filters.dateFrom}" />
          </div>

          <div class="filter-group">
            <label>Date To</label>
            <input type="date" id="filterDateTo" value="${this.filters.dateTo}" />
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render outwards table
   */
  renderOutwardsTable() {
    const rowsHTML = this.filteredOutwards.map((item, index) => {
      const category = item.Category || item.category || 'Other';
      const source = item.source || 'manual';
      const metadata = CATEGORY_METADATA[category];

      return `
        <tr>
          <td>${item.Date || item.date}</td>
          <td>
            <span class="badge badge-${metadata?.color || 'gray'}">
              ${metadata?.icon} ${category}
            </span>
          </td>
          <td class="font-bold text-purple">${item.SKU || item.sku}</td>
          <td>${item['Product Type'] || item.productType}</td>
          <td>${item['Package Size'] || item.packageSize || '-'}</td>
          <td>${item.Region || item.region || 'N/A'}</td>
          <td class="text-right font-bold text-red">-${item.Quantity || item.quantity}</td>
          <td>${item.Customer || item.customer || '-'}</td>
          <td>${item.Invoice || item.invoiceRef || '-'}</td>
          <td>
            <span class="badge badge-${source === 'arsinv' ? 'blue' : 'gray'}">
              ${source === 'arsinv' ? '🔄 Synced' : '✍️ Manual'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const emptyState = this.filteredOutwards.length === 0 ? `
      <tr>
        <td colspan="10" class="text-center text-gray">
          No outwards transactions found. ${!CONFIG.GOOGLE_SHEETS_API_KEY ? 'Configure arsinv sync or add manual entries.' : ''}
        </td>
      </tr>
    ` : '';

    return `
      <div class="card">
        <h3>Outwards History (${this.filteredOutwards.length} transactions)</h3>
        <div class="table-container">
          <table class="outwards-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Product</th>
                <th>Size</th>
                <th>Region</th>
                <th>Quantity</th>
                <th>Customer</th>
                <th>Reference</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
              ${emptyState}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary() {
    const summary = {
      total: this.filteredOutwards.length,
      totalQuantity: 0,
      uniqueProducts: new Set(),
      salesmanTransfers: 0,
      byCategory: {}
    };

    this.filteredOutwards.forEach(item => {
      const qty = parseFloat(item.Quantity || item.quantity) || 0;
      summary.totalQuantity += qty;
      summary.uniqueProducts.add(item.SKU || item.sku);

      const category = item.Category || item.category;
      if (category === OUTWARDS_CATEGORIES.SALESMAN_TRANSFER) {
        summary.salesmanTransfers++;
      }
    });

    // Count by category
    OUTWARDS_TYPES.forEach(cat => {
      summary.byCategory[cat] = this.filteredOutwards.filter(item =>
        (item.Category || item.category) === cat
      ).length;
    });

    summary.uniqueProducts = summary.uniqueProducts.size;
    summary.totalQuantity = Math.round(summary.totalQuantity);

    return summary;
  }

  /**
   * Load outwards from Google Sheets
   */
  async loadOutwards() {
    this.loading = true;
    this.showLoading(true);

    try {
      const data = await this.callAppsScript('getStockOutwards');

      if (data.status === 'success') {
        this.outwardsList = data.data || [];
      } else {
        this.outwardsList = [];
      }
    } catch (error) {
      console.error('Error loading outwards:', error);
      this.outwardsList = [];
    } finally {
      this.loading = false;
      this.showLoading(false);
    }
  }

  /**
   * Sync salesman transfer data from arsinv
   */
  async syncSalesmanData() {
    if (!CONFIG.GOOGLE_SHEETS_API_KEY) {
      this.showToast('Google Sheets API key not configured', 'error');
      return;
    }

    this.syncing = true;
    this.renderActionButtons();
    this.showLoading(true);

    try {
      const transfers = await this.fetchSalesmanTransfers();
      this.salesmanTransfers = transfers;

      this.lastSync = new Date();
      localStorage.setItem('lastSyncTimestamp', this.lastSync.toISOString());

      this.applyFilters();
      this.renderUI();

      this.showToast(`Successfully synced ${transfers.length} salesman transfers!`, 'success');
    } catch (error) {
      console.error('Error syncing salesman data:', error);
      this.showToast('Failed to sync salesman data: ' + error.message, 'error');
    } finally {
      this.syncing = false;
      this.showLoading(false);
      this.renderActionButtons();
    }
  }

  /**
   * Fetch salesman transfers from arsinv Google Sheet
   */
  async fetchSalesmanTransfers() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.ARSINV_SPREADSHEET_ID}/values/${CONFIG.ARSINV_SHEET_NAME}?key=${CONFIG.GOOGLE_SHEETS_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Sheets: ${response.statusText}`);
    }

    const result = await response.json();
    const rows = result.values || [];

    if (rows.length === 0) return [];

    const headers = rows[0];
    const transfers = [];

    // Parse rows starting from index 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowData = {};

      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      // Only include rows with transfer data within date range
      const transferQty = parseFloat(rowData.Transfer || 0);
      const rowDate = rowData.Date || '';

      if (transferQty > 0 && rowDate) {
        const date = new Date(rowDate);
        const fromDate = new Date(this.filters.dateFrom);
        const toDate = new Date(this.filters.dateTo);

        if (date >= fromDate && date <= toDate) {
          transfers.push({
            date: rowDate,
            category: OUTWARDS_CATEGORIES.SALESMAN_TRANSFER,
            sku: rowData.Code || '',
            productType: rowData.Category || '',
            packageSize: rowData['Item Name'] || '',
            region: 'Al-Hasa',
            quantity: transferQty,
            customer: rowData.Route || '',
            invoiceRef: '',
            source: 'arsinv'
          });
        }
      }
    }

    return transfers;
  }

  /**
   * Load last sync timestamp
   */
  loadLastSyncTime() {
    const timestamp = localStorage.getItem('lastSyncTimestamp');
    if (timestamp) {
      this.lastSync = new Date(timestamp);
    }
  }

  /**
   * Apply filters
   */
  applyFilters() {
    // Combine manual outwards and synced salesman transfers
    const combined = [
      ...this.outwardsList.map(item => ({
        ...item,
        source: item.Source || 'manual'
      })),
      ...this.salesmanTransfers
    ];

    let filtered = [...combined];

    if (this.filters.category !== 'all') {
      filtered = filtered.filter(item =>
        (item.Category || item.category) === this.filters.category
      );
    }

    if (this.filters.productType !== 'all') {
      filtered = filtered.filter(item =>
        (item['Product Type'] || item.productType) === this.filters.productType
      );
    }

    if (this.filters.region !== 'all') {
      filtered = filtered.filter(item =>
        (item.Region || item.region) === this.filters.region
      );
    }

    if (this.filters.dateFrom) {
      filtered = filtered.filter(item =>
        new Date(item.Date || item.date) >= new Date(this.filters.dateFrom)
      );
    }

    if (this.filters.dateTo) {
      filtered = filtered.filter(item =>
        new Date(item.Date || item.date) <= new Date(this.filters.dateTo)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) =>
      new Date(b.Date || b.date || 0) - new Date(a.Date || a.date || 0)
    );

    this.filteredOutwards = filtered;

    // Re-render components that depend on filtered data
    const summaryContainer = document.querySelector('.summary-grid');
    if (summaryContainer) {
      summaryContainer.outerHTML = this.renderSummaryCards();
    }

    const categoryContainer = document.querySelector('.card');
    if (categoryContainer) {
      const breakdown = categoryContainer.querySelector('.category-breakdown');
      if (breakdown) {
        breakdown.parentElement.outerHTML = this.renderCategoryBreakdown();
      }
    }

    const tableCard = Array.from(document.querySelectorAll('.card')).find(card =>
      card.textContent.includes('Outwards History')
    );
    if (tableCard) {
      tableCard.outerHTML = this.renderOutwardsTable();
    }
  }

  /**
   * Toggle form visibility
   */
  toggleForm() {
    this.showForm = !this.showForm;

    const actionSection = document.querySelector('.action-section');
    const formCard = document.querySelector('.form-card');

    if (this.showForm) {
      if (formCard) {
        formCard.remove();
      }
      actionSection.insertAdjacentHTML('afterend', this.renderManualEntryForm());
      this.setupFormListeners();
    } else {
      if (formCard) {
        formCard.remove();
      }
    }

    actionSection.outerHTML = this.renderActionButtons();
  }

  /**
   * Setup form listeners
   */
  setupFormListeners() {
    const form = document.getElementById('outwardsForm');
    if (!form) return;

    form.addEventListener('submit', (e) => this.handleFormSubmit(e));

    const productTypeSelect = document.getElementById('formProductType');
    productTypeSelect.addEventListener('change', (e) => {
      this.formData.productType = e.target.value;
      this.updateAvailableSKUs();
    });

    const skuSelect = document.getElementById('formSKU');
    skuSelect.addEventListener('change', (e) => {
      const selectedProduct = this.availableSKUs.find(p => p.sku === e.target.value);
      if (selectedProduct) {
        document.getElementById('formPackageSize').value = selectedProduct.size;
      }
    });

    const categorySelect = document.getElementById('formCategory');
    categorySelect.addEventListener('change', (e) => {
      this.formData.category = e.target.value;
      this.toggleForm();
      this.toggleForm(); // Re-render to show/hide warehouse field
    });
  }

  /**
   * Update available SKUs based on selected product type
   */
  updateAvailableSKUs() {
    this.availableSKUs = getSKUsForProduct(this.formData.productType);

    const skuSelect = document.getElementById('formSKU');
    if (skuSelect) {
      skuSelect.disabled = this.availableSKUs.length === 0;

      const options = this.availableSKUs.map(product =>
        `<option value="${product.sku}">${product.code} - ${product.size} (${product.unit})</option>`
      ).join('');

      skuSelect.innerHTML = '<option value="">Select SKU</option>' + options;
    }
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
      date: document.getElementById('formDate').value,
      category: document.getElementById('formCategory').value,
      sku: document.getElementById('formSKU').value,
      productType: document.getElementById('formProductType').value,
      packageSize: document.getElementById('formPackageSize').value,
      region: document.getElementById('formRegion').value,
      quantity: document.getElementById('formQuantity').value,
      customer: document.getElementById('formCustomer').value,
      warehouse: document.getElementById('formWarehouse')?.value || '',
      invoiceRef: document.getElementById('formInvoiceRef').value,
      notes: document.getElementById('formNotes').value
    };

    if (!formData.sku || !formData.quantity || !formData.productType || !formData.category) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    if (formData.category === OUTWARDS_CATEGORIES.SALESMAN_TRANSFER) {
      this.showToast('Salesman Transfers are auto-synced. Please select a different category.', 'error');
      return;
    }

    this.showLoading(true);

    try {
      const customerField = formData.category === OUTWARDS_CATEGORIES.REGIONAL_WAREHOUSE
        ? formData.warehouse
        : formData.customer;

      const result = await this.callAppsScript('saveStockOutwards', {
        date: formData.date,
        category: formData.category,
        sku: formData.sku,
        productType: formData.productType,
        packageSize: formData.packageSize,
        region: formData.region || 'N/A',
        quantity: parseFloat(formData.quantity),
        customer: customerField,
        invoiceRef: formData.invoiceRef,
        notes: formData.notes,
        source: 'manual'
      });

      if (result.status === 'success') {
        this.showToast('Stock outwards recorded successfully!', 'success');
        this.toggleForm();
        await this.loadOutwards();
        this.applyFilters();
      } else {
        throw new Error(result.message || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving outwards:', error);
      this.showToast('Error recording stock outwards: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Call Google Apps Script
   */
  async callAppsScript(action, payload = {}) {
    const params = new URLSearchParams();
    params.append('action', action);
    params.append('payload', JSON.stringify(payload));

    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Apps Script error (${response.status})`);
    }

    return response.json();
  }

  /**
   * Show loading overlay
   */
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast toast-${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new StockOutwardsApp();
  app.init();
});
