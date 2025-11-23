import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData, appendSheetData, writeSheetData } from '@shared/utils/sheetsAPI';

export default function PendingPackingEntries({ authHelper }) {
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingEntries();
  }, []);

  const loadPendingEntries = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('Pending Packing Entries');
      const parsed = parseSheetData(rawData);

      // Filter only pending entries
      const pending = parsed.filter(entry => entry['Status'] === 'PENDING');
      setPendingEntries(pending);
    } catch (error) {
      console.error('Error loading pending entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entry) => {
    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    const confirmed = window.confirm(
      `Approve packing entry ${entry['Entry ID']}?\n\n` +
      `Product: ${entry['Product Type']}\n` +
      `SKU: ${entry['SKU']}\n` +
      `Total Pouches: ${entry['Total Pouches']}\n` +
      `Weight: ${entry['Weight (T)']}T`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const accessToken = authHelper.getAccessToken();
      const currentUser = authHelper.getUserEmail() || 'Store Manager';

      // Find the entry row index
      const allEntries = await readSheetData('Pending Packing Entries');
      const allParsed = parseSheetData(allEntries);
      const rowIndex = allParsed.findIndex(e => e['Entry ID'] === entry['Entry ID']) + 2; // +2 for header and 0-index

      // Update status to APPROVED
      await writeSheetData(
        'Pending Packing Entries',
        `S${rowIndex}:U${rowIndex}`,
        [['APPROVED', currentUser, new Date().toISOString()]],
        accessToken
      );

      // Now process the consumption
      await processPackingConsumption(entry, accessToken);

      // Add to Finished Goods Inventory
      await addToFinishedGoods(entry, accessToken);

      setMessage({ type: 'success', text: `✓ Entry ${entry['Entry ID']} approved and processed!` });
      await loadPendingEntries();
    } catch (error) {
      console.error('Error approving entry:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEntry || !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason' });
      return;
    }

    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    setLoading(true);
    try {
      const accessToken = authHelper.getAccessToken();
      const currentUser = authHelper.getUserEmail() || 'Store Manager';

      // Find the entry row index
      const allEntries = await readSheetData('Pending Packing Entries');
      const allParsed = parseSheetData(allEntries);
      const rowIndex = allParsed.findIndex(e => e['Entry ID'] === selectedEntry['Entry ID']) + 2;

      // Update status to REJECTED
      await writeSheetData(
        'Pending Packing Entries',
        `S${rowIndex}:V${rowIndex}`,
        [['REJECTED', currentUser, new Date().toISOString(), rejectionReason]],
        accessToken
      );

      setMessage({ type: 'success', text: `✓ Entry ${selectedEntry['Entry ID']} rejected` });
      setSelectedEntry(null);
      setRejectionReason('');
      await loadPendingEntries();
    } catch (error) {
      console.error('Error rejecting entry:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const processPackingConsumption = async (entry, accessToken) => {
    // Get batches to find the batch
    const batchesData = await readSheetData('WIP Inventory');
    const batches = parseSheetData(batchesData);
    const batchIndex = batches.findIndex(b => b['WIP Batch ID'] === entry['WIP Batch ID']);

    if (batchIndex < 0) {
      throw new Error(`Batch ${entry['WIP Batch ID']} not found`);
    }

    const batch = batches[batchIndex];
    const consumeAmount = parseFloat(entry['Weight (T)']) || 0;
    const currentConsumed = parseFloat(batch['Consumed (T)']) || 0;
    const newConsumed = currentConsumed + consumeAmount;
    const newRemaining = parseFloat(batch['Initial WIP (T)']) - newConsumed;

    // Update WIP Inventory
    const rowNum = batchIndex + 2;
    await writeSheetData(
      'WIP Inventory',
      `H${rowNum}:I${rowNum}`,
      [[newConsumed.toFixed(4), newRemaining.toFixed(4)]],
      accessToken
    );

    // Check if batch should be completed
    if (newRemaining < 0.001) {
      await writeSheetData(
        'WIP Inventory',
        `J${rowNum}:L${rowNum}`,
        [['COMPLETE', new Date().toISOString(), '']],
        accessToken
      );
    }

    // Record in Packing Consumption
    const consumptionRow = [
      new Date().toISOString(),
      entry['WIP Batch ID'],
      entry['SKU'],
      entry['Size'],
      entry['Total Pouches'],
      consumeAmount.toFixed(4),
      newRemaining.toFixed(4),
      entry['Operator'],
      entry['Shift'],
      entry['Line'],
      entry['Machine Counter'],
      entry['Counter Status'],
      entry['Notes']
    ];

    await appendSheetData('Packing Consumption', consumptionRow, accessToken);

    // Log to Batch Tracking
    const trackingRow = [
      new Date().toISOString(),
      entry['WIP Batch ID'],
      entry['Product Type'],
      entry['Size'],
      entry['Variant'],
      'CONSUMED',
      -consumeAmount,
      newRemaining.toFixed(4),
      'Packing',
      entry['Operator'],
      `SKU: ${entry['SKU']}`,
      `Approved by Store Manager`
    ];

    await appendSheetData('Batch Tracking', trackingRow, accessToken);
  };

  const addToFinishedGoods = async (entry, accessToken) => {
    // Add to Finished Goods Inventory
    // This is a simplified version - you may need to update existing inventory if SKU already exists
    const finishedGoodsRow = [
      entry['SKU'],
      entry['Product Type'],
      entry['Size'],
      entry['Region'] || 'N/A',
      entry['Total Pouches'], // Quantity (in pouches)
      entry['Weight (T)'],
      new Date().toISOString(),
      entry['Operator'],
      'From Packing - ' + entry['Entry ID']
    ];

    await appendSheetData('Finished Goods Inventory', finishedGoodsRow, accessToken);
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
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Pending Packing Entries - Store Manager Approval
        </h2>
        <p className="text-gray-600 mb-4">
          Review and approve/reject packing entries submitted by supervisors
        </p>

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

        {pendingEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">✓ No pending entries</p>
            <p className="text-sm">All packing entries have been reviewed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEntries.map((entry, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Entry ID</p>
                    <p className="font-bold text-gray-900">{entry['Entry ID']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-gray-900">{entry['Date']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Operator</p>
                    <p className="text-gray-900">{entry['Operator']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Shift</p>
                    <p className="text-gray-900">{entry['Shift']}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Product</p>
                    <p className="text-gray-900">{entry['Product Type']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">SKU</p>
                    <p className="font-medium text-gray-900">{entry['SKU']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Size</p>
                    <p className="text-gray-900">{entry['Size']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">WIP Batch</p>
                    <p className="text-gray-900 text-xs">{entry['WIP Batch ID']}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Bags</p>
                    <p className="text-2xl font-bold text-gray-900">{entry['Unit1 Count']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bundles</p>
                    <p className="text-2xl font-bold text-gray-900">{entry['Unit2 Count']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Pouches</p>
                    <p className="text-2xl font-bold text-purple-700">{entry['Total Pouches']}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Weight</p>
                    <p className="text-2xl font-bold text-gray-900">{parseFloat(entry['Weight (T)']).toFixed(3)}T</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${
                    entry['Counter Status'] === 'MATCH'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="text-xs text-gray-600">Machine Counter Status</p>
                    <p className={`text-lg font-bold ${
                      entry['Counter Status'] === 'MATCH' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {entry['Counter Status'] === 'MATCH' ? '✓ Match' : '⚠️ Mismatch'}
                    </p>
                    <p className="text-sm text-gray-700">Machine: {entry['Machine Counter']} pouches</p>
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                    <p className="text-xs text-gray-600">Supervisor Signature</p>
                    {entry['Signature'] && (
                      <img
                        src={entry['Signature']}
                        alt="Signature"
                        className="w-full h-16 object-contain bg-white border border-indigo-300 rounded mt-1"
                      />
                    )}
                  </div>
                </div>

                {entry['Notes'] && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Notes</p>
                    <p className="text-sm text-gray-900">{entry['Notes']}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(entry)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    ✓ Approve Entry
                  </button>
                  <button
                    onClick={() => setSelectedEntry(entry)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
                  >
                    ✕ Reject Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Reject Entry</h3>
            <p className="text-gray-700 mb-4">
              Entry ID: <span className="font-bold">{selectedEntry['Entry ID']}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3"
                rows="4"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setSelectedEntry(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
