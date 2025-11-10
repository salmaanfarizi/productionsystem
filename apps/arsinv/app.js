/**
 * ARS Inventory Management System v2.0
 * Enhanced with better UX, offline support, and modern features
 */

// ===== PRODUCT CATALOG =====
const PRODUCT_CATALOG = {
  'Sunflower Seeds': [
    { code: '4402', name: '200g', unit: 'bag', price: 58, bundle: 5 },
    { code: '4401', name: '100g', unit: 'bag', price: 34, bundle: 5 },
    { code: '1129', name: '25g', unit: 'bag', price: 16, bundle: 6 },
    { code: '1116', name: '800g', unit: 'bag', price: 17, carton: 12 },
    { code: '1145', name: '130g', unit: 'box', price: 54, carton: 6 },
    { code: '1126', name: '10KG', unit: 'sack', price: 170 }
  ],
  'Pumpkin Seeds': [
    { code: '8001', name: '15g', unit: 'box', price: 16, carton: 6 },
    { code: '8002', name: '110g', unit: 'box', price: 54, carton: 6 },
    { code: '1142', name: '10KG', unit: 'sack', price: 230 }
  ],
  'Melon Seeds': [
    { code: '9001', name: '15g', unit: 'box', price: 16, carton: 6 },
    { code: '9002', name: '110g', unit: 'box', price: 54, carton: 6 }
  ],
  'Popcorn': [
    { code: '1710', name: 'Cheese', unit: 'bag', price: 5, carton: 8 },
    { code: '1711', name: 'Butter', unit: 'bag', price: 5, carton: 8 },
    { code: '1703', name: 'Lightly Salted', unit: 'bag', price: 5, carton: 8 }
  ]
};

const ROUTES = ['Al-Hasa 1', 'Al-Hasa 2', 'Al-Hasa 3', 'Al-Hasa 4', 'Al-Hasa Wholesale'];

const CATEGORY_ICONS = {
  'Sunflower Seeds': '🌻',
  'Pumpkin Seeds': '🎃',
  'Melon Seeds': '🍉',
  'Popcorn': '🍿'
};

// ===== MAIN APPLICATION CLASS =====
class InventoryApp {
  constructor() {
    this.currentRoute = '';
    this.lockedItems = new Set();
    this.expandedCategories = new Set();
    this.expandedItems = new Set();
    this.heartbeatTimer = null;
    this.pollingTimer = null;
    this.lastServerTimestamp = 0;
    this.activeUsers = 0;
    this.pendingChanges = [];
    this.isOnline = navigator.onLine;
    this.currentModule = 'inventory';
    this.outwardsData = [];
    this.filteredOutwardsData = [];
  }

  /**
   * Initialize the application
   */
  async init() {
    this.setupEventListeners();
    this.setupDatePicker();
    this.renderRoutes();
    this.renderCategories();
    this.loadFromLocalStorage();
    this.startHeartbeat();
    this.startPolling();
    await this.testConnection();
  }

