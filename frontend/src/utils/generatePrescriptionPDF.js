/**
 * Generate a premium, professionally formatted PDF prescription document.
 * Uses jsPDF + jspdf-autotable for clean table rendering.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/**
 * @param {Object} prescription - The prescription object from the API
 * @param {string} prescription.doc_first - Doctor's first name
 * @param {string} prescription.doc_last - Doctor's last name
 * @param {string} prescription.specialization - Doctor's specialization
 * @param {string} prescription.diagnosis - Diagnosis text
 * @param {string} prescription.instructions - General instructions
 * @param {string} prescription.issued_at - ISO date string
 * @param {Array}  prescription.items - Array of medication items
 * @param {string} [patientName] - Patient's name (optional)
 */
export function generatePrescriptionPDF(prescription, patientName = 'Patient') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Hospital Header ──────────────────────────────────────
  // Blue header bar
  doc.setFillColor(37, 99, 235); // brand-600
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Hospital name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Q-Care Hospital', pageWidth / 2, 16, { align: 'center' });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Prescription • Hospital Management System', pageWidth / 2, 24, { align: 'center' });

  // Contact info
  doc.setFontSize(8);
  doc.text('Emergency: 911  |  Support: 1-800-QCARE  |  hello@qcarehospital.com', pageWidth / 2, 32, { align: 'center' });

  y = 48;

  // ── Prescription ID & Date ──────────────────────────────
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Prescription ID: RX-${String(prescription.id || '0000').padStart(6, '0')}`, margin, y);
  doc.text(`Date: ${formatDate(prescription.issued_at)}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  // ── Doctor & Patient Info Card ──────────────────────────
  // Light blue background card
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'FD');

  y += 8;
  doc.setTextColor(30, 64, 175); // blue-800
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${prescription.doc_first || ''} ${prescription.doc_last || ''}`, margin + 6, y);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(prescription.specialization || 'General Practitioner', margin + 6, y + 6);

  // Patient info on the right
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Patient: ${patientName}`, pageWidth - margin - 6, y, { align: 'right' });

  y += 24;

  // ── Diagnosis Section ───────────────────────────────────
  if (prescription.diagnosis) {
    y += 4;
    doc.setFillColor(254, 249, 195); // yellow-100
    doc.setDrawColor(253, 230, 138); // yellow-300
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setTextColor(133, 77, 14); // yellow-800
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DIAGNOSIS', margin + 5, y + 6);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(prescription.diagnosis, margin + 5, y + 13, {
      maxWidth: contentWidth - 10,
    });
    y += 24;
  }

  // ── General Instructions ────────────────────────────────
  if (prescription.instructions) {
    y += 2;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('GENERAL INSTRUCTIONS', margin, y);
    y += 5;
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(prescription.instructions, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  // ── Medications Table ───────────────────────────────────
  const items = prescription.items || [];
  if (items.length > 0) {
    y += 4;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`PRESCRIBED MEDICATIONS (${items.length})`, margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Notes']],
      body: items.map((item, i) => [
        i + 1,
        item.medicine_name || '—',
        item.dosage || '—',
        item.frequency || '—',
        item.duration || '—',
        item.instructions || '—',
      ]),
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35, fontStyle: 'bold' },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 'auto' },
      },
      theme: 'grid',
      styles: {
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.3,
      },
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Doctor Signature Area ───────────────────────────────
  const sigY = Math.max(y + 15, 230);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(pageWidth - margin - 60, sigY, pageWidth - margin, sigY);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature', pageWidth - margin - 30, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Dr. ${prescription.doc_first || ''} ${prescription.doc_last || ''}`, pageWidth - margin - 30, sigY + 10, { align: 'center' });

  // ── Footer ──────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This is a digitally generated prescription from Q-Care Hospital Management System. © ' + new Date().getFullYear(),
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // ── Save the PDF ────────────────────────────────────────
  const fileName = `Prescription_Dr${prescription.doc_last || 'Doctor'}_${formatDate(prescription.issued_at).replace(/\s/g, '')}.pdf`;
  doc.save(fileName);
}
