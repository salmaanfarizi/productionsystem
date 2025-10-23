import React, { useState } from 'react';
import { readSheetData, appendSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import { generateDailySummaryPDF } from '@shared/utils/pdfGenerator';

export default function DailySummary({ authHelper }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const generateSummary = async () => {
    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();

      // Load packing transfers for the selected date
      const rawData = await readSheetData('Packing Transfers', 'A1:Q10000');
      const parsed = parseSheetData(rawData);

      // Filter transfers for selected date
      const dayTransfers = parsed.filter(row => row['Date'] === selectedDate);

      if (dayTransfers.length === 0) {
        setMessage({ type: 'warning', text: `No transfers found for ${selectedDate}` });
        setSummary(null);
        setLoading(false);
        return;
      }

      // Calculate totals
      const totalWIPConsumed = dayTransfers.reduce((sum, row) => {
        return sum + (parseFloat(row['Weight Consumed (T)']) || 0);
      }, 0);

      const uniqueSKUs = new Set(dayTransfers.map(row => row['SKU']));

      // Breakdown by product
      const productMap = {};
      dayTransfers.forEach(row => {
        const product = row['Product Name'];
        if (!productMap[product]) {
          productMap[product] = { weight: 0, count: 0 };
        }
        productMap[product].weight += parseFloat(row['Weight Consumed (T)']) || 0;
        productMap[product].count += 1;
      });

      const productBreakdown = Object.entries(productMap).map(([product, data]) => ({
        product,
        weight: data.weight.toFixed(3),
        count: data.count
      }));

      // Breakdown by region
      const regionMap = {};
      dayTransfers.forEach(row => {
        const region = row['Region'];
        if (region && region !== 'N/A') {
          if (!regionMap[region]) {
            regionMap[region] = 0;
          }
          regionMap[region] += parseFloat(row['Weight Consumed (T)']) || 0;
        }
      });

      const regionBreakdown = Object.entries(regionMap).map(([region, weight]) => ({
        region,
        weight: weight.toFixed(3)
      }));

      // Breakdown by SKU
      const skuMap = {};
      dayTransfers.forEach(row => {
        const sku = row['SKU'];
        if (!skuMap[sku]) {
          skuMap[sku] = {
            units: 0,
            totalUnits: 0,
            packagingType: row['Packaging Type'],
            unitType: row['Product Name'].includes('Seeds') ? 'bag' : 'box'
          };
        }
        skuMap[sku].units += parseInt(row['Units Packed']) || 0;
        skuMap[sku].totalUnits += parseInt(row['Total Units']) || 0;
      });

      const skuBreakdown = Object.entries(skuMap).map(([sku, data]) => ({
        sku,
        units: data.units,
        totalUnits: data.totalUnits,
        packagingType: data.packagingType,
        unitType: data.unitType
      }));

      // Find top SKU
      const topSKU = skuBreakdown.reduce((max, item) => {
        return item.units > (max?.units || 0) ? item : max;
      }, null);

      const summaryData = {
        date: selectedDate,
        totalTransfers: dayTransfers.length,
        totalWIPConsumed: totalWIPConsumed.toFixed(3),
        skuCount: uniqueSKUs.size,
        productBreakdown,
        regionBreakdown,
        skuBreakdown,
        topSKU: topSKU?.sku || 'N/A'
      };

      setSummary(summaryData);
      setMessage({ type: 'success', text: `Summary generated for ${selectedDate}` });

    } catch (error) {
      console.error('Error generating summary:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!summary) return;

    try {
      generateDailySummaryPDF(summary);

      // Save summary to sheet
      if (authHelper && authHelper.getAccessToken()) {
        const summaryRow = [
          summary.date,
          summary.totalTransfers,
          summary.totalWIPConsumed,
          summary.skuCount,
          summary.productBreakdown.map(p => `${p.product}: ${p.weight}T (${p.count})`).join(', '),
          summary.regionBreakdown.map(r => `${r.region}: ${r.weight}T`).join(', '),
          summary.topSKU,
          'TRUE',
          new Date().toISOString()
        ];

        appendSheetData('Daily Packing Summary', summaryRow, authHelper.getAccessToken())
          .then(() => {
            setMessage({ type: 'success', text: '✓ PDF downloaded and summary saved!' });
          })
          .catch(err => {
            console.error('Error saving summary:', err);
            setMessage({ type: 'success', text: '✓ PDF downloaded (summary save failed)' });
          });
      } else {
        setMessage({ type: 'success', text: '✓ PDF downloaded!' });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setMessage({ type: 'error', text: 'Error downloading PDF' });
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Daily Packing Summary
      </h2>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Date Selection */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="label">Select Date</label>
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={generateSummary}
            disabled={loading}
            className="btn btn-secondary px-6"
          >
            {loading ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>
      </div>

      {/* Summary Display */}
      {summary && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total WIP Consumed</p>
                <p className="text-3xl font-bold text-blue-600">{summary.totalWIPConsumed} T</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transfers</p>
                <p className="text-3xl font-bold text-blue-600">{summary.totalTransfers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">SKUs Packed</p>
                <p className="text-3xl font-bold text-blue-600">{summary.skuCount}</p>
              </div>
            </div>
          </div>

          {/* Product Breakdown */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-900 mb-4">Breakdown by Product</h3>
            <div className="space-y-2">
              {summary.productBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-medium">{item.product}:</span>
                  <span className="text-green-700">
                    {item.weight} T ({item.count} transfers)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Region Breakdown */}
          {summary.regionBreakdown.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-purple-900 mb-4">Breakdown by Region</h3>
              <div className="space-y-2">
                {summary.regionBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-medium">{item.region}:</span>
                    <span className="text-purple-700">{item.weight} T</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SKU Breakdown */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-4">
              Breakdown by SKU (Top {Math.min(10, summary.skuBreakdown.length)})
            </h3>
            <div className="space-y-2">
              {summary.skuBreakdown.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.sku}:</span>
                  <span className="text-yellow-700">
                    {item.units} {item.packagingType}s ({item.totalUnits} {item.unitType}s)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadPDF}
            className="w-full btn btn-primary py-3 text-lg font-semibold"
          >
            📄 Download PDF Summary
          </button>
        </div>
      )}
    </div>
  );
}
