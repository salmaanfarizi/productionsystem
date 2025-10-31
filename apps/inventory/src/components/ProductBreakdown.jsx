import React, { useState, useEffect } from 'react';
import { readSheetData, parseSheetData } from '@shared/utils/sheetsAPI';

export default function ProductBreakdown({ refreshTrigger }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [refreshTrigger]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const rawData = await readSheetData('WIP Inventory');
      const batches = parseSheetData(rawData);

      // Group by product (product type + size range + region)
      const productMap = {};

      batches.forEach(batch => {
        if (batch['Status'] !== 'ACTIVE') return;

        const region = batch['Variant/Region'] && batch['Variant/Region'] !== 'N/A' ? batch['Variant/Region'] : '';
        const key = `${batch['Product Type']}-${batch['Size Range']}-${region}`;
        if (!productMap[key]) {
          productMap[key] = {
            productType: batch['Product Type'],
            sizeRange: batch['Size Range'],
            region: region || 'N/A',
            batches: 0,
            totalRemaining: 0
          };
        }

        productMap[key].batches++;
        productMap[key].totalRemaining += parseFloat(batch['Remaining (T)']) || 0;
      });

      // Convert to array and sort by remaining weight
      const productList = Object.values(productMap)
        .sort((a, b) => b.totalRemaining - a.totalRemaining);

      setProducts(productList);

    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Product Breakdown</h3>
        <button
          onClick={loadProducts}
          className="text-purple-600 hover:text-purple-800"
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No active products</p>
          </div>
        ) : (
          products.map((product, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    {product.productType} - {product.sizeRange}
                  </p>
                  {product.region && product.region !== 'N/A' && (
                    <p className="text-xs text-gray-500">Region: {product.region}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {product.batches} active batch{product.batches !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">
                    {product.totalRemaining.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Tonnes</p>
                </div>
              </div>

              {/* Stock Level Indicator */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Stock Level</span>
                  <span className={
                    product.totalRemaining > 5 ? 'text-green-600' :
                    product.totalRemaining > 2 ? 'text-yellow-600' :
                    'text-red-600'
                  }>
                    {product.totalRemaining > 5 ? 'Good' :
                     product.totalRemaining > 2 ? 'Medium' :
                     'Low'}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      product.totalRemaining > 5 ? 'bg-green-500' :
                      product.totalRemaining > 2 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (product.totalRemaining / 10) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
