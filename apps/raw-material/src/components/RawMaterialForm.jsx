import React, { useState, useEffect } from 'react';
import { appendSheetData } from '@shared/utils/sheetsAPI';
import {
  RAW_MATERIAL_CATEGORIES,
  CATEGORY_ITEMS,
  TRANSACTION_TYPES,
  SUNFLOWER_GRADES,
  SUNFLOWER_SIZES,
  SUNFLOWER_UNIT_WEIGHTS,
  UNITS_OF_MEASURE,
  getUnitForMaterial,
  getCategoryForMaterial
} from '@shared/config/rawMaterials';

export default function RawMaterialForm({ authHelper, onSuccess, settings }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    transactionType: TRANSACTION_TYPES.STOCK_IN,
    category: '',
    material: '',
    quantity: '',
    unit: 'KG',
    kgPerUnit: '', // Weight in kg per 1 unit (for non-KG units)
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [totalKg, setTotalKg] = useState(0);

  // Calculate total KG whenever quantity, unit, or kgPerUnit changes
  useEffect(() => {
    const qty = parseFloat(formData.quantity) || 0;
    const kgPer = parseFloat(formData.kgPerUnit) || 0;

    if (formData.unit === 'KG') {
      setTotalKg(qty);
    } else if (kgPer > 0 && qty > 0) {
      setTotalKg(qty * kgPer);
    } else {
      setTotalKg(0);
    }
  }, [formData.quantity, formData.unit, formData.kgPerUnit]);

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

  // Update default unit when material changes
  useEffect(() => {
    if (formData.material) {
      const defaultUnit = getUnitForMaterial(formData.material);
      setFormData(prev => ({ ...prev, unit: defaultUnit }));
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

    // Require KG per Unit when unit is not KG
    if (formData.unit !== 'KG' && (!formData.kgPerUnit || parseFloat(formData.kgPerUnit) <= 0)) {
      setMessage({ type: 'error', text: `Please enter "KG per Unit" - how many KG is 1 ${formData.unit}?` });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();
      const quantity = parseFloat(formData.quantity);
      const kgPerUnit = parseFloat(formData.kgPerUnit) || 0;
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const totalCost = quantity * unitPrice;

      // Calculate total KG for storage
      const quantityInKg = formData.unit === 'KG' ? quantity : (kgPerUnit > 0 ? quantity * kgPerUnit : quantity);

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
          formData.unit,
          quantity.toFixed(2),
          kgPerUnit > 0 ? kgPerUnit.toFixed(2) : '', // KG per Unit
          quantityInKg.toFixed(2), // Total KG
          formData.supplier || 'N/A',
          formData.batchNumber || 'N/A',
          formData.expiryDate || 'N/A',
          unitPrice.toFixed(2),
          totalCost.toFixed(2),
          'Available',
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
        formData.unit,
        kgPerUnit > 0 ? kgPerUnit.toFixed(2) : '', // KG per Unit
        formData.transactionType === TRANSACTION_TYPES.STOCK_IN ? quantity.toFixed(2) : '0',
        formData.transactionType === TRANSACTION_TYPES.STOCK_OUT ? quantity.toFixed(2) : '0',
        quantityInKg.toFixed(2), // Total KG
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
        kgPerUnit: '',
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
                name="transactionType"
                autoComplete="off"
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
                name="date"
                autoComplete="off"
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
                name="category"
                autoComplete="off"
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
                name="material"
                autoComplete="off"
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
                  name="sunflowerGrade"
                  autoComplete="off"
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
                  name="sunflowerSize"
                  autoComplete="off"
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
                  name="sunflowerUnitWeight"
                  autoComplete="off"
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
                  name="sunflowerIdentification"
                  autoComplete="off"
                  value={formData.sunflowerIdentification}
                  onChange={(e) => setFormData({ ...formData, sunflowerIdentification: e.target.value })}
                  placeholder="e.g., See High, Premium, etc."
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Quantity & Unit */}
        <div className="section-container bg-green-50 border-green-200">
          <h3 className="heading-md mb-3 sm:mb-4 text-green-900">4. Quantity & Unit</h3>

          <div className="form-grid-2">
            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                step="0.01"
                className="input"
                name="quantity"
                autoComplete="off"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 100"
                min="0.01"
                required
              />
            </div>

            <div>
              <label className="label">Unit of Measure *</label>
              <select
                className="input"
                name="unit"
                autoComplete="off"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value, kgPerUnit: '' })}
                required
              >
                {UNITS_OF_MEASURE.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* KG per Unit conversion (shown when unit is not KG) */}
          {formData.unit !== 'KG' && (
            <div className="mt-4 p-4 bg-white border border-green-300 rounded-lg">
              <div className="form-grid-2">
                <div>
                  <label className="label">1 {formData.unit} = ? KG *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    name="kgPerUnit"
                    autoComplete="off"
                    value={formData.kgPerUnit}
                    onChange={(e) => setFormData({ ...formData, kgPerUnit: e.target.value })}
                    placeholder={`Enter weight in KG per 1 ${formData.unit}`}
                    min="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the weight in kilograms for 1 {formData.unit.toLowerCase()}
                  </p>
                </div>

                <div>
                  <label className="label">Total Weight (Auto-calculated)</label>
                  <div className="input bg-green-100 font-bold text-green-800 flex items-center">
                    {totalKg > 0 ? `${totalKg.toFixed(2)} KG` : '-- KG'}
                  </div>
                  {totalKg > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      {formData.quantity} {formData.unit} × {formData.kgPerUnit} KG = {totalKg.toFixed(2)} KG
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Unit Price and Total Cost for Stock In */}
          {isStockIn && (
            <div className="mt-4 form-grid-2">
              <div>
                <label className="label">Unit Price (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  name="unitPrice"
                  autoComplete="off"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="Price per unit"
                  min="0"
                />
              </div>

              {formData.quantity && formData.unitPrice && (
                <div>
                  <label className="label">Total Cost</label>
                  <div className="input bg-green-100 font-bold text-green-800 flex items-center">
                    ${(parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)}
                  </div>
                </div>
              )}
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
                  name="supplier"
                  autoComplete="off"
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
                  name="batchNumber"
                  autoComplete="off"
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
                  name="expiryDate"
                  autoComplete="off"
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
            name="notes"
            autoComplete="off"
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
