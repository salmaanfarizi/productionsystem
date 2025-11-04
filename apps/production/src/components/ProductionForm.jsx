import React, { useState, useEffect } from 'react';
import { appendSheetData, readSheetData, parseSheetData, writeSheetData } from '@shared/utils/sheetsAPI';
import {
  PRODUCT_TYPES,
  SEED_VARIETIES,
  SUNFLOWER_SIZE_RANGES,
  SUNFLOWER_VARIANTS,
  BAG_TYPES,
  EMPLOYEES,
  DIESEL_TRUCKS,
  WASTEWATER_TRUCKS,
  calculateWIP,
  calculateWeightFromBags,
  calculateSaltWeight,
  productHasSizeVariant,
  getSeedVarietiesForProduct
} from '@shared/config/production';

// Product code mapping for WIP Batch IDs
const PRODUCT_CODES = {
  'Sunflower Seeds': 'SUN',
  'Melon Seeds': 'MEL',
  'Pumpkin Seeds': 'PUM',
  'Peanuts': 'PEA'
};

export default function ProductionForm({ authHelper, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productType: '',
    seedVariety: '',
    sizeRange: '',
    variant: '',
    bagType: '25KG',
    bagQuantity: '',
    otherWeight: '', // For custom weight input
    saltBags: '',
    dieselTruck: '',
    dieselLiters: '',
    wastewaterTruck: '',
    wastewaterLiters: '',
    notes: ''
  });

  const [overtime, setOvertime] = useState(
    EMPLOYEES.reduce((acc, emp) => ({ ...acc, [emp]: '' }), {})
  );

  const [availableSeedVarieties, setAvailableSeedVarieties] = useState([]);

  const [calculations, setCalculations] = useState({
    totalRawWeight: 0,
    wip: 0,
    loss: 0,
    saltWeight: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Update available seed varieties when product type changes
  useEffect(() => {
    if (formData.productType) {
      const varieties = getSeedVarietiesForProduct(formData.productType);
      setAvailableSeedVarieties(varieties);
      setFormData(prev => ({ ...prev, seedVariety: '' }));
    } else {
      setAvailableSeedVarieties([]);
    }
  }, [formData.productType]);

  // Calculate weights when inputs change
  useEffect(() => {
    let bagWeight;
    if (formData.bagType === 'OTHER') {
      // Use custom weight from otherWeight field
      bagWeight = parseFloat(formData.otherWeight) * (parseInt(formData.bagQuantity) || 0);
    } else {
      bagWeight = calculateWeightFromBags(formData.bagType, parseInt(formData.bagQuantity) || 0);
    }
    const rawWeight = bagWeight / 1000; // Convert kg to tonnes

    const wipCalc = calculateWIP(rawWeight);
    const saltWeight = calculateSaltWeight(parseInt(formData.saltBags) || 0);

    setCalculations({
      totalRawWeight: rawWeight,
      wip: wipCalc.wip,
      loss: wipCalc.loss,
      saltWeight: saltWeight
    });
  }, [formData.bagType, formData.bagQuantity, formData.otherWeight, formData.saltBags]);

  // Auto-populate diesel liters when truck is selected
  useEffect(() => {
    if (formData.dieselTruck) {
      const truck = DIESEL_TRUCKS.find(t => t.capacity === parseInt(formData.dieselTruck));
      if (truck && truck.autoFill) {
        setFormData(prev => ({ ...prev, dieselLiters: truck.autoFill.toString() }));
      }
    }
  }, [formData.dieselTruck]);

  // Auto-populate wastewater liters when truck is selected
  useEffect(() => {
    if (formData.wastewaterTruck) {
      const truck = WASTEWATER_TRUCKS.find(t => t.capacity === parseInt(formData.wastewaterTruck));
      if (truck && truck.autoFill) {
        setFormData(prev => ({ ...prev, wastewaterLiters: truck.autoFill.toString() }));
      }
    }
  }, [formData.wastewaterTruck]);

  // Check if current product needs size/variant fields
  const showSizeVariant = productHasSizeVariant(formData.productType);

  // Check raw material availability before production
  const checkRawMaterialAvailability = async (materialName, requiredQuantityKg, accessToken) => {
    try {
      // Read Raw Material Inventory
      const rawData = await readSheetData('Raw Material Inventory', 'A1:N1000', accessToken);
      const inventory = parseSheetData(rawData);

      // Find the raw material
      const material = inventory.find(item =>
        item['Material'] === materialName &&
        item['Status'] === 'ACTIVE'
      );

      if (!material) {
        throw new Error(`Raw material "${materialName}" not found in inventory`);
      }

      const availableQuantity = parseFloat(material['Quantity']) || 0;
      const unit = material['Unit'] || 'KG';

      // Convert available quantity to KG for comparison
      let availableKg = availableQuantity;
      if (unit === 'T' || unit === 'TONNES') {
        availableKg = availableQuantity * 1000;
      }

      if (availableKg < requiredQuantityKg) {
        throw new Error(
          `Insufficient raw material! Available: ${availableKg.toFixed(2)} kg, Required: ${requiredQuantityKg.toFixed(2)} kg`
        );
      }

      return {
        available: true,
        materialData: material,
        availableKg: availableKg,
        rowIndex: inventory.indexOf(material) + 2 // +2 for header row and 0-index
      };
    } catch (error) {
      console.error('Error checking raw material:', error);
      throw error;
    }
  };

  // Consume raw materials and update inventory
  const consumeRawMaterials = async (materialName, consumedQuantityKg, wipBatchId, accessToken) => {
    try {
      // Read current inventory
      const rawData = await readSheetData('Raw Material Inventory', 'A1:N1000', accessToken);
      const inventory = parseSheetData(rawData);

      // Find the material
      const material = inventory.find(item =>
        item['Material'] === materialName &&
        item['Status'] === 'ACTIVE'
      );

      if (!material) {
        throw new Error(`Raw material "${materialName}" not found`);
      }

      const currentQuantity = parseFloat(material['Quantity']) || 0;
      const unit = material['Unit'] || 'KG';

      // Convert consumed quantity to same unit as inventory
      let consumedInInventoryUnit = consumedQuantityKg;
      if (unit === 'T' || unit === 'TONNES') {
        consumedInInventoryUnit = consumedQuantityKg / 1000; // Convert kg to tonnes
      }

      const newQuantity = Math.max(0, currentQuantity - consumedInInventoryUnit);

      // Update the quantity in Raw Material Inventory (Column E)
      // Note: We need to use writeSheetData to update specific cell
      const rowIndex = inventory.indexOf(material) + 2; // +2 for header and 0-index
      await writeSheetData(
        'Raw Material Inventory',
        `E${rowIndex}`,
        [[newQuantity.toFixed(2)]],
        accessToken
      );

      // Add transaction to Raw Material Transactions
      const transactionRow = [
        new Date().toISOString(), // Timestamp
        formData.date, // Date
        'Stock Out', // Transaction Type
        materialName, // Material
        material['Category'] || 'Base Item', // Category
        unit, // Unit
        '0', // Quantity In
        consumedInInventoryUnit.toFixed(2), // Quantity Out
        'Production Department', // Supplier (not applicable for out)
        wipBatchId, // Batch Number (WIP Batch ID as reference)
        material['Unit Price'] || '0', // Unit Price
        (consumedInInventoryUnit * (parseFloat(material['Unit Price']) || 0)).toFixed(2), // Total Cost
        `Production consumption for WIP Batch ${wipBatchId}`, // Notes
        'Production System' // User
      ];

      await appendSheetData('Raw Material Transactions', transactionRow, accessToken);

      return {
        success: true,
        newQuantity: newQuantity,
        consumed: consumedInInventoryUnit
      };
    } catch (error) {
      console.error('Error consuming raw material:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    if (!formData.bagQuantity || parseInt(formData.bagQuantity) <= 0) {
      setMessage({ type: 'error', text: 'Please enter bag quantity' });
      return;
    }

    if (calculations.totalRawWeight <= 0) {
      setMessage({ type: 'error', text: 'Total weight must be greater than 0' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();

      // ✅ STEP 1: Check raw material availability BEFORE production
      const requiredKg = calculations.totalRawWeight * 1000; // Convert tonnes to kg
      await checkRawMaterialAvailability(formData.productType, requiredKg, accessToken);

      // Format overtime as "Employee: Xh, Employee2: Yh"
      const overtimeText = Object.entries(overtime)
        .filter(([_, hours]) => hours && parseFloat(hours) > 0)
        .map(([emp, hours]) => `${emp}: ${hours}h`)
        .join(', ');

      // Get selected truck labels
      const dieselTruckObj = DIESEL_TRUCKS.find(t => t.capacity === parseInt(formData.dieselTruck));
      const wastewaterTruckObj = WASTEWATER_TRUCKS.find(t => t.capacity === parseInt(formData.wastewaterTruck));

      // Prepare Production Data row (18 columns - added Seed Variety)
      const bagTypeLabel = formData.bagType === 'OTHER'
        ? `Other ${formData.otherWeight}kg (${formData.bagQuantity} bags)`
        : `${BAG_TYPES[formData.bagType].label} (${formData.bagQuantity} bags)`;

      const productionRow = [
        formData.date,
        formData.productType,
        formData.seedVariety || 'N/A',
        showSizeVariant ? formData.sizeRange : 'N/A',
        showSizeVariant ? formData.variant : 'N/A',
        bagTypeLabel,
        calculations.totalRawWeight.toFixed(3),
        calculations.loss.toFixed(3),
        calculations.wip.toFixed(3),
        formData.saltBags || '0',
        calculations.saltWeight.toFixed(2),
        dieselTruckObj ? dieselTruckObj.label : '',
        formData.dieselLiters || '0',
        wastewaterTruckObj ? wastewaterTruckObj.label : '',
        formData.wastewaterLiters || '0',
        overtimeText,
        formData.notes,
        new Date().toISOString()
      ];

      await appendSheetData('Production Data', productionRow, accessToken);

      // Create WIP Inventory entry
      const wipBatchId = await createWIPBatch(
        formData.productType,
        formData.seedVariety || 'N/A',
        showSizeVariant ? formData.sizeRange : 'N/A',
        showSizeVariant ? formData.variant : 'N/A',
        calculations.wip,
        formData.date,
        accessToken
      );

      // ✅ STEP 2: Consume raw materials AFTER successful production
      const consumedKg = calculations.totalRawWeight * 1000; // Convert tonnes to kg
      await consumeRawMaterials(formData.productType, consumedKg, wipBatchId, accessToken);

      setMessage({
        type: 'success',
        text: `✓ Production recorded! WIP Batch: ${wipBatchId} | Raw materials consumed: ${calculations.totalRawWeight.toFixed(3)}T`
      });

      // Reset form
      setFormData(prev => ({
        ...prev,
        bagQuantity: '',
        otherWeight: '',
        saltBags: '',
        dieselTruck: '',
        dieselLiters: '',
        wastewaterTruck: '',
        wastewaterLiters: '',
        notes: ''
      }));

      setOvertime(EMPLOYEES.reduce((acc, emp) => ({ ...acc, [emp]: '' }), {}));

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error submitting production:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const createWIPBatch = async (productType, seedVariety, sizeRange, variant, wipWeight, date, accessToken) => {
    // Read existing WIP batches to get next sequence
    const rawData = await readSheetData('WIP Inventory', 'A1:M1000', accessToken);
    const batches = parseSheetData(rawData);

    // Generate WIP Batch ID
    const productCode = PRODUCT_CODES[productType] || 'WIP';
    const dateObj = new Date(date);
    const dateStr = formatDateForBatch(dateObj);
    const sequence = getNextWIPSequence(batches, productCode, dateStr);
    const wipBatchId = `WIP-${productCode}-${dateStr}-${sequence.toString().padStart(3, '0')}`;

    // Create WIP Inventory row (13 columns - added Seed Variety)
    const wipRow = [
      wipBatchId,
      date,
      productType,
      seedVariety,
      sizeRange,
      variant,
      wipWeight.toFixed(3), // Initial WIP
      '0.000', // Consumed
      wipWeight.toFixed(3), // Remaining
      'ACTIVE',
      new Date().toISOString(),
      '', // Completed time (empty)
      'Created from production entry'
    ];

    await appendSheetData('WIP Inventory', wipRow, accessToken);

    // Log to Batch Tracking
    await logBatchTracking({
      batchId: wipBatchId,
      productType,
      seedVariety,
      sizeRange,
      variant,
      action: 'CREATED',
      weightChange: wipWeight,
      runningTotal: wipWeight,
      department: 'Production',
      user: 'Production User',
      reference: `Production entry ${date}`,
      notes: `New WIP batch created: ${seedVariety} ${wipWeight.toFixed(3)}T`,
      accessToken
    });

    return wipBatchId;
  };

  const getNextWIPSequence = (batches, productCode, dateStr) => {
    const pattern = `WIP-${productCode}-${dateStr}-`;
    let maxSequence = 0;

    batches.forEach(batch => {
      const batchId = batch['WIP Batch ID'] || '';
      if (batchId.startsWith(pattern)) {
        const parts = batchId.split('-');
        const seq = parseInt(parts[parts.length - 1]);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    });

    return maxSequence + 1;
  };

  const formatDateForBatch = (date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const logBatchTracking = async ({ batchId, productType, seedVariety, sizeRange, variant, action, weightChange, runningTotal, department, user, reference, notes, accessToken }) => {
    const trackingRow = [
      new Date().toISOString(),
      batchId,
      productType,
      seedVariety || 'N/A',
      sizeRange,
      variant,
      action,
      weightChange.toFixed(3),
      runningTotal.toFixed(3),
      department,
      user,
      reference,
      notes
    ];

    await appendSheetData('Batch Tracking', trackingRow, accessToken);
  };

  return (
    <div className="card">
      <h2 className="heading-lg mb-4 sm:mb-6 text-gray-900">
        Production Entry Form
      </h2>

      <form onSubmit={handleSubmit} className="section-spacing">
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* SECTION 1: Basic Information */}
        <div className="section-container bg-green-50 border-green-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-green-900">1. Basic Information</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                className="input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Product Type *</label>
              <select
                className="input"
                value={formData.productType}
                onChange={(e) => setFormData({
                  ...formData,
                  productType: e.target.value,
                  seedVariety: '',
                  sizeRange: '', // Reset size/variant when product changes
                  variant: ''
                })}
                required
              >
                <option value="">Select Product</option>
                {Object.values(PRODUCT_TYPES).map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>

            {/* Seed Variety - for all products */}
            {availableSeedVarieties.length > 0 && (
              <div>
                <label className="label">Seed Variety (Crop Type) *</label>
                <select
                  className="input"
                  value={formData.seedVariety}
                  onChange={(e) => setFormData({ ...formData, seedVariety: e.target.value })}
                  required
                >
                  <option value="">Select Variety</option>
                  {availableSeedVarieties.map(variety => (
                    <option key={variety} value={variety}>{variety}</option>
                  ))}
                </select>
              </div>
            )}

            {showSizeVariant && (
              <>
                <div>
                  <label className="label">Size Range *</label>
                  <select
                    className="input"
                    value={formData.sizeRange}
                    onChange={(e) => setFormData({ ...formData, sizeRange: e.target.value })}
                    required
                  >
                    <option value="">Select Size</option>
                    {SUNFLOWER_SIZE_RANGES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Variant/Region *</label>
                  <select
                    className="input"
                    value={formData.variant}
                    onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                    required
                  >
                    <option value="">Select Region</option>
                    {SUNFLOWER_VARIANTS.map(variant => (
                      <option key={variant} value={variant}>{variant}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 2: Raw Material Input */}
        <div className="section-container bg-blue-50 border-blue-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-blue-900">2. Raw Material Input</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Bag Type *</label>
              <select
                className="input"
                value={formData.bagType}
                onChange={(e) => setFormData({ ...formData, bagType: e.target.value })}
                required
              >
                {Object.entries(BAG_TYPES).map(([key, bag]) => (
                  <option key={key} value={key}>{bag.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Number of Bags *</label>
              <input
                type="number"
                className="input"
                value={formData.bagQuantity}
                onChange={(e) => setFormData({ ...formData, bagQuantity: e.target.value })}
                placeholder="e.g., 100"
                min="1"
                required
              />
            </div>

            {formData.bagType === 'OTHER' && (
              <div className="col-span-full">
                <label className="label">Weight per Bag (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.otherWeight}
                  onChange={(e) => setFormData({ ...formData, otherWeight: e.target.value })}
                  placeholder="e.g., 15.5"
                  min="0.01"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Production Output Display */}
        {formData.bagQuantity && parseInt(formData.bagQuantity) > 0 && (
          <div className="section-container bg-green-100 border-2 border-green-300">
            <h3 className="heading-md mb-3 sm:mb-4 text-green-900">3. Production Output</h3>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Raw Material Weight</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {calculations.totalRawWeight.toFixed(3)} T
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">
                  ({(calculations.totalRawWeight * 1000).toFixed(0)} kg)
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-gray-600">Normal Loss (2%)</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                  -{calculations.loss.toFixed(3)} T
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">
                  ({(calculations.loss * 1000).toFixed(0)} kg)
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-gray-600">WIP Output</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                  {calculations.wip.toFixed(3)} T
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">
                  ({(calculations.wip * 1000).toFixed(0)} kg)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Salt Consumption */}
        <div className="section-container bg-yellow-50 border-yellow-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-yellow-900">4. Salt Consumption</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Salt Bags (50 kg each)</label>
              <input
                type="number"
                className="input"
                value={formData.saltBags}
                onChange={(e) => setFormData({ ...formData, saltBags: e.target.value })}
                placeholder="e.g., 5"
                min="0"
              />
            </div>

            <div className="flex items-end">
              <div className="bg-white p-3 rounded border border-yellow-300 w-full">
                <p className="text-sm text-gray-600">Total Salt Weight</p>
                <p className="text-xl font-bold text-yellow-800">
                  {calculations.saltWeight.toFixed(2)} kg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Employee Overtime */}
        <div className="section-container bg-purple-50 border-purple-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-purple-900">5. Employee Overtime</h3>

          <div className="form-grid-3">
            {EMPLOYEES.map(employee => (
              <div key={employee}>
                <label className="label text-sm">{employee}</label>
                <input
                  type="number"
                  step="0.5"
                  className="input"
                  value={overtime[employee]}
                  onChange={(e) => setOvertime({ ...overtime, [employee]: e.target.value })}
                  placeholder="Hours"
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: Diesel Filling */}
        <div className="section-container bg-orange-50 border-orange-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-orange-900">6. Diesel Filling</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Diesel Truck Capacity</label>
              <select
                className="input"
                value={formData.dieselTruck}
                onChange={(e) => setFormData({ ...formData, dieselTruck: e.target.value, dieselLiters: '' })}
              >
                <option value="">Select Truck</option>
                {DIESEL_TRUCKS.map(truck => (
                  <option key={truck.capacity} value={truck.capacity}>
                    {truck.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Diesel Filled (Liters)
                {formData.dieselTruck && ` - Max: ${parseInt(formData.dieselTruck).toLocaleString()}L`}
              </label>
              <input
                type="number"
                className="input"
                value={formData.dieselLiters}
                onChange={(e) => setFormData({ ...formData, dieselLiters: e.target.value })}
                placeholder="e.g., 6500"
                min="0"
                max={formData.dieselTruck || undefined}
                disabled={!formData.dieselTruck}
              />
            </div>
          </div>
        </div>

        {/* SECTION 7: Wastewater Collection */}
        <div className="section-container bg-cyan-50 border-cyan-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-cyan-900">7. Wastewater Collection</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Wastewater Truck Capacity</label>
              <select
                className="input"
                value={formData.wastewaterTruck}
                onChange={(e) => setFormData({ ...formData, wastewaterTruck: e.target.value, wastewaterLiters: '' })}
              >
                <option value="">Select Truck</option>
                {WASTEWATER_TRUCKS.map(truck => (
                  <option key={truck.capacity} value={truck.capacity}>
                    {truck.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Wastewater Collected (Liters)
                {formData.wastewaterTruck && ` - Max: ${parseInt(formData.wastewaterTruck).toLocaleString()}L`}
              </label>
              <input
                type="number"
                className="input"
                value={formData.wastewaterLiters}
                onChange={(e) => setFormData({ ...formData, wastewaterLiters: e.target.value })}
                placeholder="e.g., 9800"
                min="0"
                max={formData.wastewaterTruck || undefined}
                disabled={!formData.wastewaterTruck}
              />
            </div>
          </div>
        </div>

        {/* SECTION 8: Notes */}
        <div>
          <label className="label">Notes (Optional)</label>
          <textarea
            className="input"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
            placeholder="Any additional notes about this production..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full btn btn-primary py-3 text-lg font-semibold ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Recording Production...' : '✓ Record Production'}
        </button>
      </form>
    </div>
  );
}
