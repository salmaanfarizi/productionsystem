import React from 'react';

// The Sales Van app was retired in September 2026 (not used since November 2025).
// Despatch is recorded in the Packing app's Store Entry; the old records stay in the
// "sales van master data" spreadsheet and the Stock Outwards / Salesman Inventory tabs.
function App() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-lg w-full p-6 sm:p-8">
        <p className="text-sm font-medium text-gray-500">ARS International</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">The Sales Van app has been retired</h1>
        <p className="mt-4 text-gray-700">
          Goods going out of the store are now recorded by the store team in the Packing app, under{' '}
          <strong>Store Entry → Despatched</strong>.
        </p>
        <p className="mt-3 text-gray-700">
          Earlier sales van records are kept as an archive in the "sales van master data" spreadsheet.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href="https://packing.abusalim.sa"
            className="inline-flex justify-center whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Open the Packing app
          </a>
          <a
            href="https://inventory.abusalim.sa"
            className="inline-flex justify-center whitespace-nowrap rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200"
          >
            See stock in the Inventory app
          </a>
        </div>
      </div>
    </main>
  );
}

export default App;
