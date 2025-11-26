import React, { useState } from 'react';
import { appendSheetData } from '@shared/utils/sheetsAPI';

const ROUTES = ['Al-Hasa 1', 'Al-Hasa 2', 'Al-Hasa 3', 'Al-Hasa 4', 'Al-Hasa Wholesale'];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'check', label: 'Check', icon: '📝' },
  { value: 'card', label: 'Card', icon: '💳' }
];

export default function CashCollection() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    route: '',
    salesmanName: '',
    paymentMethod: 'cash',
    amount: '',
    invoiceNumbers: '',
    referenceNumber: '',
    bankName: '',
    checkNumber: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.route || !formData.amount || !formData.salesmanName) {
      alert('Please fill in all required fields (Route, Salesman Name, and Amount)');
      return;
    }

    setSubmitting(true);
    try {
      const rowData = [
        formData.date,
        new Date().toLocaleTimeString(),
        formData.route,
        formData.salesmanName,
        formData.paymentMethod,
        parseFloat(formData.amount),
        formData.invoiceNumbers,
        formData.referenceNumber || '-',
        formData.bankName || '-',
        formData.checkNumber || '-',
        formData.notes || '-',
        'pending', // Reconciliation status
        new Date().toISOString() // Timestamp
      ];

      await appendSheetData('Cash Collection', [rowData]);

      alert('Cash collection recorded successfully!');

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        route: '',
        salesmanName: '',
        paymentMethod: 'cash',
        amount: '',
        invoiceNumbers: '',
        referenceNumber: '',
        bankName: '',
        checkNumber: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error saving cash collection:', error);
      alert('Error recording cash collection: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="text-3xl">💰</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Record Daily Cash Collection</h3>
            <p className="text-sm text-gray-600 mt-1">
              Enter cash collected from salesmen. Support for multiple payment methods including cash, bank transfers, and checks.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Cash Collection Entry</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Route *</label>
              <select
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                className="input"
                required
              >
                <option value="">Select Route</option>
                {ROUTES.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Salesman Name *</label>
              <input
                type="text"
                name="salesmanName"
                value={formData.salesmanName}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter salesman name"
                required
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Payment Details</h4>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(method => (
                    <label
                      key={method.value}
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.paymentMethod === method.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className="text-xl mr-2">{method.icon}</span>
                      <span className="text-sm font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Amount (SAR) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="label">Invoice Numbers</label>
                <input
                  type="text"
                  name="invoiceNumbers"
                  value={formData.invoiceNumbers}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="INV-001, INV-002"
                />
              </div>
            </div>

            {/* Conditional fields based on payment method */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="REF-001"
                />
              </div>

              {(formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'check') && (
                <div>
                  <label className="label">Bank Name {formData.paymentMethod === 'bank_transfer' ? '*' : ''}</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter bank name"
                    required={formData.paymentMethod === 'bank_transfer'}
                  />
                </div>
              )}

              {formData.paymentMethod === 'check' && (
                <div>
                  <label className="label">Check Number *</label>
                  <input
                    type="text"
                    name="checkNumber"
                    value={formData.checkNumber}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="CHK-12345"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="input"
              placeholder="Additional notes or comments"
              rows="3"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setFormData({
                date: new Date().toISOString().split('T')[0],
                route: '',
                salesmanName: '',
                paymentMethod: 'cash',
                amount: '',
                invoiceNumbers: '',
                referenceNumber: '',
                bankName: '',
                checkNumber: '',
                notes: ''
              })}
              className="btn btn-secondary"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>💾 Record Collection</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
