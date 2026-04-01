/**
 * Deterministic PDF bank statement parsers for Nigerian banks.
 * Each parser reads positional text extracted by pdfjs-dist and
 * returns structured transaction rows — no AI involved.
 */

import type { PdfPageData, PdfTextItem } from "./pdf-parser";

// ─── Types ───────────────────────────────────────────────────

export interface PdfParsedRow {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  balance?: number;
}

export interface BankParserResult {
  bank: string;
  rows: PdfParsedRow[];
}

// ─── Row grouping helper ─────────────────────────────────────

function groupIntoRows(items: PdfTextItem[], tolerance = 4): PdfTextItem[][] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: PdfTextItem[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const lastY = rows[rows.length - 1][0].y;
    if (Math.abs(sorted[i].y - lastY) <= tolerance) {
      rows[rows.length - 1].push(sorted[i]);
    } else {
      rows.push([sorted[i]]);
    }
  }
  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}

function rowText(row: PdfTextItem[]): string {
  return row.map((i) => i.text).join(" ");
}

function itemsInXRange(row: PdfTextItem[], xStart: number, xEnd: number): string {
  return row
    .filter((i) => i.x >= xStart - 8 && i.x <= xEnd + 8)
    .map((i) => i.text)
    .join(" ")
    .trim();
}

// ─── Number parsing ──────────────────────────────────────────

function parseAmt(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[,\s]/g, "").replace(/[^0-9.\-]/g, "");
  return parseFloat(cleaned) || 0;
}

