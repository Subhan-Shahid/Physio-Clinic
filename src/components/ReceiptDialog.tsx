import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency } from "@/lib/utils";
import { type Invoice } from "@/lib/storage";

export interface ReceiptDialogProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReceiptDialog({ invoice, isOpen, onOpenChange }: ReceiptDialogProps) {
  const { settings } = useSettings();
  const { currency, language } = settings.appearance;
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  // Clean up the hidden iframe on unmount
  useEffect(() => {
    return () => {
      if (printFrameRef.current) {
        document.body.removeChild(printFrameRef.current);
        printFrameRef.current = null;
      }
    };
  }, []);

  if (!invoice) return null;

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0;';
      case 'pending': return 'background:#fef9c3;color:#854d0e;border:1px solid #fef08a;';
      case 'overdue': return 'background:#fee2e2;color:#991b1b;border:1px solid #fecaca;';
      case 'cancelled': return 'background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;';
      default: return 'background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;';
    }
  };

  const buildReceiptHTML = () => {
    const { clinic } = settings;
    const isPaid = invoice.status === 'paid';
    const issueDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString();
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();
    const paidDate = invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : null;
    const invoiceNo = invoice.id.replace(/^inv_/, '');
    const patientId = invoice.patientId.replace(/^patients_/, '').replace(/^devora_patients_/, '').substring(0, 10);

    const serviceRows = invoice.services.map((s, i) => `
      <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding:10px 12px;font-size:12px;color:#1e293b;font-weight:500;">${s.name}</td>
        <td style="padding:10px 12px;font-size:12px;color:#475569;text-align:center;">${s.quantity}</td>
        <td style="padding:10px 12px;font-size:12px;color:#475569;text-align:right;">${formatCurrency(s.rate, currency, language)}</td>
        <td style="padding:10px 12px;font-size:12px;color:#1e293b;font-weight:600;text-align:right;">${formatCurrency(s.total, currency, language)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt - ${invoice.patientName}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #1e293b;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 100%; }

    /* ─── HEADER ─── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
      margin-bottom: 22px;
    }
    .clinic-name {
      font-size: 20px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 4px;
    }
    .clinic-info {
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .doc-title {
      text-align: right;
    }
    .doc-type {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #cbd5e1;
    }
    .doc-number {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 99px;
      margin-top: 6px;
    }

    /* ─── BILLING PARTY ROW ─── */
    .billing-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 22px;
      padding-bottom: 18px;
      border-bottom: 1px solid #e2e8f0;
      gap: 24px;
    }
    .billing-col {
      flex: 1;
    }
    .billing-col.right { text-align: right; }
    .section-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .patient-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .meta-text {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .meta-text strong { color: #334155; }
    .meta-text.green { color: #15803d; }

    /* ─── TABLE ─── */
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .services-table thead tr {
      background: #1e3a5f;
    }
    .services-table thead th {
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .services-table thead th:not(:first-child) { text-align: right; }
    .services-table thead th:nth-child(2) { text-align: center; }

    /* ─── TOTALS ─── */
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-box {
      width: 260px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #475569;
      padding: 4px 0;
    }
    .totals-row.grand {
      border-top: 2px solid #1e3a5f;
      margin-top: 6px;
      padding-top: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }

    /* ─── WATERMARK ─── */
    .watermark-paid {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(34,197,94,0.08);
      text-transform: uppercase;
      letter-spacing: 8px;
      pointer-events: none;
      z-index: 0;
    }

    /* ─── FOOTER ─── */
    .footer {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
    }
    .footer .thanks {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
    }
    .footer .tax-id {
      font-family: monospace;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 10px;
    }
    .sig-block {
      width: 160px;
      border-top: 1px solid #94a3b8;
      text-align: center;
      padding-top: 5px;
      font-size: 10px;
      color: #64748b;
    }

    @media print {
      body { background: #ffffff !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${isPaid ? `<div class="watermark-paid">PAID</div>` : ''}

    <!-- HEADER -->
    <div class="header">
      <div>
        <div class="clinic-name">${clinic.name || 'DevOra Clinic'}</div>
        <div class="clinic-info">
          ${clinic.address ? `${clinic.address}<br/>` : ''}
          ${clinic.phone ? `<strong>Phone:</strong> ${clinic.phone}` : ''}
          ${clinic.phone && clinic.email ? ' &nbsp;|&nbsp; ' : ''}
          ${clinic.email ? `<strong>Email:</strong> ${clinic.email}` : ''}
          ${clinic.website ? `<br/><strong>Web:</strong> ${clinic.website}` : ''}
        </div>
      </div>
      <div class="doc-title">
        <div class="doc-type">${isPaid ? 'Receipt' : 'Invoice'}</div>
        <div class="doc-number">#${invoiceNo}</div>
        <div>
          <span class="status-badge" style="${getStatusStyle(invoice.status)}">${getStatusLabel(invoice.status)}</span>
        </div>
      </div>
    </div>

    <!-- BILLING PARTIES -->
    <div class="billing-row">
      <div class="billing-col">
        <div class="section-label">Billed To</div>
        <div class="patient-name">${invoice.patientName}</div>
        <div class="meta-text">Patient Ref: ${patientId}</div>
      </div>
      <div class="billing-col right">
        <div class="section-label">Transaction Details</div>
        <div class="meta-text"><strong>Issue Date:</strong> ${issueDate}</div>
        <div class="meta-text"><strong>Due Date:</strong> ${dueDate}</div>
        ${paidDate ? `<div class="meta-text green"><strong>Paid On:</strong> ${paidDate}</div>` : ''}
        ${invoice.paymentMethod ? `<div class="meta-text"><strong>Method:</strong> ${invoice.paymentMethod}</div>` : ''}
      </div>
    </div>

    <!-- SERVICES TABLE -->
    <table class="services-table">
      <thead>
        <tr>
          <th style="text-align:left;">Service Description</th>
          <th style="width:60px;">Qty</th>
          <th style="width:110px;">Unit Rate</th>
          <th style="width:120px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${serviceRows}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(invoice.amount, currency, language)}</span>
        </div>
        <div class="totals-row">
          <span>Tax (10%)</span>
          <span>${formatCurrency(invoice.tax, currency, language)}</span>
        </div>
        <div class="totals-row grand">
          <span>Total Due</span>
          <span>${formatCurrency(invoice.total, currency, language)}</span>
        </div>
        ${isPaid ? `
        <div style="margin-top:10px;padding:8px;background:#dcfce7;border:1px solid #86efac;border-radius:6px;text-align:center;">
          <span style="font-size:12px;font-weight:700;color:#15803d;">✓ PAYMENT RECEIVED — ${formatCurrency(invoice.total, currency, language)}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="thanks">Thank you for choosing ${clinic.name || 'DevOra Clinic'}!</div>
      <div>Questions? Reach us at ${clinic.email || 'info@devora.com'}</div>
      ${clinic.taxId ? `<div class="tax-id">Tax Registration ID (TRN): ${clinic.taxId}</div>` : ''}
      <div class="signature-row">
        <div class="sig-block">Patient Signature</div>
        <div class="sig-block">Authorized Stamp &amp; Sign</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); window.close(); };
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    // Remove any existing hidden iframe
    if (printFrameRef.current) {
      document.body.removeChild(printFrameRef.current);
    }
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    printFrameRef.current = iframe;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(buildReceiptHTML());
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };

  const { clinic } = settings;
  const isPaid = invoice.status === 'paid';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 p-0 rounded-xl border-none shadow-2xl">
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 rounded-t-xl sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isPaid ? 'Payment Receipt' : 'Invoice'} — {invoice.patientName}
            </DialogTitle>
          </DialogHeader>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>

        {/* On-screen preview */}
        <div className="p-6 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Preview Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "24px 28px 18px",
                borderBottom: "2px solid #3b82f6",
                background: "#fff",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f" }}>
                  {clinic.name || "DevOra Clinic"}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.6 }}>
                  {clinic.address && <div>{clinic.address}</div>}
                  {clinic.phone && <div><strong>Phone:</strong> {clinic.phone}</div>}
                  {clinic.email && <div><strong>Email:</strong> {clinic.email}</div>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#cbd5e1", letterSpacing: 3, textTransform: "uppercase" }}>
                  {isPaid ? "Receipt" : "Invoice"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginTop: 3 }}>
                  #{invoice.id.replace(/^inv_/, "")}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    padding: "2px 10px",
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    ...(invoice.status === "paid"
                      ? { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }
                      : invoice.status === "pending"
                      ? { background: "#fef9c3", color: "#854d0e", border: "1px solid #fef08a" }
                      : invoice.status === "overdue"
                      ? { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }
                      : { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }),
                  }}
                >
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Billing parties */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid #e2e8f0", gap: 16 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", letterSpacing: 1.5, marginBottom: 5 }}>Billed To</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{invoice.patientName}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Patient Ref: {invoice.patientId.substring(0, 10)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", letterSpacing: 1.5, marginBottom: 5 }}>Transaction Details</div>
                <div style={{ fontSize: 11, color: "#475569" }}><strong>Issue Date:</strong> {new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</div>
                <div style={{ fontSize: 11, color: "#475569" }}><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</div>
                {invoice.paidDate && <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}><strong>Paid On:</strong> {new Date(invoice.paidDate).toLocaleDateString()}</div>}
              </div>
            </div>

            {/* Services table */}
            <div style={{ padding: "16px 28px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: "#1e3a5f" }}>
                    <th style={{ padding: "9px 12px", fontSize: 11, fontWeight: 600, color: "#fff", textAlign: "left", textTransform: "uppercase" }}>Service</th>
                    <th style={{ padding: "9px 12px", fontSize: 11, fontWeight: 600, color: "#fff", textAlign: "center", width: 60 }}>Qty</th>
                    <th style={{ padding: "9px 12px", fontSize: 11, fontWeight: 600, color: "#fff", textAlign: "right", width: 110 }}>Rate</th>
                    <th style={{ padding: "9px 12px", fontSize: 11, fontWeight: 600, color: "#fff", textAlign: "right", width: 120 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.services.map((s, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      <td style={{ padding: "9px 12px", fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: "9px 12px", fontSize: 12, color: "#475569", textAlign: "center" }}>{s.quantity}</td>
                      <td style={{ padding: "9px 12px", fontSize: 12, color: "#475569", textAlign: "right" }}>{formatCurrency(s.rate, currency, language)}</td>
                      <td style={{ padding: "9px 12px", fontSize: 12, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{formatCurrency(s.total, currency, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ padding: "0 28px 20px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 240 }}>
                {[{ label: "Subtotal", val: invoice.amount }, { label: "Tax (10%)", val: invoice.tax }].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", padding: "3px 0" }}>
                    <span>{r.label}</span><span>{formatCurrency(r.val, currency, language)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#0f172a", borderTop: "2px solid #1e3a5f", marginTop: 6, paddingTop: 8 }}>
                  <span>Total Due</span><span>{formatCurrency(invoice.total, currency, language)}</span>
                </div>
                {isPaid && (
                  <div style={{ marginTop: 10, padding: "7px 10px", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 6, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#15803d" }}>
                    ✓ PAYMENT RECEIVED
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid #e2e8f0", padding: "14px 28px 20px", textAlign: "center", background: "#f8fafc" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Thank you for choosing {clinic.name || "DevOra Clinic"}!</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>Questions? Reach us at {clinic.email || "info@devora.com"}</div>
              {clinic.taxId && <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginTop: 3 }}>TRN: {clinic.taxId}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 8 }}>
                <div style={{ width: 150, borderTop: "1px solid #94a3b8", textAlign: "center", paddingTop: 5, fontSize: 10, color: "#64748b" }}>Patient Signature</div>
                <div style={{ width: 150, borderTop: "1px solid #94a3b8", textAlign: "center", paddingTop: 5, fontSize: 10, color: "#64748b" }}>Authorized Stamp & Sign</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
