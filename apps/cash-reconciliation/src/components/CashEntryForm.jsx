import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData, appendSheetData } from '@shared/utils/sheetsAPI';

export default function CashEntryForm({ isSignedIn, user, onSuccess }) {
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    salesman: '',
    expectedAmount: '',
    receivedAmount: '',
    denomination: {
      d2000: '',
      d500: '',
      d200: '',
      d100: '',
      d50: '',
      d20: '',
      d10: '',
      coins: ''
    },
    notes: ''
  });

  useEffect(() => {
    loadSalesmen();
  }, []);

  const loadSalesmen = async () => {
    try {
      const rawData = await readSheetData('Salesmen');
      const parsed = parseSheetData(rawData);
      const activeSalesmen = parsed.filter(s => s['Status'] !== 'Inactive');
      setSalesmen(activeSalesmen);
    } catch (error) {
      console.error('Error loading salesmen:', error);
      // Default salesmen if sheet doesn't exist
      setSalesmen([
        { Name: 'Salesman 1', ID: 'S001' },
        { Name: 'Salesman 2', ID: 'S002' },
        { Name: 'Salesman 3', ID: 'S003' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDenominationTotal = () => {
    const d = formData.denomination;
    return (
      (parseInt(d.d2000) || 0) * 2000 +
      (parseInt(d.d500) || 0) * 500 +
      (parseInt(d.d200) || 0) * 200 +
      (parseInt(d.d100) || 0) * 100 +
      (parseInt(d.d50) || 0) * 50 +
      (parseInt(d.d20) || 0) * 20 +
      (parseInt(d.d10) || 0) * 10 +
      (parseFloat(d.coins) || 0)
    );
  };

  const handleDenominationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      denomination: {
        ...prev.denomination,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.salesman || !formData.receivedAmount) {
      setMessage({ type: 'error', text: 'Please fill in required fields' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const entryId = `CASH-${Date.now()}`;
      const denominationTotal = calculateDenominationTotal();
      const variance = parseFloat(formData.receivedAmount) - (parseFloat(formData.expectedAmount) || 0);
      
      const rowData = [
        entryId,
        new Date().toISOString(),
        formData.date,
        formData.salesman,
        parseFloat(formData.expectedAmount) || 0,
        parseFloat(formData.receivedAmount),
        denominationTotal,
        variance,
        variance === 0 ? 'Matched' : variance > 0 ? 'Excess' : 'Short',
        JSON.stringify(formData.denomination),
        formData.notes,
        user?.email || 'Unknown'
      ];

      await appendSheetData('Cash Collections', [rowData]);
      
      setMessage({ type: 'success', text: 'Cash entry recorded successfully!' });
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        salesman: '',
        expectedAmount: '',
        receivedAmount: '',
        denomination: {
          d2000: '',
          d500: '',
          d200: '',
          d100: '',
          d50: '',
          d20: '',
          d10: '',
          coins: ''
        },
        notes: ''
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving cash entry:', error);
      setMessage({ type: 'error', text: 'Failed to save entry: ' + error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const denominationTotal = calculateDenominationTotal();
  const receivedAmount = parseFloat(formData.receivedAmount) || 0;
  const denominationMatch = denominationTotal === receivedAmount;

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4">Record Cash Collection</h2>

        {message && (
          <div className={`p-3 sm:p-4 rounded-lg mb-4 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="form-grid-2">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Salesman *</label>
              <select
                value={formData.salesman}
                onChange={(e) => setFormData(prev => ({ ...prev, salesman: e.target.value }))}
                className="input"
                required
              >
                <option value="">Select Salesman</option>
                {salesmen.map((s, idx) => (
                  <option key={idx} value={s.Name || s.name}>
                    {s.Name || s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Fields */}
          <div className="form-grid-2">
            <div>
              <label className="label">Expected Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.expectedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedAmount: e.target.value }))}
                className="input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Received Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.receivedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, receivedAmount: e.target.value }))}
                className="input"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Denomination Breakdown */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Denomination Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'd2000', label: '2000', multiplier: 2000 },
                { key: 'd500', label: '500', multiplier: 500 },
                { key: 'd200', label: '200', multiplier: 200 },
                { key: 'd100', label: '100', multiplier: 100 },
                { key: 'd50', label: '50', multiplier: 50 },
                { key: 'd20', label: '20', multiplier: 20 },
                { key: 'd10', label: '10', multiplier: 10 },
                { key: 'coins', label: 'Coins', multiplier: 1, isAmount: true }
              ].map(({ key, label, multiplier, isAmount }) => (
                <div key={key}>
                  <label className="label text-xs">
                    {label} {!isAmount && 'x'}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      step={isAmount ? "0.01" : "1"}
                      value={formData.denomination[key]}
                      onChange={(e) => handleDenominationChange(key, e.target.value)}
                      className="input py-1.5 text-sm"
                      placeholder="0"
                    />
                    {!isAmount && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        = {((parseInt(formData.denomination[key]) || 0) * multiplier).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Denomination Total */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Denomination Total:</span>
                <span className={`text-lg font-bold ${
                  receivedAmount > 0 && denominationMatch ? 'text-green-600' : 
                  receivedAmount > 0 && !denominationMatch ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {denominationTotal.toLocaleString()}
                </span>
              </div>
              {receivedAmount > 0 && !denominationMatch && (
                <p className="text-xs text-red-600 mt-1">
                  Denomination does not match received amount (Diff: {(denominationTotal - receivedAmount).toLocaleString()})
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input"
              rows={3}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Variance Display */}
          {formData.expectedAmount && formData.receivedAmount && (
            <div className={`p-3 sm:p-4 rounded-lg ${
              parseFloat(formData.receivedAmount) === parseFloat(formData.expectedAmount)
                ? 'bg-green-50 border border-green-200'
                : parseFloat(formData.receivedAmount) > parseFloat(formData.expectedAmount)
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Variance:</span>
                <span className={`text-lg font-bold ${
                  parseFloat(formData.receivedAmount) === parseFloat(formData.expectedAmount)
                    ? 'text-green-700'
                    : parseFloat(formData.receivedAmount) > parseFloat(formData.expectedAmount)
                    ? 'text-blue-700'
                    : 'text-red-700'
                }`}>
                  {(parseFloat(formData.receivedAmount) - parseFloat(formData.expectedAmount)).toLocaleString()}
                  {parseFloat(formData.receivedAmount) === parseFloat(formData.expectedAmount) && ' (Matched)'}
                  {parseFloat(formData.receivedAmount) > parseFloat(formData.expectedAmount) && ' (Excess)'}
                  {parseFloat(formData.receivedAmount) < parseFloat(formData.expectedAmount) && ' (Short)'}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-success px-6 sm:px-8 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
