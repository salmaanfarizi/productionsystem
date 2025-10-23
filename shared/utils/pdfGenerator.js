import { jsPDF } from 'jspdf';

/**
 * Generate Transfer PDF
 * Auto-downloads after packing entry
 */
export function generateTransferPDF(transferData) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('TRANSFER DOCUMENT', 105, 20, { align: 'center' });

  // Transfer ID
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Transfer ID: ${transferData.transferId}`, 20, 35);
  doc.text(`Date: ${transferData.date} ${transferData.time}`, 20, 42);

  // Separator
  doc.setLineWidth(0.5);
  doc.line(20, 48, 190, 48);

  // FROM/TO Section
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('FROM:', 20, 58);
  doc.setFont(undefined, 'normal');
  doc.text(`WIP Inventory (${transferData.wipBatchId})`, 40, 58);

  doc.setFont(undefined, 'bold');
  doc.text('TO:', 20, 65);
  doc.setFont(undefined, 'normal');
  doc.text('Finished Goods Inventory', 40, 65);

  // Separator
  doc.line(20, 71, 190, 71);

  // Product Details
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('PRODUCT DETAILS:', 20, 81);

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`SKU: ${transferData.sku}`, 20, 91);
  doc.text(`Product: ${transferData.productName}`, 20, 98);
  doc.text(`Package Size: ${transferData.packageSize}`, 20, 105);

  if (transferData.region !== 'N/A') {
    doc.text(`Region: ${transferData.region}`, 20, 112);
  }

  doc.text(`Packaging: ${transferData.packagingType}`, 20, 119);

  // Separator
  doc.line(20, 125, 190, 125);

  // Quantity Section
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('QUANTITY:', 20, 135);

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`${transferData.packagingType}s Packed: ${transferData.unitsPacked}`, 20, 145);
  doc.text(`Total ${transferData.unitType}s: ${transferData.totalUnits}`, 20, 152);
  doc.text(`Weight Consumed: ${transferData.weightConsumed} T`, 20, 159);

  // Separator
  doc.line(20, 165, 190, 165);

  // Operator Details
  doc.setFontSize(11);
  doc.text(`Operator: ${transferData.operator}`, 20, 175);
  doc.text(`Shift: ${transferData.shift}`, 20, 182);
  doc.text(`Line: ${transferData.line}`, 20, 189);

  if (transferData.notes) {
    doc.text(`Notes: ${transferData.notes}`, 20, 196);
  }

  // Separator line at bottom
  doc.setLineWidth(0.5);
  doc.line(20, 210, 190, 210);

  // Signature section
  doc.setFontSize(10);
  doc.text('Authorized Signature: ___________________', 20, 225);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 280);
  doc.text('Production System - Transfer Document', 105, 280, { align: 'center' });

  // Auto-download
  doc.save(`Transfer_${transferData.transferId}.pdf`);
}

/**
 * Generate Daily Summary PDF
 * Manually triggered by button click
 */
export function generateDailySummaryPDF(summaryData) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('DAILY PACKING SUMMARY', 105, 20, { align: 'center' });

  // Date
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text(`Date: ${summaryData.date}`, 105, 30, { align: 'center' });

  // Separator
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // Overview
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('OVERVIEW:', 20, 48);

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Total WIP Consumed: ${summaryData.totalWIPConsumed} T`, 20, 58);
  doc.text(`Total Transfers: ${summaryData.totalTransfers}`, 20, 65);
  doc.text(`SKUs Packed: ${summaryData.skuCount}`, 20, 72);

  // Separator
  doc.line(20, 78, 190, 78);

  // Breakdown by Product
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('BREAKDOWN BY PRODUCT:', 20, 88);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  let yPos = 98;
  summaryData.productBreakdown.forEach(item => {
    doc.text(`• ${item.product}: ${item.weight} T (${item.count} transfers)`, 25, yPos);
    yPos += 7;
  });

  // Separator
  yPos += 5;
  doc.line(20, yPos, 190, yPos);

  // Breakdown by Region
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('BREAKDOWN BY REGION:', 20, yPos);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPos += 10;
  summaryData.regionBreakdown.forEach(item => {
    doc.text(`• ${item.region}: ${item.weight} T`, 25, yPos);
    yPos += 7;
  });

  // Separator
  yPos += 5;
  doc.line(20, yPos, 190, yPos);

  // Breakdown by SKU
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('BREAKDOWN BY SKU:', 20, yPos);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  yPos += 10;

  summaryData.skuBreakdown.forEach(item => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(`${item.sku}: ${item.units} ${item.packagingType}s (${item.totalUnits} ${item.unitType}s)`, 25, yPos);
    yPos += 6;
  });

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 280);
  }

  // Auto-download
  doc.save(`Daily_Summary_${summaryData.date}.pdf`);
}

export default {
  generateTransferPDF,
  generateDailySummaryPDF
};
