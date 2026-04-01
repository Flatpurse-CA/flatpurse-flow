import * as pdfjsLib from "pdfjs-dist";

// Use CDN worker for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPageData {
  pageNumber: number;
  width: number;
  height: number;
  items: PdfTextItem[];
}

export interface PdfTemplateConfig {
  /** The Y position where the header row starts (as fraction of page height, 0-1) */
  headerYStart: number;
  headerYEnd: number;
  /** Column definitions: each has a label and x-range (as fraction of page width, 0-1) */
  columns: { label: string; xStart: number; xEnd: number }[];
  /** Pattern to detect header rows on subsequent pages (first few column texts) */
  headerPattern: string[];
  /** Whether to skip rows matching certain patterns */
  skipPatterns: string[];
}

/**
 * Load a PDF file and extract text items with positions from all pages
 */
export async function extractPdfPages(file: File): Promise<PdfPageData[]> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: PdfPageData[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    const items: PdfTextItem[] = content.items
      .filter((item): item is any => "str" in item && item.str.trim() !== "")
      .map((item: any) => {
        const tx = item.transform;
        return {
          text: item.str.trim(),
          x: tx[4],
          y: viewport.height - tx[5], // Flip Y (PDF has origin at bottom-left)
          width: item.width,
          height: item.height || Math.abs(tx[3]),
        };
      });

    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      items,
    });
  }

  return pages;
}

/**
 * Render a PDF page to a canvas and return the data URL
 */
export async function renderPdfPageToImage(file: File, pageNum: number, scale = 1.5): Promise<string> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
}

/**
 * Group text items into rows by Y proximity
 */
function groupIntoRows(items: PdfTextItem[], tolerance = 4): PdfTextItem[][] {
  if (!items.length) return [];

  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: PdfTextItem[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const lastRow = rows[rows.length - 1];
    const lastY = lastRow[0].y;
    if (Math.abs(sorted[i].y - lastY) <= tolerance) {
      lastRow.push(sorted[i]);
    } else {
      rows.push([sorted[i]]);
    }
  }

  // Sort items within each row by X
  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}

/**
 * Given pages and a template config, extract structured rows
 */
export function extractRowsWithTemplate(
  pages: PdfPageData[],
  config: PdfTemplateConfig
): Record<string, string>[][] {
  const allRows: Record<string, string>[][] = [];

  for (const page of pages) {
    const { width, height, items } = page;

    // Convert fractional positions to absolute
    const headerYStartAbs = config.headerYStart * height;
    const headerYEndAbs = config.headerYEnd * height;

    // Get all text items below the header region
    const dataItems = items.filter((item) => item.y > headerYEndAbs);

    // Check if this page has a header row (for multi-page tables)
    const headerItems = items.filter(
      (item) => item.y >= headerYStartAbs && item.y <= headerYEndAbs
    );

    // If we detect a header pattern, only use items below it
    const rows = groupIntoRows(dataItems);
    const pageRows: Record<string, string>[] = [];

    for (const row of rows) {
      const record: Record<string, string> = {};
      let hasData = false;

      for (const col of config.columns) {
        const colXStart = col.xStart * width;
        const colXEnd = col.xEnd * width;

        // Find text items that fall within this column's x-range
        const colItems = row.filter(
          (item) => item.x >= colXStart - 5 && item.x + (item.width || 0) <= colXEnd + 10
        );

        const text = colItems.map((i) => i.text).join(" ").trim();
        record[col.label] = text;
        if (text) hasData = true;
      }

      // Skip empty rows or rows matching skip patterns
      if (!hasData) continue;

      const rowText = Object.values(record).join(" ").toLowerCase();
      const shouldSkip = config.skipPatterns.some((p) =>
        rowText.includes(p.toLowerCase())
      );
      if (shouldSkip) continue;

      pageRows.push(record);
    }

    allRows.push(pageRows);
  }

  return allRows;
}

/**
 * Detect likely text "lines" / rows on a page and return them grouped
 */
export function detectTextRows(page: PdfPageData): PdfTextItem[][] {
  return groupIntoRows(page.items);
}

/**
 * Try to detect columns from a header row
 */
export function detectColumnsFromRow(
  row: PdfTextItem[],
  pageWidth: number,
  nextRows: PdfTextItem[][]
): { label: string; xStart: number; xEnd: number }[] {
  if (!row.length) return [];

  const sorted = [...row].sort((a, b) => a.x - b.x);
  const columns: { label: string; xStart: number; xEnd: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const xStart = i === 0 ? 0 : (sorted[i - 1].x + (sorted[i - 1].width || 30) + item.x) / 2 / pageWidth;
    const xEnd =
      i === sorted.length - 1
        ? 1
        : (item.x + (item.width || 30) + sorted[i + 1].x) / 2 / pageWidth;

    columns.push({
      label: item.text,
      xStart,
      xEnd,
    });
  }

  return columns;
}
