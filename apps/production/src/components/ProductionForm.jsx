import React, { useState, useEffect } from 'react';
import { appendSheetData } from '@shared/utils/sheetsAPI';
import {
  PRODUCT_TYPES,
  SUNFLOWER_SIZE_RANGES,
  SUNFLOWER_VARIANTS,
  BAG_TYPES,
  EMPLOYEES,
  DIESEL_TRUCKS,
  WASTEWATER_TRUCKS,
  calculateWIP,
  calculateWeightFromBags,
  calculateSaltWeight,
  productHasSizeVariant
} from '@shared/config/production';

export default function ProductionForm({ authHelper, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productType: '',
    size: '',
    variant: '',
    bagType: '25KG',
    bagQuantity: '',
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

  const [calculations, setCalculations] = useState({
    totalRawWeight: 0,
    wip: 0,
    loss: 0,
    saltWeight: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Calculate weights when inputs change
  useEffect(() => {
    const bagWeight = calculateWeightFromBags(formData.bagType, parseInt(formData.bagQuantity) || 0);
    const rawWeight = bagWeight / 1000; // Convert kg to tonnes

    const wipCalc = calculateWIP(rawWeight);
    const saltWeight = calculateSaltWeight(parseInt(formData.saltBags) || 0);

    setCalculations({
      totalRawWeight: rawWeight,
      wip: wipCalc.wip,
      loss: wipCalc.loss,
      saltWeight: saltWeight
    });
  }, [formData.bagType, formData.bagQuantity, formData.saltBags]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid weight' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();
      const weight = parseFloat(formData.weight);

      // Step 1: Add to Production Sheet
      const productionRow = [
        formData.date,
        formData.productionType,
        formData.seedType,
        formData.size,
        '', // Extra field
        formData.variant,
        formData.quantity || '',
        weight,
        '', '', '', '', '', '', '', '', // Extra columns
        '' // Batch ID column (Q/17) - will be filled later
      ];

      await appendSheetData('Daily - Jul 2025', productionRow, accessToken);

      // Step 2: Create or Update Batch
      const batchResult = await createOrUpdateBatch(
        formData.seedType,
        formData.size,
        formData.variant,
        weight,
        formData.date,
        accessToken
      );

      setMessage({
        type: 'success',
        text: `✓ Production recorded! Batch: ${batchResult.batchId} (${batchResult.action})`
      });

      // Reset form
      setFormData(prev => ({
        ...prev,
        quantity: '',
        weight: '',
        notes: ''
      }));

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error submitting production:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateBatch = async (seedType, size, variant, weight, date, accessToken) => {
    // Read existing batches
    const rawData = await readSheetData('Batch Master');
    const batches = parseSheetData(rawData);

    // Find active batch with same product
    const activeBatch = batches.find(b =>
      b['Seed Type'] === seedType &&
      b['Size'] === size &&
      (b['Production Variant'] || '') === (variant || '') &&
      b['Status'] === 'ACTIVE' &&
      parseFloat(b['Remaining Weight (T)'] || 0) > 0
    );

    if (activeBatch) {
      // Update existing batch
      const batchId = activeBatch['Batch ID'];
      const currentInitial = parseFloat(activeBatch['Initial Weight (T)']) || 0;
      const currentConsumed = parseFloat(activeBatch['Consumed Weight (T)']) || 0;
      const newInitial = currentInitial + weight;
      const newRemaining = newInitial - currentConsumed;

      // Find row index (add 2 for header + 0-index)
      const rowIndex = batches.findIndex(b => b['Batch ID'] === batchId) + 2;

      // Update weights
      await writeSheetData(
        'Batch Master',
        `F${rowIndex}:H${rowIndex}`,
        [[newInitial, currentConsumed, newRemaining]],
        accessToken
      );

      // Log to tracking
      await logBatchAction({
        batchId,
        action: 'WEIGHT_ADDED',
        weight,
        seedType,
        size,
        variant,
        department: 'Production',
        notes: `Added ${weight}T to existing batch`,
        accessToken
      });

      return { batchId, action: 'UPDATED' };

    } else {
      // Create new batch
      const batchSequence = getNextBatchSequence(batches, seedType, date);
      const batchId = generateBatchId(seedType, new Date(date), batchSequence);

      const batchRow = [
        batchId,
        date,
        seedType,
        size,
        variant || '',
        weight,
        0, // consumed
        weight, // remaining
        'ACTIVE',
        new Date().toISOString(),
        '', // complete time
        '', // linked rows
        'Created from production entry'
      ];

      await appendSheetData('Batch Master', batchRow, accessToken);

      // Log to tracking
      await logBatchAction({
        batchId,
        action: 'CREATED',
        weight,
        seedType,
        size,
        variant,
        department: 'Production',
        notes: `New batch created: ${weight}T`,
        accessToken
      });

      return { batchId, action: 'CREATED' };
    }
  };

  const getNextBatchSequence = (batches, seedType, date) => {
    const prefix = BATCH_PREFIX[seedType] || 'B';
    const dateStr = formatDateForBatch(new Date(date));
    const pattern = `${prefix}-${dateStr}-`;

    let maxSequence = 0;
    batches.forEach(batch => {
      const batchId = batch['Batch ID'];
      if (batchId && batchId.startsWith(pattern)) {
        const parts = batchId.split('-');
        const seq = parseInt(parts[parts.length - 1]);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    });

    return maxSequence + 1;
  };

  const logBatchAction = async ({ batchId, action, weight, seedType, size, variant, department, notes, accessToken }) => {
    const trackingRow = [
      new Date().toISOString(),
      batchId,
      seedType,
      size,
      variant || '',
      action,
      weight,
      '', // running total
      department,
      authHelper.getAccessToken() ? 'Production User' : 'System',
      'Production entry',
      notes
    ];

    await appendSheetData('Batch Tracking', trackingRow, accessToken);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Production Entry Form
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">Production Type</label>
          <select
            className="input"
            value={formData.productionType}
            onChange={(e) => setFormData({ ...formData, productionType: e.target.value })}
            required
          >
            <option value="Production Day">Production Day</option>
            <option value="Non Production Day">Non Production Day</option>
          </select>
        </div>

        <div>
          <label className="label">Seed Type</label>
          <select
            className="input"
            value={formData.seedType}
            onChange={(e) => setFormData({ ...formData, seedType: e.target.value })}
            required
          >
            <option value="">Select Seed Type</option>
            {Object.entries(SEED_TYPES).map(([key, value]) => (
              <option key={key} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Size</label>
          <select
            className="input"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            required
          >
            <option value="">Select Size</option>
            {sizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Variant (Optional)</label>
          <input
            type="text"
            className="input"
            value={formData.variant}
            onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
            placeholder="e.g., Salted, Roasted"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Quantity (Units)</label>
            <input
              type="number"
              className="input"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="Optional"
              min="0"
            />
          </div>

          <div>
            <label className="label">Weight (Tonnes) *</label>
            <input
              type="number"
              step="0.001"
              className="input"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="e.g., 5.5"
              min="0"
              required
            />
          </div>
        </div>

        {formData.weight && parseFloat(formData.weight) > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">Production Weight:</p>
            <p className="text-2xl font-bold text-green-600">
              {parseFloat(formData.weight).toFixed(3)} Tonnes
            </p>
            <p className="text-sm text-green-700">
              ({(parseFloat(formData.weight) * 1000).toFixed(2)} kg)
            </p>
          </div>
        )}

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
