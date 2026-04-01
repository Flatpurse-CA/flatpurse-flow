import { useState, useCallback, useMemo } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { extractPdfPages } from "@/lib/pdf-parser";
import { parseBankStatementPdf, getSupportedBanks } from "@/lib/pdf-bank-parsers";
import { useCreateTransaction, useTransactions, useAccountBalance } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Upload, FileText, Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Download, ArrowRight, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatNaira } from "@/lib/currency";


// ─── Types ───────────────────────────────────────────────────

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category?: string;
  isDuplicate?: boolean;
  selected?: boolean;
  errors?: string[];
}

interface ColumnMapping {
  date: string;
  description: string;
  amount?: string;
  debit?: string;
  credit?: string;
  category?: string;
}

interface StatementImportProps {
  accountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "done";

const MAPPING_STORAGE_KEY = "manaa_import_column_mapping";

// ─── Component ───────────────────────────────────────────────

export default function StatementImport({ accountId, open, onOpenChange }: StatementImportProps) {
  const [step, setStep] = useState<Step>("upload");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: "", description: "" });
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
   const [importedCount, setImportedCount] = useState(0);
   const [skippedCount, setSkippedCount] = useState(0);
   const [fileName, setFileName] = useState("");
   const [dragging, setDragging] = useState(false);
   const [amountMode, setAmountMode] = useState<"single" | "split">("single");
   const [detectedBank, setDetectedBank] = useState("");
  

  const { data: existingTx } = useTransactions(accountId);
  const balance = useAccountBalance(accountId);
  const createTx = useCreateTransaction();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // ── Reset ──
  const resetState = () => {
    setStep("upload");
    setRawHeaders([]);
    setRawRows([]);
    setMapping({ date: "", description: "" });
    setParsed([]);
    setParsing(false);
    setImportProgress(0);
    setImportTotal(0);
    setImportedCount(0);
    setSkippedCount(0);
    setFileName("");
    setAmountMode("single");
    setDetectedBank("");
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  // ── Duplicate check ──
  const markDuplicates = useCallback(
    (rows: ParsedTransaction[]): ParsedTransaction[] => {
      try {
        if (!existingTx?.length) return rows.map((r) => ({ ...r, isDuplicate: false, selected: true }));
        return rows.map((row) => {
          const isDup = existingTx.some(
            (tx) =>
              tx.transaction_date === row.date &&
              Math.abs(Number(tx.amount) - row.amount) < 0.01 &&
              (tx.description?.toLowerCase().includes(row.description?.toLowerCase().slice(0, 20) || "") ||
                row.description?.toLowerCase().includes(tx.description?.toLowerCase().slice(0, 20) || ""))
          );
          return { ...row, isDuplicate: isDup, selected: !isDup };
        });
      } catch (err) {
        console.error("markDuplicates error:", err);
        return rows.map((r) => ({ ...r, isDuplicate: false, selected: true }));
      }
    },
    [existingTx]
  );

  // ── Saved mapping ──
  const loadSavedMapping = (headers: string[]) => {
    try {
      const saved = localStorage.getItem(MAPPING_STORAGE_KEY);
      if (!saved) return null;
      const m = JSON.parse(saved) as ColumnMapping;
      // Validate saved mapping columns still exist in headers
      const lowerHeaders = headers.map(h => h.toLowerCase().trim());
      if (m.date && !lowerHeaders.includes(m.date.toLowerCase().trim())) return null;
      if (m.description && !lowerHeaders.includes(m.description.toLowerCase().trim())) return null;
      return m;
    } catch { return null; }
  };

  const saveMapping = (m: ColumnMapping) => {
    try { localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(m)); } catch {}
  };

  // ── Auto-detect mapping ──
  const autoDetectMapping = (headers: string[]): ColumnMapping => {
    const lower = headers.map(h => h.toLowerCase().trim());
    const find = (candidates: string[]) => {
      for (const c of candidates) {
        const idx = lower.findIndex(h => h === c || h.includes(c));
        if (idx !== -1) return headers[idx];
      }
      return "";
    };

    const dateCol = find(["date", "transaction date", "trans date", "value date", "posting date"]);
    const descCol = find(["description", "narration", "details", "particulars", "remarks", "memo", "reference"]);
    const amountCol = find(["amount", "transaction amount"]);
    const debitCol = find(["debit", "withdrawal", "dr", "debit amount"]);
    const creditCol = find(["credit", "deposit", "cr", "credit amount"]);
    const catCol = find(["category", "type", "label"]);

    const hasSplit = debitCol && creditCol;

    return {
      date: dateCol,
      description: descCol,
      amount: hasSplit ? undefined : amountCol,
      debit: hasSplit ? debitCol : undefined,
      credit: hasSplit ? creditCol : undefined,
      category: catCol,
    };
  };

  // ── File Processing ──
  const processFile = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
        return;
      }

      setFileName(file.name);
      setParsing(true);
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        parseCSV(file);
      } else if (ext === "xlsx" || ext === "xls") {
        await parseExcel(file);
      } else if (ext === "pdf") {
        await parsePdfStatement(file);
      } else {
        toast({ title: "Unsupported format", description: "Please upload a CSV, Excel (.xlsx), or PDF file.", variant: "destructive" });
        setParsing(false);
      }
    } catch (err) {
      console.error("processFile error:", err);
      toast({ title: "Failed to process file", description: "Please try a different file.", variant: "destructive" });
      setParsing(false);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, string>[];
          if (!data?.length || !data[0]) {
            toast({ title: "No data found in file", variant: "destructive" });
            setParsing(false);
            return;
          }
          const headers = Object.keys(data[0]).filter(h => h && h.trim());
          if (!headers.length) {
            toast({ title: "No valid columns found", variant: "destructive" });
            setParsing(false);
            return;
          }
          setRawHeaders(headers);
          setRawRows(data);
          initMapping(headers);
        } catch (err) {
          console.error("CSV parse error:", err);
          toast({ title: "Failed to process CSV data", variant: "destructive" });
        }
        setParsing(false);
      },
      error: () => {
        toast({ title: "Failed to parse CSV", variant: "destructive" });
        setParsing(false);
      },
    });
  };

  const parseExcel = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("No worksheet found");

      const headers: string[] = [];
      const data: Record<string, string>[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value ?? "").trim();
          });
        } else {
          const rowData: Record<string, string> = {};
          row.eachCell((cell, colNumber) => {
            const key = headers[colNumber] || `col${colNumber}`;
            const raw = cell.value;
            // ExcelJS returns Date objects for date cells — convert to ISO string
            if (raw instanceof Date) {
              rowData[key] = `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`;
            } else if (typeof raw === "object" && raw !== null && "result" in raw) {
              // ExcelJS formula cell — use the result
              const result = (raw as { result: unknown }).result;
              if (result instanceof Date) {
                rowData[key] = `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, "0")}-${String(result.getDate()).padStart(2, "0")}`;
              } else {
                rowData[key] = String(result ?? "").trim();
              }
            } else if (typeof raw === "object" && raw !== null && "richText" in raw) {
              // ExcelJS rich text cell
              rowData[key] = ((raw as { richText: { text: string }[] }).richText || []).map(r => r.text).join("");
            } else {
              rowData[key] = String(raw ?? "").trim();
            }
          });
          if (Object.values(rowData).some(v => v !== "")) data.push(rowData);
        }
      });

      if (!data.length) {
        toast({ title: "No data found in file", variant: "destructive" });
        setParsing(false);
        return;
      }

      const cleanHeaders = headers.filter(Boolean);
      setRawHeaders(cleanHeaders);
      setRawRows(data);
      initMapping(cleanHeaders);
    } catch {
      toast({ title: "Failed to parse Excel file", variant: "destructive" });
    }
    setParsing(false);
  };

  const initMapping = (headers: string[]) => {
    const saved = loadSavedMapping(headers);
    const detected = autoDetectMapping(headers);
    const m = saved || detected;
    setMapping(m);
    setAmountMode(m.debit && m.credit ? "split" : "single");
    setStep("mapping");
  };

  // ── PDF Statement Parsing ──
  const parsePdfStatement = async (file: File) => {
    try {
      const pages = await extractPdfPages(file);
      if (!pages.length) {
        toast({ title: "Could not read PDF", description: "The file appears to be empty or image-based.", variant: "destructive" });
        setParsing(false);
        return;
      }

      const result = parseBankStatementPdf(pages);
      setDetectedBank(result.bank);

      if (!result.rows.length) {
        toast({
          title: "No transactions found",
          description: "Could not extract transactions from this PDF. It may be a scanned/image PDF (not supported) or an unsupported bank format.",
          variant: "destructive",
        });
        setParsing(false);
        return;
      }

      // Convert to ParsedTransaction format and skip mapping step
      const transactions: ParsedTransaction[] = result.rows.map((row) => ({
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: detectCategory(row.description, row.type),
      }));

      setParsed(markDuplicates(transactions));
      setStep("preview");
      toast({
        title: `${result.bank} statement detected`,
        description: `${result.rows.length} transactions extracted from PDF.`,
      });
    } catch (err) {
      console.error("PDF parse error:", err);
      toast({ title: "Failed to parse PDF", description: "Please try a CSV or Excel file instead.", variant: "destructive" });
    }
    setParsing(false);
  };

  // ── Smart category detection from description ──
  const detectCategory = useCallback((description: string, type: "credit" | "debit"): string | undefined => {
    if (!existingTx?.length) return undefined;
    const descLower = description.toLowerCase();

    // Build keyword map from user's existing categorized transactions
    const catKeywords: Record<string, string[]> = {};
    if (existingTx?.length) {
      for (const tx of existingTx) {
        if (!tx.category || !tx.description) continue;
        const cat = tx.category;
        if (!catKeywords[cat]) catKeywords[cat] = [];
        // Extract meaningful words (3+ chars) from past descriptions
        const words = tx.description.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
        catKeywords[cat].push(...words);
      }
    }

    // Score each category by keyword overlap
    let bestCat = "";
    let bestScore = 0;
    for (const [cat, keywords] of Object.entries(catKeywords)) {
      const uniqueKeywords = [...new Set(keywords)];
      let score = 0;
      for (const kw of uniqueKeywords) {
        if (descLower.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCat = cat;
      }
    }
    if (bestScore >= 2) return bestCat;

    // Fallback: common keyword patterns
    const patterns: [RegExp, string, "credit" | "debit" | "any"][] = [
      [/salary|payroll/i, "Salary", "credit"],
      [/transfer\s*(from|to)/i, "Moving Money", "any"],
      [/airtime|mtn|glo|airtel|9mobile/i, "Airtime", "debit"],
      [/data\s*(sub|plan|bundle)/i, "Data", "debit"],
      [/uber|bolt|taxi|transport/i, "Transport", "debit"],
      [/food|restaurant|chowdeck|glovo/i, "Food", "debit"],
      [/tithe|offering|church/i, "Tithe", "debit"],
      [/rent/i, "Rent", "debit"],
      [/subscription|netflix|spotify|apple\.com/i, "Subscriptions", "debit"],
      [/lovable|namecheap|domain|hosting/i, "Subscriptions", "debit"],
      [/stamp\s*duty/i, "Bank Charges", "debit"],
      [/charge|fee|commission/i, "Bank Charges", "debit"],
    ];
    for (const [regex, cat, txType] of patterns) {
      if (regex.test(description) && (txType === "any" || txType === type)) {
        return cat;
      }
    }

    return undefined;
  }, [existingTx]);

  // ── Apply mapping → produce parsed transactions ──
  const applyMapping = () => {
    try {
      if (!mapping.date || !mapping.description) {
        toast({ title: "Please map the required columns (Date and Description)", variant: "destructive" });
        return;
      }
      if (amountMode === "single" && !mapping.amount) {
        toast({ title: "Please map the Amount column", variant: "destructive" });
        return;
      }
      if (amountMode === "split" && (!mapping.debit || !mapping.credit)) {
        toast({ title: "Please map both Debit and Credit columns", variant: "destructive" });
        return;
      }

      saveMapping(mapping);

      const transactions: ParsedTransaction[] = rawRows
        .map((row) => {
          try {
            const dateStr = row[mapping.date] || "";
            const desc = row[mapping.description] || "";
            const errors: string[] = [];

            let amount = 0;
            let type: "credit" | "debit" = "debit";

            if (amountMode === "split" && mapping.debit && mapping.credit) {
              const debitAmt = parseNumber(row[mapping.debit]);
              const creditAmt = parseNumber(row[mapping.credit]);
              if (creditAmt > 0) {
                amount = creditAmt;
                type = "credit";
              } else if (debitAmt > 0) {
                amount = debitAmt;
                type = "debit";
              }
            } else if (mapping.amount) {
              const raw = parseNumber(row[mapping.amount]);
              amount = Math.abs(raw);
              type = raw >= 0 ? "credit" : "debit";
            }

            if (!amount || amount === 0) return null;

            const parsedDate = parseDate(dateStr);
            if (!parsedDate || parsedDate === "invalid") {
              errors.push("Invalid date");
            }
            if (!desc.trim()) {
              errors.push("Missing description");
            }

            const mappedCategory = mapping.category ? row[mapping.category] || undefined : undefined;
            const category = mappedCategory || detectCategory(desc, type);

            return {
              date: parsedDate === "invalid" ? new Date().toISOString().split("T")[0] : parsedDate,
              description: desc,
              amount,
              type,
              category,
              errors: errors.length ? errors : undefined,
            } as ParsedTransaction;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as ParsedTransaction[];

      setParsed(markDuplicates(transactions));
      setStep("preview");
    } catch (err) {
      console.error("applyMapping error:", err);
      toast({ title: "Failed to process transactions", description: "Please check your file format.", variant: "destructive" });
    }
  };

  // ── Import ──
  const selectedRows = parsed.filter(r => r.selected);

  const handleImport = async () => {
    if (!selectedRows.length) return;
    setStep("importing");
    setImportTotal(selectedRows.length);
    setImportProgress(0);

    let currentBalance = balance ?? 0;
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i];

      if (row.isDuplicate) {
        skipped++;
        setImportProgress(i + 1);
        continue;
      }

      const txType = row.type === "credit" ? "cash_in" : "cash_out";
      currentBalance = txType === "cash_in" ? currentBalance + row.amount : currentBalance - row.amount;

      try {
        await createTx.mutateAsync({
          account_id: accountId,
          type: txType,
          amount: row.amount,
          category: row.category || (txType === "cash_in" ? "Other Income" : "Other Expense"),
          description: row.description,
          customer_name: "",
          transaction_date: row.date,
          balance_after: currentBalance,
        });
        imported++;
      } catch (err) {
        console.error("Failed to import row:", err);
        skipped++;
      }
      setImportProgress(i + 1);
    }

    setImportedCount(imported);
    setSkippedCount(skipped);
    setStep("done");
    toast({ title: `${imported} transactions imported!` });
  };

  // ── Toggle helpers ──
  const toggleRow = (index: number) => {
    setParsed(prev => prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)));
  };
  const toggleAll = (selected: boolean) => {
    setParsed(prev => prev.map(r => ({ ...r, selected })));
  };

  // ── Template download ──
  const downloadTemplate = () => {
    const csv = "Date,Description,Amount,Category\n2025-01-15,Monthly salary,50000,Sales\n2025-01-16,Office rent,-25000,Rent\n2025-01-17,Client payment,15000,Services\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Manaa_Import_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Stats ──
  const duplicateCount = parsed.filter(r => r.isDuplicate).length;
  const errorCount = parsed.filter(r => r.errors?.length).length;

  // ─── Mapping field renderer ───
  const MappingSelect = ({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <Select value={value || "_none"} onValueChange={(v) => onChange(v === "_none" ? "" : v)}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Select column..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">— Not mapped —</SelectItem>
          {rawHeaders.map(h => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────

  const content = (
    <div className={`overflow-x-hidden ${step === "preview" ? "flex flex-col flex-1 min-h-0" : "space-y-4"}`}>

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
            onDrop={async (e) => {
              e.preventDefault(); e.stopPropagation(); setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) await processFile(file);
            }}
          >
            {parsing ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Reading file...</p>
              </div>
            ) : (
              <label className="cursor-pointer space-y-3 block">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {dragging ? "Drop your file here" : "Drag & drop or click to upload"}
                  </p>
                   <p className="text-xs text-muted-foreground mt-1">CSV, Excel (.xlsx), or PDF · Max 10MB</p>
                   <p className="text-[10px] text-muted-foreground">PDF supported: GTBank, First Bank, Access, UBA, Zenith, PocketApp</p>
                </div>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await processFile(file);
                  }}
                  className="hidden"
                />
                <Button variant="outline" size="sm" className="pointer-events-none">
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Choose File
                </Button>
              </label>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Must have columns for date, description, and amount</p>
              <p>• Duplicates are auto-detected and skipped</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5 mr-1" /> Template
            </Button>
          </div>
        </div>
      )}


      {/* ── Step 2: Column Mapping ── */}
      {step === "mapping" && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">{rawRows.length} rows detected · Map your columns below</p>
          </div>

          {/* Preview first 5 rows */}
          <div className="border rounded-lg overflow-x-auto max-h-36">
            <table className="text-[10px] w-full">
              <thead>
                <tr className="bg-muted/50">
                  {rawHeaders.map(h => (
                    <th key={h} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-border/50">
                    {rawHeaders.map(h => (
                      <td key={h} className="px-2 py-1 whitespace-nowrap text-muted-foreground truncate max-w-[120px]">{row[h] || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={amountMode === "single" ? "default" : "outline"}
              size="sm"
              className="text-xs flex-1"
              onClick={() => { setAmountMode("single"); setMapping(m => ({ ...m, debit: undefined, credit: undefined })); }}
            >
              Single Amount
            </Button>
            <Button
              variant={amountMode === "split" ? "default" : "outline"}
              size="sm"
              className="text-xs flex-1"
              onClick={() => { setAmountMode("split"); setMapping(m => ({ ...m, amount: undefined })); }}
            >
              Debit + Credit
            </Button>
          </div>

          {/* Mapping dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <MappingSelect label="Date" value={mapping.date} onChange={v => setMapping(m => ({ ...m, date: v }))} required />
            <MappingSelect label="Description" value={mapping.description} onChange={v => setMapping(m => ({ ...m, description: v }))} required />
            {amountMode === "single" ? (
              <MappingSelect label="Amount" value={mapping.amount || ""} onChange={v => setMapping(m => ({ ...m, amount: v }))} required />
            ) : (
              <>
                <MappingSelect label="Debit (Expense)" value={mapping.debit || ""} onChange={v => setMapping(m => ({ ...m, debit: v }))} required />
                <MappingSelect label="Credit (Income)" value={mapping.credit || ""} onChange={v => setMapping(m => ({ ...m, credit: v }))} required />
              </>
            )}
            <MappingSelect label="Category (optional)" value={mapping.category || ""} onChange={v => setMapping(m => ({ ...m, category: v }))} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" onClick={resetState}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
            </Button>
            <Button size="sm" onClick={applyMapping}>
              Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview & Validate ── */}
      {step === "preview" && (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <p className="text-sm font-medium">{fileName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {detectedBank && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{detectedBank}</Badge>
                )}
                <p className="text-xs text-muted-foreground">{parsed.length} transactions</p>
                {duplicateCount > 0 && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-600 border-amber-400">
                    {duplicateCount} duplicates
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-destructive border-destructive">
                    {errorCount} errors
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleAll(true)}>All</Button>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleAll(false)}>None</Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg divide-y divide-border mt-3">
            {parsed.map((row, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm ${
                  row.isDuplicate ? "bg-muted/50 opacity-60" : ""
                } ${row.selected ? "" : "opacity-50"} ${row.errors?.length ? "bg-destructive/5" : ""}`}
              >
                <Checkbox checked={row.selected} onCheckedChange={() => toggleRow(i)} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium truncate">{row.description || "—"}</p>
                    {row.category && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">{row.category}</Badge>
                    )}
                    {row.isDuplicate && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 text-amber-600 border-amber-400">Duplicate</Badge>
                    )}
                    {row.errors?.map((e, j) => (
                      <Badge key={j} variant="outline" className="text-[9px] px-1 py-0 shrink-0 text-destructive border-destructive">
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" />{e}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{row.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xs font-medium flex items-center gap-1 ${
                    row.type === "credit" ? "text-cash-in" : "text-cash-out"
                  }`}>
                    {row.type === "credit" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatNaira(row.amount)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {row.type === "credit" ? "Cash In" : "Cash Out"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setStep(detectedBank ? "upload" : "mapping")}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> {detectedBank ? "Back" : "Remap"}
            </Button>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">{selectedRows.length} selected</p>
              <Button size="sm" onClick={handleImport} disabled={!selectedRows.length} className="text-xs">
                Import {selectedRows.length}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Importing ── */}
      {step === "importing" && (
        <div className="py-8 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <div>
            <p className="text-sm font-medium">Importing transactions...</p>
            <p className="text-xs text-muted-foreground mt-1">
              {importProgress} of {importTotal} completed
            </p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(importProgress / importTotal) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ── Step 5: Done ── */}
      {step === "done" && (
        <div className="py-8 text-center space-y-4">
          <CheckCircle className="w-10 h-10 mx-auto text-cash-in" />
          <div>
            <p className="text-sm font-medium">Import complete!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Imported {importedCount} transactions
            </p>
            {skippedCount > 0 && (
              <p className="text-xs text-amber-600 mt-0.5">{skippedCount} duplicates/errors skipped</p>
            )}
          </div>
          <Button size="sm" onClick={() => handleClose(false)}>Done</Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose} direction="bottom">
        <DrawerContent className="max-h-[90vh] left-0 right-0">
          <DrawerHeader className="pb-2 pt-2">
            <DrawerTitle className="text-[15px]">Import Transactions</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 flex-1 min-h-0 overflow-hidden flex flex-col">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function parseNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9.\-]/g, "");
  return parseFloat(cleaned) || 0;
}

function parseDate(str: string): string {
  if (!str) return "invalid";
  // Strip time portions like " 00:00:00" or "T00:00:00" 
  let trimmed = str.trim().replace(/[\sT]\d{2}:\d{2}(:\d{2})?.*$/, "").trim();

  // Helper to format as YYYY-MM-DD
  const fmt = (y: number, m: number, d: number): string => {
    if (y < 1970 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return "invalid";
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  // Handle Excel serial date numbers (e.g. 45678)
  const asNum = Number(trimmed);
  if (!isNaN(asNum) && asNum > 30000 && asNum < 60000) {
    // Excel serial: days since 1900-01-01 (with the 1900 leap year bug)
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + asNum * 86400000);
    if (!isNaN(d.getTime())) {
      return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
  }

  // Month name lookup for formats like "11-Jan-2026"
  const monthNames: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    january: 1, february: 2, march: 3, april: 4, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };

  // Try DD-MMM-YYYY or DD/MMM/YYYY (e.g. "11-Jan-2026", "11 January 2026")
  const mMatch = trimmed.match(/^(\d{1,2})[\/\-\.\s]+([A-Za-z]{3,9})[\/\-\.\s,]+(\d{2,4})$/);
  if (mMatch) {
    const day = Number(mMatch[1]);
    const mon = monthNames[mMatch[2].toLowerCase().slice(0, 3)];
    let year = Number(mMatch[3]);
    if (year < 100) year += 2000;
    if (mon && day >= 1 && day <= 31) return fmt(year, mon, day);
  }

  // Try MMM-DD-YYYY or "Jan 11, 2026"
  const mMatch2 = trimmed.match(/^([A-Za-z]{3,9})[\/\-\.\s]+(\d{1,2})[\/\-\.\s,]+(\d{2,4})$/);
  if (mMatch2) {
    const mon = monthNames[mMatch2[1].toLowerCase().slice(0, 3)];
    const day = Number(mMatch2[2]);
    let year = Number(mMatch2[3]);
    if (year < 100) year += 2000;
    if (mon && day >= 1 && day <= 31) return fmt(year, mon, day);
  }

  // Try date parts split by / - .
  const parts = trimmed.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(p => Number(p.trim()));
    if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
      // YYYY-MM-DD or YYYY/MM/DD (most unambiguous, check first)
      if (a > 100 && b >= 1 && b <= 12 && c >= 1 && c <= 31) {
        return fmt(a, b, c);
      }
      // DD/MM/YYYY — prioritize this for Nigerian bank statements
      if (c > 100 && a >= 1 && a <= 31 && b >= 1 && b <= 12) {
        return fmt(c, b, a);
      }
      // MM/DD/YYYY fallback (only if month <= 12 and day > 12 disambiguates)
      if (c > 100 && a >= 1 && a <= 12 && b > 12 && b <= 31) {
        return fmt(c, a, b);
      }
      // DD/MM/YY
      if (c < 100 && a >= 1 && a <= 31 && b >= 1 && b <= 12) {
        return fmt(c + 2000, b, a);
      }
    }
  }

  // Try ISO / standard JS-parseable as last resort
  const d = new Date(trimmed);
  if (!isNaN(d.getTime()) && d.getFullYear() >= 1970 && d.getFullYear() <= 2100) {
    return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  console.warn("[StatementImport] Could not parse date:", JSON.stringify(trimmed));
  return "invalid";
}
