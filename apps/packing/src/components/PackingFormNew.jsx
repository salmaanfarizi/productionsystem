import React, { useState, useEffect } from 'react';
import { readSheetData, appendSheetData, writeSheetData, parseSheetData } from '@shared/utils/sheetsAPI';
import {
  RETAIL_PRODUCTS,
  PACKING_PRODUCT_TYPES,
  REGIONS,
  getSKUsForProduct,
  getProductBySKU,
  calculatePackagingWeight,
  calculateRecommendedPacking,
  productNeedsRegion
} from '@shared/config/retailProducts';
import {
  calculatePackingMaterialConsumption,
  getPackingMaterialForDeduction
} from '@shared/config/packingMaterials';
import { generateTransferPDF } from '@shared/utils/pdfGenerator';
import { generatePacketLabel, getNextSequence } from '@shared/utils/packetLabelGenerator';
import BatchLabelPopup from './BatchLabelPopup';

export default function PackingFormNew({ authHelper, onSuccess, settings }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productType: '',
    region: '',
    sku: '',
    unitsPacked: '',
    operator: '',
    shift: 'Morning',
    line: '',
    notes: '',
    is10kgBag: false
  });

  // Helper function to get region value consistently
  const getRegionValue = () => {
    return productNeedsRegion(formData.productType) ? formData.region : 'N/A';
  };

  const [availableSKUs, setAvailableSKUs] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableWIP, setAvailableWIP] = useState([]);
  const [currentInventory, setCurrentInventory] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [calculatedWeight, setCalculatedWeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [labelData, setLabelData] = useState(null);
  const [previewPacketLabel, setPreviewPacketLabel] = useState(null);

  // Load WIP batches and inventory when product/region/10kg selection changes
  useEffect(() => {
    if (formData.productType && (productNeedsRegion(formData.productType) ? formData.region : true)) {
      loadAvailableWIP();
    }
  }, [formData.productType, formData.region, formData.is10kgBag]);

  // Load inventory when SKU changes
  useEffect(() => {
    if (formData.sku) {
      loadCurrentInventory();
    }
  }, [formData.sku, formData.region]);

  // Update available SKUs when product type or 10kg selection changes
  useEffect(() => {
    if (formData.productType) {
      let skus = getSKUsForProduct(formData.productType);

      // Filter SKUs based on 10kg bag selection
      if (formData.is10kgBag) {
        // Only show 10 KG SKUs
        skus = skus.filter(product =>
          product.size.toLowerCase().includes('10 kg') ||
          product.size.toLowerCase().includes('10kg')
        );
      } else {
        // Exclude 10 KG SKUs for regular packing
        skus = skus.filter(product =>
          !product.size.toLowerCase().includes('10 kg') &&
          !product.size.toLowerCase().includes('10kg')
        );
      }

      setAvailableSKUs(skus);
      setFormData(prev => ({ ...prev, sku: '', unitsPacked: '' }));
    } else {
      setAvailableSKUs([]);
    }
  }, [formData.productType, formData.is10kgBag]);

  // Calculate weight when units change
  useEffect(() => {
    if (formData.sku && formData.unitsPacked) {
      const weight = calculatePackagingWeight(formData.sku, parseInt(formData.unitsPacked) || 0);
      setCalculatedWeight(weight);
    } else {
      setCalculatedWeight(0);
    }
  }, [formData.sku, formData.unitsPacked]);

  // Update selected product details
  useEffect(() => {
    if (formData.sku) {
      const product = getProductBySKU(formData.sku);
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
  }, [formData.sku]);

  // Generate preview packet label
  useEffect(() => {
    const generatePreview = async () => {
      if (availableWIP.length > 0 && formData.date &&
          (productNeedsRegion(formData.productType) ? formData.region : true)) {
        try {
          const regionValue = getRegionValue();
          const wipBatch = availableWIP[0];

          // Get existing labels to calculate sequence
          let existingLabels = [];
          try {
            const transfersRaw = await readSheetData('Packing Transfers', 'A1:R1000');
            const transfersParsed = parseSheetData(transfersRaw);
            existingLabels = transfersParsed
              .filter(row => row['Packet Label'])
              .map(row => row['Packet Label']);
          } catch (error) {
            console.warn('Could not load existing labels for preview:', error);
          }

          const sequence = getNextSequence(regionValue, formData.date, existingLabels);
          const previewLabel = generatePacketLabel(
            wipBatch['WIP Batch ID'],
            regionValue,
            formData.date,
            sequence
          );

          setPreviewPacketLabel(previewLabel);
        } catch (error) {
          console.error('Error generating preview label:', error);
          setPreviewPacketLabel(null);
        }
      } else {
        setPreviewPacketLabel(null);
      }
    };

    generatePreview();
  }, [availableWIP, formData.date, formData.productType, formData.region]);

  const loadAvailableWIP = async () => {
    try {
      const accessToken = authHelper?.getAccessToken();
      const rawData = await readSheetData('WIP Inventory', 'A1:M1000', accessToken);
      const parsed = parseSheetData(rawData);

      // Filter active WIP batches for selected product and region
      const filtered = parsed.filter(row => {
        const matchesProduct = row['Product Type'] === formData.productType;
        const matchesRegion = !productNeedsRegion(formData.productType) ||
                             row['Variant/Region'] === formData.region;
        const remaining = parseFloat(row['Remaining (KG)'] || row['Remaining (T)']) || 0;
        // Check if batch has remaining quantity (don't rely on Status column)
        const hasRemaining = remaining > 0.001;

        // Filter based on 10kg bag selection
        const seedVariety = row['Seed Variety'] || '';
        const is10kgMixBatch = seedVariety.toLowerCase().includes('10kg') ||
                               seedVariety.includes('(10kg Mix)') ||
                               seedVariety.includes('10 kg');

        // If 10kg bag is selected, only show 10kg mix batches
        // If 10kg bag is not selected, exclude 10kg mix batches
        const matches10kgFilter = formData.is10kgBag ? is10kgMixBatch : !is10kgMixBatch;

        return matchesProduct && matchesRegion && hasRemaining && matches10kgFilter;
      });

      // Check for batches that need proactive carry forward
      // Fixed threshold: keep combining batches until reaching 12 KG
      const minPackableKG = 12;

      if (accessToken && filtered.length > 1) {
        let carryForwardMessages = [];
        let needsRefresh = false;

        // Keep combining batches until all have >= 12 KG or no more batches to combine
        let continueCarryForward = true;
        let iterations = 0;
        const maxIterations = 50; // Safety limit to prevent infinite loops

        while (continueCarryForward && iterations < maxIterations) {
          iterations++;
          continueCarryForward = false;

          // Get fresh data for each iteration
          const freshData = needsRefresh ? await readSheetData('WIP Inventory', 'A1:M1000', accessToken) : rawData;
          const freshParsed = needsRefresh ? parseSheetData(freshData) : parsed;

          // Find batches that need carry forward (below 12 KG)
          const batchesNeedingCarryForward = freshParsed.filter(row => {
            const matchesProduct = row['Product Type'] === formData.productType;
            const matchesRegion = !productNeedsRegion(formData.productType) ||
                                 row['Variant/Region'] === formData.region;
            const remaining = parseFloat(row['Remaining (KG)'] || row['Remaining (T)']) || 0;
            const status = (row['Status'] || '').toUpperCase();

            // Also check 10kg filter for carry forward
            const seedVariety = row['Seed Variety'] || '';
            const is10kgMixBatch = seedVariety.toLowerCase().includes('10kg') ||
                                   seedVariety.includes('(10kg Mix)') ||
                                   seedVariety.includes('10 kg');
            const matches10kgFilter = formData.is10kgBag ? is10kgMixBatch : !is10kgMixBatch;

            return matchesProduct && matchesRegion && remaining > 0 && remaining < minPackableKG && status !== 'COMPLETE' && matches10kgFilter;
          });

          if (batchesNeedingCarryForward.length === 0) {
            break; // No more batches need carry forward
          }

          // Process the first batch that needs carry forward
          const batch = batchesNeedingCarryForward[0];
          const remaining = parseFloat(batch['Remaining (KG)'] || batch['Remaining (T)']) || 0;

          console.log(`🔄 Carry forward needed: ${batch['WIP Batch ID']} has ${remaining.toFixed(2)} KG (target: ${minPackableKG} KG)`);

          // Find next batch of same product/variety to carry forward to
          const nextBatch = freshParsed.find((b) => {
            if (b['WIP Batch ID'] === batch['WIP Batch ID']) return false; // Skip current batch
            const status = (b['Status'] || '').toUpperCase();
            const bRemaining = parseFloat(b['Remaining (KG)'] || b['Remaining (T)']) || 0;
            const matchesProduct = b['Product Type'] === batch['Product Type'];
            const matchesVariety = b['Seed Variety'] === batch['Seed Variety'];
            const matchesRegion = !productNeedsRegion(formData.productType) ||
                                 b['Variant/Region'] === batch['Variant/Region'];
            return status !== 'COMPLETE' && bRemaining > 0 && matchesProduct && matchesVariety && matchesRegion;
          });

          if (nextBatch) {
            try {
              // Find row indices
              const currentIndex = freshParsed.findIndex(p => p['WIP Batch ID'] === batch['WIP Batch ID']);
              const nextIndex = freshParsed.findIndex(p => p['WIP Batch ID'] === nextBatch['WIP Batch ID']);

              if (currentIndex >= 0 && nextIndex >= 0) {
                const currentRowNum = currentIndex + 2;
                const nextRowNum = nextIndex + 2;

                const currentConsumed = parseFloat(batch['Consumed (KG)'] || batch['Consumed (T)']) || 0;
                const nextInitial = parseFloat(nextBatch['Initial WIP (KG)'] || nextBatch['Initial WIP (T)']) || 0;
                const nextConsumed = parseFloat(nextBatch['Consumed (KG)'] || nextBatch['Consumed (T)']) || 0;
                const nextRemaining = parseFloat(nextBatch['Remaining (KG)'] || nextBatch['Remaining (T)']) || 0;

                // Update next batch: add remaining to initial and remaining
                const updatedNextInitial = nextInitial + remaining;
                const updatedNextRemaining = nextRemaining + remaining;

                await writeSheetData(
                  'WIP Inventory',
                  `G${nextRowNum}:I${nextRowNum}`,
                  [[updatedNextInitial.toFixed(2), nextConsumed.toFixed(2), updatedNextRemaining.toFixed(2)]],
                  accessToken
                );

                // Mark current batch as complete
                await writeSheetData(
                  'WIP Inventory',
                  `H${currentRowNum}:L${currentRowNum}`,
                  [[currentConsumed.toFixed(2), '0.00', 'COMPLETE', '', new Date().toISOString()]],
                  accessToken
                );

                // Add note
                await writeSheetData(
                  'WIP Inventory',
                  `M${currentRowNum}`,
                  [[`Auto carry forward ${remaining.toFixed(2)} KG to ${nextBatch['WIP Batch ID']}`]],
                  accessToken
                );

                console.log(`✅ Carried forward ${remaining.toFixed(2)} KG from ${batch['WIP Batch ID']} to ${nextBatch['WIP Batch ID']} (new total: ${updatedNextRemaining.toFixed(2)} KG)`);
                carryForwardMessages.push(`${batch['WIP Batch ID']} → ${nextBatch['WIP Batch ID']} (${remaining.toFixed(2)} KG)`);

                needsRefresh = true;

                // Check if the receiving batch is still below threshold
                if (updatedNextRemaining < minPackableKG) {
                  console.log(`⚠️ ${nextBatch['WIP Batch ID']} still has ${updatedNextRemaining.toFixed(2)} KG (< ${minPackableKG} KG), continuing...`);
                  continueCarryForward = true; // Continue combining
                } else {
                  console.log(`✅ ${nextBatch['WIP Batch ID']} now has ${updatedNextRemaining.toFixed(2)} KG (>= ${minPackableKG} KG), done!`);
                }
              }
            } catch (error) {
              console.error('Error in carry forward:', error);
              break; // Stop on error
            }
          } else {
            console.log(`⚠️ No next batch available for carry forward from ${batch['WIP Batch ID']}`);
            break; // No more batches to combine with
          }
        }

        // If any carry forwards happened, reload and show message
        if (carryForwardMessages.length > 0) {
          const freshData = await readSheetData('WIP Inventory', 'A1:M1000', accessToken);
          const freshParsed = parseSheetData(freshData);
          const freshFiltered = freshParsed.filter(row => {
            const matchesProduct = row['Product Type'] === formData.productType;
            const matchesRegion = !productNeedsRegion(formData.productType) ||
                                 row['Variant/Region'] === formData.region;
            const rem = parseFloat(row['Remaining (KG)'] || row['Remaining (T)']) || 0;

            // Also check 10kg filter
            const seedVariety = row['Seed Variety'] || '';
            const is10kgMixBatch = seedVariety.toLowerCase().includes('10kg') ||
                                   seedVariety.includes('(10kg Mix)') ||
                                   seedVariety.includes('10 kg');
            const matches10kgFilter = formData.is10kgBag ? is10kgMixBatch : !is10kgMixBatch;

            return matchesProduct && matchesRegion && rem > 0.001 && matches10kgFilter;
          });

          setAvailableWIP(freshFiltered);
          setMessage({
            type: 'info',
            text: `Auto carry forward completed: ${carryForwardMessages.join(', ')}`
          });
          return; // Exit after all carry forwards
        }
      }

      setAvailableWIP(filtered);

      if (filtered.length === 0) {
        setMessage({
          type: 'warning',
          text: `No WIP available for ${formData.productType}${formData.region ? ` (${formData.region})` : ''}`
        });
      } else {
        setMessage(null);
      }
    } catch (error) {
      console.error('Error loading WIP:', error);
      setMessage({ type: 'error', text: 'Error loading WIP inventory' });
    }
  };

  const loadCurrentInventory = async () => {
    try {
      const rawData = await readSheetData('Finished Goods Inventory');
      const parsed = parseSheetData(rawData);

      // Find inventory row for this SKU and region
      const inventoryRow = parsed.find(row => {
        const matchesSKU = row['SKU'] === formData.sku;
        const matchesRegion = !productNeedsRegion(formData.productType) ||
                             row['Region'] === formData.region;
        return matchesSKU && matchesRegion;
      });

      if (inventoryRow) {
        const currentStock = parseInt(inventoryRow['Current Stock']) || 0;
        const minStock = parseInt(inventoryRow['Minimum Stock']) || 0;
        const status = inventoryRow['Status'] || 'OK';

        setCurrentInventory({
          current: currentStock,
          minimum: minStock,
          status: status
        });

        // Calculate recommendation
        if (minStock > 0) {
          const recommended = calculateRecommendedPacking(formData.sku, formData.region, currentStock);
          setRecommendation(recommended);
        } else {
          setRecommendation(null);
        }
      } else {
        setCurrentInventory(null);
        setRecommendation(null);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setCurrentInventory(null);
    }
  };

  const generateTransferId = async (date) => {
    try {
      const rawData = await readSheetData('Packing Transfers', 'A1:A1000');
      const parsed = parseSheetData(rawData);

      const dateStr = new Date(date).toISOString().slice(2, 10).replace(/-/g, '');
      const pattern = `TRF-${dateStr}-`;

      let maxSeq = 0;
      parsed.forEach(row => {
        const transferId = row['Transfer ID'] || '';
        if (transferId.startsWith(pattern)) {
          const seq = parseInt(transferId.split('-')[2]);
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      });

      return `${pattern}${(maxSeq + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating transfer ID:', error);
      const dateStr = new Date(date).toISOString().slice(2, 10).replace(/-/g, '');
      return `TRF-${dateStr}-001`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authHelper || !authHelper.getAccessToken()) {
      setMessage({ type: 'error', text: 'Please authenticate first' });
      return;
    }

    if (availableWIP.length === 0) {
      setMessage({ type: 'error', text: 'No WIP available for this product' });
      return;
    }

    if (!formData.unitsPacked || parseInt(formData.unitsPacked) <= 0) {
      setMessage({ type: 'error', text: 'Please enter valid quantity' });
      return;
    }

    if (calculatedWeight === 0) {
      setMessage({ type: 'error', text: 'Invalid weight calculation' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const accessToken = authHelper.getAccessToken();
      const transferId = await generateTransferId(formData.date);
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Select WIP batch (FIFO - oldest first)
      const wipBatch = availableWIP[0];
      const wipRemainingRaw = parseFloat(wipBatch['Remaining (T)'] || wipBatch['Remaining (KG)']) || 0;
      // Detect if data is in KG (values > 100) or Tonnes
      const isDataInKG = wipBatch['Remaining (KG)'] !== undefined || wipRemainingRaw > 100;
      const wipRemainingKG = isDataInKG ? wipRemainingRaw : wipRemainingRaw * 1000;

      // calculatedWeight is now in KG
      if (calculatedWeight > wipRemainingKG) {
        // Calculate max units that can be packed with available WIP
        const maxPackableUnits = selectedProduct?.weightPerUnit
          ? Math.floor(wipRemainingKG / selectedProduct.weightPerUnit)
          : 0;
        setMessage({
          type: 'error',
          text: `Insufficient WIP. Available: ${wipRemainingKG.toLocaleString()} KG, Required: ${calculatedWeight.toLocaleString()} KG. Max packable: ${maxPackableUnits.toLocaleString()} ${selectedProduct?.packaging?.unit || 'units'}`
        });
        setLoading(false);
        return;
      }

      // Calculate totals
      const totalUnits = parseInt(formData.unitsPacked) * selectedProduct.packaging.quantity;

      // Get existing packet labels for sequence calculation
      const regionValue = getRegionValue();

      let existingLabels = [];
      try {
        const transfersRaw = await readSheetData('Packing Transfers', 'A1:R1000', accessToken);
        const transfersParsed = parseSheetData(transfersRaw);
        existingLabels = transfersParsed
          .filter(row => row['Packet Label']) // Filter rows that have packet labels
          .map(row => row['Packet Label']);
      } catch (error) {
        // If we can't load existing labels, use sequence 1
        existingLabels = [];
      }

      // Calculate sequence number
      const sequence = getNextSequence(regionValue, formData.date, existingLabels);

      // Generate packet label
      const packetLabel = generatePacketLabel(
        wipBatch['WIP Batch ID'],
        regionValue,
        formData.date,
        sequence
      );

      // Create packing transfer row (18 columns - added Packet Label)
      const transferRow = [
        transferId,
        formData.date,
        time,
        wipBatch['WIP Batch ID'],
        regionValue,
        formData.sku,
        selectedProduct.productType,
        selectedProduct.size,
        selectedProduct.packaging.type,
        formData.unitsPacked,
        totalUnits.toString(),
        calculatedWeight.toFixed(3),
        formData.operator || 'Unknown',
        formData.shift,
        formData.line || '-',
        formData.notes || '-',
        now.toISOString(),
        packetLabel // Column 18: Packet Label
      ];

      await appendSheetData('Packing Transfers', transferRow, accessToken);

      // Update WIP Inventory
      const wipData = await readSheetData('WIP Inventory', 'A1:M1000', accessToken);
      const wipParsed = parseSheetData(wipData);
      const wipIndex = wipParsed.findIndex(row => row['WIP Batch ID'] === wipBatch['WIP Batch ID']);

      if (wipIndex >= 0) {
        // Get current values (in KG) - use fresh data from wipParsed
        const currentBatch = wipParsed[wipIndex];
        const currentConsumed = parseFloat(currentBatch['Consumed (KG)'] || currentBatch['Consumed (T)']) || 0;
        const initialWIP = parseFloat(currentBatch['Initial WIP (KG)'] || currentBatch['Initial WIP (T)']) || 0;

        // calculatedWeight is in KG
        const newConsumed = currentConsumed + calculatedWeight;
        const newRemaining = initialWIP - newConsumed;
        const rowNum = wipIndex + 2;

        // Write to columns H (Consumed) and I (Remaining)
        // Headers: A=ID, B=Date, C=ProductType, D=Variety, E=Size, F=Region, G=Initial, H=Consumed, I=Remaining
        await writeSheetData(
          'WIP Inventory',
          `H${rowNum}:I${rowNum}`,
          [[newConsumed.toFixed(2), newRemaining.toFixed(2)]],
          accessToken
        );

        // Check if remaining is below minimum packable quantity (weightPerUnit)
        const minPackableKG = selectedProduct.weightPerUnit || 1;

        if (newRemaining < minPackableKG && newRemaining > 0) {
          console.log(`🔍 Looking for next batch to carry forward ${newRemaining.toFixed(2)} KG`);
          console.log(`   Current batch: ${currentBatch['WIP Batch ID']}, Product: ${currentBatch['Product Type']}, Variety: ${currentBatch['Seed Variety']}`);

          // Find next active batch of same product type and variety to carry forward
          const nextBatch = wipParsed.find((batch, idx) => {
            if (idx === wipIndex) return false; // Skip current batch
            const status = (batch['Status'] || '').toUpperCase();
            const remaining = parseFloat(batch['Remaining (KG)'] || batch['Remaining (T)']) || 0;
            const matchesProduct = batch['Product Type'] === currentBatch['Product Type'];
            const matchesVariety = batch['Seed Variety'] === currentBatch['Seed Variety'];

            console.log(`   Checking batch ${batch['WIP Batch ID']}: Status=${status}, Remaining=${remaining}, Product=${batch['Product Type']}, Variety=${batch['Seed Variety']}, Matches=${matchesProduct && matchesVariety}`);

            return status === 'ACTIVE' && remaining > 0 && matchesProduct && matchesVariety;
          });

          if (nextBatch) {
            // Carry forward to next batch
            const nextBatchIndex = wipParsed.findIndex(b => b['WIP Batch ID'] === nextBatch['WIP Batch ID']);
            const nextRowNum = nextBatchIndex + 2;
            const nextInitial = parseFloat(nextBatch['Initial WIP (KG)'] || nextBatch['Initial WIP (T)']) || 0;
            const nextConsumed = parseFloat(nextBatch['Consumed (KG)'] || nextBatch['Consumed (T)']) || 0;
            const nextRemaining = parseFloat(nextBatch['Remaining (KG)'] || nextBatch['Remaining (T)']) || 0;

            // Add carry forward to next batch's initial and remaining
            const updatedNextInitial = nextInitial + newRemaining;
            const updatedNextRemaining = nextRemaining + newRemaining;

            console.log(`🔄 Carrying forward to ${nextBatch['WIP Batch ID']}: Initial ${nextInitial} -> ${updatedNextInitial}, Remaining ${nextRemaining} -> ${updatedNextRemaining}`);

            await writeSheetData(
              'WIP Inventory',
              `G${nextRowNum}:I${nextRowNum}`,
              [[updatedNextInitial.toFixed(2), nextConsumed.toFixed(2), updatedNextRemaining.toFixed(2)]],
              accessToken
            );

            // Mark current batch as complete with carry forward note
            await writeSheetData(
              'WIP Inventory',
              `H${rowNum}:L${rowNum}`,
              [[newConsumed.toFixed(2), '0.00', 'COMPLETE', '', now.toISOString()]],
              accessToken
            );

            // Update notes column with carry forward info
            await writeSheetData(
              'WIP Inventory',
              `M${rowNum}`,
              [[`Carried forward ${newRemaining.toFixed(2)} KG to ${nextBatch['WIP Batch ID']}`]],
              accessToken
            );

            console.log(`✅ Carried forward ${newRemaining.toFixed(2)} KG from ${currentBatch['WIP Batch ID']} to ${nextBatch['WIP Batch ID']}`);
          } else {
            // No next batch found - just mark as complete with remaining as waste
            console.log(`⚠️ No next batch found for carry forward. Marking ${newRemaining.toFixed(2)} KG as waste.`);
            await writeSheetData(
              'WIP Inventory',
              `J${rowNum}:L${rowNum}`,
              [['COMPLETE', '', now.toISOString()]],
              accessToken
            );
            await writeSheetData(
              'WIP Inventory',
              `M${rowNum}`,
              [[`Remaining ${newRemaining.toFixed(2)} KG - no next batch for carry forward`]],
              accessToken
            );
          }
        } else if (newRemaining < 1) {
          // Mark as complete if fully consumed (Status is column J)
          await writeSheetData(
            'WIP Inventory',
            `J${rowNum}:L${rowNum}`,
            [['COMPLETE', '', now.toISOString()]],
            accessToken
          );
        }
      }

      // Update Finished Goods Inventory
      const inventoryData = await readSheetData('Finished Goods Inventory', 'A1:J1000', accessToken);
      const inventoryParsed = parseSheetData(inventoryData);
      const inventoryIndex = inventoryParsed.findIndex(row => {
        const matchesSKU = row['SKU'] === formData.sku;
        const matchesRegion = !productNeedsRegion(formData.productType) ||
                             row['Region'] === formData.region;
        return matchesSKU && matchesRegion;
      });

      if (inventoryIndex >= 0) {
        // Update existing entry
        const currentStock = parseInt(inventoryParsed[inventoryIndex]['Current Stock']) || 0;
        const newStock = currentStock + parseInt(formData.unitsPacked);
        const rowNum = inventoryIndex + 2;

        // Only update Current Stock (G) and Last Updated (J)
        // Don't touch Minimum Stock (H) or Status (I - should be a formula)
        await writeSheetData(
          'Finished Goods Inventory',
          `G${rowNum}`,
          [[newStock]],
          accessToken
        );

        await writeSheetData(
          'Finished Goods Inventory',
          `J${rowNum}`,
          [[now.toISOString()]],
          accessToken
        );

        // Log to Finished Goods Log sheet
        const logRow = [
          now.toISOString(),                              // Timestamp
          formData.date,                                  // Date
          'Stock In',                                     // Transaction Type
          formData.sku,                                   // SKU
          selectedProduct.productType,                    // Product Type
          selectedProduct.size,                           // Size
          formData.region || '',                          // Region
          `+${formData.unitsPacked}`,                     // Quantity Change
          currentStock,                                   // Previous Stock
          newStock,                                       // New Stock
          'Packing',                                      // Source
          transferId,                                     // Reference
          formData.operator || 'Unknown'                  // User
        ];
        await appendSheetData('Finished Goods Log', logRow, accessToken);

        console.log(`✅ Updated Finished Goods: ${formData.sku} - Stock: ${currentStock} -> ${newStock}`);
      } else {
        // Create new entry if SKU doesn't exist
        const newInventoryRow = [
          formData.sku,                                    // SKU
          selectedProduct.productType,                     // Product Type
          selectedProduct.size,                            // Package Size
          selectedProduct.packaging.type,                  // Unit Type (bundle/carton/sack)
          selectedProduct.packaging.label,                 // Packaging Info
          formData.region || '',                           // Region
          parseInt(formData.unitsPacked),                  // Current Stock
          selectedProduct.minStock?.[formData.region] || 0, // Minimum Stock
          'In Stock',                                      // Status
          now.toISOString()                                // Last Updated
        ];

        await appendSheetData('Finished Goods Inventory', newInventoryRow, accessToken);

        // Log to Finished Goods Log sheet (new entry)
        const logRow = [
          now.toISOString(),                              // Timestamp
          formData.date,                                  // Date
          'Stock In (New)',                               // Transaction Type
          formData.sku,                                   // SKU
          selectedProduct.productType,                    // Product Type
          selectedProduct.size,                           // Size
          formData.region || '',                          // Region
          `+${formData.unitsPacked}`,                     // Quantity Change
          0,                                              // Previous Stock
          parseInt(formData.unitsPacked),                 // New Stock
          'Packing',                                      // Source
          transferId,                                     // Reference
          formData.operator || 'Unknown'                  // User
        ];
        await appendSheetData('Finished Goods Log', logRow, accessToken);

        console.log(`✅ Created new Finished Goods entry: ${formData.sku} - Stock: ${formData.unitsPacked}`);
      }

      // Log to Batch Tracking
      // Headers: Timestamp, Batch ID, Seed Type, seed variety, Size, Variant, Action, Weight Change (T), Running Total (T), Department, User, Reference, Notes
      const trackingRow = [
        now.toISOString(),                          // Timestamp
        wipBatch['WIP Batch ID'],                   // Batch ID
        selectedProduct.productType,                // Seed Type
        wipBatch['Seed Variety'] || '',             // seed variety
        wipBatch['Size Range'] || '',               // Size
        wipBatch['Variant/Region'] || '',           // Variant
        'CONSUMED',                                 // Action
        `-${calculatedWeight.toFixed(3)}`,          // Weight Change (T)
        '',                                         // Running Total (T) - calculated by sheet
        'Packing',                                  // Department
        formData.operator || 'Unknown',             // User
        `Transfer: ${transferId}`,                  // Reference
        `Packed ${formData.unitsPacked} ${selectedProduct.packaging.type}s (${totalUnits} ${selectedProduct.unit}s)` // Notes
      ];

      await appendSheetData('Batch Tracking', trackingRow, accessToken);

      // Deduct packing materials from raw material inventory
      const packingMaterialsToDeduct = getPackingMaterialForDeduction(
        selectedProduct.size,
        parseInt(formData.unitsPacked)
      );

      for (const material of packingMaterialsToDeduct) {
        // Record Stock Out transaction for packing materials
        const materialTransactionRow = [
          now.toISOString(), // Timestamp
          formData.date, // Transaction Date
          'Stock Out', // Transaction Type
          material.material, // Material Name
          material.category, // Category
          material.unit, // Unit
          '0', // Stock In Qty
          material.quantity.toFixed(4), // Stock Out Qty
          'N/A', // Supplier
          'N/A', // Batch Number
          '0', // Unit Price
          '0', // Total Cost
          `Used for packing transfer ${transferId}`, // Notes
          formData.operator || 'System' // User
        ];

        await appendSheetData('Raw Material Transactions', materialTransactionRow, accessToken);
      }

      // Generate and download PDF
      generateTransferPDF({
        transferId,
        date: formData.date,
        time,
        wipBatchId: wipBatch['WIP Batch ID'],
        region: regionValue,
        sku: formData.sku,
        productName: selectedProduct.productType,
        packageSize: selectedProduct.size,
        packagingType: selectedProduct.packaging.type,
        unitsPacked: formData.unitsPacked,
        totalUnits,
        unitType: selectedProduct.unit,
        weightConsumed: calculatedWeight.toFixed(3),
        operator: formData.operator || 'Unknown',
        shift: formData.shift,
        line: formData.line || '-',
        notes: formData.notes || ''
      });

      setMessage({
        type: 'success',
        text: `✓ Transfer ${transferId} completed! PDF downloaded.`
      });

      // Show batch label popup
      setLabelData({
        transferId,
        wipBatchId: wipBatch['WIP Batch ID'],
        region: regionValue,
        date: formData.date,
        productName: selectedProduct.productType,
        packageSize: selectedProduct.size,
        packagingType: selectedProduct.packaging.type,
        unitsPacked: formData.unitsPacked,
        totalUnits,
        unitType: selectedProduct.unit,
        weight: calculatedWeight.toFixed(3),
        operator: formData.operator || 'Unknown',
        sequence // Use calculated sequence number
      });
      setShowLabelPopup(true);

      // Reset form
      setFormData(prev => ({
        ...prev,
        unitsPacked: '',
        notes: ''
      }));

      // Reload data
      await loadAvailableWIP();
      await loadCurrentInventory();

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error submitting packing:', error);
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2 className="heading-lg mb-4 sm:mb-6 text-gray-900">
          Packing Entry Form
        </h2>

        <form onSubmit={handleSubmit} className="section-spacing">
        {/* Message Display */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
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

        {/* BATCH CODE - FIRST PRIORITY - Print this on packets! */}
        {previewPacketLabel && (
          <div className="info-box bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-blue-700 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm sm:text-base font-bold text-white uppercase tracking-wide flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                📦 BATCH CODE FOR PACKING
              </p>
              <button
                type="button"
                onClick={() => {
                  const labelContent = `
PACKET LABEL
═══════════════════════════
${previewPacketLabel}
═══════════════════════════
WIP Batch: ${availableWIP[0]['WIP Batch ID']}
Region: ${getRegionValue()}
Date: ${new Date(formData.date).toLocaleDateString()}
═══════════════════════════
ATTACH TO ALL PACKETS
                  `.trim();

                  const printWindow = window.open('', '_blank', 'width=400,height=600');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Batch Code - ${previewPacketLabel}</title>
                        <style>
                          body {
                            font-family: 'Courier New', monospace;
                            padding: 40px;
                            text-align: center;
                          }
                          .batch-code {
                            font-size: 48px;
                            font-weight: bold;
                            margin: 30px 0;
                            letter-spacing: 3px;
                          }
                          .info { font-size: 16px; margin: 10px 0; }
                          .separator { margin: 20px 0; border-top: 3px solid #000; }
                        </style>
                      </head>
                      <body>
                        <h2>PACKET LABEL</h2>
                        <div class="separator"></div>
                        <div class="batch-code">${previewPacketLabel}</div>
                        <div class="separator"></div>
                        <div class="info"><strong>WIP Batch:</strong> ${availableWIP[0]['WIP Batch ID']}</div>
                        <div class="info"><strong>Region:</strong> ${getRegionValue()}</div>
                        <div class="info"><strong>Date:</strong> ${new Date(formData.date).toLocaleDateString()}</div>
                        <div class="separator"></div>
                        <div class="info"><strong>ATTACH TO ALL PACKETS</strong></div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  setTimeout(() => printWindow.print(), 250);
                }}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Label</span>
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <p className="text-3xl sm:text-5xl md:text-6xl font-bold font-mono text-blue-700 tracking-widest select-all break-all">
                {previewPacketLabel}
              </p>
            </div>
            <p className="text-xs sm:text-sm text-blue-100 mt-3 text-center">
              ⚠️ PRINT THIS CODE AND ATTACH TO PACKETS BEFORE PACKING
            </p>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="label">Date *</label>
          <input
            type="date"
            className="input"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        {/* Product Type */}
        <div>
          <label className="label">Product Type *</label>
          <select
            className="input"
            value={formData.productType}
            onChange={(e) => setFormData({
              ...formData,
              productType: e.target.value,
              region: '',
              sku: '',
              unitsPacked: '',
              is10kgBag: false
            })}
            required
          >
            <option value="">Select Product Type</option>
            {Object.values(PACKING_PRODUCT_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* 10 KG Bag Checkbox - For products that have 10kg variants */}
        {formData.productType && formData.productType !== 'Popcorn' && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
                checked={formData.is10kgBag}
                onChange={(e) => setFormData({
                  ...formData,
                  is10kgBag: e.target.checked,
                  sku: '',
                  unitsPacked: ''
                })}
              />
              <span className="text-lg font-semibold text-amber-900">
                10 KG Bag Packing
              </span>
            </label>
            <p className="text-sm text-amber-700 mt-1 ml-8">
              Enable this to pack from WIP batches produced specifically for 10 KG bags
            </p>
          </div>
        )}

        {/* Region (only for Sunflower) */}
        {productNeedsRegion(formData.productType) && (
          <div>
            <label className="label">Region *</label>
            <select
              className="input"
              value={formData.region}
              onChange={(e) => setFormData({
                ...formData,
                region: e.target.value,
                sku: '',
                unitsPacked: ''
              })}
              required
            >
              <option value="">Select Region</option>
              {REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        )}

        {/* Available WIP Display */}
        {availableWIP.length > 0 && (
          <div className="info-box bg-green-50 border-green-200">
            <p className="text-xs sm:text-sm font-medium text-green-900">Available WIP:</p>
            <p className="text-base sm:text-lg font-bold text-green-600">
              {availableWIP[0]['WIP Batch ID']}
            </p>
            <p className="text-xs sm:text-sm text-green-700">
              Remaining: {parseFloat(availableWIP[0]['Remaining (T)'] || availableWIP[0]['Remaining (KG)']).toLocaleString()} KG
            </p>
            {availableWIP.length > 1 && (
              <p className="text-xs text-green-600 mt-2">
                + {availableWIP.length - 1} more batch(es) available
              </p>
            )}
          </div>
        )}

        {/* SKU Selection */}
        {availableSKUs.length > 0 && (
          <div>
            <label className="label">SKU / Product Code *</label>
            <select
              className="input"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value, unitsPacked: '' })}
              required
            >
              <option value="">Select SKU</option>
              {availableSKUs.map(product => (
                <option key={product.sku} value={product.sku}>
                  {product.code} - {product.size} ({product.unit})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product Details Display */}
        {selectedProduct && (
          <div className="info-box-tight bg-blue-50 border-blue-200">
            <p className="text-xs sm:text-sm font-medium text-blue-900">Packaging Info:</p>
            <p className="text-xs sm:text-sm text-blue-700">
              {selectedProduct.packaging.label}
            </p>
            <p className="text-xs sm:text-sm text-blue-700">
              Weight per {selectedProduct.unit}: {selectedProduct.weightPerUnit} kg
            </p>
            {availableWIP.length > 0 && selectedProduct.weightPerUnit > 0 && (() => {
              const wipRemainingRaw = parseFloat(availableWIP[0]['Remaining (T)'] || availableWIP[0]['Remaining (KG)']) || 0;
              const isDataInKG = availableWIP[0]['Remaining (KG)'] !== undefined || wipRemainingRaw > 100;
              const wipRemainingKG = isDataInKG ? wipRemainingRaw : wipRemainingRaw * 1000;
              const maxPackable = Math.floor(wipRemainingKG / selectedProduct.weightPerUnit);
              return (
                <p className="text-xs sm:text-sm font-semibold text-blue-800 mt-1">
                  Max packable with available WIP: {maxPackable.toLocaleString()} {selectedProduct.packaging?.unit || 'units'}
                </p>
              );
            })()}
          </div>
        )}

        {/* Current Inventory & Recommendation */}
        {currentInventory && (
          <div className={`section-container border-2 ${
            currentInventory.status === 'OUT' ? 'bg-red-50 border-red-300' :
            currentInventory.status === 'CRITICAL' ? 'bg-orange-50 border-orange-300' :
            currentInventory.status === 'LOW' ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <p className="text-xs sm:text-sm font-medium mb-2">Current Inventory Status:</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p className="text-xs text-gray-600">Current Stock</p>
                <p className="text-xl sm:text-2xl font-bold">{currentInventory.current}</p>
              </div>
              {currentInventory.minimum > 0 && (
                <div>
                  <p className="text-xs text-gray-600">Minimum Required</p>
                  <p className="text-xl sm:text-2xl font-bold">{currentInventory.minimum}</p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                currentInventory.status === 'OUT' ? 'bg-red-200 text-red-800' :
                currentInventory.status === 'CRITICAL' ? 'bg-orange-200 text-orange-800' :
                currentInventory.status === 'LOW' ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
                {currentInventory.status}
              </span>
            </div>
            {recommendation && recommendation > 0 && (
              <div className="mt-4 p-3 bg-white rounded border-2 border-orange-400">
                <p className="text-sm font-bold text-orange-700">
                  ⚠️ RECOMMENDED: Pack {recommendation} {selectedProduct.packaging.type}s
                </p>
              </div>
            )}
          </div>
        )}

        {/* Units to Pack */}
        {selectedProduct && (
          <div>
            <label className="label">
              {selectedProduct.packaging.type}s to Pack *
              {recommendation && recommendation > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitsPacked: recommendation.toString() })}
                  className="ml-3 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Use Recommended ({recommendation})
                </button>
              )}
            </label>
            <input
              type="number"
              className="input"
              value={formData.unitsPacked}
              onChange={(e) => setFormData({ ...formData, unitsPacked: e.target.value })}
              placeholder={`Number of ${selectedProduct.packaging.type}s`}
              min="1"
              required
            />
            {formData.unitsPacked && (
              <p className="text-sm text-gray-600 mt-1">
                Packaging: {selectedProduct.packaging.label}
              </p>
            )}
          </div>
        )}

        {/* Calculated Weight */}
        {calculatedWeight > 0 && (
          <div className="info-box bg-blue-50 border-blue-200">
            <p className="text-xs sm:text-sm font-medium text-blue-900">Weight to Consume:</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {calculatedWeight.toLocaleString()} KG
            </p>
          </div>
        )}

        {/* Operator Details */}
        <div className="form-grid-3">
          <div>
            <label className="label">Operator</label>
            <input
              type="text"
              className="input"
              value={formData.operator}
              onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              placeholder="Operator name"
            />
          </div>

          <div>
            <label className="label">Shift</label>
            <select
              className="input"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
            >
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
            </select>
          </div>

          <div>
            <label className="label">Line</label>
            <input
              type="text"
              className="input"
              value={formData.line}
              onChange={(e) => setFormData({ ...formData, line: e.target.value })}
              placeholder="Line number"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (Optional)</label>
          <textarea
            className="input"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="2"
            placeholder="Additional notes..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || availableWIP.length === 0}
          className={`w-full btn btn-primary py-3 text-lg font-semibold ${
            loading || availableWIP.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Processing...' : '✓ Record Packing & Generate PDF'}
        </button>
      </form>
    </div>

    {/* Batch Label Popup */}
    {showLabelPopup && labelData && (
      <BatchLabelPopup
        data={labelData}
        onClose={() => setShowLabelPopup(false)}
      />
    )}
  </>
  );
}
