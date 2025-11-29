import React, { useState, useEffect } from 'react';
import { appendSheetData, readSheetData, parseSheetData, writeSheetData } from '@shared/utils/sheetsAPI';
import {
  getProductTypes,
  getSeedVarietiesForProduct,
  getSunflowerSizes,
  getRegions,
  getEmployees,
  getBagTypes,
  getDieselTrucks,
  getWastewaterTrucks,
  calculateWIP,
  calculateWeightFromBags,
  calculateSaltWeight,
  productHasSizeVariant
} from '@shared/utils/settingsLoader';

export default function ProductionForm({ authHelper, onSuccess, settings }) {
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
    saltKg: '', // Additional salt in kilograms
    dieselTruck: '',
    dieselLiters: '',
    wastewaterTruck: '',
    wastewaterLiters: '',
    notes: ''
  });

  const [overtime, setOvertime] = useState({});

  const [availableSeedVarieties, setAvailableSeedVarieties] = useState([]);

  const [calculations, setCalculations] = useState({
    totalRawWeight: 0,
    wip: 0,
    loss: 0,
    saltWeight: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Initialize overtime state when settings are loaded
  useEffect(() => {
    if (settings) {
      const employees = getEmployees(settings);
      setOvertime(employees.reduce((acc, emp) => ({ ...acc, [emp]: '' }), {}));
    }
  }, [settings]);

  // Update available seed varieties when product type changes
  useEffect(() => {
    if (formData.productType && settings) {
      const varieties = getSeedVarietiesForProduct(settings, formData.productType);
      setAvailableSeedVarieties(varieties);
      setFormData(prev => ({ ...prev, seedVariety: '' }));
    } else {
      setAvailableSeedVarieties([]);
    }
  }, [formData.productType, settings]);

  // Calculate weights when inputs change
  useEffect(() => {
    if (!settings) return;

    let bagWeight;
    if (formData.bagType === 'OTHER') {
      // Use custom weight from otherWeight field
      bagWeight = parseFloat(formData.otherWeight) * (parseInt(formData.bagQuantity) || 0);
    } else {
      bagWeight = calculateWeightFromBags(settings, formData.bagType, parseInt(formData.bagQuantity) || 0);
    }
    const rawWeight = bagWeight / 1000; // Convert kg to tonnes

    const wipCalc = calculateWIP(settings, rawWeight);

    // Calculate salt: bags × 50 + additional KG
    const saltFromBags = calculateSaltWeight(settings, parseInt(formData.saltBags) || 0);
    const additionalSaltKg = parseFloat(formData.saltKg) || 0;
    const totalSaltWeight = saltFromBags + additionalSaltKg;

    setCalculations({
      totalRawWeight: rawWeight,
      wip: wipCalc.wip,
      loss: wipCalc.loss,
      saltWeight: totalSaltWeight
    });
  }, [formData.bagType, formData.bagQuantity, formData.otherWeight, formData.saltBags, formData.saltKg, settings]);

  // Auto-populate diesel liters when truck is selected
  useEffect(() => {
    if (formData.dieselTruck && settings) {
      const trucks = getDieselTrucks(settings);
      const truck = trucks.find(t => t.capacity === parseInt(formData.dieselTruck));
      if (truck && truck.autoFill) {
        setFormData(prev => ({ ...prev, dieselLiters: truck.autoFill.toString() }));
      }
    }
  }, [formData.dieselTruck, settings]);

  // Auto-populate wastewater liters when truck is selected
  useEffect(() => {
    if (formData.wastewaterTruck && settings) {
      const trucks = getWastewaterTrucks(settings);
      const truck = trucks.find(t => t.capacity === parseInt(formData.wastewaterTruck));
      if (truck && truck.autoFill) {
        setFormData(prev => ({ ...prev, wastewaterLiters: truck.autoFill.toString() }));
      }
    }
  }, [formData.wastewaterTruck, settings]);

  // Check if current product needs size/variant fields
  const showSizeVariant = settings ? productHasSizeVariant(settings, formData.productType) : false;

  // Helper function to get value from item with multiple possible column names
  const getItemValue = (item, possibleNames, defaultValue = '') => {
    for (const name of possibleNames) {
      if (item[name] !== undefined && item[name] !== null && item[name] !== '') {
        return item[name];
      }
    }
    return defaultValue;
  };

  // Get material name from inventory item - checks multiple possible column names
  const getMaterialName = (item) => {
    // Try common column name variations (case-sensitive first)
    const possibleNames = [
      'Item', 'Item Name', 'Material Name', 'Material', 'Name', 'Product',
      'Raw Material', 'item', 'material', 'name', 'product',
      'ITEM', 'MATERIAL', 'NAME', 'PRODUCT',
      'Item name', 'Material name', 'Raw material'
    ];

    let value = getItemValue(item, possibleNames);

    // If no match found, try to get the second column value (index 1)
    // since RawMaterialForm writes material to column B
    if (!value) {
      const keys = Object.keys(item);
      if (keys.length >= 2) {
        // The second key should correspond to column B (material)
        value = item[keys[1]] || '';
      }
    }

    return value;
  };

  // Get quantity from inventory item - prioritize Total KG (Column G, index 6) over original Quantity
  const getQuantity = (item) => {
    // First try to get Total KG (the normalized quantity in kilograms)
    let value = getItemValue(item, ['Total KG', 'Total Kg', 'TotalKG', 'total kg'], '');
    if (value) {
      return parseFloat(value) || 0;
    }

    // Fall back to column G (index 6) - Total KG column
    const keys = Object.keys(item);
    if (keys.length >= 7 && item[keys[6]]) {
      const colGValue = parseFloat(item[keys[6]]);
      if (!isNaN(colGValue) && colGValue > 0) {
        return colGValue;
      }
    }

    // Fall back to Quantity column (Column E, index 4)
    value = getItemValue(item, ['Quantity', 'Qty', 'Stock', 'Balance', 'quantity', 'QUANTITY'], '');
    if (!value && keys.length >= 5) {
      value = item[keys[4]] || '0';
    }
    return parseFloat(value) || 0;
  };

  // Get unit from inventory item - Column D (index 3)
  const getUnit = (item) => {
    let value = getItemValue(item, ['Unit', 'UOM', 'unit', 'UNIT', 'Unit of Measure'], '');
    if (!value) {
      const keys = Object.keys(item);
      if (keys.length >= 4) {
        value = item[keys[3]] || 'KG';
      }
    }
    return value || 'KG';
  };

  // Get status from inventory item - Column M (index 12) in new format
  const getStatus = (item) => {
    let value = getItemValue(item, ['Status', 'status', 'STATUS'], '');
    if (!value) {
      const keys = Object.keys(item);
      // In new format, Status is column M (index 12)
      if (keys.length >= 13) {
        value = item[keys[12]] || 'Available';
      }
    }
    return (value || 'Available').toUpperCase();
  };

  // Check if status indicates the item is available for use
  const isStatusActive = (status) => {
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === 'ACTIVE' || normalizedStatus === 'AVAILABLE';
  };

  // Check raw material availability before production
  const checkRawMaterialAvailability = async (baseMaterialName, requiredQuantityKg, accessToken) => {
    console.log(`📦 Starting availability check for "${baseMaterialName}", need ${requiredQuantityKg} kg`);

    // Read Raw Material Inventory (extended range for new columns including Total KG)
    let rawData;
    try {
      rawData = await readSheetData('Raw Material Inventory', 'A1:O1000', accessToken);
    } catch (readError) {
      console.error('❌ Failed to read Raw Material Inventory sheet:', readError);
      throw new Error('Cannot read Raw Material Inventory sheet. Please ensure the sheet exists and you have access.');
    }

    if (!rawData || rawData.length === 0) {
      throw new Error('Raw Material Inventory sheet is empty. Please add raw materials first.');
    }

    console.log(`📊 Read ${rawData.length} rows from Raw Material Inventory`);

    const inventory = parseSheetData(rawData);
    console.log(`📊 Parsed ${inventory.length} inventory items`);

    if (inventory.length === 0) {
      throw new Error('No raw material entries found in inventory. Please add raw materials first.');
    }

    // Debug: Log first item to see column structure
    if (inventory.length > 0) {
      console.log('📋 Sample inventory item columns:', Object.keys(inventory[0]));
      console.log('📋 Sample inventory item:', inventory[0]);
    }

    // Find matching raw materials (match on base material name like "Sunflower Seeds")
    const matchingMaterials = inventory.filter(item => {
      const itemMaterial = getMaterialName(item);
      const itemStatus = getStatus(item);
      const statusActive = isStatusActive(itemStatus);

      console.log(`  Checking: "${itemMaterial}" | Status: "${itemStatus}" | Active: ${statusActive}`);

      // Match if the item contains the base material name and is active/available
      const materialMatches = itemMaterial &&
             itemMaterial.toLowerCase().includes(baseMaterialName.toLowerCase());

      if (materialMatches) {
        console.log(`  ✓ Material matches: "${itemMaterial}"`);
      }

      return materialMatches && statusActive;
    });

    console.log(`📊 Found ${matchingMaterials.length} matching materials with active status`);

    // Calculate total available quantity from all matching materials
    let totalAvailableKg = 0;
    matchingMaterials.forEach(item => {
      const quantityKg = getQuantity(item); // Already in KG (from Total KG column)
      console.log(`  Adding ${quantityKg} kg from "${getMaterialName(item)}"`);
      totalAvailableKg += quantityKg;
    });

    console.log(`📊 Total available: ${totalAvailableKg} kg, Required: ${requiredQuantityKg} kg`);

    if (matchingMaterials.length === 0) {
      // Get active/available materials for error message
      const activeMaterials = inventory
        .filter(item => isStatusActive(getStatus(item)))
        .map(item => getMaterialName(item))
        .filter(name => name);

      console.log('📋 Active materials in inventory:', activeMaterials);

      // If no materials found, include column headers for debugging
      let debugInfo = '';
      if (activeMaterials.length === 0 && inventory.length > 0) {
        const sampleItem = inventory[0];
        const columns = Object.keys(sampleItem).join(', ');
        debugInfo = ` Sheet columns: [${columns}]`;
      }

      throw new Error(
        `Raw material "${baseMaterialName}" not found in inventory. ` +
        `Active materials: ${activeMaterials.length > 0 ? activeMaterials.join(', ') : 'None'}${debugInfo}`
      );
    }

    if (totalAvailableKg < requiredQuantityKg) {
      throw new Error(
        `Insufficient raw material! Available: ${totalAvailableKg.toFixed(2)} kg, Required: ${requiredQuantityKg.toFixed(2)} kg`
      );
    }

    console.log('✅ Availability check PASSED');

    return {
      available: true,
      materials: matchingMaterials,
      totalAvailableKg: totalAvailableKg
    };
  };

  // Consume raw materials and update inventory
  const consumeRawMaterials = async (baseMaterialName, consumedQuantityKg, wipBatchId, accessToken) => {
    try {
      // Read current inventory with headers (extended range for new columns)
      const rawData = await readSheetData('Raw Material Inventory', 'A1:O1000', accessToken);

      if (!rawData || rawData.length < 2) {
        throw new Error('Raw Material Inventory is empty or has no data rows');
      }

      // Get headers to find Total KG column (preferred) or Quantity column (fallback)
      const headers = rawData[0];

      // First try to find Total KG column (Column G in new format)
      let totalKgColIndex = headers.findIndex(h =>
        h && (h.toLowerCase() === 'total kg' || h.toLowerCase() === 'totalkg' || h.toLowerCase() === 'total_kg')
      );

      // Fallback to Quantity column
      const quantityColIndex = headers.findIndex(h =>
        h && (h.toLowerCase() === 'quantity' || h.toLowerCase() === 'qty' || h.toLowerCase() === 'stock')
      );

      // Use Total KG if available, otherwise use Quantity
      const useColumnIndex = totalKgColIndex !== -1 ? totalKgColIndex : quantityColIndex;
      const useColumnName = totalKgColIndex !== -1 ? 'Total KG' : 'Quantity';

      if (useColumnIndex === -1) {
        console.error('Available columns:', headers);
        throw new Error('Neither Total KG nor Quantity column found in Raw Material Inventory');
      }

      // Column letter (A=0, B=1, C=2, D=3, E=4, F=5, G=6...)
      const columnLetter = String.fromCharCode(65 + useColumnIndex);
      console.log(`📊 Using ${useColumnName} column: ${columnLetter} (index ${useColumnIndex})`);

      const inventory = parseSheetData(rawData);

      // Find matching active/available material - use strict matching
      // The material name in inventory should contain the full search term (e.g., "Sunflower Seeds 601")
      const materialIndex = inventory.findIndex(item => {
        const itemMaterial = getMaterialName(item);
        const itemStatus = getStatus(item);

        // Strict matching: inventory item must contain the exact material name we're looking for
        // e.g., searching for "Sunflower Seeds 601" should match "Sunflower Seeds 601" but NOT "Sunflower Seeds T6"
        const matches = itemMaterial &&
               itemMaterial.toLowerCase().includes(baseMaterialName.toLowerCase()) &&
               isStatusActive(itemStatus);

        if (matches) {
          console.log(`  ✓ Found matching material for consumption: "${itemMaterial}"`);
        }
        return matches;
      });

      if (materialIndex === -1) {
        const allMaterials = inventory.map(item => getMaterialName(item)).filter(n => n).join(', ');
        throw new Error(`Raw material "${baseMaterialName}" not found. Available: ${allMaterials}`);
      }

      const material = inventory[materialIndex];
      const materialName = getMaterialName(material);
      const unit = getUnit(material);

      // Get current quantity from the column we're updating
      const currentQuantityKg = getQuantity(material); // This now returns Total KG if available

      console.log(`📦 Found material: "${materialName}" at row ${materialIndex + 2}`);
      console.log(`📊 Current quantity: ${currentQuantityKg} KG (from ${useColumnName} column)`);
      console.log(`📊 To consume: ${consumedQuantityKg} KG`);

      // Since we're using Total KG column, no unit conversion needed
      const newQuantityKg = Math.max(0, currentQuantityKg - consumedQuantityKg);
      const rowIndex = materialIndex + 2; // +2 for header and 0-index

      console.log(`📝 Updating ${columnLetter}${rowIndex}: ${currentQuantityKg} KG -> ${newQuantityKg} KG`);

      await writeSheetData(
        'Raw Material Inventory',
        `${columnLetter}${rowIndex}`,
        [[newQuantityKg.toFixed(2)]],
        accessToken
      );

      console.log(`✅ Raw material quantity updated successfully`);

      // Also update the original Quantity column if we have KG per Unit
      if (totalKgColIndex !== -1 && quantityColIndex !== -1) {
        // Find KG per Unit column (Column F, index 5)
        const kgPerUnitColIndex = headers.findIndex(h =>
          h && (h.toLowerCase().includes('kg per') || h.toLowerCase() === 'kgperunit')
        );

        if (kgPerUnitColIndex !== -1) {
          const kgPerUnit = parseFloat(rawData[materialIndex + 1][kgPerUnitColIndex]) || 0;
          if (kgPerUnit > 0) {
            const newOriginalQty = newQuantityKg / kgPerUnit;
            const quantityColLetter = String.fromCharCode(65 + quantityColIndex);
            await writeSheetData(
              'Raw Material Inventory',
              `${quantityColLetter}${rowIndex}`,
              [[newOriginalQty.toFixed(2)]],
              accessToken
            );
            console.log(`📝 Also updated Quantity column: ${quantityColLetter}${rowIndex} -> ${newOriginalQty.toFixed(2)} ${unit}`);
          }
        }
      }

      // Add transaction to Raw Material Transactions (with new column format)
      const transactionRow = [
        new Date().toISOString(), // Timestamp
        formData.date, // Date
        'Stock Out', // Transaction Type
        materialName, // Material
        getItemValue(material, ['Category', 'category'], 'Base Item'), // Category
        unit, // Unit
        '', // KG per Unit (not applicable for out)
        '0', // Quantity In
        consumedQuantityKg.toFixed(2), // Quantity Out (in KG)
        consumedQuantityKg.toFixed(2), // Total KG consumed
        'Production Department', // Supplier (not applicable for out)
        wipBatchId, // Batch Number (WIP Batch ID as reference)
        '0', // Unit Price
        '0', // Total Cost
        `Production consumption for WIP Batch ${wipBatchId}`, // Notes
        'Production System' // User
      ];

      await appendSheetData('Raw Material Transactions', transactionRow, accessToken);

      return {
        success: true,
        newQuantity: newQuantityKg,
        consumed: consumedQuantityKg
      };
    } catch (error) {
      console.error('❌ Error in consumeRawMaterials:', error);
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

      // Build the full material name including variety (e.g., "Sunflower Seeds 601")
      // The raw material inventory stores items as "Product Type Variety" format
      const baseMaterialName = formData.seedVariety
        ? `${formData.productType} ${formData.seedVariety}`
        : formData.productType;

      console.log(`🔍 Checking availability for: "${baseMaterialName}" (Product: ${formData.productType}, Variety: ${formData.seedVariety || 'N/A'}), Required: ${requiredKg} kg`);

      // Check availability - this will throw an error if not enough stock
      const availabilityResult = await checkRawMaterialAvailability(baseMaterialName, requiredKg, accessToken);

      if (!availabilityResult || !availabilityResult.available) {
        setMessage({ type: 'error', text: 'Raw material availability check failed. Please check inventory.' });
        setLoading(false);
        return;
      }

      console.log(`✅ Availability check passed. Available: ${availabilityResult.totalAvailableKg} kg`);

      // Format overtime as "Employee: Xh, Employee2: Yh"
      const overtimeText = Object.entries(overtime)
        .filter(([_, hours]) => hours && parseFloat(hours) > 0)
        .map(([emp, hours]) => `${emp}: ${hours}h`)
        .join(', ');

      // Get selected truck labels
      const dieselTrucks = getDieselTrucks(settings);
      const dieselTruckObj = dieselTrucks.find(t => t.capacity === parseInt(formData.dieselTruck));
      const wastewaterTrucks = getWastewaterTrucks(settings);
      const wastewaterTruckObj = wastewaterTrucks.find(t => t.capacity === parseInt(formData.wastewaterTruck));

      // Prepare Production Data row (18 columns - added Seed Variety)
      const bagTypes = getBagTypes(settings);
      const bagTypeLabel = formData.bagType === 'OTHER'
        ? `Other ${formData.otherWeight}kg (${formData.bagQuantity} bags)`
        : `${bagTypes[formData.bagType].label} (${formData.bagQuantity} bags)`;

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
      await consumeRawMaterials(baseMaterialName, consumedKg, wipBatchId, accessToken);

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
        saltKg: '',
        dieselTruck: '',
        dieselLiters: '',
        wastewaterTruck: '',
        wastewaterLiters: '',
        notes: ''
      }));

      if (settings) {
        const employees = getEmployees(settings);
        setOvertime(employees.reduce((acc, emp) => ({ ...acc, [emp]: '' }), {}));
      }

      if (onSuccess) onSuccess();

    } catch (error) {
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
    // Get batch prefix from settings
    const products = getProductTypes(settings);
    const product = products.find(p => p.name === productType);
    const productCode = product?.batchPrefix || 'WIP';
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
                name="date"
                autoComplete="off"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Product Type *</label>
              <select
                className="input"
                name="productType"
                autoComplete="off"
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
                {settings && getProductTypes(settings).map(product => (
                  <option key={product.code} value={product.name}>{product.name}</option>
                ))}
              </select>
            </div>

            {/* Seed Variety - for all products */}
            {availableSeedVarieties.length > 0 && (
              <div>
                <label className="label">Seed Variety (Crop Type) *</label>
                <select
                  className="input"
                  name="seedVariety"
                  autoComplete="off"
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
                    name="sizeRange"
                    autoComplete="off"
                    value={formData.sizeRange}
                    onChange={(e) => setFormData({ ...formData, sizeRange: e.target.value })}
                    required
                  >
                    <option value="">Select Size</option>
                    {settings && getSunflowerSizes(settings).map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Variant/Region *</label>
                  <select
                    className="input"
                    name="variant"
                    autoComplete="off"
                    value={formData.variant}
                    onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                    required
                  >
                    <option value="">Select Region</option>
                    {settings && getRegions(settings).map(region => (
                      <option key={region.code} value={region.name}>{region.name}</option>
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
                name="bagType"
                autoComplete="off"
                value={formData.bagType}
                onChange={(e) => setFormData({ ...formData, bagType: e.target.value })}
                required
              >
                {settings && Object.entries(getBagTypes(settings)).map(([key, bag]) => (
                  <option key={key} value={key}>{bag.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Number of Bags *</label>
              <input
                type="number"
                className="input"
                name="bagQuantity"
                autoComplete="off"
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
                  name="otherWeight"
                  autoComplete="off"
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

          <div className="form-grid-3">
            <div>
              <label className="label">Salt Bags (50 kg each)</label>
              <input
                type="number"
                className="input"
                name="saltBags"
                autoComplete="off"
                value={formData.saltBags}
                onChange={(e) => setFormData({ ...formData, saltBags: e.target.value })}
                placeholder="e.g., 2"
                min="0"
              />
            </div>

            <div>
              <label className="label">Additional Salt (kg)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                name="saltKg"
                autoComplete="off"
                value={formData.saltKg}
                onChange={(e) => setFormData({ ...formData, saltKg: e.target.value })}
                placeholder="e.g., 17"
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
            {settings && getEmployees(settings).map(employee => (
              <div key={employee}>
                <label className="label text-sm">{employee}</label>
                <input
                  type="number"
                  step="0.5"
                  className="input"
                  name={`overtime_${employee}`}
                  autoComplete="off"
                  value={overtime[employee] || ''}
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
                name="dieselTruck"
                autoComplete="off"
                value={formData.dieselTruck}
                onChange={(e) => setFormData({ ...formData, dieselTruck: e.target.value, dieselLiters: '' })}
              >
                <option value="">Select Truck</option>
                {settings && getDieselTrucks(settings).map(truck => (
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
                name="dieselLiters"
                autoComplete="off"
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
                name="wastewaterTruck"
                autoComplete="off"
                value={formData.wastewaterTruck}
                onChange={(e) => setFormData({ ...formData, wastewaterTruck: e.target.value, wastewaterLiters: '' })}
              >
                <option value="">Select Truck</option>
                {settings && getWastewaterTrucks(settings).map(truck => (
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
                name="wastewaterLiters"
                autoComplete="off"
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
            name="notes"
            autoComplete="off"
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
