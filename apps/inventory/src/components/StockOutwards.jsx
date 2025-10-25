import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData, appendSheetData } from '@shared/utils/sheetsAPI';
import { PACKING_PRODUCT_TYPES, REGIONS } from '@shared/config/retailProducts';

export default function StockOutwards({ refreshTrigger }) {
  const [outwardsList, setOutwardsList] = useState([]);
  const [filteredOutwards, setFilteredOutwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    productType: 'all',
    region: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sku: '',
    productType: '',
    packageSize: '',
    region: '',
    quantity: '',
    customer: '',
    invoiceRef: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOutwards();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [outwardsList, filters]);

  const loadOutwards = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Stock Outwards');
      const parsed = parseSheetData(rawData);
      // Sort by date descending
      const sorted = parsed.sort((a, b) =>
        new Date(b['Date'] || 0) - new Date(a['Date'] || 0)
      );
      setOutwardsList(sorted);
    } catch (error) {
      console.error('Error loading outwards:', error);
      // If sheet doesn't exist, start with empty array
      setOutwardsList([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...outwardsList];

    if (filters.productType !== 'all') {
      filtered = filtered.filter(item => item['Product Type'] === filters.productType);
    }

    if (filters.region !== 'all') {
      filtered = filtered.filter(item => item['Region'] === filters.region);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(item =>
        new Date(item['Date']) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(item =>
        new Date(item['Date']) <= new Date(filters.dateTo)
      );
    }

    setFilteredOutwards(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sku || !formData.quantity || !formData.productType) {
      alert('Please fill in all required fields (SKU, Product Type, and Quantity)');
      return;
    }

    setSubmitting(true);
    try {
      const rowData = [
        formData.date,
        formData.sku,
        formData.productType,
        formData.packageSize,
        formData.region || 'N/A',
        parseFloat(formData.quantity),
        formData.customer,
        formData.invoiceRef,
        formData.notes,
        new Date().toISOString()
      ];

      await appendSheetData('Stock Outwards', [rowData]);

      alert('Stock outwards recorded successfully!');

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        sku: '',
        productType: '',
        packageSize: '',
        region: '',
        quantity: '',
        customer: '',
        invoiceRef: '',
        notes: ''
      });

      setShowForm(false);
      loadOutwards(); // Reload data
    } catch (error) {
      console.error('Error saving outwards:', error);
      alert('Error recording stock outwards: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate summary statistics
  const summary = {
    total: filteredOutwards.length,
    totalQuantity: filteredOutwards.reduce((sum, item) =>
      sum + (parseFloat(item['Quantity']) || 0), 0
    ),
    uniqueProducts: new Set(filteredOutwards.map(item => item['SKU'])).size,
    uniqueCustomers: new Set(filteredOutwards.map(item => item['Customer']).filter(Boolean)).size
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-3xl font-bold text-purple-700">{summary.total}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-sm text-gray-600">Total Quantity Out</p>
          <p className="text-3xl font-bold text-red-700">{summary.totalQuantity.toFixed(0)}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-gray-600">Unique Products</p>
          <p className="text-3xl font-bold text-blue-700">{summary.uniqueProducts}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-gray-600">Unique Customers</p>
          <p className="text-3xl font-bold text-green-700">{summary.uniqueCustomers}</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Stock Outwards Transactions</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>{showForm ? 'Cancel' : 'Record Outwards'}</span>
        </button>
      </div>

      {/* Outwards Form */}
      {showForm && (
        <div className="card bg-gradient-to-br from-purple-50 to-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Record Stock Outwards</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="label">SKU *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., SF-200-RH"
                  required
                />
              </div>

              <div>
                <label className="label">Product Type *</label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select Product Type</option>
                  {Object.values(PACKING_PRODUCT_TYPES).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Package Size</label>
                <input
                  type="text"
                  name="packageSize"
                  value={formData.packageSize}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., 200g"
                />
              </div>

              <div>
                <label className="label">Region</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select Region</option>
                  {REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div>
                <label className="label">Customer</label>
                <input
                  type="text"
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="label">Invoice/Reference</label>
                <input
                  type="text"
                  name="invoiceRef"
                  value={formData.invoiceRef}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="INV-001"
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? 'Saving...' : 'Save Outwards'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label">Product Type</label>
            <select
              className="input"
              value={filters.productType}
              onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
            >
              <option value="all">All Products</option>
              {Object.values(PACKING_PRODUCT_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Region</label>
            <select
              className="input"
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            >
              <option value="all">All Regions</option>
              {REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
              <option value="N/A">N/A (Non-regional)</option>
            </select>
          </div>

          <div>
            <label className="label">Date From</label>
            <input
              type="date"
              className="input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Date To</label>
            <input
              type="date"
              className="input"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Outwards History Table */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Outwards History ({filteredOutwards.length} transactions)
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Region
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOutwards.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {item['Date']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-600">
                    {item['SKU']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Product Type']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Package Size']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Region'] || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                    -{item['Quantity']}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item['Customer'] || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {item['Invoice'] || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item['Notes'] || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOutwards.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No outwards transactions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
