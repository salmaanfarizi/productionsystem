import React, { useState, useEffect } from 'react';
import { readSheetData, appendSheetData, writeSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import { PRODUCT_TYPES, PACKAGING_CONFIG, getPackagingConfig, calculateWeightFromUnits } from '@shared/config/products';
import {
  generateBatchId,
  getNextSequence,
  findActiveBatchForConsumption,
  calculateRemainingWeight,
  shouldCloseBatch
} from '@shared/utils/batchGenerator';

export default function PackingForm({ authHelper, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productType: '',
    seedType: '',
    size: '',
    variant: '',
    sku: '',
    unit1Count: '',
    unit2Count: '',
    operator: '',
    shift: 'Morning',
    line: '',
    notes: ''
  });

  const [availableSizes, setAvailableSizes] = useState([]);
  const [packagingConfig, setPackagingConfig] = useState(null);
  const [calculatedWeight, setCalculatedWeight] = useState({ kg: 0, tonnes: 0 });
  const [activeBatch, setActiveBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [productionData, setProductionData] = useState([]);
  const [batches, setBatches] = useState([]);

  // Load production data and batches
  useEffect(() => {
    loadProductionData();
    loadBatches();
  }, []);

  // Update available sizes when product type changes
  useEffect(() => {
    if (formData.productType) {
      const config = PACKAGING_CONFIG[formData.productType];
      if (config) {
        setAvailableSizes(config.sizes);
      }
    } else {
      setAvailableSizes([]);
    }
    setFormData(prev => ({ ...prev, size: '', sku: '' }));
  }, [formData.productType]);

  // Update packaging config when size changes
  useEffect(() => {
    if (formData.productType && formData.size) {
      const config = getPackagingConfig(formData.productType, formData.size);
      setPackagingConfig(config);
    } else {
      setPackagingConfig(null);
    }
  }, [formData.productType, formData.size]);

  // Calculate weight when units change
  useEffect(() => {
    if (formData.productType && formData.size) {
      const unit1 = parseInt(formData.unit1Count) || 0;
      const unit2 = parseInt(formData.unit2Count) || 0;

      const weightInTonnes = calculateWeightFromUnits(
        formData.productType,
        formData.size,
        unit1,
        unit2
      );

      setCalculatedWeight({
        kg: weightInTonnes * 1000,
        tonnes: weightInTonnes
      });
    }
  }, [formData.unit1Count, formData.unit2Count, formData.productType, formData.size]);

  // Find active batch when product details change
  useEffect(() => {
    if (formData.seedType && formData.size && batches.length > 0) {
      const batch = findActiveBatchForConsumption(
        batches,
        formData.seedType,
        formData.size,
        formData.variant
      );
      setActiveBatch(batch);
    } else {
      setActiveBatch(null);
    }
  }, [formData.seedType, formData.size, formData.variant, batches]);

  const loadProductionData = async () => {
    try {
      const rawData = await readSheetData('Daily - Jul 2025');
      setProductionData(parseSheetData(rawData));
    } catch (error) {
      console.error('Error loading production data:', error);
    }
  };

  const loadBatches = async () => {
    try {
      const rawData = await readSheetData('Batch Master');
      const parsed = parseSheetData(rawData);

      // Convert to proper format
      const formattedBatches = parsed.map(row => ({
        batchId: row['Batch ID'],
        productionDate: row['Production Date'],
        date: row['Production Date'],
        seedType: row['Seed Type'],
        size: row['Size'],
        variant: row['Production Variant'] || '',
        initialWeight: parseFloat(row['Initial Weight (T)']) || 0,
        consumedWeight: parseFloat(row['Consumed Weight (T)']) || 0,
        remainingWeight: parseFloat(row['Remaining Weight (T)']) || 0,
        status: row['Status'],
        startTime: row['Start Time'],
        completeTime: row['Complete Time'],
        linkedRows: row['Linked Production Rows'],
        notes: row['Notes']
      }));

      setBatches(formattedBatches);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    if (calculatedWeight.tonnes === 0) {
      setMessage({ type: 'error', text: 'Please enter valid quantities' });
      return;
    }

    if (!activeBatch) {
      setMessage({ type: 'error', text: 'No active batch available for this product' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();

      // Calculate consumption
      let remainingToConsume = calculatedWeight.tonnes;
      let currentBatch = activeBatch;
      const consumedBatches = [];

      while (remainingToConsume > 0.001 && currentBatch) {
        const batchRemaining = calculateRemainingWeight(currentBatch);
        const consumeFromBatch = Math.min(remainingToConsume, batchRemaining);

        // Record consumption in Packing Consumption sheet
        const consumptionRow = [
          new Date().toISOString(),
          currentBatch.batchId,
          formData.sku,
          formData.size,
          (parseInt(formData.unit1Count) || 0) + ((parseInt(formData.unit2Count) || 0) * (packagingConfig?.conversion || 1)),
          consumeFromBatch,
          batchRemaining - consumeFromBatch,
          formData.operator || 'Unknown',
          formData.shift,
          formData.line,
          formData.notes
        ];

        await appendSheetData('Packing Consumption', consumptionRow, accessToken);

        // Update batch master
        const batchIndex = batches.findIndex(b => b.batchId === currentBatch.batchId);
        if (batchIndex >= 0) {
          const newConsumed = currentBatch.consumedWeight + consumeFromBatch;
          const newRemaining = currentBatch.initialWeight - newConsumed;

          // Update in Batch Master sheet (row index + 2 for header)
          const rowNum = batchIndex + 2;
          await writeSheetData(
            'Batch Master',
            `G${rowNum}:H${rowNum}`,
            [[newConsumed, newRemaining]],
            accessToken
          );

          // Check if batch should be completed
          if (shouldCloseBatch({ ...currentBatch, consumedWeight: newConsumed })) {
            await writeSheetData(
              'Batch Master',
              `I${rowNum}:K${rowNum}`,
              [['COMPLETE', new Date().toISOString(), '']],
              accessToken
            );
          }
        }

        consumedBatches.push({
          batchId: currentBatch.batchId,
          consumed: consumeFromBatch
        });

        remainingToConsume -= consumeFromBatch;

        // Get next batch if needed
        if (remainingToConsume > 0.001) {
          await loadBatches(); // Refresh batches
          currentBatch = findActiveBatchForConsumption(
            batches,
            formData.seedType,
            formData.size,
            formData.variant
          );

          if (!currentBatch) {
            setMessage({
              type: 'warning',
              text: `Partially processed. Short by ${remainingToConsume.toFixed(3)}T`
            });
            break;
          }
        }
      }

      // Log to Batch Tracking
      for (const consumed of consumedBatches) {
        const trackingRow = [
          new Date().toISOString(),
          consumed.batchId,
          formData.seedType,
          formData.size,
          formData.variant,
          'CONSUMED',
          -consumed.consumed,
          '', // Will be calculated
          'Packing',
          formData.operator || 'Unknown',
          `SKU: ${formData.sku}`,
          `${consumed.consumed.toFixed(3)}T consumed`
        ];

        await appendSheetData('Batch Tracking', trackingRow, accessToken);
      }

      setMessage({
        type: 'success',
        text: `✓ Successfully recorded! Consumed from ${consumedBatches.length} batch(es)`
      });

      // Reset form
      setFormData(prev => ({
        ...prev,
        unit1Count: '',
        unit2Count: '',
        sku: '',
        notes: ''
      }));

      // Reload data
      await loadBatches();
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Packaging Entry Form
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Message Display */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Date */}
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

        {/* Product Type */}
        <div>
          <label className="label">Product Type</label>
          <select
            className="input"
            value={formData.productType}
            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
            required
          >
            <option value="">Select Product Type</option>
            {Object.entries(PRODUCT_TYPES).map(([key, value]) => (
              <option key={key} value={value}>{value}</option>
            ))}
          </select>
        </div>

        {/* Seed Type */}
        <div>
          <label className="label">Seed Type</label>
          <select
            className="input"
            value={formData.seedType}
            onChange={(e) => setFormData({ ...formData, seedType: e.target.value })}
            required
          >
            <option value="">Select Seed Type</option>
            <option value="T6">T6</option>
            <option value="361">361</option>
            <option value="363">363</option>
            <option value="601">601</option>
            <option value="S9">S9</option>
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="label">Package Size</label>
          <select
            className="input"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            disabled={!formData.productType}
            required
          >
            <option value="">Select Size</option>
            {availableSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Variant (Optional) */}
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

        {/* SKU */}
        <div>
          <label className="label">SKU / Product Code</label>
          <input
            type="text"
            className="input"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="e.g., SUN-T6-100G-001"
            required
          />
        </div>

        {/* Quantity Inputs */}
        {packagingConfig && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{packagingConfig.unit1}s</label>
              <input
                type="number"
                className="input"
                value={formData.unit1Count}
                onChange={(e) => setFormData({ ...formData, unit1Count: e.target.value })}
                min="0"
                placeholder="0"
              />
            </div>

            {packagingConfig.unit2 && (
              <div>
                <label className="label">{packagingConfig.unit2}s</label>
                <input
                  type="number"
                  className="input"
                  value={formData.unit2Count}
                  onChange={(e) => setFormData({ ...formData, unit2Count: e.target.value })}
                  min="0"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {packagingConfig.conversion} {packagingConfig.unit1}s = 1 {packagingConfig.unit2}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Calculated Weight */}
        {calculatedWeight.tonnes > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">Calculated Weight:</p>
            <p className="text-2xl font-bold text-blue-600">
              {calculatedWeight.kg.toFixed(2)} kg
            </p>
            <p className="text-sm text-blue-700">
              ({calculatedWeight.tonnes.toFixed(4)} Tonnes)
            </p>
          </div>
        )}

        {/* Active Batch Info */}
        {activeBatch && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">Active Batch:</p>
            <p className="text-lg font-bold text-green-600">{activeBatch.batchId}</p>
            <p className="text-sm text-green-700">
              Remaining: {calculateRemainingWeight(activeBatch).toFixed(3)}T
            </p>
          </div>
        )}

        {/* Operator Details */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Operator</label>
            <input
              type="text"
              className="input"
              value={formData.operator}
              onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              placeholder="Operator name"
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

          <div>
            <label className="label">Line</label>
            <input
              type="text"
              className="input"
              value={formData.line}
              onChange={(e) => setFormData({ ...formData, line: e.target.value })}
              placeholder="Line number"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (Optional)</label>
          <textarea
            className="input"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
            placeholder="Any additional notes..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !activeBatch}
          className={`w-full btn btn-primary py-3 text-lg font-semibold ${
            loading || !activeBatch ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Recording...' : '✓ Record Packaging Entry'}
        </button>
      </form>
    </div>
  );
}
