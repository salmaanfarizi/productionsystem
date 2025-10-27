import React, { useState, useEffect } from 'react';
import { appendSheetData } from '@shared/utils/sheetsAPI';
import {
  RAW_MATERIAL_CATEGORIES,
  CATEGORY_ITEMS,
  TRANSACTION_TYPES,
  SUNFLOWER_GRADES,
  SUNFLOWER_SIZES,
  SUNFLOWER_UNIT_WEIGHTS,
  getUnitForMaterial,
  getCategoryForMaterial
} from '@shared/config/rawMaterials';

export default function RawMaterialForm({ authHelper, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    transactionType: TRANSACTION_TYPES.STOCK_IN,
    category: '',
    material: '',
    quantity: '',
    supplier: '',
    batchNumber: '',
    expiryDate: '',
    unitPrice: '',
    notes: '',
    // Sunflower Seeds specific fields
    sunflowerGrade: '',
    sunflowerSize: '',
    sunflowerUnitWeight: '',
    sunflowerIdentification: ''
  });

  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [currentUnit, setCurrentUnit] = useState('UNITS');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Update available materials when category changes
  useEffect(() => {
    if (formData.category) {
      const materials = CATEGORY_ITEMS[formData.category] || [];
      setAvailableMaterials(materials);
      setFormData(prev => ({ ...prev, material: '' }));
    } else {
      setAvailableMaterials([]);
    }
  }, [formData.category]);

  // Update unit when material changes
  useEffect(() => {
    if (formData.material) {
      const unit = getUnitForMaterial(formData.material);
      setCurrentUnit(unit);
    }
  }, [formData.material]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();
      const quantity = parseFloat(formData.quantity);
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const totalCost = quantity * unitPrice;

      // Stock In transaction
      if (formData.transactionType === TRANSACTION_TYPES.STOCK_IN) {
        // Build notes with sunflower details if applicable
        let enhancedNotes = formData.notes || '';
        if (formData.material === 'Sunflower Seeds') {
          const sunflowerDetails = [
            formData.sunflowerGrade && `Grade: ${formData.sunflowerGrade}`,
            formData.sunflowerSize && `Size: ${formData.sunflowerSize}`,
            formData.sunflowerUnitWeight && `Unit Weight: ${formData.sunflowerUnitWeight}`,
            formData.sunflowerIdentification && `ID: ${formData.sunflowerIdentification}`
          ].filter(Boolean).join(' | ');

          enhancedNotes = sunflowerDetails + (enhancedNotes ? ` | ${enhancedNotes}` : '');
        }

        // Add to Raw Material Inventory
        const inventoryRow = [
          formData.date,
          formData.material,
          formData.category,
          currentUnit,
          quantity.toFixed(2),
          formData.supplier || 'N/A',
          formData.batchNumber || 'N/A',
          formData.expiryDate || 'N/A',
          unitPrice.toFixed(2),
          totalCost.toFixed(2),
          'ACTIVE',
          new Date().toISOString(),
          enhancedNotes
        ];

        await appendSheetData('Raw Material Inventory', inventoryRow, accessToken);
      }

      // Add to Transaction History (both Stock In and Stock Out)
      const transactionRow = [
        new Date().toISOString(),
        formData.date,
        formData.transactionType,
        formData.material,
        formData.category,
        currentUnit,
        formData.transactionType === TRANSACTION_TYPES.STOCK_IN ? quantity.toFixed(2) : '0',
        formData.transactionType === TRANSACTION_TYPES.STOCK_OUT ? quantity.toFixed(2) : '0',
        formData.supplier || 'N/A',
        formData.batchNumber || 'N/A',
        unitPrice.toFixed(2),
        totalCost.toFixed(2),
        formData.notes || '',
        'System'
      ];

      await appendSheetData('Raw Material Transactions', transactionRow, accessToken);

      setMessage({
        type: 'success',
        text: `✓ ${formData.transactionType} recorded successfully!`
      });

      // Reset form
      setFormData(prev => ({
        ...prev,
        quantity: '',
        supplier: '',
        batchNumber: '',
        expiryDate: '',
        unitPrice: '',
        notes: '',
        sunflowerGrade: '',
        sunflowerSize: '',
        sunflowerUnitWeight: '',
        sunflowerIdentification: ''
      }));

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error submitting transaction:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const isStockIn = formData.transactionType === TRANSACTION_TYPES.STOCK_IN;

  return (
    <div className="card">
      <h2 className="heading-lg mb-4 sm:mb-6 text-gray-900">
        Raw Material Transaction
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

        {/* SECTION 1: Transaction Type & Date */}
        <div className="section-container bg-blue-50 border-blue-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-blue-900">1. Transaction Details</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Transaction Type *</label>
              <select
                className="input"
                value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                required
              >
                <option value={TRANSACTION_TYPES.STOCK_IN}>Stock In (Purchase/Receive)</option>
                <option value={TRANSACTION_TYPES.STOCK_OUT}>Stock Out (Usage/Issue)</option>
              </select>
            </div>

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
          </div>
        </div>

        {/* SECTION 2: Material Selection */}
        <div className="section-container bg-amber-50 border-amber-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-amber-900">2. Material Selection</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Category *</label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, material: '' })}
                required
              >
                <option value="">Select Category</option>
                {Object.values(RAW_MATERIAL_CATEGORIES).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Material *</label>
              <select
                className="input"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                required
                disabled={!formData.category}
              >
                <option value="">Select Material</option>
                {availableMaterials.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Sunflower Seeds Details (conditional) */}
        {formData.material === 'Sunflower Seeds' && (
          <div className="section-container bg-yellow-50 border-yellow-200">
            <h3 className="heading-md mb-3 sm:mb-4 text-yellow-900">3. Sunflower Seeds Details</h3>

            <div className="form-grid-2">
              <div>
                <label className="label">Grade *</label>
                <select
                  className="input"
                  value={formData.sunflowerGrade}
                  onChange={(e) => setFormData({ ...formData, sunflowerGrade: e.target.value })}
                  required
                >
                  <option value="">Select Grade</option>
                  {SUNFLOWER_GRADES.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Size (seeds per 50g) *</label>
                <select
                  className="input"
                  value={formData.sunflowerSize}
                  onChange={(e) => setFormData({ ...formData, sunflowerSize: e.target.value })}
                  required
                >
                  <option value="">Select Size</option>
                  {SUNFLOWER_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Unit Weight *</label>
                <select
                  className="input"
                  value={formData.sunflowerUnitWeight}
                  onChange={(e) => setFormData({ ...formData, sunflowerUnitWeight: e.target.value })}
                  required
                >
                  <option value="">Select Unit Weight</option>
                  {SUNFLOWER_UNIT_WEIGHTS.map(weight => (
                    <option key={weight} value={weight}>{weight}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Identification</label>
                <input
                  type="text"
                  className="input"
                  value={formData.sunflowerIdentification}
                  onChange={(e) => setFormData({ ...formData, sunflowerIdentification: e.target.value })}
                  placeholder="e.g., See High, Premium, etc."
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Quantity */}
        <div className="section-container bg-green-50 border-green-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-green-900">4. Quantity</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Quantity *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 100"
                  min="0.01"
                  required
                />
                <div className="flex items-center px-4 bg-white border border-gray-300 rounded-lg font-medium text-gray-700">
                  {currentUnit}
                </div>
              </div>
            </div>

            {isStockIn && (
              <div>
                <label className="label">Unit Price (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="Price per unit"
                  min="0"
                />
              </div>
            )}
          </div>

          {isStockIn && formData.quantity && formData.unitPrice && (
            <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-xl font-bold text-green-800">
                ${(parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* SECTION 5: Stock In Details (Supplier, Batch, Expiry) */}
        {isStockIn && (
          <div className="section-container bg-purple-50 border-purple-200">
            <h3 className="heading-md mb-3 sm:mb-4 text-purple-900">5. Stock In Details</h3>

            <div className="form-grid-2">
              <div>
                <label className="label">Supplier</label>
                <input
                  type="text"
                  className="input"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="label">Batch Number</label>
                <input
                  type="text"
                  className="input"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="Batch/Lot number"
                />
              </div>

              <div>
                <label className="label">Expiry Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
            placeholder={
              isStockIn
                ? 'Additional notes about this stock receipt...'
                : 'Purpose of stock usage (e.g., for production batch XYZ)...'
            }
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full btn ${
            isStockIn ? 'btn-success' : 'btn-danger'
          } py-3 text-lg font-semibold ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading
            ? 'Processing...'
            : isStockIn
            ? '✓ Record Stock In'
            : '✓ Record Stock Out'}
        </button>
      </form>
    </div>
  );
}
