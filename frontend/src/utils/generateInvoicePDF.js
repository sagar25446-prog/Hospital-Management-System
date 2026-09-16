import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/**
 * Generate a premium, professionally formatted PDF invoice document.
 * @param {Object} invoice - The invoice object from the API
 */
export function generateInvoicePDF(invoice) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // ── Hospital Header ──────────────────────────────────────
  // Blue header bar
  doc.setFillColor(15, 23, 42); // slate-900 (for premium feel)
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Hospital name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const hospitalName = invoice.hospital_name || 'Q-Care Hospital';
  doc.text(hospitalName, pageWidth / 2, 16, { align: 'center' });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Invoice / Receipt', pageWidth / 2, 24, { align: 'center' });

  // Contact info
  doc.setFontSize(8);
  const gstText = invoice.hospital_gstin ? `  |  GSTIN: ${invoice.hospital_gstin}` : '';
  doc.text(`Support: 1-800-QCARE  |  hello@qcarehospital.com${gstText}`, pageWidth / 2, 32, { align: 'center' });

  y = 48;

  // ── Invoice ID & Date ──────────────────────────────
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice ID: INV-${String(invoice.id || '0000').padStart(6, '0')}`, margin, y);
  doc.text(`Date: ${formatDate(invoice.paid_at || new Date())}`, pageWidth - margin, y, { align: 'right' });
  y += 8;
  
  if (invoice.razorpay_payment_id) {
    doc.text(`Transaction ID: ${invoice.razorpay_payment_id}`, margin, y);
    y += 8;
  }

  // ── Patient Info Card ──────────────────────────
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 24, 3, 3, 'FD');

  y += 8;
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Billed To: ${invoice.patient_first_name || ''} ${invoice.patient_last_name || ''}`, margin + 6, y);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Consulting Doctor: Dr. ${invoice.doctor_first_name || ''} ${invoice.doctor_last_name || ''}`, margin + 6, y + 6);
  doc.text(`Appointment Date: ${formatDate(invoice.appointment_date)}`, margin + 6, y + 12);

  y += 24;

  // ── Items Table ───────────────────────────────────
  y += 8;
  
  const amount = parseFloat(invoice.amount || 0);
  const tax = parseFloat(invoice.tax_amount || 0);
  const total = parseFloat(invoice.total_amount || 0);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Description', 'Amount (INR)']],
    body: [
      [`Doctor Consultation Fee (Dr. ${invoice.doctor_first_name || ''} ${invoice.doctor_last_name || ''})`, `Rs. ${amount.toFixed(2)}`],
      ['Taxes (18% GST)', `Rs. ${tax.toFixed(2)}`],
    ],
    foot: [
      ['Total Paid', `Rs. ${total.toFixed(2)}`]
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [30, 41, 59],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 11,
    },
    theme: 'grid',
  });

  y = doc.lastAutoTable.finalY + 15;

  // ── Footer ──────────────────────────────────────────────
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.text('Thank you for choosing Q-Care Hospital.', pageWidth / 2, y, { align: 'center' });
  
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7);
  doc.text(
    'This is a digitally generated invoice from Q-Care Hospital Management System. No physical signature is required.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // ── Save the PDF ────────────────────────────────────────
  const fileName = `Invoice_${String(invoice.id || '000').padStart(6, '0')}.pdf`;
  doc.save(fileName);
}