// ─── Date parsing (DD/MM/YYYY, DD-MMM-YYYY, etc.) ────────────

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function tryParseSingleDate(trimmed: string): string {
  // DD/MM/YYYY or DD-MM-YYYY
  const numMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (numMatch) {
    const d = numMatch[1].padStart(2, "0");
    const m = numMatch[2].padStart(2, "0");
    let y = numMatch[3];
    if (y.length === 2) y = "20" + y;
    return `${y}-${m}-${d}`;
  }

  // DD-MMM-YYYY or DD-MMM-YY
  const mMatch = trimmed.match(/^(\d{1,2})[\/\-\.\s]+([A-Za-z]{3})[\/\-\.\s,]+(\d{2,4})$/);
  if (mMatch) {
    const d = mMatch[1].padStart(2, "0");
    const m = MONTH_MAP[mMatch[2].toLowerCase()] || "01";
    let y = mMatch[3];
    if (y.length === 2) y = "20" + y;
    return `${y}-${m}-${d}`;
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  return "";
}

function parseNigerianDate(str: string): string {
  if (!str) return "";
  const trimmed = str.trim();

  // Strip trailing time like "09:18:52 am"
  const noTime = trimmed.replace(/\s+\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?/i, "").trim();

  // Try full string first (with and without time stripped)
  for (const candidate of [noTime, trimmed]) {
    const full = tryParseSingleDate(candidate);
    if (full) return full;
  }

  // Handle concatenated dates like "04-JAN-26 04-JAN-26" — try each space-separated segment
  const segments = noTime.split(/\s+/);
  for (const seg of segments) {
    const result = tryParseSingleDate(seg);
    if (result) return result;
  }

  // Handle "DD MMM YY" (space-separated date parts)
  if (segments.length >= 3) {
    const result = tryParseSingleDate(`${segments[0]}-${segments[1]}-${segments[2]}`);
    if (result) return result;
  }

  return "";
}

// ─── Bank detection ──────────────────────────────────────────

type BankId = "gtbank" | "firstbank" | "access" | "uba" | "zenith" | "pocketapp" | "unknown";

interface BankSignature {
  id: BankId;
  label: string;
  patterns: RegExp[];
}

const BANK_SIGNATURES: BankSignature[] = [
  {
    id: "pocketapp",
    label: "PocketApp",
    patterns: [/pocketapp/i, /pocket\s*app/i, /piggyvest/i, /pocket\s*user/i, /pocket_p2p/i, /pocket_disburse/i, /pocket_funding/i],
  },
  {
    id: "access",
    label: "Access Bank",
    patterns: [/access\s*bank/i, /access\s*plc/i, /diamond\s*bank/i, /\*901#\s*access/i],
  },
  {
    id: "gtbank",
    label: "GTBank",
    patterns: [/guaranty\s*trust/i, /gtbank/i, /gtb\s*plc/i],
  },
  {
    id: "firstbank",
    label: "First Bank",
    patterns: [/first\s*bank/i, /first\s*bank\s*of\s*nigeria/i],
  },
  {
    id: "uba",
    label: "UBA",
    patterns: [/united\s*bank\s*for\s*africa/i],
  },
  {
    id: "zenith",
    label: "Zenith Bank",
    patterns: [/zenith\s*bank/i, /zenith\s*plc/i],
  },
];

function detectBank(pages: PdfPageData[]): BankId {
  // Check ALL pages for bank identifiers (PocketApp IDs appear in transaction rows)
  const textToCheck = pages
    .flatMap((p) => p.items.map((i) => i.text))
    .join(" ");

  for (const sig of BANK_SIGNATURES) {
    for (const pattern of sig.patterns) {
      if (pattern.test(textToCheck)) return sig.id;
    }
  }
  return "unknown";
}

// ─── Header detection (find the transaction table header row) ─

const HEADER_KEYWORDS = [
  "date", "trans date", "transaction date", "value date", "posting date", "posted date", "full date",
  "description", "narration", "details", "particulars", "remarks", "memo",
  "debit", "credit", "withdrawal", "deposit", "amount",
  "balance", "closing balance",
];

function findHeaderRow(allRows: PdfTextItem[][]): { index: number; row: PdfTextItem[]; endIndex: number } | null {
  const DATE_KEYWORDS = ["date", "trans date", "transaction date", "value date", "posting date", "posted date"];
  
  for (let i = 0; i < allRows.length; i++) {
    const text = rowText(allRows[i]).toLowerCase();
    let matches = 0;
    let hasDate = false;
    for (const kw of HEADER_KEYWORDS) {
      if (text.includes(kw)) {
        matches++;
        if (DATE_KEYWORDS.includes(kw)) hasDate = true;
      }
    }
    // Must have at least 3 keyword matches AND include a date-related keyword
    if (matches >= 3 && hasDate) {
      let endIndex = i;
      if (i + 1 < allRows.length) {
        const nextText = rowText(allRows[i + 1]).toLowerCase();
        const nextMatches = HEADER_KEYWORDS.filter(kw => nextText.includes(kw)).length;
        if (nextMatches >= 1) {
          const mergedRow = mergeHeaderRows(allRows[i], allRows[i + 1]);
          endIndex = i + 1;
          return { index: i, row: mergedRow, endIndex };
        }
      }
      return { index: i, row: allRows[i], endIndex };
    }
    
    // Also try merging with next row first, then check (for split headers like "Posted" / "Date")
    if (matches >= 1 && i + 1 < allRows.length) {
      const nextText = rowText(allRows[i + 1]).toLowerCase();
      const combinedText = text + " " + nextText;
      let combinedMatches = 0;
      let combinedHasDate = false;
      for (const kw of HEADER_KEYWORDS) {
        if (combinedText.includes(kw)) {
          combinedMatches++;
          if (DATE_KEYWORDS.includes(kw)) combinedHasDate = true;
        }
      }
      if (combinedMatches >= 3 && combinedHasDate) {
        const mergedRow = mergeHeaderRows(allRows[i], allRows[i + 1]);
        return { index: i, row: mergedRow, endIndex: i + 1 };
      }
    }
  }
  return null;
}

/**
 * Merge two header rows by combining vertically-aligned items.
 * E.g., "Posted" (row1) + "Date" (row2) at same X → "Posted Date"
 */
function mergeHeaderRows(row1: PdfTextItem[], row2: PdfTextItem[]): PdfTextItem[] {
  const merged: PdfTextItem[] = [];
  const used2 = new Set<number>();

  for (const item1 of row1) {
    // Find item in row2 that's vertically aligned (within 20px X tolerance)
    const match2Idx = row2.findIndex((item2, idx) => !used2.has(idx) && Math.abs(item2.x - item1.x) < 20);
    if (match2Idx !== -1) {
      used2.add(match2Idx);
      merged.push({
        ...item1,
        text: `${item1.text} ${row2[match2Idx].text}`,
      });
    } else {
      merged.push(item1);
    }
  }

  // Add any unmatched items from row2
  for (let i = 0; i < row2.length; i++) {
    if (!used2.has(i)) merged.push(row2[i]);
  }

  return merged.sort((a, b) => a.x - b.x);
}

// ─── Column position detection from header row ───────────────

interface ColumnPositions {
  date?: { x: number; label: string };
  description?: { x: number; label: string };
  debit?: { x: number; label: string };
  credit?: { x: number; label: string };
  amount?: { x: number; label: string };
  balance?: { x: number; label: string };
}

function detectColumns(headerRow: PdfTextItem[]): ColumnPositions {
  const cols: ColumnPositions = {};

  // First pass: try to match individual items
  for (const item of headerRow) {
    const lower = item.text.toLowerCase().trim();

    if (!cols.date && /\b(posted\s*date|trans\.?\s*date|transaction\s*date|value\s*date|posting\s*date|full\s*date)\b/i.test(lower)) {
      cols.date = { x: item.x, label: item.text };
    } else if (!cols.date && /^date$/i.test(lower)) {
      cols.date = { x: item.x, label: item.text };
    } else if (!cols.description && /\b(description|narration|details|particulars|remarks|memo)\b/i.test(lower)) {
      cols.description = { x: item.x, label: item.text };
    } else if (!cols.debit && /\bdebit\b/i.test(lower)) {
      cols.debit = { x: item.x, label: item.text };
    } else if (!cols.debit && /\b(withdrawal|withdrawals)\b/i.test(lower)) {
      cols.debit = { x: item.x, label: item.text };
    } else if (!cols.credit && /\bcredit\b/i.test(lower)) {
      cols.credit = { x: item.x, label: item.text };
    } else if (!cols.credit && /\b(deposit|deposits)\b/i.test(lower)) {
      cols.credit = { x: item.x, label: item.text };
    } else if (!cols.amount && /\bamount\b/i.test(lower) && !/debit|credit/i.test(lower)) {
      cols.amount = { x: item.x, label: item.text };
    } else if (!cols.balance && /\bbalance\b/i.test(lower)) {
      cols.balance = { x: item.x, label: item.text };
    }
  }

  return cols;
}

// ─── Column boundary calculation ─────────────────────────────

interface ColBoundary {
  name: string;
  xStart: number;
  xEnd: number;
}

function buildColumnBoundaries(cols: ColumnPositions, pageWidth: number): ColBoundary[] {
  const entries: { name: string; x: number }[] = [];
  if (cols.date) entries.push({ name: "date", x: cols.date.x });
  if (cols.description) entries.push({ name: "description", x: cols.description.x });
  if (cols.debit) entries.push({ name: "debit", x: cols.debit.x });
  if (cols.credit) entries.push({ name: "credit", x: cols.credit.x });
  if (cols.amount) entries.push({ name: "amount", x: cols.amount.x });
  if (cols.balance) entries.push({ name: "balance", x: cols.balance.x });

  entries.sort((a, b) => a.x - b.x);

  return entries.map((entry, i) => {
    const xStart = i === 0 ? 0 : (entries[i - 1].x + entry.x) / 2;
    const xEnd = i === entries.length - 1 ? pageWidth : (entry.x + entries[i + 1].x) / 2;
    return { name: entry.name, xStart, xEnd };
  });
}

// ─── Generic row parser ──────────────────────────────────────

function isDateLike(str: string): boolean {
  return /^\d{1,2}[\/\-\.\s]/.test(str.trim()) || /^\d{4}-\d{2}-\d{2}$/.test(str.trim());
}

const SKIP_PATTERNS = [
  /^opening\s*balance/i,
  /^closing\s*balance/i,
  /^total/i,
  /^brought\s*forward/i,
  /^carried\s*forward/i,
  /^statement\s*(of|for)/i,
  /^page\s*\d/i,
  /^account\s*(number|name|type)/i,
  /^branch/i,
  /^currency/i,
  /^customer/i,
];

function shouldSkipRow(text: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(text.trim()));
}

// ─── PocketApp dedicated parser ──────────────────────────────

function parsePocketApp(pages: PdfPageData[]): PdfParsedRow[] {
  const rows: PdfParsedRow[] = [];
  
  for (const page of pages) {
    const textRows = groupIntoRows(page.items);
    
    for (let i = 0; i < textRows.length; i++) {
      const text = rowText(textRows[i]);
      
      // PocketApp rows start with optional row number then DD-MM-YYYY HH:MM:SS
      const dateMatch = text.match(/(?:^\d+\s+)?(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2}:\d{2})/);
      if (!dateMatch) continue;
      
      const dateStr = dateMatch[1]; // DD-MM-YYYY
      const parts = dateStr.split("-");
      if (parts.length !== 3) continue;
      const parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      
      // Find amount: look for number patterns like -14,500.00 or 10,000.00 near end
      // The row text format: "... description pocket_xxx_yyy -amount balance" or "... ₦ amount balance"
      // Extract all number-like tokens from the row items, using position
      const items = textRows[i];
      const sortedByX = [...items].sort((a, b) => b.x - a.x); // rightmost first
      
      // The rightmost number is balance, second rightmost is amount
      const numbers: { value: number; x: number }[] = [];
      for (const item of sortedByX) {
        const cleaned = item.text.replace(/[₦,\s]/g, "").trim();
        if (/^-?\d+(\.\d+)?$/.test(cleaned) && cleaned !== "") {
          numbers.push({ value: parseFloat(cleaned), x: item.x });
        }
      }
      
      if (numbers.length < 1) continue;
      
      let amount: number;
      let balance: number | undefined;
      let type: "credit" | "debit";
      
      if (numbers.length >= 2) {
        // Rightmost = balance, next = amount
        balance = Math.abs(numbers[0].value);
        amount = Math.abs(numbers[1].value);
        type = numbers[1].value < 0 ? "debit" : "credit";
      } else {
        amount = Math.abs(numbers[0].value);
        type = numbers[0].value < 0 ? "debit" : "credit";
      }
      
      if (amount === 0) continue;
      
      // Extract description: everything between time and pocket_/stamp_ transaction ID
      const afterTime = text.replace(/^\d+\s+/, "").replace(/^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}\s*/, "");
      // Remove am/pm prefix if present
      const cleanedDesc = afterTime.replace(/^[ap]m\s*/i, "");
      // Remove transaction ID and numbers from end
      const desc = cleanedDesc
        .replace(/\s*(pocket_\S+|stamp_\S+)\s.*$/, "")
        .replace(/\s+[\d,₦\-\.]+\s*$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      
      rows.push({
        date: parsedDate,
        description: desc || "Transaction",
        amount,
        type,
        balance,
      });
    }
  }
  
  return rows;
}

