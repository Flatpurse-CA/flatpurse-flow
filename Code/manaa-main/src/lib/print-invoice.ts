import { format } from "date-fns";
import { formatNaira } from "@/lib/currency";

const LOGO_URL = "/manaa-logo-light.png";

// Convert image URL to base64 for PDF embedding
async function getLogoBase64(): Promise<string> {
  try {
    const response = await fetch(LOGO_URL);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function getInvoiceStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; }
    .page { max-width: 720px; margin: 0 auto; padding: 40px 32px; }

    .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid #e5e5e5; margin-bottom: 28px; }
    .logo { height: 36px; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .doc-title p { font-size: 11px; color: #888; margin-top: 3px; }

    .meta { display: flex; justify-content: space-between; margin-bottom: 28px; }
    .meta-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 6px; }
    .meta-block p { font-size: 13px; line-height: 1.5; }

    .badge { display: inline-block; padding: 3px 14px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-paid { background: #dcfce7; color: #16a34a; }
    .badge-draft { background: #f4f4f5; color: #71717a; }
    .badge-sent { background: #dbeafe; color: #2563eb; }
    .badge-overdue { background: #fef2f2; color: #dc2626; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th { background: #1a1a1a; color: #ffffff; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; padding: 9px 12px; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:nth-child(even) td { background: #fafafa; }
    .text-right { text-align: right; }
    .text-bold { font-weight: 600; }

    .totals { margin-left: auto; width: 260px; margin-bottom: 28px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .total-row.grand { border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 4px; font-weight: 700; font-size: 15px; }

    .notes { background: #f9fafb; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px; }
    .notes h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #888; margin-bottom: 6px; }
    .notes p { font-size: 12px; color: #555; line-height: 1.5; }

    .footer { border-top: 1px solid #e5e5e5; padding-top: 16px; text-align: center; font-size: 10px; color: #aaa; }
    .footer p { margin-bottom: 2px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px 16px; }
    }
    @page { margin: 12mm; size: A4; }
  `;
}

export interface InvoicePrintData {
  invoice_number: string;
  status: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  business_name?: string;
  business_address?: string;
  business_email?: string;
  business_phone?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  items: { description: string; quantity: number; unit_price: number; total: number }[];
}

function buildInvoiceHTML(inv: InvoicePrintData, docType: "invoice" | "receipt", logoSrc: string) {
  const isReceipt = docType === "receipt";
  const title = isReceipt ? "Payment Receipt" : "Invoice";
  const badgeClass = inv.status === "paid" ? "badge-paid" : "badge-overdue";
  const displayStatus = inv.status === "paid" ? "Paid" : "Unpaid";

  const itemRows = inv.items.map(item => `
    <tr>
      <td>${item.description || "—"}</td>
      <td class="text-right">${item.quantity}</td>
      <td class="text-right">${formatNaira(Number(item.unit_price))}</td>
      <td class="text-right text-bold">${formatNaira(Number(item.total))}</td>
    </tr>
  `).join("");

  return `
    <html>
    <head><title>${title} — ${inv.invoice_number}</title>
    <style>${getInvoiceStyles()}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
           <img src="${logoSrc}" class="logo" alt="Manaa" />
            ${inv.business_name ? `<p style="font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:#888; margin-top:10px; margin-bottom:2px;">Business Name</p><p style="font-size:13px; font-weight:600;">${inv.business_name}</p>` : ""}
            ${inv.business_address ? `<p style="font-size:11px; color:#888;">${inv.business_address}</p>` : ""}
            ${inv.business_email ? `<p style="font-size:11px; color:#888;">${inv.business_email}</p>` : ""}
            ${inv.business_phone ? `<p style="font-size:11px; color:#888;">${inv.business_phone}</p>` : ""}
          </div>
          <div class="doc-title">
            <h1>${title}</h1>
            <p>${inv.invoice_number}</p>
            <div style="margin-top:8px;">
              <span class="badge ${badgeClass}">${isReceipt ? "Paid" : displayStatus}</span>
            </div>
          </div>
        </div>

        <div class="meta">
          <div class="meta-block">
            <h3>Bill To</h3>
            <p style="font-weight:500;">${inv.customer_name}</p>
            ${inv.customer_email ? `<p>${inv.customer_email}</p>` : ""}
            ${inv.customer_address ? `<p>${inv.customer_address}</p>` : ""}
          </div>
          <div class="meta-block" style="text-align:right;">
            <h3>${isReceipt ? "Payment Details" : "Invoice Details"}</h3>
            <p>Issued: ${format(new Date(inv.issue_date), "dd MMM yyyy")}</p>
            ${isReceipt
              ? `<p>Paid on: ${format(new Date(), "dd MMM yyyy")}</p>`
              : `<p>Due: ${format(new Date(inv.due_date), "dd MMM yyyy")}</p>`
            }
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${formatNaira(Number(inv.subtotal))}</span>
          </div>
          ${inv.tax_rate > 0 ? `
            <div class="total-row">
              <span>VAT (${inv.tax_rate}%)</span>
              <span>${formatNaira(Number(inv.tax_amount))}</span>
            </div>
          ` : ""}
          <div class="total-row grand">
            <span>Total</span>
            <span>${formatNaira(Number(inv.total))}</span>
          </div>
        </div>

        ${inv.bank_name || inv.bank_account_number ? `
          <div class="notes" style="margin-bottom: 16px;">
            <h3>Bank Details</h3>
            ${inv.bank_name ? `<p><strong>Bank:</strong> ${inv.bank_name}</p>` : ""}
            ${inv.bank_account_number ? `<p><strong>Account Number:</strong> ${inv.bank_account_number}</p>` : ""}
            ${inv.bank_account_name ? `<p><strong>Account Name:</strong> ${inv.bank_account_name}</p>` : ""}
          </div>
        ` : ""}

        ${inv.notes ? `
          <div class="notes">
            <h3>Notes</h3>
            <p>${inv.notes}</p>
          </div>
        ` : ""}

        <div class="footer">
          <p>Generated on ${format(new Date(), "dd MMM yyyy 'at' HH:mm")}</p>
          <p style="margin-top: 4px; font-size: 11px; color: #666;">Powered by <strong>Midda Innovation Ltd.</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function printInvoice(inv: InvoicePrintData) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  // Use absolute URL for print window (same origin)
  const absoluteLogo = new URL(LOGO_URL, window.location.origin).href;
  w.document.write(buildInvoiceHTML(inv, "invoice", absoluteLogo));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

export function printInvoiceReceipt(inv: InvoicePrintData) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  const absoluteLogo = new URL(LOGO_URL, window.location.origin).href;
  w.document.write(buildInvoiceHTML(inv, "receipt", absoluteLogo));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

export async function downloadInvoicePDF(inv: InvoicePrintData, docType: "invoice" | "receipt" = "invoice") {
  // Get logo as base64 so it embeds in the PDF
  const logoBase64 = await getLogoBase64();
  const html = buildInvoiceHTML(inv, docType, logoBase64 || new URL(LOGO_URL, window.location.origin).href);

  // Create a temporary container
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px"; // A4 width in px at 96dpi
  document.body.appendChild(container);

  // Wait for logo to load
  const img = container.querySelector("img");
  if (img && logoBase64) {
    await new Promise<void>((resolve) => {
      if (img.complete) resolve();
      else {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }
    });
  }

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const pageEl = container.querySelector(".page") || container;
    
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `${docType === "receipt" ? "Receipt" : "Invoice"}-${inv.invoice_number}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(pageEl)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
