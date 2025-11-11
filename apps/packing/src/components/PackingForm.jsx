import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
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
    machineCounter: '',
    operator: '',
    shift: 'Morning',
    line: '',
    notes: ''
  });

  const [availableSizes, setAvailableSizes] = useState([]);
  const [packagingConfig, setPackagingConfig] = useState(null);
  const [calculatedWeight, setCalculatedWeight] = useState({ kg: 0, tonnes: 0 });
  const [totalPouches, setTotalPouches] = useState(0);
  const [counterMismatch, setCounterMismatch] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [productionData, setProductionData] = useState([]);
  const [batches, setBatches] = useState([]);
  const signaturePadRef = useRef(null);

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

  // Calculate weight and total pouches when units change
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

      // Calculate total pouches using pcsPerUnit1 from config
      const config = packagingConfig;
      if (config && config.pcsPerUnit1) {
        // Total pouches = (unit1 * pcsPerUnit1) + (unit2 * conversion * pcsPerUnit1)
        const totalFromUnit1 = unit1 * config.pcsPerUnit1;
        const totalFromUnit2 = unit2 * config.conversion * config.pcsPerUnit1;
        const total = totalFromUnit1 + totalFromUnit2;
        setTotalPouches(total);
      } else {
        // Fallback for items without pcsPerUnit1 (like 800g, 10kg)
        const conversion = config?.conversion || 1;
        const total = unit1 + (unit2 * conversion);
        setTotalPouches(total);
      }

      // Check for mismatch with machine counter
      const machineCount = parseInt(formData.machineCounter) || 0;
      if (machineCount > 0 && totalPouches > 0) {
        setCounterMismatch(machineCount !== totalPouches);
      } else {
        setCounterMismatch(false);
      }
    }
  }, [formData.unit1Count, formData.unit2Count, formData.machineCounter, formData.productType, formData.size, packagingConfig, totalPouches]);

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
      const rawData = await readSheetData('WIP Inventory');
      const parsed = parseSheetData(rawData);

      // Convert to proper format
      const formattedBatches = parsed.map(row => ({
        batchId: row['WIP Batch ID'],
        productionDate: row['Date'],
        date: row['Date'],
        seedType: row['Product Type'],
        size: row['Size Range'],
        variant: row['Variant/Region'] || '',
        initialWeight: parseFloat(row['Initial WIP (T)']) || 0,
        consumedWeight: parseFloat(row['Consumed (T)']) || 0,
        remainingWeight: parseFloat(row['Remaining (T)']) || 0,
        status: row['Status'],
        startTime: row['Created'],
        completeTime: row['Completed'],
        linkedRows: '',
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

    if (!formData.machineCounter || parseInt(formData.machineCounter) === 0) {
      setMessage({ type: 'error', text: 'Please enter the machine counter reading' });
      return;
    }

    // Check for signature
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setMessage({ type: 'error', text: 'Please provide supervisor signature' });
      return;
    }

    if (counterMismatch) {
      const confirmed = window.confirm(
        `⚠️ Warning: Counter Mismatch!\n\n` +
        `Entered Quantity: ${totalPouches} pouches\n` +
        `Machine Counter: ${formData.machineCounter} pouches\n` +
        `Difference: ${Math.abs(totalPouches - parseInt(formData.machineCounter))} pouches\n\n` +
        `Do you want to proceed anyway?`
      );
      if (!confirmed) {
        return;
      }
    }

    if (!activeBatch) {
      setMessage({ type: 'error', text: 'No active batch available for this product' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();

      // Get signature as base64
      const signatureDataURL = signaturePadRef.current.toDataURL();

      // Generate pending entry ID
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
      const entryId = `PKG-${timestamp}`;

      // Create Pending Packing Entry
      const pendingEntry = [
        entryId,
        new Date().toISOString(),
        formData.date,
        activeBatch.batchId,
        formData.productType,
        formData.seedType,
        formData.size,
        formData.variant || 'N/A',
        formData.sku,
        parseInt(formData.unit1Count) || 0,
        parseInt(formData.unit2Count) || 0,
        totalPouches,
        formData.machineCounter,
        counterMismatch ? 'MISMATCH' : 'MATCH',
        calculatedWeight.tonnes.toFixed(4),
        formData.operator || 'Unknown',
        formData.shift,
        formData.line,
        'PENDING',
        '', // Approved By (empty)
        '', // Approved At (empty)
        '', // Rejection Reason (empty)
        signatureDataURL,
        formData.notes
      ];

      await appendSheetData('Pending Packing Entries', pendingEntry, accessToken);

      setMessage({
        type: 'success',
        text: `✓ Packing entry submitted! Entry ID: ${entryId}. Awaiting store manager approval.`
      });

      // Reset form
      setFormData(prev => ({
        ...prev,
        unit1Count: '',
        unit2Count: '',
        machineCounter: '',
        sku: '',
        notes: ''
      }));

      // Clear signature
      if (signaturePadRef.current) {
        signaturePadRef.current.clear();
      }

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
            name="date"
            autoComplete="off"
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
            name="productType"
            autoComplete="off"
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
            name="seedType"
            autoComplete="off"
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
            name="size"
            autoComplete="off"
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
            name="variant"
            autoComplete="off"
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
            name="sku"
            autoComplete="off"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="e.g., SUN-T6-100G-001"
            required
          />
        </div>

        {/* Quantity Inputs */}
        {packagingConfig && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{packagingConfig.unit1}s</label>
                <input
                  type="number"
                  className="input"
                  name="unit1Count"
                  autoComplete="off"
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
                    name="unit2Count"
                    autoComplete="off"
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

            {/* Machine Counter Verification */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <label className="label text-purple-900">Machine Counter (Total Pouches)</label>
              <input
                type="number"
                className={`input ${counterMismatch ? 'border-red-500 border-2' : ''}`}
                name="machineCounter"
                autoComplete="off"
                value={formData.machineCounter}
                onChange={(e) => setFormData({ ...formData, machineCounter: e.target.value })}
                min="0"
                placeholder="Enter machine counter reading"
                required
              />
              <p className="text-xs text-purple-700 mt-1">
                ℹ️ Check the machine's counter and enter the total pouches produced
              </p>
            </div>

            {/* Counter Comparison Display */}
            {totalPouches > 0 && formData.machineCounter && (
              <div className={`border-2 rounded-lg p-4 ${
                counterMismatch
                  ? 'bg-red-50 border-red-300'
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Entered Quantity</p>
                    <p className="text-2xl font-bold text-gray-900">{totalPouches}</p>
                    <p className="text-xs text-gray-500">pouches</p>
                  </div>
                  <div className="flex items-center justify-center">
                    {counterMismatch ? (
                      <span className="text-3xl text-red-600">≠</span>
                    ) : (
                      <span className="text-3xl text-green-600">✓</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Machine Counter</p>
                    <p className="text-2xl font-bold text-gray-900">{formData.machineCounter}</p>
                    <p className="text-xs text-gray-500">pouches</p>
                  </div>
                </div>

                {counterMismatch && (
                  <div className="mt-3 p-3 bg-red-100 rounded-lg">
                    <p className="text-sm font-semibold text-red-900">⚠️ Counter Mismatch Detected!</p>
                    <p className="text-xs text-red-800 mt-1">
                      Difference: {Math.abs(totalPouches - parseInt(formData.machineCounter))} pouches
                      {totalPouches > parseInt(formData.machineCounter)
                        ? ' (Entered quantity is higher)'
                        : ' (Machine counter is higher)'}
                    </p>
                    <p className="text-xs text-red-700 mt-2">
                      Please verify the count with the machine before submitting.
                    </p>
                  </div>
                )}

                {!counterMismatch && (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm font-semibold text-green-900">✓ Counts Match!</p>
                    <p className="text-xs text-green-800">
                      Entered quantity matches the machine counter reading.
                    </p>
                  </div>
                )}
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
              name="operator"
              autoComplete="off"
              value={formData.operator}
              onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              placeholder="Operator name"
            />
          </div>

          <div>
            <label className="label">Shift</label>
            <select
              className="input"
              name="shift"
              autoComplete="off"
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
              name="line"
              autoComplete="off"
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
            name="notes"
            autoComplete="off"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
            placeholder="Any additional notes..."
          />
        </div>

        {/* Supervisor Signature */}
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold text-indigo-900">
              Supervisor Signature *
            </label>
            <button
              type="button"
              onClick={() => signaturePadRef.current?.clear()}
              className="text-sm px-3 py-1 bg-white border border-indigo-300 rounded hover:bg-indigo-50 text-indigo-700"
            >
              Clear
            </button>
          </div>
          <div className="bg-white border-2 border-indigo-300 rounded-lg overflow-hidden">
            <SignatureCanvas
              ref={signaturePadRef}
              canvasProps={{
                className: 'w-full h-32',
                style: { width: '100%', height: '128px' }
              }}
              backgroundColor="rgb(255, 255, 255)"
              penColor="rgb(0, 0, 139)"
            />
          </div>
          <p className="text-xs text-indigo-700 mt-2">
            ✍️ Supervisor must sign above to approve this packing entry
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !activeBatch}
          className={`w-full btn btn-primary py-3 text-lg font-semibold ${
            loading || !activeBatch ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Submitting for Approval...' : '✓ Submit Packing Entry'}
        </button>
      </form>
    </div>
  );
}
