import React from 'react';
import { generatePacketLabel } from '@shared/utils/packetLabelGenerator';

export default function BatchLabelPopup({ data, onClose }) {
  if (!data) return null;

  // Use pre-generated packet label if available, otherwise generate it
  const packetLabel = data.packetLabel || generatePacketLabel(
    data.wipBatchId,
    data.region,
    data.date,
    data.sequence || 1
  );

  const handlePrint = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packet Label - ${packetLabel}</title>
          <style>
            @page {
              size: 4in 3in;
              margin: 0.25in;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              text-align: center;
            }
            .label-container {
              border: 3px solid #000;
              padding: 20px;
              display: inline-block;
            }
            .packet-label {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            }
            .info-row {
              font-size: 14px;
              margin: 8px 0;
              text-align: left;
            }
            .info-label {
              font-weight: bold;
              display: inline-block;
              width: 120px;
            }
            .barcode {
              font-size: 36px;
              font-family: 'Libre Barcode 128', 'Courier New', monospace;
              margin-top: 15px;
              letter-spacing: 0;
            }
            .divider {
              border-top: 2px solid #000;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <h1 style="margin: 0 0 10px 0; font-size: 18px;">PACKET LABEL</h1>
            <div class="divider"></div>

            <div class="packet-label">${packetLabel}</div>

            <div class="divider"></div>

            <div class="info-row">
              <span class="info-label">WIP Batch:</span>
              <span>${data.wipBatchId}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Product:</span>
              <span>${data.productName}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Size:</span>
              <span>${data.packageSize}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Region:</span>
              <span>${data.region}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Quantity:</span>
              <span>${data.unitsPacked} ${data.packagingType}s (${data.totalUnits} ${data.unitType}s)</span>
            </div>

            <div class="info-row">
              <span class="info-label">Weight:</span>
              <span>${data.weight} T</span>
            </div>

            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${new Date(data.date).toLocaleDateString()}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Operator:</span>
              <span>${data.operator}</span>
            </div>

            <div class="divider"></div>

            <div class="barcode">*${packetLabel}*</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Trigger print dialog after content loads
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold">Print Packet Label</h2>
              <p className="text-yellow-100 text-sm">⚠️ Print and attach to packets BEFORE packing!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Main Label Display */}
          <div className="border-4 border-gray-800 rounded-lg p-8 mb-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                Packet Label
              </p>
              <div className="text-5xl font-bold font-mono tracking-wider text-gray-900 mb-4 select-all">
                {packetLabel || 'ERROR'}
              </div>
              {packetLabel && (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    Format: WIP Day ({packetLabel.substring(0, 2)}) - Month ({packetLabel.substring(2, 4)}) -
                    Packing Day ({packetLabel.substring(4, 6)}) - Region - Sequence
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-900 uppercase mb-1">WIP Batch Source</p>
              <p className="text-lg font-bold text-blue-700">{data.wipBatchId}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs font-medium text-green-900 uppercase mb-1">Region</p>
              <p className="text-lg font-bold text-green-700">{data.region}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs font-medium text-purple-900 uppercase mb-1">Product</p>
              <p className="text-sm font-semibold text-purple-700">
                {data.productName} - {data.packageSize}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs font-medium text-orange-900 uppercase mb-1">Quantity</p>
              <p className="text-sm font-semibold text-orange-700">
                {data.unitsPacked} {data.packagingType}s ({data.totalUnits} {data.unitType}s)
              </p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-xs font-medium text-indigo-900 uppercase mb-1">Weight Consumed</p>
              <p className="text-lg font-bold text-indigo-700">{data.weight} T</p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-700 uppercase mb-1">Date & Operator</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(data.date).toLocaleDateString()} - {data.operator}
              </p>
            </div>
          </div>

          {/* Print Instructions */}
          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-bold text-orange-900 mb-1">⚠️ IMPORTANT - Print Labels FIRST!</p>
                <ol className="text-xs text-orange-800 space-y-1 list-decimal list-inside">
                  <li>Click "Print Label" button below</li>
                  <li>Print enough copies for your quantity ({data.unitsPacked} {data.packagingType}s)</li>
                  <li>Attach labels to all packets</li>
                  <li>Close this popup and click "Record Packing" to submit</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Label</span>
          </button>
        </div>
      </div>
    </div>
  );
}
