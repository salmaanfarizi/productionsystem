import React from 'react';
import { generatePacketLabel } from '@shared/utils/packetLabelGenerator';

export default function BatchLabelPopup({ data, onClose }) {
  if (!data) return null;

  // Generate the packet label using the utility
  const packetLabel = generatePacketLabel(
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-t-lg flex justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold truncate">Packet Label Generated</h2>
              <p className="text-blue-100 text-xs sm:text-sm truncate">Transfer ID: {data.transferId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors flex-shrink-0 p-2 -m-2 rounded-lg hover:bg-white hover:bg-opacity-20 touch-target"
            aria-label="Close popup"
          >
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* Main Label Display */}
          <div className="border-2 sm:border-4 border-gray-800 rounded-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                Packet Label
              </p>
              <div className="text-2xl sm:text-4xl md:text-5xl font-bold font-mono tracking-wider text-gray-900 mb-3 sm:mb-4 select-all break-all">
                {packetLabel || 'ERROR'}
              </div>
              {packetLabel && (
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="hidden sm:block">
                    Format: WIP Day ({packetLabel.substring(0, 2)}) - Month ({packetLabel.substring(2, 4)}) -
                    Packing Day ({packetLabel.substring(4, 6)}) - Region - Sequence
                  </p>
                  <p className="sm:hidden text-xs">
                    Day-Month-Day-Region-Seq
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs font-medium text-blue-900 uppercase mb-1">WIP Batch Source</p>
              <p className="text-base sm:text-lg font-bold text-blue-700 break-all">{data.wipBatchId}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs font-medium text-green-900 uppercase mb-1">Region</p>
              <p className="text-base sm:text-lg font-bold text-green-700">{data.region}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs font-medium text-purple-900 uppercase mb-1">Product</p>
              <p className="text-sm font-semibold text-purple-700">
                {data.productName} - {data.packageSize}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs font-medium text-orange-900 uppercase mb-1">Quantity</p>
              <p className="text-sm font-semibold text-orange-700">
                {data.unitsPacked} {data.packagingType}s ({data.totalUnits} {data.unitType}s)
              </p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-3 sm:p-4">
              <p className="text-xs font-medium text-indigo-900 uppercase mb-1">Weight Consumed</p>
              <p className="text-base sm:text-lg font-bold text-indigo-700">{data.weight} T</p>
            </div>

            <div className="bg-gray-100 rounded-lg p-3 sm:p-4">
              <p className="text-xs font-medium text-gray-700 uppercase mb-1">Date & Operator</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(data.date).toLocaleDateString()} - {data.operator}
              </p>
            </div>
          </div>

          {/* Print Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">Print Instructions</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Click the "Print Label" button to generate a printable label.
                  Attach this label to all packets from this batch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 rounded-b-lg flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-2.5 text-sm sm:text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-target order-2 sm:order-1"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm sm:text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center space-x-2 touch-target order-1 sm:order-2"
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