// ─── Main parse function ─────────────────────────────────────

export function parseBankStatementPdf(pages: PdfPageData[]): BankParserResult {
  const bank = detectBank(pages);
  const bankLabel = BANK_SIGNATURES.find((s) => s.id === bank)?.label || "Unknown Bank";
  console.log("[PDF Parser] Detected bank:", bank, bankLabel);
  
  // Use dedicated parser for PocketApp
  if (bank === "pocketapp") {
    const rows = parsePocketApp(pages);
    console.log(`[PDF Parser] PocketApp parser extracted ${rows.length} transactions`);
    return { bank: bankLabel, rows };
  }
  
  const allRows: PdfParsedRow[] = [];

  for (const page of pages) {
    const textRows = groupIntoRows(page.items);
    console.log(`[PDF Parser] Page ${page.pageNumber}: ${textRows.length} text rows, ${page.items.length} items`);
    
    // Log first 5 rows for debugging
    for (let r = 0; r < Math.min(textRows.length, 10); r++) {
      console.log(`[PDF Parser] Row ${r}: "${rowText(textRows[r])}"`);
    }
    
    const header = findHeaderRow(textRows);
    if (!header) {
      console.log("[PDF Parser] No header found on page", page.pageNumber);
      continue;
    }
    console.log(`[PDF Parser] Header found at row ${header.index}-${header.endIndex}: "${rowText(header.row)}"`);
    console.log("[PDF Parser] Header items:", header.row.map(i => `"${i.text}" @x=${i.x.toFixed(1)}`).join(", "));

    const cols = detectColumns(header.row);
    console.log("[PDF Parser] Detected columns:", JSON.stringify(cols, null, 2));

    // Need at least date + (debit/credit or amount)
    if (!cols.date || (!cols.debit && !cols.credit && !cols.amount)) {
      console.log("[PDF Parser] Missing required columns, skipping page", page.pageNumber);
      continue;
    }

    const boundaries = buildColumnBoundaries(cols, page.width);
    console.log("[PDF Parser] Boundaries:", boundaries.map(b => `${b.name}: ${b.xStart.toFixed(0)}-${b.xEnd.toFixed(0)}`).join(", "));

    const getBoundary = (name: string) => boundaries.find((b) => b.name === name);

    let rowsProcessed = 0;
    // Process data rows (everything after header)
    for (let i = header.endIndex + 1; i < textRows.length; i++) {
      const row = textRows[i];
      const fullText = rowText(row);

      if (shouldSkipRow(fullText)) continue;

      // Extract values by column position
      const dateBound = getBoundary("date");
      const descBound = getBoundary("description");
      const debitBound = getBoundary("debit");
      const creditBound = getBoundary("credit");
      const amountBound = getBoundary("amount");
      const balanceBound = getBoundary("balance");

      const dateStr = dateBound ? itemsInXRange(row, dateBound.xStart, dateBound.xEnd) : "";
      const desc = descBound ? itemsInXRange(row, descBound.xStart, descBound.xEnd) : "";
      const debitStr = debitBound ? itemsInXRange(row, debitBound.xStart, debitBound.xEnd) : "";
      const creditStr = creditBound ? itemsInXRange(row, creditBound.xStart, creditBound.xEnd) : "";
      const amountStr = amountBound ? itemsInXRange(row, amountBound.xStart, amountBound.xEnd) : "";
      const balanceStr = balanceBound ? itemsInXRange(row, balanceBound.xStart, balanceBound.xEnd) : "";

      if (rowsProcessed < 5) {
        console.log(`[PDF Parser] Data row ${i}: items=${row.map(it => `"${it.text}"@x=${it.x.toFixed(0)}`).join(", ")}`);
        console.log(`[PDF Parser]   date="${dateStr}" desc="${desc}" debit="${debitStr}" credit="${creditStr}" bal="${balanceStr}"`);
      }

      // Parse date
      const parsedDate = parseNigerianDate(dateStr);
      if (!parsedDate) {
        if (rowsProcessed < 5) console.log(`[PDF Parser]   -> skipped: no valid date from "${dateStr}"`);
        continue;
      }
      rowsProcessed++;

      // Parse amounts
      let amount = 0;
      let type: "credit" | "debit" = "debit";

      if (debitBound && creditBound) {
        const debitAmt = parseAmt(debitStr);
        const creditAmt = parseAmt(creditStr);
        if (creditAmt > 0) {
          amount = creditAmt;
          type = "credit";
        } else if (debitAmt > 0) {
          amount = debitAmt;
          type = "debit";
        }
      } else if (amountBound) {
        const raw = parseAmt(amountStr);
        amount = Math.abs(raw);
        type = raw >= 0 ? "credit" : "debit";
      }

      if (amount === 0) continue;

      // Use description, or fallback to full row text minus date and numbers
      const finalDesc = desc || fullText.replace(dateStr, "").replace(/[\d,]+\.\d{2}/g, "").trim();

      allRows.push({
        date: parsedDate,
        description: finalDesc,
        amount,
        type,
        balance: parseAmt(balanceStr) || undefined,
      });
    }
  }

  return { bank: bankLabel, rows: allRows };
}

/**
 * Get list of supported banks for display
 */
export function getSupportedBanks(): string[] {
  return BANK_SIGNATURES.map((s) => s.label);
}
