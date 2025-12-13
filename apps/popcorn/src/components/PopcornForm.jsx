import React, { useState, useEffect } from 'react';
import { appendSheetData, readSheetData, writeSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import {
  getEmployees,
  getBagTypes,
  calculateWeightFromBags,
  getSystemConfig
} from '@shared/utils/settingsLoader';

// Popcorn-specific packaging configurations
const POPCORN_PACKAGES = {
  '50g': { weight: 0.05, label: '50g Pouch', pcsPerCarton: 48 },
  '100g': { weight: 0.1, label: '100g Pouch', pcsPerCarton: 24 },
  '150g': { weight: 0.15, label: '150g Pouch', pcsPerCarton: 20 },
  '200g': { weight: 0.2, label: '200g Pouch', pcsPerCarton: 12 },
  '500g': { weight: 0.5, label: '500g Pack', pcsPerCarton: 10 },
  '1kg': { weight: 1, label: '1 kg Pack', pcsPerCarton: 6 }
};

const POPCORN_FLAVORS = [
  'Classic Salted',
  'Butter',
  'Caramel',
  'Cheese',
  'Sweet & Salty',
  'Spicy',
  'Plain'
];

export default function PopcornForm({ authHelper, onSuccess, settings }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    variety: '',
    flavor: '',
    // Raw material input
    rawBagType: '25KG',
    rawBagQuantity: '',
    // Packing output
    packageSize: '',
    pouchCount: '',
    cartonCount: '',
    // Other
    operator: '',
    shift: 'Morning',
    notes: ''
  });

  const [overtime, setOvertime] = useState({});

  const [calculations, setCalculations] = useState({
    rawWeightKg: 0,
    rawWeightTonnes: 0,
    outputWeightKg: 0,
    outputWeightTonnes: 0,
    totalPouches: 0,
    loss: 0,
    lossPercent: 0
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

  // Calculate weights when inputs change
  useEffect(() => {
    if (!settings) return;

    // Calculate raw material weight
    const rawWeight = calculateWeightFromBags(settings, formData.rawBagType, parseInt(formData.rawBagQuantity) || 0);
    const rawWeightTonnes = rawWeight / 1000;

    // Calculate output weight from packing
    const packageConfig = POPCORN_PACKAGES[formData.packageSize];
    let outputWeightKg = 0;
    let totalPouches = 0;

    if (packageConfig) {
      const pouches = parseInt(formData.pouchCount) || 0;
      const cartons = parseInt(formData.cartonCount) || 0;
      totalPouches = pouches + (cartons * packageConfig.pcsPerCarton);
      outputWeightKg = totalPouches * packageConfig.weight;
    }

    const outputWeightTonnes = outputWeightKg / 1000;

    // Calculate loss
    const loss = rawWeightTonnes - outputWeightTonnes;
    const lossPercent = rawWeightTonnes > 0 ? (loss / rawWeightTonnes) * 100 : 0;

    setCalculations({
      rawWeightKg: rawWeight,
      rawWeightTonnes: rawWeightTonnes,
      outputWeightKg: outputWeightKg,
      outputWeightTonnes: outputWeightTonnes,
      totalPouches: totalPouches,
      loss: loss,
      lossPercent: lossPercent
    });
  }, [formData.rawBagType, formData.rawBagQuantity, formData.packageSize, formData.pouchCount, formData.cartonCount, settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    if (!formData.rawBagQuantity || parseInt(formData.rawBagQuantity) <= 0) {
      setMessage({ type: 'error', text: 'Please enter raw material bag quantity' });
      return;
    }

    if (!formData.packageSize) {
      setMessage({ type: 'error', text: 'Please select package size' });
      return;
    }

    if (calculations.totalPouches <= 0) {
      setMessage({ type: 'error', text: 'Please enter packing output (pouches or cartons)' });
      return;
    }

    // Check for excessive loss
    if (calculations.lossPercent > 15) {
      const confirmed = window.confirm(
        `⚠️ High Loss Warning!\n\nLoss percentage: ${calculations.lossPercent.toFixed(1)}%\nThis seems unusually high.\n\nDo you want to proceed anyway?`
      );
      if (!confirmed) return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();

      // Generate batch ID
      const dateObj = new Date(formData.date);
      const dateStr = `${dateObj.getFullYear().toString().slice(-2)}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getDate().toString().padStart(2, '0')}`;

      // Get next sequence
      const existingData = await readSheetData('Popcorn Production', 'A1:A1000', accessToken).catch(() => null);
      let sequence = 1;
      if (existingData && existingData.length > 1) {
        const todayBatches = existingData.filter(row => row[0] && row[0].includes(`POP-${dateStr}`));
        sequence = todayBatches.length + 1;
      }

      const batchId = `POP-${dateStr}-${sequence.toString().padStart(3, '0')}`;

      // Format overtime
      const overtimeText = Object.entries(overtime)
        .filter(([_, hours]) => hours && parseFloat(hours) > 0)
        .map(([emp, hours]) => `${emp}: ${hours}h`)
        .join(', ');

      const bagTypes = getBagTypes(settings);
      const bagTypeLabel = bagTypes[formData.rawBagType]?.label || formData.rawBagType;

      // Create combined production + packing row
      const productionRow = [
        batchId,
        formData.date,
        'Popcorn',
        formData.variety || 'Standard',
        formData.flavor,
        // Raw material
        `${bagTypeLabel} x ${formData.rawBagQuantity}`,
        calculations.rawWeightKg.toFixed(2),
        calculations.rawWeightTonnes.toFixed(4),
        // Packing output
        POPCORN_PACKAGES[formData.packageSize]?.label || formData.packageSize,
        formData.pouchCount || '0',
        formData.cartonCount || '0',
        calculations.totalPouches,
        calculations.outputWeightKg.toFixed(2),
        calculations.outputWeightTonnes.toFixed(4),
        // Loss
        (calculations.loss * 1000).toFixed(2),
        calculations.lossPercent.toFixed(2),
        // Other
        formData.operator || 'Unknown',
        formData.shift,
        overtimeText,
        formData.notes,
        new Date().toISOString()
      ];

      await appendSheetData('Popcorn Production', productionRow, accessToken);

      // Also add to Finished Goods Inventory
      const finishedGoodsRow = [
        new Date().toISOString(),
        formData.date,
        batchId,
        'Popcorn',
        formData.variety || 'Standard',
        formData.flavor,
        POPCORN_PACKAGES[formData.packageSize]?.label || formData.packageSize,
        calculations.totalPouches,
        calculations.outputWeightKg.toFixed(2),
        'AVAILABLE',
        'Popcorn Production',
        formData.notes
      ];

      await appendSheetData('Finished Goods Inventory', finishedGoodsRow, accessToken);

      // Consume raw materials
      await consumeRawMaterial(
        `Popcorn Corn ${formData.variety || 'Standard'}`,
        calculations.rawWeightKg,
        batchId,
        accessToken
      );

      setMessage({
        type: 'success',
        text: `✓ Production & Packing recorded! Batch: ${batchId} | Output: ${calculations.totalPouches} pouches (${calculations.outputWeightKg.toFixed(2)} kg)`
      });

      // Reset form
      setFormData(prev => ({
        ...prev,
        rawBagQuantity: '',
        pouchCount: '',
        cartonCount: '',
        notes: ''
      }));

      if (settings) {
        const employees = getEmployees(settings);
        setOvertime(employees.reduce((acc, emp) => ({ ...acc, [emp]: '' }), {}));
      }

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const consumeRawMaterial = async (materialName, consumedKg, batchId, accessToken) => {
    try {
      // Read Raw Material Inventory
      const rawData = await readSheetData('Raw Material Inventory', 'A1:O1000', accessToken);
      if (!rawData || rawData.length < 2) return;

      const headers = rawData[0];
      const inventory = parseSheetData(rawData);

      // Find matching material
      const materialIndex = inventory.findIndex(item => {
        const itemName = item['Item'] || item['Material Name'] || item['Material'] || '';
        const status = (item['Status'] || 'Available').toUpperCase();
        return itemName.toLowerCase().includes('popcorn') &&
               (status === 'ACTIVE' || status === 'AVAILABLE');
      });

      if (materialIndex === -1) {
        console.warn('Popcorn raw material not found in inventory');
        return;
      }

      // Find Total KG column
      let totalKgColIndex = headers.findIndex(h =>
        h && (h.toLowerCase() === 'total kg' || h.toLowerCase() === 'totalkg')
      );

      if (totalKgColIndex === -1) {
        totalKgColIndex = headers.findIndex(h =>
          h && (h.toLowerCase() === 'quantity' || h.toLowerCase() === 'qty')
        );
      }

      if (totalKgColIndex === -1) return;

      const currentQty = parseFloat(rawData[materialIndex + 1][totalKgColIndex]) || 0;
      const newQty = Math.max(0, currentQty - consumedKg);
      const columnLetter = String.fromCharCode(65 + totalKgColIndex);
      const rowIndex = materialIndex + 2;

      await writeSheetData(
        'Raw Material Inventory',
        `${columnLetter}${rowIndex}`,
        [[newQty.toFixed(2)]],
        accessToken
      );

      // Add transaction record
      const transactionRow = [
        new Date().toISOString(),
        new Date().toISOString().split('T')[0],
        'Stock Out',
        'Popcorn Corn',
        'Popcorn',
        'KG',
        '',
        '0',
        consumedKg.toFixed(2),
        consumedKg.toFixed(2),
        'Popcorn Production',
        batchId,
        '0',
        '0',
        `Consumed for batch ${batchId}`,
        'Popcorn System'
      ];

      await appendSheetData('Raw Material Transactions', transactionRow, accessToken);

    } catch (error) {
      console.error('Error consuming raw material:', error);
    }
  };

  return (
    <div className="card">
      <h2 className="heading-lg mb-4 sm:mb-6 text-gray-900">
        🍿 Popcorn Production & Packing Entry
      </h2>

      <form onSubmit={handleSubmit} className="section-spacing">
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="section-container bg-yellow-50 border-yellow-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-yellow-900">1. Basic Information</h3>
          <div className="form-grid-3">
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
              <label className="label">Corn Variety</label>
              <select
                className="input"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              >
                <option value="">Select Variety</option>
                <option value="Butterfly">Butterfly</option>
                <option value="Mushroom">Mushroom</option>
                <option value="Yellow">Yellow</option>
                <option value="White">White</option>
              </select>
            </div>
            <div>
              <label className="label">Flavor *</label>
              <select
                className="input"
                value={formData.flavor}
                onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                required
              >
                <option value="">Select Flavor</option>
                {POPCORN_FLAVORS.map(flavor => (
                  <option key={flavor} value={flavor}>{flavor}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Raw Material Input */}
        <div className="section-container bg-orange-50 border-orange-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-orange-900">2. Raw Material (Corn Kernels)</h3>
          <div className="form-grid-2">
            <div>
              <label className="label">Bag Type *</label>
              <select
                className="input"
                value={formData.rawBagType}
                onChange={(e) => setFormData({ ...formData, rawBagType: e.target.value })}
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
                value={formData.rawBagQuantity}
                onChange={(e) => setFormData({ ...formData, rawBagQuantity: e.target.value })}
                placeholder="e.g., 10"
                min="1"
                required
              />
            </div>
          </div>

          {calculations.rawWeightKg > 0 && (
            <div className="mt-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Raw Material Weight:</strong> {calculations.rawWeightKg.toFixed(2)} kg ({calculations.rawWeightTonnes.toFixed(4)} T)
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Packing Output */}
        <div className="section-container bg-green-50 border-green-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-green-900">3. Packing Output</h3>
          <div className="form-grid-3">
            <div>
              <label className="label">Package Size *</label>
              <select
                className="input"
                value={formData.packageSize}
                onChange={(e) => setFormData({ ...formData, packageSize: e.target.value })}
                required
              >
                <option value="">Select Size</option>
                {Object.entries(POPCORN_PACKAGES).map(([key, pkg]) => (
                  <option key={key} value={key}>{pkg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Loose Pouches</label>
              <input
                type="number"
                className="input"
                value={formData.pouchCount}
                onChange={(e) => setFormData({ ...formData, pouchCount: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="label">Full Cartons</label>
              <input
                type="number"
                className="input"
                value={formData.cartonCount}
                onChange={(e) => setFormData({ ...formData, cartonCount: e.target.value })}
                placeholder="0"
                min="0"
              />
              {formData.packageSize && POPCORN_PACKAGES[formData.packageSize] && (
                <p className="text-xs text-gray-500 mt-1">
                  {POPCORN_PACKAGES[formData.packageSize].pcsPerCarton} pcs per carton
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Production Summary */}
        {calculations.totalPouches > 0 && (
          <div className="section-container bg-blue-50 border-2 border-blue-300">
            <h3 className="heading-md mb-3 sm:mb-4 text-blue-900">4. Production Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600">Raw Input</p>
                <p className="text-xl font-bold text-orange-600">{calculations.rawWeightKg.toFixed(1)} kg</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600">Total Pouches</p>
                <p className="text-xl font-bold text-green-600">{calculations.totalPouches}</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600">Output Weight</p>
                <p className="text-xl font-bold text-blue-600">{calculations.outputWeightKg.toFixed(1)} kg</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600">Loss</p>
                <p className={`text-xl font-bold ${calculations.lossPercent > 10 ? 'text-red-600' : 'text-gray-600'}`}>
                  {calculations.lossPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Operator & Shift */}
        <div className="section-container bg-purple-50 border-purple-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-purple-900">5. Operator Details</h3>
          <div className="form-grid-2">
            <div>
              <label className="label">Operator Name</label>
              <input
                type="text"
                className="input"
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                placeholder="Enter operator name"
              />
            </div>
            <div>
              <label className="label">Shift</label>
              <select
                className="input"
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 6: Employee Overtime */}
        <div className="section-container bg-indigo-50 border-indigo-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-indigo-900">6. Employee Overtime</h3>
          <div className="form-grid-3">
            {settings && getEmployees(settings).map(employee => (
              <div key={employee}>
                <label className="label text-sm">{employee}</label>
                <input
                  type="number"
                  step="0.5"
                  className="input"
                  value={overtime[employee] || ''}
                  onChange={(e) => setOvertime({ ...overtime, [employee]: e.target.value })}
                  placeholder="Hours"
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 7: Notes */}
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
          {loading ? 'Recording...' : '✓ Record Production & Packing'}
        </button>
      </form>
    </div>
  );
}
