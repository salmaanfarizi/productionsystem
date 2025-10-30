import React, { useState, useEffect } from 'react';
import { readSheetData, appendSheetData, writeSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import {
  RETAIL_PRODUCTS,
  PACKING_PRODUCT_TYPES,
  REGIONS,
  getSKUsForProduct,
  getProductBySKU,
  calculatePackagingWeight,
  calculateRecommendedPacking,
  productNeedsRegion
} from '@shared/config/retailProducts';
import {
  calculatePackingMaterialConsumption,
  getPackingMaterialForDeduction
} from '@shared/config/packingMaterials';
import { generateTransferPDF } from '@shared/utils/pdfGenerator';
import { generatePacketLabel, getNextSequence } from '@shared/utils/packetLabelGenerator';
import BatchLabelPopup from './BatchLabelPopup';

export default function PackingFormNew({ authHelper, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productType: '',
    region: '',
    sku: '',
    unitsPacked: '',
    operator: '',
    shift: 'Morning',
    line: '',
    notes: ''
  });

  // Helper function to get region value consistently
  const getRegionValue = () => {
    return productNeedsRegion(formData.productType) ? formData.region : 'N/A';
  };

  const [availableSKUs, setAvailableSKUs] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableWIP, setAvailableWIP] = useState([]);
  const [currentInventory, setCurrentInventory] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [calculatedWeight, setCalculatedWeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [labelData, setLabelData] = useState(null);

  // Load WIP batches and inventory when product/region changes
  useEffect(() => {
    if (formData.productType && (productNeedsRegion(formData.productType) ? formData.region : true)) {
      loadAvailableWIP();
    }
  }, [formData.productType, formData.region]);

  // Load inventory when SKU changes
  useEffect(() => {
    if (formData.sku) {
      loadCurrentInventory();
    }
  }, [formData.sku, formData.region]);

  // Update available SKUs when product type changes
  useEffect(() => {
    if (formData.productType) {
      const skus = getSKUsForProduct(formData.productType);
      setAvailableSKUs(skus);
      setFormData(prev => ({ ...prev, sku: '', unitsPacked: '' }));
    } else {
      setAvailableSKUs([]);
    }
  }, [formData.productType]);

  // Calculate weight when units change
  useEffect(() => {
    if (formData.sku && formData.unitsPacked) {
      const weight = calculatePackagingWeight(formData.sku, parseInt(formData.unitsPacked) || 0);
      setCalculatedWeight(weight);
    } else {
      setCalculatedWeight(0);
    }
  }, [formData.sku, formData.unitsPacked]);

  // Update selected product details
  useEffect(() => {
    if (formData.sku) {
      const product = getProductBySKU(formData.sku);
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
  }, [formData.sku]);

  const loadAvailableWIP = async () => {
    try {
      const rawData = await readSheetData('WIP Inventory');
      const parsed = parseSheetData(rawData);

      // Filter active WIP batches for selected product and region
      const filtered = parsed.filter(row => {
        const matchesProduct = row['Product Type'] === formData.productType;
        const matchesRegion = !productNeedsRegion(formData.productType) ||
                             row['Variant/Region'] === formData.region;
        const isActive = row['Status'] === 'ACTIVE';
        const hasRemaining = parseFloat(row['Remaining (T)']) > 0.001;

        return matchesProduct && matchesRegion && isActive && hasRemaining;
      });

      setAvailableWIP(filtered);

      if (filtered.length === 0) {
        setMessage({
          type: 'warning',
          text: `No WIP available for ${formData.productType}${formData.region ? ` (${formData.region})` : ''}`
        });
      } else {
        setMessage(null);
      }
    } catch (error) {
      console.error('Error loading WIP:', error);
      setMessage({ type: 'error', text: 'Error loading WIP inventory' });
    }
  };

  const loadCurrentInventory = async () => {
    try {
      const rawData = await readSheetData('Finished Goods Inventory');
      const parsed = parseSheetData(rawData);

      // Find inventory row for this SKU and region
      const inventoryRow = parsed.find(row => {
        const matchesSKU = row['SKU'] === formData.sku;
        const matchesRegion = !productNeedsRegion(formData.productType) ||
                             row['Region'] === formData.region;
        return matchesSKU && matchesRegion;
      });

      if (inventoryRow) {
        const currentStock = parseInt(inventoryRow['Current Stock']) || 0;
        const minStock = parseInt(inventoryRow['Minimum Stock']) || 0;
        const status = inventoryRow['Status'] || 'OK';

        setCurrentInventory({
          current: currentStock,
          minimum: minStock,
          status: status
        });

        // Calculate recommendation
        if (minStock > 0) {
          const recommended = calculateRecommendedPacking(formData.sku, formData.region, currentStock);
          setRecommendation(recommended);
        } else {
          setRecommendation(null);
        }
      } else {
        setCurrentInventory(null);
        setRecommendation(null);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setCurrentInventory(null);
    }
  };

  const generateTransferId = async (date) => {
    try {
      const rawData = await readSheetData('Packing Transfers', 'A1:A1000');
      const parsed = parseSheetData(rawData);

      const dateStr = new Date(date).toISOString().slice(2, 10).replace(/-/g, '');
      const pattern = `TRF-${dateStr}-`;

      let maxSeq = 0;
      parsed.forEach(row => {
        const transferId = row['Transfer ID'] || '';
        if (transferId.startsWith(pattern)) {
          const seq = parseInt(transferId.split('-')[2]);
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      });

      return `${pattern}${(maxSeq + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating transfer ID:', error);
      const dateStr = new Date(date).toISOString().slice(2, 10).replace(/-/g, '');
      return `TRF-${dateStr}-001`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    if (availableWIP.length === 0) {
      setMessage({ type: 'error', text: 'No WIP available for this product' });
      return;
    }

    if (!formData.unitsPacked || parseInt(formData.unitsPacked) <= 0) {
      setMessage({ type: 'error', text: 'Please enter valid quantity' });
      return;
    }

    if (calculatedWeight === 0) {
      setMessage({ type: 'error', text: 'Invalid weight calculation' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();
      const transferId = await generateTransferId(formData.date);
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Select WIP batch (FIFO - oldest first)
      const wipBatch = availableWIP[0];
      const wipRemaining = parseFloat(wipBatch['Remaining (T)']);

      if (calculatedWeight > wipRemaining) {
        setMessage({
          type: 'error',
          text: `Insufficient WIP. Available: ${wipRemaining.toFixed(3)}T, Required: ${calculatedWeight.toFixed(3)}T`
        });
        setLoading(false);
        return;
      }

      // Calculate totals
      const totalUnits = parseInt(formData.unitsPacked) * selectedProduct.packaging.quantity;

      // Get existing packet labels for sequence calculation
      const regionValue = getRegionValue();
      console.log('[Batch Label Debug] Region value:', regionValue);
      console.log('[Batch Label Debug] Product type:', formData.productType);
      console.log('[Batch Label Debug] Form region:', formData.region);

      let existingLabels = [];
      try {
        const transfersRaw = await readSheetData('Packing Transfers', 'A1:R1000', accessToken);
        const transfersParsed = parseSheetData(transfersRaw);
        existingLabels = transfersParsed
          .filter(row => row['Packet Label']) // Filter rows that have packet labels
          .map(row => row['Packet Label']);
        console.log('[Batch Label Debug] Existing labels:', existingLabels);
      } catch (error) {
        console.warn('Could not load existing labels, using sequence 1:', error);
      }

      // Calculate sequence number
      const sequence = getNextSequence(regionValue, formData.date, existingLabels);
      console.log('[Batch Label Debug] Sequence:', sequence);

      // Generate packet label
      const packetLabel = generatePacketLabel(
        wipBatch['WIP Batch ID'],
        regionValue,
        formData.date,
        sequence
      );
      console.log('[Batch Label Debug] Generated packet label:', packetLabel);
      console.log('[Batch Label Debug] WIP Batch ID:', wipBatch['WIP Batch ID']);

      // Create packing transfer row (18 columns - added Packet Label)
      const transferRow = [
        transferId,
        formData.date,
        time,
        wipBatch['WIP Batch ID'],
        regionValue,
        formData.sku,
        selectedProduct.productType,
        selectedProduct.size,
        selectedProduct.packaging.type,
        formData.unitsPacked,
        totalUnits.toString(),
        calculatedWeight.toFixed(3),
        formData.operator || 'Unknown',
        formData.shift,
        formData.line || '-',
        formData.notes || '-',
        now.toISOString(),
        packetLabel // Column 18: Packet Label
      ];

      await appendSheetData('Packing Transfers', transferRow, accessToken);

      // Update WIP Inventory
      const wipData = await readSheetData('WIP Inventory', 'A1:L1000', accessToken);
      const wipParsed = parseSheetData(wipData);
      const wipIndex = wipParsed.findIndex(row => row['WIP Batch ID'] === wipBatch['WIP Batch ID']);

      if (wipIndex >= 0) {
        const consumed = parseFloat(wipBatch['Consumed (T)']) + calculatedWeight;
        const remaining = parseFloat(wipBatch['Initial WIP (T)']) - consumed;
        const rowNum = wipIndex + 2;

        await writeSheetData(
          'WIP Inventory',
          `G${rowNum}:H${rowNum}`,
          [[consumed.toFixed(3), remaining.toFixed(3)]],
          accessToken
        );

        // Mark as complete if fully consumed
        if (remaining < 0.001) {
          await writeSheetData(
            'WIP Inventory',
            `I${rowNum}:K${rowNum}`,
            [['COMPLETE', now.toISOString(), '']],
            accessToken
          );
        }
      }

      // Update Finished Goods Inventory
      const inventoryData = await readSheetData('Finished Goods Inventory', 'A1:J1000', accessToken);
      const inventoryParsed = parseSheetData(inventoryData);
      const inventoryIndex = inventoryParsed.findIndex(row => {
        const matchesSKU = row['SKU'] === formData.sku;
        const matchesRegion = !productNeedsRegion(formData.productType) ||
                             row['Region'] === formData.region;
        return matchesSKU && matchesRegion;
      });

      if (inventoryIndex >= 0) {
        const currentStock = parseInt(inventoryParsed[inventoryIndex]['Current Stock']) || 0;
        const newStock = currentStock + parseInt(formData.unitsPacked);
        const rowNum = inventoryIndex + 2;

        // Only update Current Stock (G) and Last Updated (J)
        // Don't touch Minimum Stock (H) or Status (I - should be a formula)
        await writeSheetData(
          'Finished Goods Inventory',
          `G${rowNum}`,
          [[newStock]],
          accessToken
        );

        await writeSheetData(
          'Finished Goods Inventory',
          `J${rowNum}`,
          [[now.toISOString()]],
          accessToken
        );
      }

      // Log to Batch Tracking
      const trackingRow = [
        now.toISOString(),
        wipBatch['WIP Batch ID'],
        selectedProduct.productType,
        wipBatch['Size Range'],
        wipBatch['Variant/Region'],
        'CONSUMED',
        `-${calculatedWeight.toFixed(3)}`,
        '',
        'Packing',
        formData.operator || 'Unknown',
        `Transfer: ${transferId}`,
        `Packed ${formData.unitsPacked} ${selectedProduct.packaging.type}s (${totalUnits} ${selectedProduct.unit}s)`
      ];

      await appendSheetData('Batch Tracking', trackingRow, accessToken);

      // Deduct packing materials from raw material inventory
      const packingMaterialsToDeduct = getPackingMaterialForDeduction(
        selectedProduct.size,
        parseInt(formData.unitsPacked)
      );

      for (const material of packingMaterialsToDeduct) {
        // Record Stock Out transaction for packing materials
        const materialTransactionRow = [
          now.toISOString(), // Timestamp
          formData.date, // Transaction Date
          'Stock Out', // Transaction Type
          material.material, // Material Name
          material.category, // Category
          material.unit, // Unit
          '0', // Stock In Qty
          material.quantity.toFixed(4), // Stock Out Qty
          'N/A', // Supplier
          'N/A', // Batch Number
          '0', // Unit Price
          '0', // Total Cost
          `Used for packing transfer ${transferId}`, // Notes
          formData.operator || 'System' // User
        ];

        await appendSheetData('Raw Material Transactions', materialTransactionRow, accessToken);
      }

      // Generate and download PDF
      generateTransferPDF({
        transferId,
        date: formData.date,
        time,
        wipBatchId: wipBatch['WIP Batch ID'],
        region: regionValue,
        sku: formData.sku,
        productName: selectedProduct.productType,
        packageSize: selectedProduct.size,
        packagingType: selectedProduct.packaging.type,
        unitsPacked: formData.unitsPacked,
        totalUnits,
        unitType: selectedProduct.unit,
        weightConsumed: calculatedWeight.toFixed(3),
        operator: formData.operator || 'Unknown',
        shift: formData.shift,
        line: formData.line || '-',
        notes: formData.notes || ''
      });

      setMessage({
        type: 'success',
        text: `✓ Transfer ${transferId} completed! PDF downloaded.`
      });

      // Show batch label popup
      setLabelData({
        transferId,
        wipBatchId: wipBatch['WIP Batch ID'],
        region: regionValue,
        date: formData.date,
        productName: selectedProduct.productType,
        packageSize: selectedProduct.size,
        packagingType: selectedProduct.packaging.type,
        unitsPacked: formData.unitsPacked,
        totalUnits,
        unitType: selectedProduct.unit,
        weight: calculatedWeight.toFixed(3),
        operator: formData.operator || 'Unknown',
        sequence // Use calculated sequence number
      });
      setShowLabelPopup(true);

      // Reset form
      setFormData(prev => ({
        ...prev,
        unitsPacked: '',
        notes: ''
      }));

      // Reload data
      await loadAvailableWIP();
      await loadCurrentInventory();

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error submitting packing:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2 className="heading-lg mb-4 sm:mb-6 text-gray-900">
          Packing Entry Form
        </h2>

        <form onSubmit={handleSubmit} className="section-spacing">
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
          <label className="label">Date *</label>
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
          <label className="label">Product Type *</label>
          <select
            className="input"
            value={formData.productType}
            onChange={(e) => setFormData({
              ...formData,
              productType: e.target.value,
              region: '',
              sku: '',
              unitsPacked: ''
            })}
            required
          >
            <option value="">Select Product Type</option>
            {Object.values(PACKING_PRODUCT_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Region (only for Sunflower) */}
        {productNeedsRegion(formData.productType) && (
          <div>
            <label className="label">Region *</label>
            <select
              className="input"
              value={formData.region}
              onChange={(e) => setFormData({
                ...formData,
                region: e.target.value,
                sku: '',
                unitsPacked: ''
              })}
              required
            >
              <option value="">Select Region</option>
              {REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        )}

        {/* Available WIP Display */}
        {availableWIP.length > 0 && (
          <div className="info-box bg-green-50 border-green-200">
            <p className="text-xs sm:text-sm font-medium text-green-900">Available WIP:</p>
            <p className="text-base sm:text-lg font-bold text-green-600">
              {availableWIP[0]['WIP Batch ID']}
            </p>
            <p className="text-xs sm:text-sm text-green-700">
              Remaining: {parseFloat(availableWIP[0]['Remaining (T)']).toFixed(3)} T
            </p>
            {availableWIP.length > 1 && (
              <p className="text-xs text-green-600 mt-2">
                + {availableWIP.length - 1} more batch(es) available
              </p>
            )}
          </div>
        )}

        {/* SKU Selection */}
        {availableSKUs.length > 0 && (
          <div>
            <label className="label">SKU / Product Code *</label>
            <select
              className="input"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value, unitsPacked: '' })}
              required
            >
              <option value="">Select SKU</option>
              {availableSKUs.map(product => (
                <option key={product.sku} value={product.sku}>
                  {product.code} - {product.size} ({product.unit})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product Details Display */}
        {selectedProduct && (
          <div className="info-box-tight bg-blue-50 border-blue-200">
            <p className="text-xs sm:text-sm font-medium text-blue-900">Packaging Info:</p>
            <p className="text-xs sm:text-sm text-blue-700">
              {selectedProduct.packaging.label}
            </p>
            <p className="text-xs sm:text-sm text-blue-700">
              Weight per {selectedProduct.unit}: {selectedProduct.weightPerUnit} kg
            </p>
          </div>
        )}

        {/* Current Inventory & Recommendation */}
        {currentInventory && (
          <div className={`section-container border-2 ${
            currentInventory.status === 'OUT' ? 'bg-red-50 border-red-300' :
            currentInventory.status === 'CRITICAL' ? 'bg-orange-50 border-orange-300' :
            currentInventory.status === 'LOW' ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <p className="text-xs sm:text-sm font-medium mb-2">Current Inventory Status:</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p className="text-xs text-gray-600">Current Stock</p>
                <p className="text-xl sm:text-2xl font-bold">{currentInventory.current}</p>
              </div>
              {currentInventory.minimum > 0 && (
                <div>
                  <p className="text-xs text-gray-600">Minimum Required</p>
                  <p className="text-xl sm:text-2xl font-bold">{currentInventory.minimum}</p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                currentInventory.status === 'OUT' ? 'bg-red-200 text-red-800' :
                currentInventory.status === 'CRITICAL' ? 'bg-orange-200 text-orange-800' :
                currentInventory.status === 'LOW' ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
                {currentInventory.status}
              </span>
            </div>
            {recommendation && recommendation > 0 && (
              <div className="mt-4 p-3 bg-white rounded border-2 border-orange-400">
                <p className="text-sm font-bold text-orange-700">
                  ⚠️ RECOMMENDED: Pack {recommendation} {selectedProduct.packaging.type}s
                </p>
              </div>
            )}
          </div>
        )}

        {/* Units to Pack */}
        {selectedProduct && (
          <div>
            <label className="label">
              {selectedProduct.packaging.type}s to Pack *
              {recommendation && recommendation > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitsPacked: recommendation.toString() })}
                  className="ml-3 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Use Recommended ({recommendation})
                </button>
              )}
            </label>
            <input
              type="number"
              className="input"
              value={formData.unitsPacked}
              onChange={(e) => setFormData({ ...formData, unitsPacked: e.target.value })}
              placeholder={`Number of ${selectedProduct.packaging.type}s`}
              min="1"
              required
            />
            {formData.unitsPacked && (
              <p className="text-sm text-gray-600 mt-1">
                = {parseInt(formData.unitsPacked) * selectedProduct.packaging.quantity} {selectedProduct.unit}s
              </p>
            )}
          </div>
        )}

        {/* Calculated Weight */}
        {calculatedWeight > 0 && (
          <div className="info-box bg-blue-50 border-blue-200">
            <p className="text-xs sm:text-sm font-medium text-blue-900">Weight to Consume:</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {calculatedWeight.toFixed(3)} T
            </p>
            <p className="text-xs sm:text-sm text-blue-700">
              ({(calculatedWeight * 1000).toFixed(1)} kg)
            </p>
          </div>
        )}

        {/* Operator Details */}
        <div className="form-grid-3">
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
            rows="2"
            placeholder="Additional notes..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || availableWIP.length === 0}
          className={`w-full btn btn-primary py-3 text-lg font-semibold ${
            loading || availableWIP.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Processing...' : '✓ Record Packing & Generate PDF'}
        </button>
      </form>
    </div>

    {/* Batch Label Popup */}
    {showLabelPopup && labelData && (
      <BatchLabelPopup
        data={labelData}
        onClose={() => setShowLabelPopup(false)}
      />
    )}
  </>
  );
}
