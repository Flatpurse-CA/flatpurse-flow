import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, ArrowRight, Loader2, FileText, Trash2, Check, Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  extractPdfPages, renderPdfPageToImage, detectTextRows, detectColumnsFromRow,
  extractRowsWithTemplate,
  type PdfPageData, type PdfTemplateConfig,
} from "@/lib/pdf-parser";
import { usePdfTemplates, useCreatePdfTemplate, useDeletePdfTemplate, type PdfTemplate } from "@/hooks/usePdfTemplates";
import type { ParsedTransaction } from "@/components/StatementImport";

type WizardStep = "select-template" | "pick-header" | "confirm-columns" | "extracting";

interface PdfTemplateWizardProps {
  file: File;
  onComplete: (transactions: ParsedTransaction[], templateName: string) => void;
  onBack: () => void;
}

export default function PdfTemplateWizard({ file, onComplete, onBack }: PdfTemplateWizardProps) {
  const [step, setStep] = useState<WizardStep>("select-template");
  const [pages, setPages] = useState<PdfPageData[]>([]);
  const [pageImage, setPageImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<{ items: any[]; yCenter: number }[]>([]);
  const [selectedHeaderIdx, setSelectedHeaderIdx] = useState<number | null>(null);
  const [columns, setColumns] = useState<{ label: string; xStart: number; xEnd: number }[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const { data: templates = [], isLoading: templatesLoading } = usePdfTemplates();
  const createTemplate = useCreatePdfTemplate();
  const deleteTemplate = useDeletePdfTemplate();
  const { toast } = useToast();
  const imgRef = useRef<HTMLImageElement>(null);

  // Load PDF on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [pagesData, image] = await Promise.all([
          extractPdfPages(file),
          renderPdfPageToImage(file, 1, 1.5),
        ]);
        if (cancelled) return;
        setPages(pagesData);
        setPageImage(image);

        if (pagesData[0]) {
          const textRows = detectTextRows(pagesData[0]);
          setRows(
            textRows.map((r) => ({
              items: r,
              yCenter: r.reduce((s, i) => s + i.y, 0) / r.length,
            }))
          );
        }
      } catch (err) {
        console.error("PDF load error:", err);
        toast({ title: "Failed to read PDF", description: "The file may be damaged or password-protected.", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  // Use existing template
  const applyExistingTemplate = useCallback(async (template: PdfTemplate) => {
    if (!pages.length) return;
    setStep("extracting");

    try {
      const allPageRows = extractRowsWithTemplate(pages, template.config);
      const flat = allPageRows.flat();
      const columnLabels = template.config.columns.map((c) => c.label.toLowerCase());

      const transactions = parseExtractedRows(flat, columnLabels);
      onComplete(transactions, template.name);
    } catch (err) {
      console.error("Template extraction error:", err);
      toast({ title: "Extraction failed", description: "Could not parse transactions with this template.", variant: "destructive" });
      setStep("select-template");
    }
  }, [pages, onComplete, toast]);

  // When user picks a header row
  const handleHeaderSelect = (idx: number) => {
    setSelectedHeaderIdx(idx);
    const row = rows[idx];
    if (!row || !pages[0]) return;

    const detected = detectColumnsFromRow(row.items, pages[0].width, rows.slice(idx + 1).map((r) => r.items));
    setColumns(detected);
    setStep("confirm-columns");
  };

  // Save template and extract
  const handleSaveAndExtract = async () => {
    if (!templateName.trim()) {
      toast({ title: "Enter a template name", variant: "destructive" });
      return;
    }
    if (!columns.length || !pages[0] || selectedHeaderIdx === null) return;

    const headerRow = rows[selectedHeaderIdx];
    const nextRow = rows[selectedHeaderIdx + 1];

    const config: PdfTemplateConfig = {
      headerYStart: (headerRow.yCenter - 10) / pages[0].height,
      headerYEnd: nextRow ? (headerRow.yCenter + nextRow.yCenter) / 2 / pages[0].height : (headerRow.yCenter + 15) / pages[0].height,
      columns,
      headerPattern: headerRow.items.slice(0, 3).map((i) => i.text),
      skipPatterns: ["total", "opening balance", "closing balance", "statement", "page"],
    };

    setStep("extracting");

    try {
      await createTemplate.mutateAsync({ name: templateName, config });

      const allPageRows = extractRowsWithTemplate(pages, config);
      const flat = allPageRows.flat();
      const columnLabels = columns.map((c) => c.label.toLowerCase());

      const transactions = parseExtractedRows(flat, columnLabels);
      onComplete(transactions, templateName);
    } catch (err) {
      console.error("Save/extract error:", err);
      toast({ title: "Failed to save template", variant: "destructive" });
      setStep("confirm-columns");
    }
  };

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast({ title: "Template deleted" });
      if (selectedTemplateId === id) setSelectedTemplateId("");
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Reading PDF...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Select or create template */}
      {step === "select-template" && (
        <>
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{pages.length} page{pages.length !== 1 ? "s" : ""} · {rows.length} text rows detected</p>
          </div>

          {templates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saved Templates</p>
              <div className="space-y-1.5">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplateId === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedTemplateId(t.id)}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.config.columns.length} columns</p>
                    </div>
                    {selectedTemplateId === t.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                    <Button
                      variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>

              {selectedTemplateId && (
                <Button
                  size="sm" className="w-full text-xs"
                  onClick={() => {
                    const t = templates.find((x) => x.id === selectedTemplateId);
                    if (t) applyExistingTemplate(t);
                  }}
                >
                  Use Template <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}

              <div className="relative flex items-center gap-2 py-1">
                <div className="flex-1 border-t border-border" />
                <span className="text-[10px] text-muted-foreground uppercase">or</span>
                <div className="flex-1 border-t border-border" />
              </div>
            </div>
          )}

          <Button
            variant="outline" size="sm" className="w-full text-xs"
            onClick={() => setStep("pick-header")}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Create New Template
          </Button>

          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
            </Button>
          </div>
        </>
      )}

      {/* Step 2: Pick header row */}
      {step === "pick-header" && (
        <>
          <div>
            <p className="text-sm font-medium">Step 1: Select the header row</p>
            <p className="text-xs text-muted-foreground">Tap the row that contains column headers (Date, Description, Amount, etc.)</p>
          </div>

          <div className="border rounded-lg overflow-y-auto max-h-[50vh]">
            {/* Show page image with overlaid clickable rows */}
            <div className="relative">
              {pageImage && (
                <img ref={imgRef} src={pageImage} alt="PDF page 1" className="w-full opacity-30" />
              )}
              {/* Row list overlay */}
              <div className="absolute inset-0 flex flex-col">
                {rows.map((row, i) => {
                  const yPercent = (row.yCenter / (pages[0]?.height || 1)) * 100;
                  const text = row.items.map((it) => it.text).join("  |  ");
                  return null; // We use list view below instead
                })}
              </div>
            </div>

            {/* List view of detected rows */}
            <div className="divide-y divide-border">
              {rows.map((row, i) => {
                const text = row.items.map((it) => it.text).join("  ·  ");
                const isSelected = selectedHeaderIdx === i;
                return (
                  <div
                    key={i}
                    onClick={() => handleHeaderSelect(i)}
                    className={`px-3 py-2 text-[11px] cursor-pointer transition-colors truncate ${
                      isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="text-[9px] text-muted-foreground/50 mr-2">#{i + 1}</span>
                    {text}
                  </div>
                );
              })}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => { setStep("select-template"); setSelectedHeaderIdx(null); }}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>
        </>
      )}

      {/* Step 3: Confirm columns */}
      {step === "confirm-columns" && (
        <>
          <div>
            <p className="text-sm font-medium">Step 2: Confirm detected columns</p>
            <p className="text-xs text-muted-foreground">Rename or remove columns. Then name and save this template.</p>
          </div>

          <div className="space-y-2">
            {columns.map((col, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] shrink-0 w-6 justify-center">{i + 1}</Badge>
                <Input
                  value={col.label}
                  onChange={(e) => {
                    const updated = [...columns];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setColumns(updated);
                  }}
                  className="h-8 text-xs flex-1"
                  placeholder="Column name"
                />
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0"
                  onClick={() => setColumns(columns.filter((_, j) => j !== i))}
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          {/* Preview rows using these columns */}
          {selectedHeaderIdx !== null && pages[0] && (
            <div className="border rounded-lg overflow-x-auto max-h-36">
              <table className="text-[10px] w-full">
                <thead>
                  <tr className="bg-muted/50">
                    {columns.map((c, i) => (
                      <th key={i} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(selectedHeaderIdx + 1, selectedHeaderIdx + 6).map((row, ri) => (
                    <tr key={ri} className="border-t border-border/50">
                      {columns.map((col, ci) => {
                        const colXStart = col.xStart * pages[0].width;
                        const colXEnd = col.xEnd * pages[0].width;
                        const items = row.items.filter(
                          (item) => item.x >= colXStart - 5 && item.x + (item.width || 0) <= colXEnd + 10
                        );
                        const text = items.map((i) => i.text).join(" ");
                        return (
                          <td key={ci} className="px-2 py-1 whitespace-nowrap text-muted-foreground truncate max-w-[120px]">
                            {text || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-2">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name (e.g. GTBank)"
              className="h-9 text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" size="sm" onClick={() => { setStep("pick-header"); setColumns([]); }}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAndExtract}
              disabled={!templateName.trim() || !columns.length || createTemplate.isPending}
            >
              {createTemplate.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Save & Extract <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </>
      )}

      {/* Step 4: Extracting */}
      {step === "extracting" && (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Extracting transactions...</p>
        </div>
      )}
    </div>
  );
}

// ── Parse extracted row records into ParsedTransaction format ──
function parseExtractedRows(
  rows: Record<string, string>[],
  columnLabels: string[]
): ParsedTransaction[] {
  // Try to find date, description, amount/debit/credit columns
  const dateCol = columnLabels.find((c) => /date|trans.*date|value.*date|posting/i.test(c)) || columnLabels[0];
  const descCol = columnLabels.find((c) => /desc|narr|detail|particular|remark|memo|ref/i.test(c)) || columnLabels[1];
  const amountCol = columnLabels.find((c) => /^amount$|transaction.*amount/i.test(c));
  const debitCol = columnLabels.find((c) => /debit|withdrawal|dr/i.test(c));
  const creditCol = columnLabels.find((c) => /credit|deposit|cr/i.test(c));

  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    // Find values case-insensitively
    const getValue = (colName: string) => {
      const key = Object.keys(row).find((k) => k.toLowerCase() === colName);
      return key ? row[key] : "";
    };

    const dateStr = getValue(dateCol);
    const desc = getValue(descCol);

    let amount = 0;
    let type: "credit" | "debit" = "debit";

    if (debitCol && creditCol) {
      const dr = parseFloat((getValue(debitCol) || "0").replace(/[^0-9.\-]/g, "")) || 0;
      const cr = parseFloat((getValue(creditCol) || "0").replace(/[^0-9.\-]/g, "")) || 0;
      if (cr > 0) {
        amount = cr;
        type = "credit";
      } else if (dr > 0) {
        amount = dr;
        type = "debit";
      }
    } else if (amountCol) {
      const raw = parseFloat((getValue(amountCol) || "0").replace(/[^0-9.\-]/g, "")) || 0;
      amount = Math.abs(raw);
      type = raw >= 0 ? "credit" : "debit";
    } else {
      // Fallback: try numeric columns
      for (const label of columnLabels) {
        if (label === dateCol || label === descCol) continue;
        const val = parseFloat((getValue(label) || "0").replace(/[^0-9.\-]/g, "")) || 0;
        if (val > 0) {
          amount = val;
          type = /credit|cr|deposit/i.test(label) ? "credit" : "debit";
          break;
        }
      }
    }

    if (!amount || !desc?.trim()) continue;

    // Parse date
    const parsed = parseDateFlexible(dateStr);

    transactions.push({
      date: parsed,
      description: desc.trim(),
      amount,
      type,
      selected: true,
    });
  }

  return transactions;
}

function parseDateFlexible(str: string): string {
  if (!str) return new Date().toISOString().split("T")[0];
  const trimmed = str.trim().replace(/[\sT]\d{2}:\d{2}(:\d{2})?.*$/, "").trim();
  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const parts = trimmed.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => Number(p.trim()));
    if (!isNaN(a) && !isNaN(b) && !isNaN(c)) {
      if (a > 100 && b >= 1 && b <= 12 && c >= 1 && c <= 31) return fmt(a, b, c);
      if (c > 100 && a >= 1 && a <= 31 && b >= 1 && b <= 12) return fmt(c, b, a);
      if (c < 100 && a >= 1 && a <= 31 && b >= 1 && b <= 12) return fmt(c + 2000, b, a);
    }
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return new Date().toISOString().split("T")[0];
}
