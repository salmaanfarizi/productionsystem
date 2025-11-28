import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData, appendSheetData, writeSheetData } from '@shared/utils/sheetsAPI';

export default function PendingPackingEntries({ authHelper }) {
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadRecentTransfers();
  }, []);

  const loadRecentTransfers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const rawData = await readSheetData('Packing Transfers');
      const parsed = parseSheetData(rawData);

      // Get transfers from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recent = parsed.filter(entry => {
        const entryDate = new Date(entry['Date'] || entry['Timestamp']);
        return entryDate >= sevenDaysAgo;
      }).sort((a, b) => {
        const dateA = new Date(a['Timestamp'] || a['Date']);
        const dateB = new Date(b['Timestamp'] || b['Date']);
        return dateB - dateA; // Most recent first
      });

      setRecentTransfers(recent);
    } catch (error) {
      console.error('Error loading transfers:', error);
      if (error.message.includes('404') || error.message.includes('400')) {
        setMessage({
          type: 'error',
          text: 'Sheet "Packing Transfers" not found. Please create this sheet in your Google Spreadsheet with headers: Transfer ID, Date, WIP Batch ID, Product Type, Size, Total Pouches, Weight (T), Packet Label'
        });
      } else if (error.message.includes('403')) {
        setMessage({
          type: 'error',
          text: 'Permission denied. Please check that the spreadsheet is shared or the API key has access.'
        });
      } else {
        setMessage({ type: 'error', text: 'Error loading packing transfers: ' + error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRecentTransfers();
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
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Packing Transfers
            </h2>
            <p className="text-gray-600">
              View recent packing transfers from WIP to Finished Goods (Last 7 days)
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {recentTransfers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No recent transfers</p>
            <p className="text-sm">No packing transfers in the last 7 days</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WIP Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pouches</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (T)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packet Label</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransfers.map((transfer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transfer['Transfer ID'] || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {transfer['Date'] || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {transfer['WIP Batch ID'] || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {transfer['Product Type'] || transfer['Product'] || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {transfer['Size'] || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-700">
                      {transfer['Total Pouches'] || transfer['Pouches'] || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {transfer['Weight (T)'] ? parseFloat(transfer['Weight (T)']).toFixed(3) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                      {transfer['Packet Label'] || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        {recentTransfers.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-sm text-purple-600">Total Transfers</p>
              <p className="text-2xl font-bold text-purple-900">{recentTransfers.length}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600">Total Pouches</p>
              <p className="text-2xl font-bold text-blue-900">
                {recentTransfers.reduce((sum, t) => sum + (parseInt(t['Total Pouches'] || t['Pouches']) || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Total Weight</p>
              <p className="text-2xl font-bold text-green-900">
                {recentTransfers.reduce((sum, t) => sum + (parseFloat(t['Weight (T)']) || 0), 0).toFixed(3)} T
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
