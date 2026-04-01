import { format } from "date-fns";
import { formatNaira } from "@/lib/currency";

const LOGO_URL = "/manaa-logo-light.png";

function getBaseStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; }
    .page { max-width: 680px; margin: 0 auto; padding: 40px 32px; }
    
    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5; margin-bottom: 28px; }
    .logo { height: 32px; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; }
    .doc-title p { font-size: 11px; color: #888; margin-top: 2px; }
    
    /* Amount hero */
    .amount-hero { text-align: center; padding: 24px 0; margin-bottom: 24px; }
    .amount-hero .type-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .type-badge.cash_in { background: #dcfce7; color: #16a34a; }
    .type-badge.cash_out { background: #fef2f2; color: #dc2626; }
    .amount-hero .amount { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
    .amount.cash_in { color: #16a34a; }
    .amount.cash_out { color: #dc2626; }
    .amount-hero .date { font-size: 12px; color: #888; margin-top: 6px; }
    
    /* Detail table */
    .details { border: 1px solid #e5e5e5; border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 16px; font-size: 13px; }
    .detail-row:not(:last-child) { border-bottom: 1px solid #f0f0f0; }
    .detail-row:nth-child(even) { background: #fafafa; }
    .detail-label { color: #888; font-size: 12px; }
    .detail-value { font-weight: 500; text-align: right; max-width: 60%; }
    
    /* Statement table */
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
    th { background: #f4f4f5; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; text-align: left; padding: 8px 12px; }
    td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:nth-child(even) td { background: #fafafa; }
    .text-right { text-align: right; }
    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
    .text-bold { font-weight: 600; }
    
    /* Summary cards */
    .summary { display: flex; gap: 16px; margin-bottom: 28px; }
    .summary-card { flex: 1; background: #f9fafb; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 16px; }
    .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #888; margin-bottom: 4px; }
    .summary-value { font-size: 18px; font-weight: 700; }
    
    /* Footer */
    .footer { border-top: 1px solid #e5e5e5; padding-top: 16px; text-align: center; font-size: 10px; color: #aaa; }
    .footer p { margin-bottom: 2px; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px 16px; }
    }
    @page { margin: 12mm; size: A4; }
  `;
}

interface ReceiptData {
  type: "cash_in" | "cash_out";
  amount: number;
  transaction_date: string;
  description?: string;
  category: string;
  customer_name?: string;
  customer_detail?: string;
  balance_after: number;
  business_name?: string;
  account_name?: string;
}

export function printReceipt(tx: ReceiptData) {
  const w = window.open("", "_blank", "width=700,height=900");
  if (!w) return;

  const typeLabel = tx.type === "cash_in" ? "Cash In" : "Cash Out";
  const sign = tx.type === "cash_in" ? "+" : "−";

  w.document.write(`
    <html>
    <head><title>Receipt — ${typeLabel} ${formatNaira(Number(tx.amount))}</title>
    <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <img src="${LOGO_URL}" class="logo" alt="Manaa" />
          <div class="doc-title">
            <h1>Transaction Receipt</h1>
            <p>#${tx.transaction_date?.replace(/-/g, "")}-${String(tx.amount).slice(-4)}</p>
          </div>
        </div>

        <div class="amount-hero">
          <div class="type-badge ${tx.type}">${typeLabel}</div>
          <div class="amount ${tx.type}">${sign}${formatNaira(Number(tx.amount))}</div>
          <div class="date">${format(new Date(tx.transaction_date), "EEEE, dd MMMM yyyy")}</div>
        </div>

        <div class="details">
          <div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">${tx.description || "—"}</span></div>
          <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${tx.category}</span></div>
          ${tx.business_name ? `<div class="detail-row"><span class="detail-label">Business</span><span class="detail-value">${tx.business_name}</span></div>` : ""}
          ${tx.account_name ? `<div class="detail-row"><span class="detail-label">Book</span><span class="detail-value">${tx.account_name}</span></div>` : ""}
          ${tx.customer_name ? `<div class="detail-row"><span class="detail-label">Customer</span><span class="detail-value">${tx.customer_name}</span></div>` : ""}
          ${tx.customer_detail ? `<div class="detail-row"><span class="detail-label">Customer Detail</span><span class="detail-value">${tx.customer_detail}</span></div>` : ""}
          <div class="detail-row"><span class="detail-label">Balance After</span><span class="detail-value">${formatNaira(Number(tx.balance_after))}</span></div>
        </div>

        <div class="footer">
          <p>Generated on ${format(new Date(), "dd MMM yyyy 'at' HH:mm")}</p>
          <p style="margin-top: 4px; font-size: 11px; color: #666;">Powered by <strong>Manaa</strong> · Midda Innovation Ltd.</p>
        </div>
      </div>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

interface StatementData {
  accountName: string;
  transactions: {
    transaction_date: string;
    description?: string;
    category: string;
    type: string;
    amount: number;
    balance_after: number;
    customer_name?: string;
  }[];
  cashIn: number;
  cashOut: number;
  balance: number;
  isFiltered: boolean;
}

export function printStatement(data: StatementData) {
  const w = window.open("", "_blank", "width=900,height=800");
  if (!w) return;

  const rows = data.transactions.map((tx) => `
    <tr>
      <td>${format(new Date(tx.transaction_date), "dd MMM yyyy")}</td>
      <td>${tx.description || tx.category}${tx.customer_name ? ` · ${tx.customer_name}` : ""}</td>
      <td>${tx.category}</td>
      <td class="text-right ${tx.type === "cash_in" ? "text-green" : "text-red"} text-bold">
        ${tx.type === "cash_in" ? "+" : "−"}${formatNaira(Number(tx.amount))}
      </td>
      <td class="text-right">${formatNaira(Number(tx.balance_after))}</td>
    </tr>
  `).join("");

  w.document.write(`
    <html>
    <head><title>Statement — ${data.accountName}</title>
    <style>${getBaseStyles()}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <img src="${LOGO_URL}" class="logo" alt="Manaa" />
          <div class="doc-title">
            <h1>Book Statement</h1>
            <p>${data.accountName} · ${data.isFiltered ? "Filtered" : "Full"} statement</p>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card">
            <div class="summary-label">Cash In</div>
            <div class="summary-value text-green">${formatNaira(data.cashIn)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Cash Out</div>
            <div class="summary-value text-red">${formatNaira(data.cashOut)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Balance</div>
            <div class="summary-value">${formatNaira(data.balance)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="footer">
          <p>${data.transactions.length} transaction${data.transactions.length !== 1 ? "s" : ""} · Generated on ${format(new Date(), "dd MMM yyyy 'at' HH:mm")}</p>
          <p style="margin-top: 4px; font-size: 11px; color: #666;">Powered by <strong>Manaa</strong> · Midda Innovation Ltd.</p>
        </div>
      </div>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

interface NRSReportData {
  businessName: string;
  year: number;
  quarters: {
    label: string;
    revenue: number;
    revenueExVAT: number;
    expenses: number;
    expensesExVAT: number;
    outputVAT: number;
    inputVAT: number;
    netVAT: number;
    rate: number;
  }[];
  annualRevenue: number;
  isSmallCompany: boolean;
  devLevy: number;
}

export function printNRSReport(data: NRSReportData) {
  const w = window.open("", "_blank", "width=900,height=900");
  if (!w) return;

  const totalRevenue = data.quarters.reduce((s, q) => s + q.revenue, 0);
  const totalRevenueExVAT = data.quarters.reduce((s, q) => s + q.revenueExVAT, 0);
  const totalExpenses = data.quarters.reduce((s, q) => s + q.expenses, 0);
  const totalExpensesExVAT = data.quarters.reduce((s, q) => s + q.expensesExVAT, 0);
  const totalOutput = data.quarters.reduce((s, q) => s + q.outputVAT, 0);
  const totalInput = data.quarters.reduce((s, q) => s + q.inputVAT, 0);
  const totalNet = data.quarters.reduce((s, q) => s + q.netVAT, 0);

  const rows = data.quarters.map((q) => `
    <tr>
      <td>${q.label}</td>
      <td class="text-right">${q.rate}%</td>
      <td class="text-right">${formatNaira(q.revenueExVAT)}</td>
      <td class="text-right">${formatNaira(q.expensesExVAT)}</td>
      <td class="text-right text-green">${formatNaira(q.outputVAT)}</td>
      <td class="text-right text-red">${formatNaira(q.inputVAT)}</td>
      <td class="text-right text-bold">${q.netVAT >= 0 ? formatNaira(q.netVAT) : "(" + formatNaira(Math.abs(q.netVAT)) + ")"}</td>
    </tr>
  `).join("");

  w.document.write(`
    <html>
    <head><title>NRS VAT Report — ${data.year}</title>
    <style>${getBaseStyles()}
      .report-header { background: #1a1a1a; color: #fff; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
      .report-header h2 { font-size: 16px; font-weight: 700; }
      .report-header p { font-size: 11px; opacity: 0.7; margin-top: 2px; }
      .report-badge { background: #fff; color: #1a1a1a; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 700; }
      .notes li { font-size: 11px; color: #666; margin-bottom: 4px; list-style: disc; margin-left: 16px; }
      .classification { display: flex; gap: 16px; margin-bottom: 20px; }
      .class-card { flex: 1; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 16px; }
      .class-label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.04em; }
      .class-value { font-size: 16px; font-weight: 700; margin-top: 4px; }
      .totals-row td { border-top: 2px solid #1a1a1a; font-weight: 700; }
    </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <img src="${LOGO_URL}" class="logo" alt="Manaa" />
          <div class="doc-title">
            <h1>NRS VAT Return</h1>
            <p>Annual Report — ${data.year}</p>
          </div>
        </div>

        <div class="report-header">
          <div>
            <h2>${data.businessName}</h2>
            <p>Nigeria Revenue Service — VAT Filing Report</p>
          </div>
          <div class="report-badge">${data.isSmallCompany ? "SMALL COMPANY" : "STANDARD"}</div>
        </div>

        <div class="classification">
          <div class="class-card">
            <div class="class-label">Annual Revenue (Incl. VAT)</div>
            <div class="class-value">${formatNaira(data.annualRevenue)}</div>
          </div>
          <div class="class-card">
            <div class="class-label">Company Size</div>
            <div class="class-value">${data.isSmallCompany ? "Small (CIT/CGT Exempt)" : "Standard Rates Apply"}</div>
          </div>
          ${!data.isSmallCompany ? `
          <div class="class-card">
            <div class="class-label">Dev. Levy (4%)</div>
            <div class="class-value">${formatNaira(data.devLevy)}</div>
          </div>` : ""}
        </div>

        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Revenue (Ex-VAT)</th>
              <th class="text-right">Purchases (Ex-VAT)</th>
              <th class="text-right">Output VAT</th>
              <th class="text-right">Input VAT</th>
              <th class="text-right">Net VAT</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="totals-row">
              <td colspan="2"><strong>Annual Total</strong></td>
              <td class="text-right">${formatNaira(totalRevenueExVAT)}</td>
              <td class="text-right">${formatNaira(totalExpensesExVAT)}</td>
              <td class="text-right text-green">${formatNaira(totalOutput)}</td>
              <td class="text-right text-red">${formatNaira(totalInput)}</td>
              <td class="text-right text-bold">${totalNet >= 0 ? formatNaira(totalNet) : "(" + formatNaira(Math.abs(totalNet)) + ")"}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-bottom: 24px;">
          <p style="font-size: 12px; font-weight: 600; margin-bottom: 8px;">Notes — Nigeria Tax Act 2025</p>
          <ul class="notes">
            <li>VAT rate: 7.5% (retained — phased increase was rejected by the House of Representatives)</li>
            <li>Amounts recorded in cashbooks are treated as VAT-inclusive; VAT is extracted at 7.5/107.5</li>
            <li>Input VAT on business purchases is now fully recoverable under NTA 2025</li>
            <li>FIRS has been replaced by the Nigeria Revenue Service (NRS)</li>
            <li>Filing deadline: 21st of the month following the taxable period</li>
            <li>Essential goods (food, healthcare, education, transport) are zero-rated</li>
            ${data.isSmallCompany ? "<li>Small companies (revenue ≤₦100M) are exempt from CIT, CGT, and 4% Development Levy</li>" : ""}
          </ul>
        </div>

        <div class="footer">
          <p>Generated on ${format(new Date(), "dd MMM yyyy 'at' HH:mm")} · This is an estimate for record-keeping purposes only</p>
          <p style="margin-top: 4px; font-size: 11px; color: #666;">Powered by <strong>Manaa</strong> · Midda Innovation Ltd.</p>
        </div>
      </div>
    </body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
