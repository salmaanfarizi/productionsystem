import { jsPDF } from 'jspdf';

/**
 * Generate Daily Production Summary PDF
 * @param {Object} data - Production summary data
 * @param {string} data.date - Date in YYYY-MM-DD format
 * @param {number} data.totalWeight - Total production weight in tonnes
 * @param {Array} data.productionEntries - Array of production entries
 * @param {Array} data.wipBatches - Array of WIP batches created
 * @param {Object} data.overtimeSummary - Employee overtime hours
 */
export function generateProductionPDF(data) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace = 10) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to draw a horizontal line
  const drawLine = () => {
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  };

  // ==================== HEADER ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Daily Production Summary', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(dateStr, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  drawLine();
  yPos += 5;

  // ==================== OVERVIEW ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Production Overview', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  // Total Production Weight
  doc.setFont('helvetica', 'bold');
  doc.text('Total Production:', margin + 5, yPos);
  doc.setFillColor(76, 175, 80); // Green
  doc.rect(margin + 50, yPos - 5, 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.totalWeight.toFixed(2)} T`, margin + 70, yPos, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.text(`Entries: ${data.productionEntries.length}`, margin + 5, yPos);
  doc.text(`Batches Created: ${data.wipBatches.length}`, margin + 70, yPos);
  yPos += 10;

  drawLine();
  yPos += 5;

  // ==================== PRODUCTION ENTRIES ====================
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Production Entries', margin, yPos);
  yPos += 8;

  if (data.productionEntries.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('No production entries for this date', margin + 5, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Product', margin + 2, yPos);
    doc.text('Variety/Size', margin + 50, yPos);
    doc.text('Bags', margin + 100, yPos);
    doc.text('Weight (T)', margin + 125, yPos);
    doc.text('WIP (T)', margin + 155, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');

    data.productionEntries.forEach((entry, index) => {
      checkPageBreak(10);

      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 7, 'F');
      }

      const productType = entry['Product Type'] || 'N/A';
      const variety = entry['Seed Variety'] || 'N/A';
      const sizeRange = entry['Size Range'] || '';
      const variant = entry['Variant/Region'] || '';
      const bags = entry['Bag Quantity'] || '0';
      const bagType = entry['Bag Type'] || '';
      const rawWeight = parseFloat(entry['Raw Material Weight (T)']) || 0;
      const wipOutput = parseFloat(entry['WIP Output (T)']) || 0;

      // Truncate long text
      const productText = productType.length > 15 ? productType.substring(0, 13) + '...' : productType;
      let varietyText = variety;
      if (sizeRange && sizeRange !== 'N/A') varietyText += ` (${sizeRange})`;
      if (variant && variant !== 'N/A') varietyText += ` ${variant}`;
      varietyText = varietyText.length > 20 ? varietyText.substring(0, 18) + '...' : varietyText;

      doc.text(productText, margin + 2, yPos);
      doc.text(varietyText, margin + 50, yPos);
      doc.text(`${bags} x ${bagType}`, margin + 100, yPos);
      doc.text(rawWeight.toFixed(2), margin + 125, yPos);
      doc.text(wipOutput.toFixed(2), margin + 155, yPos);

      yPos += 7;
    });

    yPos += 3;
  }

  drawLine();
  yPos += 5;

  // ==================== WIP BATCHES CREATED ====================
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('WIP Batches Created Today', margin, yPos);
  yPos += 8;

  if (data.wipBatches.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('No WIP batches created for this date', margin + 5, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Batch ID', margin + 2, yPos);
    doc.text('Product', margin + 55, yPos);
    doc.text('Size/Variant', margin + 100, yPos);
    doc.text('Initial (T)', margin + 140, yPos);
    doc.text('Status', margin + 170, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');

    data.wipBatches.forEach((batch, index) => {
      checkPageBreak(10);

      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 7, 'F');
      }

      const batchId = batch['WIP Batch ID'] || 'N/A';
      const productType = batch['Product Type'] || 'N/A';
      const sizeRange = batch['Size Range'] || '';
      const variant = batch['Variant/Region'] || '';
      const initialWip = parseFloat(batch['Initial WIP (T)']) || 0;
      const status = batch['Status'] || 'N/A';

      let sizeVariantText = sizeRange || 'N/A';
      if (variant && variant !== 'N/A') sizeVariantText += ` (${variant})`;
      sizeVariantText = sizeVariantText.length > 20 ? sizeVariantText.substring(0, 18) + '...' : sizeVariantText;

      const productText = productType.length > 15 ? productType.substring(0, 13) + '...' : productType;

      doc.text(batchId, margin + 2, yPos);
      doc.text(productText, margin + 55, yPos);
      doc.text(sizeVariantText, margin + 100, yPos);
      doc.text(initialWip.toFixed(2), margin + 140, yPos);
      doc.text(status, margin + 170, yPos);

      yPos += 7;
    });

    yPos += 3;
  }

  drawLine();
  yPos += 5;

  // ==================== EMPLOYEE OVERTIME ====================
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Employee Overtime Summary', margin, yPos);
  yPos += 8;

  if (!data.overtimeSummary || Object.keys(data.overtimeSummary).length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('No overtime recorded for this date', margin + 5, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Filter out employees with no overtime
    const overtimeEntries = Object.entries(data.overtimeSummary)
      .filter(([_, hours]) => hours > 0)
      .sort((a, b) => b[1] - a[1]); // Sort by hours descending

    if (overtimeEntries.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text('No overtime hours recorded', margin + 5, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    } else {
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Name', margin + 2, yPos);
      doc.text('Overtime Hours', margin + 140, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');

      overtimeEntries.forEach(([employee, hours], index) => {
        checkPageBreak(8);

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 7, 'F');
        }

        doc.text(employee, margin + 2, yPos);
        doc.text(`${hours.toFixed(1)} hrs`, margin + 140, yPos);

        yPos += 7;
      });

      // Total overtime
      yPos += 3;
      checkPageBreak(10);
      const totalOvertime = overtimeEntries.reduce((sum, [_, hours]) => sum + hours, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(255, 243, 205);
      doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
      doc.text('Total Overtime:', margin + 2, yPos);
      doc.text(`${totalOvertime.toFixed(1)} hrs`, margin + 140, yPos);
      yPos += 10;
    }
  }

  // ==================== FOOTER ====================
  const footerY = pageHeight - 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    'Production Management System',
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  );

  // Save the PDF
  const filename = `Production_Summary_${data.date}.pdf`;
  doc.save(filename);
}