  /**
   * Setup event listeners for online/offline
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateSyncStatus('connected');
      this.showToast('Back online - syncing...', 'success');
      this.forceSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateSyncStatus('disconnected');
      this.showToast('Working offline - changes will sync when reconnected', 'warning');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveData();
      }
      // Ctrl/Cmd + K to calculate all
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.autoCalculateAll();
      }
    });
  }

  /**
   * Setup date picker with today's date
   */
  setupDatePicker() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('inventoryDate').value = dateStr;
  }

  /**
   * Render route buttons
   */
  renderRoutes() {
    const container = document.getElementById('routesGrid');
    container.innerHTML = ROUTES.map(route => `
      <button class="route-btn" onclick="app.selectRoute('${route}', this)">
        ${route}
      </button>
    `).join('');
  }

  /**
   * Select a route
   */
  selectRoute(route, btn) {
    this.currentRoute = route;

    // Update UI
    document.querySelectorAll('.route-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.getElementById('currentRouteText').textContent = route;

    this.showToast(`Selected: ${route}`, 'info');
    this.saveToLocalStorage();
    this.sendHeartbeat();
    this.renderCategories(); // Re-render to remove empty state
  }

  /**
   * Render product categories
   */
  renderCategories() {
    const container = document.getElementById('mainContent');

    if (!this.currentRoute) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-text">Select a route to get started</div>
          <div class="empty-state-hint">Choose from the routes above</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    Object.entries(PRODUCT_CATALOG).forEach(([category, items]) => {
      const card = this.createCategoryCard(category, items);
      container.appendChild(card);
    });
  }

  /**
   * Create a category card element
   */
  createCategoryCard(category, items) {
    const card = document.createElement('div');
    card.className = 'category-card';
    if (this.expandedCategories.has(category)) {
      card.classList.add('expanded');
    }

    const icon = CATEGORY_ICONS[category] || '📦';

    card.innerHTML = `
      <div class="category-header" onclick="app.toggleCategory('${category}')">
        <div class="category-title">
          <span class="category-icon">${icon}</span>
          <span>${category.toUpperCase()}</span>
        </div>
        <span class="category-arrow">▶</span>
      </div>
      <div class="category-content">
        <div class="items-grid">
          ${items.map(item => this.createItemBox(category, item)).join('')}
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Toggle category expansion
   */
  toggleCategory(category) {
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
      const header = card.querySelector('.category-header');
      if (header.textContent.includes(category.toUpperCase())) {
        card.classList.toggle('expanded');
      }
    });

    if (this.expandedCategories.has(category)) {
      this.expandedCategories.delete(category);
    } else {
      this.expandedCategories.add(category);
    }

    this.saveToLocalStorage();
  }

  /**
   * Create item box HTML
   */
  createItemBox(category, item) {
    const itemId = `${category}-${item.code}`;
    const isExpanded = this.expandedItems.has(itemId);
    const isLocked = this.lockedItems.has(`${this.currentRoute}_${item.code}`);

    return `
      <div class="item-box ${isExpanded ? 'expanded' : ''} ${isLocked ? 'locked' : ''}" id="item-${item.code}">
        <div class="lock-badge">🔒 Locked</div>

        <div onclick="app.toggleItem('${category}', '${item.code}')">
          <div class="item-header">
            <div class="item-info">
              <span class="item-code">${item.code}</span>
              <span class="item-name">${item.name}</span>
            </div>
            <span class="item-price">SAR ${item.price}</span>
          </div>

          <div class="item-summary">
            <div class="summary-cell">
              <div class="summary-label">Physical</div>
              <div class="summary-value" id="summary-physical-${item.code}">0</div>
            </div>
            <div class="summary-cell">
              <div class="summary-label">Transfer</div>
              <div class="summary-value" id="summary-transfer-${item.code}">0</div>
            </div>
            <div class="summary-cell">
              <div class="summary-label">Add Trans</div>
              <div class="summary-value" id="summary-addtransfer-${item.code}">0</div>
            </div>
            <div class="summary-cell">
              <div class="summary-label">System</div>
              <div class="summary-value" id="summary-system-${item.code}">0</div>
            </div>
            <div class="summary-cell">
              <div class="summary-label">Diff</div>
              <div class="summary-value" id="summary-diff-${item.code}">0</div>
            </div>
          </div>
        </div>

        <div class="item-details">
          ${this.createInputs(item)}
          <div class="calc-result">
            <div class="calc-label">Difference</div>
            <div class="calc-value" id="diff-${item.code}">0</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create input fields for an item
   */
  createInputs(item) {
    const unitOptions = this.getUnitOptions(item);

    return `
      <div class="input-grid">
        <div class="input-group">
          <div class="input-label">📦 Physical Stock</div>
          <div class="input-row">
            <input type="number" class="input-field" id="physical-${item.code}"
              placeholder="0" min="0" step="1"
              onfocus="app.onItemFocus('${item.code}')"
              onblur="app.onItemBlur('${item.code}')"
              oninput="app.calculateItem('${item.code}')">
            <select class="unit-select" id="physical-unit-${item.code}"
              onchange="app.calculateItem('${item.code}')">
              ${unitOptions}
            </select>
          </div>
        </div>

        <div class="input-group">
          <div class="input-label">🚚 Stock Transfer</div>
          <div class="input-row">
            <input type="number" class="input-field" id="transfer-${item.code}"
              placeholder="0" min="0" step="1"
              oninput="app.calculateItem('${item.code}')">
            <select class="unit-select" id="transfer-unit-${item.code}"
              onchange="app.calculateItem('${item.code}')">
              ${unitOptions}
            </select>
          </div>
        </div>

        <div class="input-group">
          <div class="input-label">➕ Additional Transfer</div>
          <div class="input-row">
            <input type="number" class="input-field" id="add-transfer-${item.code}"
              placeholder="0" min="0" step="1"
              oninput="app.calculateItem('${item.code}')">
            <select class="unit-select" id="add-transfer-unit-${item.code}"
              onchange="app.calculateItem('${item.code}')">
              ${unitOptions}
            </select>
          </div>
        </div>

        <div class="input-group">
          <div class="input-label">💻 System Stock</div>
          <div class="input-row">
            <input type="number" class="input-field" id="system-${item.code}"
              placeholder="0" min="0" step="1"
              oninput="app.calculateItem('${item.code}')">
            <select class="unit-select" id="system-unit-${item.code}"
              onchange="app.calculateItem('${item.code}')">
              ${unitOptions}
            </select>
          </div>
        </div>

        <div class="input-group">
          <div class="input-label">🔄 Pieces Reimbursed</div>
          <div class="input-row">
            <input type="number" class="input-field" id="reimburse-${item.code}"
              placeholder="0" min="0" step="1"
              oninput="app.saveToLocalStorage()">
            <span style="padding:12px; font-weight:600; color:#6c757d;">pcs</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get unit options HTML for select
   */
  getUnitOptions(item) {
    let options = `<option value="${item.unit}">${item.unit}</option>`;
    if (item.bundle) {
      options += `<option value="bundle">bundle (${item.bundle})</option>`;
    }
    if (item.carton) {
      options += `<option value="carton">carton (${item.carton})</option>`;
    }
    return options;
  }

  /**
   * Toggle item expansion
   */
  async toggleItem(category, code) {
    const itemId = `${category}-${code}`;
    const box = document.getElementById(`item-${code}`);

    if (this.expandedItems.has(itemId)) {
      this.expandedItems.delete(itemId);
      box.classList.remove('expanded');
      await this.unlockItem(code);
    } else {
      const ok = await this.lockItem(code);
      if (!ok) return;
      this.expandedItems.add(itemId);
      box.classList.add('expanded');
    }

    this.saveToLocalStorage();
  }

  /**
   * Find item by code
   */
  findItemByCode(code) {
    for (const items of Object.values(PRODUCT_CATALOG)) {
      const found = items.find(i => i.code === code);
      if (found) return found;
    }
    return null;
  }

  /**
   * Convert to base units
   */
  toBaseUnits(value, unit, item) {
    if (!item) return value;
    if (unit === 'bundle' && item.bundle) return value * item.bundle;
    if (unit === 'carton' && item.carton) return value * item.carton;
    return value;
  }

  /**
   * Calculate item difference
   */
  calculateItem(code) {
    const item = this.findItemByCode(code);
    if (!item) return;

    const physical = parseFloat(document.getElementById(`physical-${code}`).value) || 0;
    const physicalUnit = document.getElementById(`physical-unit-${code}`).value;

    const transfer = parseFloat(document.getElementById(`transfer-${code}`).value) || 0;
    const transferUnit = document.getElementById(`transfer-unit-${code}`).value;

    const addTransfer = parseFloat(document.getElementById(`add-transfer-${code}`).value) || 0;
    const addTransferUnit = document.getElementById(`add-transfer-unit-${code}`).value;

    const system = parseFloat(document.getElementById(`system-${code}`).value) || 0;
    const systemUnit = document.getElementById(`system-unit-${code}`).value;

    const physicalBase = this.toBaseUnits(physical, physicalUnit, item);
    const transferBase = this.toBaseUnits(transfer, transferUnit, item);
    const addTransferBase = this.toBaseUnits(addTransfer, addTransferUnit, item);
    const systemBase = this.toBaseUnits(system, systemUnit, item);

    const diff = systemBase - physicalBase;

    // Update UI
    this.updateElement(`diff-${code}`, diff.toFixed(0), diff > 0 ? 'positive' : diff < 0 ? 'negative' : '');
    this.updateElement(`summary-physical-${code}`, physicalBase.toFixed(0));
    this.updateElement(`summary-transfer-${code}`, transferBase.toFixed(0));
    this.updateElement(`summary-addtransfer-${code}`, addTransferBase.toFixed(0));
    this.updateElement(`summary-system-${code}`, systemBase.toFixed(0));
    this.updateElement(`summary-diff-${code}`, diff.toFixed(0), diff > 0 ? 'positive' : diff < 0 ? 'negative' : '');

    this.saveToLocalStorage();
  }

  /**
   * Update element text and class
   */
  updateElement(id, text, className = '') {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text;
      if (className) {
        el.className = el.className.split(' ')[0] + ' ' + className;
      }
    }
  }

  /**
   * Calculate all items
   */
  autoCalculateAll() {
    this.showToast('Calculating all items...', 'info');

    Object.values(PRODUCT_CATALOG).forEach(items => {
      items.forEach(item => {
        if (document.getElementById(`physical-${item.code}`)) {
          this.calculateItem(item.code);
        }
      });
    });

    this.showToast('Calculations complete!', 'success');
  }

  /**
   * Load previous entry
   */
  loadPreviousEntry() {
    if (!this.currentRoute) {
      this.showToast('Please select a route first', 'error');
      return;
    }

    const saved = localStorage.getItem(`lastEntry_${this.currentRoute}`);
    if (saved) {
      const data = JSON.parse(saved);
      this.populateForm(data);
      this.showToast('Previous entry loaded', 'success');
      setTimeout(() => this.autoCalculateAll(), 100);
    } else {
      this.showToast('No previous entry found', 'info');
    }
  }

  /**
   * Populate form with data
   */
  populateForm(data) {
    if (!data.items) return;

    data.items.forEach(row => {
      this.setFieldValue(`physical-${row.code}`, row.physical);
      this.setFieldValue(`transfer-${row.code}`, row.transfer);
      this.setFieldValue(`add-transfer-${row.code}`, row.addTransfer);
      this.setFieldValue(`system-${row.code}`, row.system);
      this.setFieldValue(`reimburse-${row.code}`, row.reimburse);

      this.setSelectValue(`physical-unit-${row.code}`, row.physUnit);
      this.setSelectValue(`transfer-unit-${row.code}`, row.transUnit);
      this.setSelectValue(`add-transfer-unit-${row.code}`, row.addUnit);
      this.setSelectValue(`system-unit-${row.code}`, row.sysUnit);
    });
  }

  /**
   * Set field value
   */
  setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
  }

  /**
   * Set select value
   */
  setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
  }

  /**
   * Clear all data
   */
  clearAllData() {
    if (!confirm('Clear all entered data?')) return;

    document.querySelectorAll('.input-field').forEach(input => input.value = '');
    document.querySelectorAll('.calc-value').forEach(el => {
      el.textContent = '0';
      el.className = 'calc-value';
    });
    document.querySelectorAll('.summary-value').forEach(el => {
      el.textContent = '0';
      el.className = 'summary-value';
    });

    this.showToast('All data cleared', 'info');
  }

  /**
   * Collect data from form
   */
  collectData() {
    const items = [];

    Object.entries(PRODUCT_CATALOG).forEach(([category, products]) => {
      products.forEach(item => {
        const physEl = document.getElementById(`physical-${item.code}`);
        if (!physEl) return;

        const physical = parseFloat(physEl.value) || 0;
        const physUnit = document.getElementById(`physical-unit-${item.code}`).value;

        const transfer = parseFloat(document.getElementById(`transfer-${item.code}`).value) || 0;
        const transUnit = document.getElementById(`transfer-unit-${item.code}`).value;

        const addTransfer = parseFloat(document.getElementById(`add-transfer-${item.code}`).value) || 0;
        const addUnit = document.getElementById(`add-transfer-unit-${item.code}`).value;

        const system = parseFloat(document.getElementById(`system-${item.code}`).value) || 0;
        const sysUnit = document.getElementById(`system-unit-${item.code}`).value;

        const reimburse = parseFloat(document.getElementById(`reimburse-${item.code}`).value) || 0;

        if (physical || transfer || addTransfer || system || reimburse) {
          const physicalBase = this.toBaseUnits(physical, physUnit, item);
          const transferBase = this.toBaseUnits(transfer, transUnit, item);
          const addTransferBase = this.toBaseUnits(addTransfer, addUnit, item);
          const systemBase = this.toBaseUnits(system, sysUnit, item);
          const difference = systemBase - physicalBase;

          items.push({
            category,
            code: item.code,
            name: item.name,
            physical: physicalBase,
            physUnit,
            transfer: transferBase,
            transUnit,
            addTransfer: addTransferBase,
            addUnit,
            system: systemBase,
            sysUnit,
            difference,
            reimburse,
            reimbUnit: 'pieces'
          });
        }
      });
    });

    return { items };
  }

  /**
   * Save data to Google Sheets
   */
  async saveData() {
    if (!this.currentRoute) {
      this.showToast('Please select a route first', 'error');
      return;
    }

    this.showLoading(true);
    const bundle = this.collectData();

    if (bundle.items.length === 0) {
      this.showLoading(false);
      this.showToast('No data to save', 'warning');
      return;
    }

    try {
      const response = await callAppsScript('saveInventoryData', {
        route: this.currentRoute,
        date: document.getElementById('inventoryDate').value,
        items: bundle.items
      });

      if (response.status === 'success') {
        this.showToast(`Data saved successfully! (${bundle.items.length} items)`, 'success');
        localStorage.setItem(`lastEntry_${this.currentRoute}`, JSON.stringify(bundle));
      } else {
        throw new Error(response.data || 'Save failed');
      }
    } catch (error) {
      this.showToast('Error saving data: ' + error.message, 'error');
      console.error('Save error:', error);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Submit and lock data
   */
  async submitData() {
    if (!confirm('Submit and lock this data? This action cannot be undone.')) return;
    await this.saveData();
  }

  /**
   * Export data
   */
  exportData() {
    const data = this.collectData();
    if (data.items.length === 0) {
      this.showToast('No data to export', 'warning');
      return;
    }

    const csv = this.convertToCSV(data.items);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${this.currentRoute}_${document.getElementById('inventoryDate').value}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.showToast('Data exported successfully', 'success');
  }

  /**
   * Convert data to CSV
   */
  convertToCSV(items) {
    const headers = ['Category', 'Code', 'Item Name', 'Physical', 'P.Unit', 'Transfer', 'T.Unit',
                     'Add Transfer', 'Add Unit', 'System', 'S.Unit', 'Difference', 'Reimburse', 'R.Unit'];

    const rows = items.map(item => [
      item.category,
      item.code,
      item.name,
      item.physical,
      item.physUnit,
      item.transfer,
      item.transUnit,
      item.addTransfer,
      item.addUnit,
      item.system,
      item.sysUnit,
      item.difference,
      item.reimburse,
      item.reimbUnit
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Save to localStorage
   */
  saveToLocalStorage() {
    const data = this.collectData();
    data.route = this.currentRoute;
    data.expandedCategories = [...this.expandedCategories];
    data.expandedItems = [...this.expandedItems];

    localStorage.setItem(`inventoryData_${this.currentRoute || 'default'}`, JSON.stringify(data));
  }

  /**
   * Load from localStorage
   */
  loadFromLocalStorage() {
    const saved = localStorage.getItem('inventoryData_default');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      if (data.expandedCategories) {
        this.expandedCategories = new Set(data.expandedCategories);
      }
      if (data.expandedItems) {
        this.expandedItems = new Set(data.expandedItems);
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  // ===== CONNECTION & SYNC =====

  /**
   * Test connection to server
   */
  async testConnection() {
    try {
      const data = await callAppsScript('testConnection');
      if (data.status === 'success') {
        this.updateSyncStatus('connected');
        this.showToast('Connected to server', 'success');
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      this.updateSyncStatus('disconnected');
      this.showToast('Working offline - data will sync when connected', 'warning');
    }
  }

  /**
   * Start heartbeat
   */
  startHeartbeat() {
    this.sendHeartbeat();
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Send heartbeat
   */
  async sendHeartbeat() {
    try {
      const data = await callAppsScript('heartbeat', {
        userId: CONFIG.USER_ID,
        route: this.currentRoute,
        module: 'inventory',
        userName: 'Inventory User'
      });

      if (data.status === 'success') {
        this.activeUsers = data.data.activeUsers;
        document.getElementById('activeUsers').textContent = `${this.activeUsers} user${this.activeUsers !== 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }

  /**
   * Start polling for updates
   */
  startPolling() {
    this.pollingTimer = setInterval(() => this.pollForUpdates(), CONFIG.POLLING_INTERVAL);
  }

  /**
   * Poll for updates
   */
  async pollForUpdates() {
    if (!this.currentRoute) return;

    try {
      const data = await callAppsScript('getRealTimeData', {
        route: this.currentRoute,
        timestamp: this.lastServerTimestamp,
        date: document.getElementById('inventoryDate').value
      });

      if (data.status === 'success') {
        this.processUpdates(data.data);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }

  /**
   * Process updates from server
   */
  processUpdates(data) {
    if (data.lockedItems) {
      this.lockedItems.clear();
      data.lockedItems.forEach(li => {
        if (li.userId !== CONFIG.USER_ID) {
          this.lockedItems.add(li.itemKey);
        }
      });
      this.updateLockedItemsUI();
    }

    if (data.updates && data.updates.length > 0) {
      data.updates.forEach(update => {
        if (update.type === 'route_update' && update.route === this.currentRoute) {
          this.showToast('Data updated by another user', 'info');
          this.lastServerTimestamp = update.timestamp;
        }
      });
    }

    if (data.serverTimestamp) {
      this.lastServerTimestamp = data.serverTimestamp;
    }
  }

  /**
   * Update locked items UI
   */
  updateLockedItemsUI() {
    this.lockedItems.forEach(key => {
      const [route, code] = key.split('_');
      if (route === this.currentRoute) {
        const box = document.getElementById(`item-${code}`);
        if (box) box.classList.add('locked');
      }
    });
  }

  /**
   * Lock item
   */
  async lockItem(code) {
    try {
      const data = await callAppsScript('lockItem', {
        route: this.currentRoute,
        itemCode: code,
        userId: CONFIG.USER_ID
      });

      if (data.status === 'error') {
        this.showToast('Item is being edited by another user', 'warning');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Lock error:', error);
      return true;
    }
  }

  /**
   * Unlock item
   */
  async unlockItem(code) {
    try {
      await callAppsScript('unlockItem', {
        route: this.currentRoute,
        itemCode: code,
        userId: CONFIG.USER_ID
      });
    } catch (error) {
      console.error('Unlock error:', error);
    }
  }

  /**
   * Force sync
   */
  async forceSync() {
    this.showLoading(true);
    this.updateSyncStatus('syncing');

    try {
      await this.pollForUpdates();
      await this.sendHeartbeat();
      this.updateSyncStatus('connected');
      this.showToast('Data synced successfully', 'success');
    } catch (error) {
      this.updateSyncStatus('disconnected');
      this.showToast('Sync failed', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Item focus handler
   */
  async onItemFocus(code) {
    await this.lockItem(code);
  }

  /**
   * Item blur handler
   */
  async onItemBlur(code) {
    await this.unlockItem(code);
  }

  // ===== UI HELPERS =====

  /**
   * Update sync status
   */
  updateSyncStatus(status) {
    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncText');

    dot.className = `sync-dot ${status}`;

    if (status === 'connected') {
      text.textContent = 'Online';
    } else if (status === 'disconnected') {
      text.textContent = 'Offline';
    } else if (status === 'syncing') {
      text.textContent = 'Syncing...';
    }
  }

  /**
   * Show loading overlay
   */
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.className = show ? 'loading-overlay show' : 'loading-overlay';
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // ===== STOCK OUTWARDS MODULE =====

  /**
   * Switch between modules
   */
  switchModule(module, btn) {
    this.currentModule = module;

    // Update module tabs
    const moduleBtns = document.querySelectorAll('.route-section button');
    moduleBtns.forEach(b => {
      if (b.textContent.includes('Inventory') || b.textContent.includes('Outwards')) {
        b.classList.remove('active');
      }
    });
    if (btn) btn.classList.add('active');

    // Show/hide modules
    const inventoryModule = document.getElementById('inventoryModule');
    const outwardsModule = document.getElementById('outwardsModule');
    const routeSection = document.getElementById('routeSection');

    if (module === 'inventory') {
      inventoryModule.style.display = 'block';
      outwardsModule.style.display = 'none';
      routeSection.style.display = 'block';
    } else {
      inventoryModule.style.display = 'none';
      outwardsModule.style.display = 'block';
      routeSection.style.display = 'none';
      this.loadOutwards();
      this.setupOutwardsDatePicker();
    }

    this.showToast(`Switched to ${module === 'inventory' ? 'Inventory' : 'Stock Outwards'}`, 'info');
  }

  /**
   * Setup date picker for outwards form
   */
  setupOutwardsDatePicker() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const outDateField = document.getElementById('outDate');
    if (outDateField && !outDateField.value) {
      outDateField.value = dateStr;
    }
  }

  /**
   * Toggle outwards form
   */
  toggleOutwardsForm() {
    const formCard = document.getElementById('outwardsFormCard');
    formCard.classList.toggle('collapsed');
  }

  /**
   * Update product list based on product category
   */
  updateOutProductList() {
    const categorySelect = document.getElementById('outProductCategory');
    const productSelect = document.getElementById('outProduct');
    const category = categorySelect.value;

    productSelect.innerHTML = '<option value="">Select Product</option>';

    if (category && PRODUCT_CATALOG[category]) {
      PRODUCT_CATALOG[category].forEach(product => {
        const option = document.createElement('option');
        option.value = JSON.stringify({ code: product.code, name: product.name });
        option.textContent = `${product.code} - ${product.name}`;
        productSelect.appendChild(option);
      });
    }
  }

  /**
   * Submit outwards transaction
   */
  async submitOutwards(event) {
    event.preventDefault();

    const date = document.getElementById('outDate').value;
    const category = document.getElementById('outCategory').value;
    const productCategory = document.getElementById('outProductCategory').value;
    const productValue = document.getElementById('outProduct').value;
    const quantity = parseInt(document.getElementById('outQuantity').value);
    const recipient = document.getElementById('outRecipient').value;
    const notes = document.getElementById('outNotes').value;

    if (!productValue) {
      this.showToast('Please select a product', 'error');
      return;
    }

    const product = JSON.parse(productValue);

    const data = {
      date,
      category,
      productCategory,
      productCode: product.code,
      productName: product.name,
      quantity,
      recipient,
      notes
    };

    this.showLoading(true);

    try {
      const response = await callAppsScript('saveStockOutwards', data);

      if (response.status === 'success') {
        this.showToast('Stock outwards saved successfully!', 'success');
        document.getElementById('outwardsForm').reset();
        this.setupOutwardsDatePicker();
        await this.loadOutwards();
      } else {
        throw new Error(response.data || 'Save failed');
      }
    } catch (error) {
      this.showToast('Error saving stock outwards: ' + error.message, 'error');
      console.error('Save error:', error);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Load outwards data from server
   */
  async loadOutwards() {
    this.showLoading(true);

    try {
      const response = await callAppsScript('getStockOutwards', {});

      if (response.status === 'success') {
        this.outwardsData = response.data || [];
        this.filteredOutwardsData = [...this.outwardsData];
        this.renderOutwardsTable();
        this.updateOutwardsStats();
        this.showToast('Data loaded successfully', 'success');
      } else {
        throw new Error(response.data || 'Load failed');
      }
    } catch (error) {
      this.showToast('Error loading data: ' + error.message, 'error');
      console.error('Load error:', error);
      this.outwardsData = [];
      this.filteredOutwardsData = [];
      this.renderOutwardsTable();
      this.updateOutwardsStats();
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Filter outwards data
   */
  filterOutwards() {
    const filterCategory = document.getElementById('filterCategory').value;
    const filterProductCategory = document.getElementById('filterProductCategory').value;
    const filterFromDate = document.getElementById('filterFromDate').value;
    const filterToDate = document.getElementById('filterToDate').value;

    this.filteredOutwardsData = this.outwardsData.filter(item => {
      // Filter by category
      if (filterCategory && item.category !== filterCategory) {
        return false;
      }

      // Filter by product category
      if (filterProductCategory && item.productCategory !== filterProductCategory) {
        return false;
      }

      // Filter by date range
      if (filterFromDate && item.date < filterFromDate) {
        return false;
      }

      if (filterToDate && item.date > filterToDate) {
        return false;
      }

      return true;
    });

    this.renderOutwardsTable();
    this.updateOutwardsStats();
  }

  /**
   * Render outwards table
   */
  renderOutwardsTable() {
    const tbody = document.getElementById('outwardsTableBody');

    if (this.filteredOutwardsData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d;">
            No outward transactions found.
          </td>
        </tr>
      `;
      return;
    }

    // Sort by date and time (newest first)
    const sorted = [...this.filteredOutwardsData].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.time || '').localeCompare(a.time || '');
    });

    tbody.innerHTML = sorted.map(item => `
      <tr>
        <td>${item.date}</td>
        <td>${item.time || '-'}</td>
        <td><span class="badge ${this.getCategoryBadgeClass(item.category)}">${item.category}</span></td>
        <td>${item.productCategory}</td>
        <td>${item.productCode} - ${item.productName}</td>
        <td style="text-align: right; font-weight: 800;">${item.quantity}</td>
        <td>${item.recipient}</td>
        <td>${item.notes || '-'}</td>
      </tr>
    `).join('');
  }

  /**
   * Get badge class for category
   */
  getCategoryBadgeClass(category) {
    const map = {
      'Damaged Goods': 'damaged',
      'Sample/Promotion': 'sample',
      'Return to Supplier': 'return',
      'Internal Use': 'internal',
      'Transfer to Regional Warehouse': 'transfer',
      'Other': 'other'
    };
    return map[category] || 'other';
  }

  /**
   * Update outwards statistics
   */
  updateOutwardsStats() {
    const data = this.filteredOutwardsData;

    // Total outwards transactions
    const totalOutwards = data.length;

    // Total quantity
    const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Unique products
    const uniqueProducts = new Set(data.map(item => item.productCode)).size;

    // This month
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const monthlyCount = data.filter(item => item.date.startsWith(currentMonth)).length;

    // Update UI
    document.getElementById('statTotalOutwards').textContent = totalOutwards;
    document.getElementById('statTotalQuantity').textContent = totalQuantity;
    document.getElementById('statUniqueProducts').textContent = uniqueProducts;
    document.getElementById('statMonthly').textContent = monthlyCount;
  }
}

// ===== API HELPER =====

/**
 * Call Google Apps Script
 */
async function callAppsScript(action, payload = {}) {
  const params = new URLSearchParams();
  params.append('action', action);
  params.append('payload', JSON.stringify(payload));

  const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: params.toString()
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Apps Script error (${response.status}): ${text}`);
  }

  return response.json();
}

// ===== INITIALIZE APP =====

const app = new InventoryApp();
window.addEventListener('DOMContentLoaded', () => app.init());
