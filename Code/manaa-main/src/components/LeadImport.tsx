import { useState, useCallback } from "react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { useCreateContact } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Upload, FileText, Loader2, CheckCircle, AlertCircle, Download, ArrowRight, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface LeadImportProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedLead {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  selected: boolean;
  errors?: string[];
}

interface ColumnMapping {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "done";

const MAPPING_KEY = "manaa_lead_import_mapping";

export default function LeadImport({ businessId, open, onOpenChange }: LeadImportProps) {
  const [step, setStep] = useState<Step>("upload");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ name: "", email: "", phone: "", company: "", notes: "" });
  const [parsed, setParsed] = useState<ParsedLead[]>([]);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const createContact = useCreateContact();
  const { toast } = useToast();

  const resetState = () => {
    setStep("upload");
    setRawHeaders([]);
    setRawRows([]);
    setMapping({ name: "", email: "", phone: "", company: "", notes: "" });
    setParsed([]);
    setParsing(false);
    setFileName("");
    setImportProgress(0);
    setImportTotal(0);
    setImportedCount(0);
    setSkippedCount(0);
  };

  const handleClose = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  // ── Template download ──
  const downloadTemplate = () => {
    const csv = "Name,Email,Phone,Company,Notes\nJane Doe,jane@example.com,+234 812 345 6789,Acme Corp,Met at Lagos tech meetup\nJohn Smith,john@smith.co,+234 901 234 5678,Smith & Co,Referral from Ibrahim\nAda Okafor,ada@startup.ng,,TechStart,Interested in premium plan\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Manaa_Lead_Import_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Auto-detect mapping ──
  const autoDetect = (headers: string[]): ColumnMapping => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
    const normalized = headers.map(normalize);

    const find = (candidates: string[]) => {
      // Pass 1: exact match after normalization
      for (const c of candidates) {
        const idx = normalized.findIndex(h => h === c);
        if (idx !== -1) return headers[idx];
      }
      // Pass 2: header IS one of the candidate words (short headers only, <= 3 words)
      for (const c of candidates) {
        const idx = normalized.findIndex(h => {
          const words = h.split(/\s+/);
          return words.length <= 3 && words.includes(c);
        });
        if (idx !== -1) return headers[idx];
      }
      // Pass 3: header starts with candidate
      for (const c of candidates) {
        const idx = normalized.findIndex(h => h.startsWith(c + " ") || h === c);
        if (idx !== -1) return headers[idx];
      }
      return "";
    };

    return {
      name: find(["full name", "contact name", "lead name", "name", "customer name", "customer"]),
      email: find(["email", "email address", "e mail", "mail"]),
      phone: find(["phone", "phone number", "telephone", "mobile", "mobile number", "tel", "cell"]),
      company: find(["company", "company name", "organization", "organisation", "firm"]),
      notes: find(["notes", "note", "comment", "comments", "remarks", "source"]),
    };
  };

  const loadSavedMapping = (headers: string[]): ColumnMapping | null => {
    try {
      const saved = localStorage.getItem(MAPPING_KEY);
      if (!saved) return null;
      const m = JSON.parse(saved) as ColumnMapping;
      const lowerHeaders = headers.map(h => h.toLowerCase().trim());
      if (m.name && !lowerHeaders.includes(m.name.toLowerCase().trim())) return null;
      return m;
    } catch { return null; }
  };

  const initMapping = (headers: string[]) => {
    const saved = loadSavedMapping(headers);
    setMapping(saved || autoDetect(headers));
    setStep("mapping");
  };

  // ── File Processing ──
  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setParsing(true);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (r) => {
          try {
            const data = r.data as Record<string, string>[];
            if (!data?.length || !data[0]) { toast({ title: "No data found", variant: "destructive" }); setParsing(false); return; }
            const headers = Object.keys(data[0]).filter(h => h && h.trim());
            if (!headers.length) { toast({ title: "No valid columns found", variant: "destructive" }); setParsing(false); return; }
            setRawHeaders(headers);
            setRawRows(data);
            initMapping(headers);
          } catch (err) {
            console.error("Lead CSV parse error:", err);
            toast({ title: "Failed to process CSV", variant: "destructive" });
          }
          setParsing(false);
        },
        error: () => { toast({ title: "Failed to parse CSV", variant: "destructive" }); setParsing(false); },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      try {
        const buf = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        const ws = wb.worksheets[0];
        if (!ws) throw new Error();
        const headers: string[] = [];
        const data: Record<string, string>[] = [];
        ws.eachRow((row, n) => {
          if (n === 1) { row.eachCell((c, i) => { headers[i] = String(c.value ?? "").trim(); }); }
          else {
            const r: Record<string, string> = {};
            row.eachCell((c, i) => { r[headers[i] || `col${i}`] = String(c.value ?? "").trim(); });
            if (Object.values(r).some(v => v)) data.push(r);
          }
        });
        if (!data.length) { toast({ title: "No data found", variant: "destructive" }); setParsing(false); return; }
        setRawHeaders(headers.filter(Boolean));
        setRawRows(data);
        initMapping(headers.filter(Boolean));
      } catch { toast({ title: "Failed to parse Excel", variant: "destructive" }); }
      setParsing(false);
    } else {
      toast({ title: "Use CSV or Excel (.xlsx)", variant: "destructive" });
      setParsing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Apply mapping ──
  const applyMapping = () => {
    if (!mapping.name) {
      toast({ title: "Name column is required", variant: "destructive" });
      return;
    }
    try { localStorage.setItem(MAPPING_KEY, JSON.stringify(mapping)); } catch {}

    const leads: ParsedLead[] = rawRows
      .map(row => {
        const name = (row[mapping.name] || "").trim();
        if (!name) return null;
        const errors: string[] = [];
        const email = (mapping.email ? row[mapping.email] : "") || "";
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email");
        return {
          name,
          email,
          phone: (mapping.phone ? row[mapping.phone] : "") || "",
          company: (mapping.company ? row[mapping.company] : "") || "",
          notes: (mapping.notes ? row[mapping.notes] : "") || "",
          selected: true,
          errors: errors.length ? errors : undefined,
        };
      })
      .filter(Boolean) as ParsedLead[];

    setParsed(leads);
    setStep("preview");
  };

  // ── Import ──
  const selectedRows = parsed.filter(r => r.selected);

  const handleImport = async () => {
    if (!selectedRows.length) return;
    setStep("importing");
    setImportTotal(selectedRows.length);
    let imported = 0, skipped = 0;

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i];
      try {
        await createContact.mutateAsync({
          business_id: businessId,
          name: row.name,
          email: row.email,
          phone: row.phone,
          company: row.company,
          notes: row.notes,
          status: "lead",
        });
        imported++;
      } catch { skipped++; }
      setImportProgress(i + 1);
    }
    setImportedCount(imported);
    setSkippedCount(skipped);
    setStep("done");
    toast({ title: `${imported} leads imported!` });
  };

  const toggleRow = (i: number) => setParsed(p => p.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const toggleAll = (v: boolean) => setParsed(p => p.map(r => ({ ...r, selected: v })));

  // ── Mapping select ──
  const MappingSelect = ({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) => (
    <div className="grid grid-cols-[4.5rem_1fr] items-center gap-2 min-w-0">
      <label className="text-xs font-medium text-foreground whitespace-nowrap">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <Select value={value || "__none__"} onValueChange={v => onChange(v === "__none__" ? "" : v)}>
        <SelectTrigger className="h-9 text-xs w-full [&>span]:truncate [&>span]:block [&>span]:max-w-[calc(100%-1.5rem)]"><SelectValue /></SelectTrigger>
        <SelectContent className="max-w-[min(300px,calc(100vw-3rem))]">
          <SelectItem value="__none__">— Skip —</SelectItem>
          {rawHeaders.map(h => (
            <SelectItem key={h} value={h}>
              <span className="truncate block">{h}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const progressPercent = importTotal > 0 ? Math.round((importProgress / importTotal) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg w-full max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 box-border">
        <DialogHeader>
          <DialogTitle className="text-base">
            {step === "upload" && "Import Leads"}
            {step === "mapping" && "Map Columns"}
            {step === "preview" && "Preview Leads"}
            {step === "importing" && "Importing..."}
            {step === "done" && "Import Complete"}
          </DialogTitle>
        </DialogHeader>

        {/* ── Upload ── */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("lead-file-input")?.click()}
            >
              {parsing ? (
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drop your CSV or Excel file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </>
              )}
              <input id="lead-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5" /> Download Lead Import Template
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Template includes: Name, Email, Phone, Company, Notes
            </p>
          </div>
        )}

        {/* ── Mapping ── */}
        {step === "mapping" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 px-1">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate min-w-0">{fileName}</span>
              <Badge variant="secondary" className="text-[10px] shrink-0">{rawRows.length} rows</Badge>
            </div>
            <div className="space-y-3">
              <MappingSelect label="Name" value={mapping.name} onChange={v => setMapping(m => ({ ...m, name: v }))} required />
              <MappingSelect label="Email" value={mapping.email} onChange={v => setMapping(m => ({ ...m, email: v }))} />
              <MappingSelect label="Phone" value={mapping.phone} onChange={v => setMapping(m => ({ ...m, phone: v }))} />
              <MappingSelect label="Company" value={mapping.company} onChange={v => setMapping(m => ({ ...m, company: v }))} />
              <MappingSelect label="Notes" value={mapping.notes} onChange={v => setMapping(m => ({ ...m, notes: v }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setStep("upload")} className="gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </Button>
              <Button size="sm" onClick={applyMapping} className="flex-1 gap-1">
                Preview <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Preview ── */}
        {step === "preview" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{selectedRows.length} of {parsed.length} selected</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => toggleAll(true)}>All</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => toggleAll(false)}>None</Button>
              </div>
            </div>
            <div className="max-h-[40vh] overflow-y-auto border rounded-lg divide-y divide-border">
              {parsed.map((lead, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                  <Checkbox checked={lead.selected} onCheckedChange={() => toggleRow(i)} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{lead.name}</p>
                    <div className="flex flex-wrap gap-x-3 text-muted-foreground mt-0.5">
                      {lead.email && <span>{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                      {lead.company && <span>{lead.company}</span>}
                    </div>
                    {lead.errors?.map((e, j) => (
                      <span key={j} className="text-destructive flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> {e}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("mapping")} className="gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </Button>
              <Button size="sm" onClick={handleImport} disabled={!selectedRows.length} className="flex-1">
                Import {selectedRows.length} Lead{selectedRows.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {/* ── Importing ── */}
        {step === "importing" && (
          <div className="py-8 space-y-4 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="text-sm font-medium">Importing leads...</p>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">{importProgress} of {importTotal}</p>
          </div>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="py-8 space-y-4 text-center">
            <CheckCircle className="w-10 h-10 mx-auto text-green-500" />
            <div>
              <p className="text-sm font-medium">{importedCount} leads imported</p>
              {skippedCount > 0 && <p className="text-xs text-muted-foreground mt-1">{skippedCount} skipped</p>}
            </div>
            <Button size="sm" onClick={() => handleClose(false)}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
