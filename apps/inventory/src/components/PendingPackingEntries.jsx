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
    <div className="space-y-4 sm:space-y-6">
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
              Recent Packing Transfers
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Last 7 days
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn btn-primary flex items-center space-x-1 sm:space-x-2 self-start sm:self-auto"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {recentTransfers.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <p className="text-base sm:text-lg">No recent transfers</p>
            <p className="text-xs sm:text-sm">No packing transfers in the last 7 days</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {recentTransfers.map((transfer, index) => (
                <div key={index} className="p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{transfer['Transfer ID'] || '-'}</p>
                      <p className="text-xs text-gray-500">{transfer['Date'] || '-'}</p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono bg-purple-100 text-purple-800 rounded">
                      {transfer['Packet Label'] || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-gray-500">WIP Batch</p>
                      <p className="font-medium truncate">{transfer['WIP Batch ID'] || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Product</p>
                      <p className="font-medium truncate">{transfer['Product Name'] || transfer['Product Type'] || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Size</p>
                      <p className="font-medium">{transfer['Package Size'] || transfer['Size'] || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Units</p>
                      <p className="font-bold text-purple-700">{transfer['Total Units'] || transfer['Total Pouches'] || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Weight</p>
                      <p className="font-medium">
                        {transfer['Weight Consumed (T)'] || transfer['Weight (T)'] ? (parseFloat(transfer['Weight Consumed (T)'] || transfer['Weight (T)']) * 1000).toFixed(0) : '-'} KG
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WIP Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (KG)</th>
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
                        {transfer['Product Name'] || transfer['Product Type'] || transfer['Product'] || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {transfer['Package Size'] || transfer['Size'] || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-700">
                        {transfer['Total Units'] || transfer['Total Pouches'] || transfer['Units Packed'] || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {transfer['Weight Consumed (T)'] || transfer['Weight (T)'] ? (parseFloat(transfer['Weight Consumed (T)'] || transfer['Weight (T)']) * 1000).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {transfer['Packet Label'] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Summary Stats */}
        {recentTransfers.length > 0 && (
          <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-purple-600">Transfers</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-900">{recentTransfers.length}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-blue-600">Units</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">
                {recentTransfers.reduce((sum, t) => sum + (parseInt(t['Total Units'] || t['Total Pouches'] || t['Units Packed']) || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-green-600">Weight</p>
              <p className="text-lg sm:text-2xl font-bold text-green-900">
                {(recentTransfers.reduce((sum, t) => sum + (parseFloat(t['Weight Consumed (T)'] || t['Weight (T)']) || 0), 0) * 1000).toLocaleString()} KG
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
