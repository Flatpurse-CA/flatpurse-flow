import { useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useLeadForms, useCreateLeadForm, useDeleteLeadForm, useUpdateLeadForm, type LeadForm } from "@/hooks/useLeadForms";
import {
  Plus, Trash2, Copy, ExternalLink, FileText, Link2, Zap,
  ChevronLeft, Type, AlignLeft, Mail, Phone, Hash, List,
  Globe, Calendar, SeparatorHorizontal, GripVertical, X,
  Check, ArrowUp, ArrowDown, Settings2, Eye, Sparkles, LayoutList,
  Pencil, Users, Inbox, BarChart3, UserCheck, FileCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreateContact } from "@/hooks/useData";

/* ─── types ─── */
interface FormFieldDef {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface SectionBreak {
  id: string;
  type: "section_break";
  label: string;
}

type FormItem = (FormFieldDef & { type: string }) | SectionBreak;

function isSection(item: FormItem): item is SectionBreak {
  return item.type === "section_break";
}

const FIELD_PALETTE = [
  { type: "text", label: "Short Text", icon: Type, category: "General" },
  { type: "textarea", label: "Long Text", icon: AlignLeft, category: "General" },
  { type: "email", label: "Email", icon: Mail, category: "General" },
  { type: "tel", label: "Phone", icon: Phone, category: "General" },
  { type: "number", label: "Number", icon: Hash, category: "General" },
  { type: "select", label: "Dropdown", icon: List, category: "General" },
  { type: "url", label: "Website URL", icon: Globe, category: "Advanced" },
  { type: "date", label: "Date", icon: Calendar, category: "Advanced" },
  { type: "section_break", label: "Section Break", icon: SeparatorHorizontal, category: "Layout" },
];

const QUICK_ADD_TEMPLATES = [
  { name: "Walk-in Customer", icon: "🚶", fields: { status: "lead", notes: "Walk-in customer" } },
  { name: "Phone Inquiry", icon: "📞", fields: { status: "lead", notes: "Phone inquiry" } },
  { name: "WhatsApp Lead", icon: "💬", fields: { status: "lead", notes: "WhatsApp lead" } },
  { name: "Referral", icon: "🤝", fields: { status: "lead", notes: "Referral" } },
];

function generateId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

type FormMode = "simple" | "advanced";

const SIMPLE_FIELDS: FormFieldDef[] = [
  { id: "s_name", name: "name", label: "Full Name", type: "text", required: true },
  { id: "s_email", name: "email", label: "Email", type: "email", required: false },
  { id: "s_phone", name: "phone", label: "Phone", type: "tel", required: false },
];

/* ─── Form Builder ─── */
function FormBuilder({
  onClose,
  businessId,
  editingForm,
}: {
  onClose: () => void;
  businessId: string;
  editingForm?: any;
}) {
  const createForm = useCreateLeadForm();
  const updateForm = useUpdateLeadForm();
  const { toast } = useToast();

  const detectMode = (): FormMode => {
    if (!editingForm?.fields?.length) return "simple";
    const fields = editingForm.fields as any[];
    const hasSections = fields.some((f: any) => f.section);
    const hasNonBasic = fields.some(
      (f: any) => !["name", "email", "phone"].includes(f.name)
    );
    return hasSections || hasNonBasic ? "advanced" : "simple";
  };

  const [mode, setMode] = useState<FormMode>(editingForm ? detectMode() : "simple");
  const [step, setStep] = useState<"choose" | "build">(editingForm ? "build" : "choose");
  const [title, setTitle] = useState(editingForm?.title || "");
  const [description, setDescription] = useState(editingForm?.description || "");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const initItems = (): FormItem[] => {
    if (!editingForm?.fields?.length) {
      return SIMPLE_FIELDS.map((f) => ({ ...f, id: generateId() }));
    }
    const items: FormItem[] = [];
    let lastSection = "";
    for (const f of editingForm.fields as any[]) {
      if (f.section && f.section !== lastSection) {
        items.push({ id: generateId(), type: "section_break", label: f.section });
        lastSection = f.section;
      }
      items.push({
        id: f.id || generateId(),
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.options,
        placeholder: f.placeholder,
      });
    }
    return items;
  };

  const [items, setItems] = useState<FormItem[]>(initItems);

  const addFieldFromPalette = (fieldType: string) => {
    const id = generateId();
    if (fieldType === "section_break") {
      setItems([...items, { id, type: "section_break", label: "New Section" }]);
      setSelectedIdx(items.length);
    } else {
      const paletteItem = FIELD_PALETTE.find((p) => p.type === fieldType);
      setItems([
        ...items,
        {
          id,
          name: `field_${id}`,
          label: paletteItem?.label || "",
          type: fieldType,
          required: false,
          options: fieldType === "select" ? ["Option 1", "Option 2"] : undefined,
        } as FormItem,
      ]);
      setSelectedIdx(items.length);
    }
  };

  const updateItem = (idx: number, updates: Partial<FormItem>) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], ...updates } as FormItem;
    if (!isSection(copy[idx]) && (updates as any).label !== undefined) {
      const field = copy[idx] as FormFieldDef;
      field.name =
        field.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/(^_|_$)/g, "") || `field_${idx}`;
    }
    setItems(copy);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    setItems(copy);
    setSelectedIdx(newIdx);
  };

  const duplicateItem = (idx: number) => {
    const item = items[idx];
    const newItem = { ...item, id: generateId() };
    if (!isSection(newItem)) (newItem as FormFieldDef).name += "_copy";
    const copy = [...items];
    copy.splice(idx + 1, 0, newItem);
    setItems(copy);
    setSelectedIdx(idx + 1);
  };

  const toSaveFields = () => {
    if (mode === "simple") {
      return SIMPLE_FIELDS.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required,
      }));
    }
    let currentSection = "";
    const fields: any[] = [];
    for (const item of items) {
      if (isSection(item)) {
        currentSection = item.label;
      } else {
        const field = item as FormFieldDef;
        if (field.label.trim()) {
          fields.push({
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            ...(field.options?.length ? { options: field.options } : {}),
            ...(currentSection ? { section: currentSection } : {}),
          });
        }
      }
    }
    return fields;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a form title", variant: "destructive" });
      return;
    }
    const cleanFields = toSaveFields();
    if (cleanFields.length === 0) {
      toast({ title: "Add at least one question", variant: "destructive" });
      return;
    }
    try {
      if (editingForm) {
        await updateForm.mutateAsync({
          id: editingForm.id,
          title: title.trim(),
          description: description.trim(),
          fields: cleanFields,
        });
        toast({ title: "Form updated!" });
      } else {
        const slug =
          title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
          "-" + Date.now().toString(36);
        await createForm.mutateAsync({
          business_id: businessId,
          title: title.trim(),
          slug,
          description: description.trim(),
          fields: cleanFields,
        });
        toast({ title: "Form created! Share the link to start capturing leads." });
      }
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const selectedItem = selectedIdx !== null ? items[selectedIdx] : null;

  /* ── Step 1: Choose form type ── */
  if (step === "choose") {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] bg-background flex flex-col" style={{ margin: 0, padding: 0 }}>
        <div className="flex items-center border-b border-border px-4 py-2.5 bg-card shrink-0">
          <Button size="sm" variant="ghost" onClick={onClose} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-semibold">Create a Lead Form</h1>
              <p className="text-sm text-muted-foreground">
                Choose the type of form you want to create
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Simple */}
              <button
                onClick={() => {
                  setMode("simple");
                  setItems(SIMPLE_FIELDS.map((f) => ({ ...f, id: generateId() })));
                  setStep("build");
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Simple Contact Form</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Quick form with Name, Email & Phone. Perfect for basic lead capture.
                  </p>
                </div>
              </button>
              {/* Advanced */}
              <button
                onClick={() => {
                  setMode("advanced");
                  setItems([]);
                  setStep("build");
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <LayoutList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Advanced Form</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Custom questions with sections, dropdowns, and more field types.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 2: Build ── */

  /* Preview */
  const renderPreview = () => {
    const previewFields = mode === "simple" ? SIMPLE_FIELDS : items;
    return (
      <div className="max-w-md mx-auto space-y-4 p-6">
        <div className="text-center space-y-1.5">
          <div
            className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center mb-2 bg-primary"
          >
            <span className="text-lg font-bold text-primary-foreground">
              {(title || "F")[0]?.toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg font-semibold">{title || "Untitled Form"}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {previewFields.map((item) => {
          if (isSection(item)) {
            return (
              <div key={item.id} className="pt-3">
                <div className="border-b border-border pb-1.5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</h3>
                </div>
              </div>
            );
          }
          const f = item as FormFieldDef;
          return (
            <div key={f.id} className="space-y-1.5">
              <Label className="text-xs">{f.label}{f.required && " *"}</Label>
              {f.type === "textarea" ? (
                <Textarea disabled placeholder={f.placeholder || f.label} className="min-h-[60px] opacity-50" />
              ) : f.type === "select" ? (
                <div className="h-9 border border-input rounded-md bg-background px-3 flex items-center text-xs text-muted-foreground opacity-50">
                  Select {f.label}...
                </div>
              ) : (
                <Input disabled type={f.type} placeholder={f.placeholder || f.label} className="h-9 opacity-50" />
              )}
            </div>
          );
        })}
        <Button disabled className="w-full">Submit</Button>
      </div>
    );
  };

  /* Simple mode canvas */
  const renderSimpleCanvas = () => (
    <div className="flex-1 overflow-y-auto bg-secondary/30">
      <div className="max-w-lg mx-auto py-10 px-4 space-y-8">
        {/* Title & Description */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Form Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Contact Us, Get a Quote..."
              className="h-11 text-base font-medium border-border bg-card"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Subtitle / Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell visitors what this form is about..."
              className="min-h-[70px] text-sm border-border bg-card"
            />
          </div>
        </div>

        {/* Simple form fields preview */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Form Fields (auto-included)
          </p>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {SIMPLE_FIELDS.map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                  {f.type === "text" && <Type className="w-3.5 h-3.5 text-muted-foreground" />}
                  {f.type === "email" && <Mail className="w-3.5 h-3.5 text-muted-foreground" />}
                  {f.type === "tel" && <Phone className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.required ? "Required" : "Optional"}</p>
                </div>
                <Badge variant="secondary" className="text-[9px]">
                  {f.type === "text" ? "Text" : f.type === "email" ? "Email" : "Phone"}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Need more fields?{" "}
            <button
              onClick={() => {
                setMode("advanced");
                setItems(SIMPLE_FIELDS.map((f) => ({ ...f, id: generateId() })));
              }}
              className="text-primary hover:underline font-medium"
            >
              Switch to Advanced
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  /* Advanced mode canvas */
  const renderAdvancedCanvas = () => (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Field palette */}
      <div className="w-52 border-r border-border bg-card overflow-y-auto shrink-0 p-3 space-y-3 hidden md:block">
        {(["General", "Advanced", "Layout"] as const).map((cat) => (
          <div key={cat} className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {cat === "General" ? "General Fields" : cat === "Advanced" ? "Advanced Fields" : "Layout"}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {FIELD_PALETTE.filter((f) => f.category === cat).map((f) => (
                <button
                  key={f.type}
                  onClick={() => addFieldFromPalette(f.type)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all text-center group"
                >
                  <f.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[9px] text-muted-foreground group-hover:text-foreground leading-tight">
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 overflow-y-auto bg-secondary/30 p-4 md:p-6">
        <div className="max-w-xl mx-auto space-y-3">
          {/* Inline title/description */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 mb-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Form title..."
              className="h-10 text-base font-semibold border-none shadow-none px-0 focus-visible:ring-0 bg-transparent"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a subtitle or description (optional)..."
              className="min-h-[40px] text-xs border-none shadow-none px-0 focus-visible:ring-0 bg-transparent resize-none"
            />
          </div>

          {/* Mobile: field chips */}
          <div className="md:hidden flex flex-wrap gap-1 mb-3">
            {FIELD_PALETTE.map((f) => (
              <button
                key={f.type}
                onClick={() => addFieldFromPalette(f.type)}
                className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-card text-[10px] hover:bg-muted"
              >
                <f.icon className="w-3 h-3" />
                {f.label}
              </button>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Click a field from the sidebar to add it</p>
              <p className="text-xs mt-1">Start building your form by adding fields</p>
            </div>
          )}

          {items.map((item, idx) => {
            const isSelected = selectedIdx === idx;

            if (isSection(item)) {
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIdx(idx)}
                  className={`group relative flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30 bg-card/50"
                  }`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                  <SeparatorHorizontal className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  {isSelected ? (
                    <Input
                      value={item.label}
                      onChange={(e) => updateItem(idx, { label: e.target.value })}
                      className="h-7 text-xs font-medium border-none shadow-none p-0 focus-visible:ring-0 bg-transparent"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); moveItem(idx, -1); }} className="p-1 rounded hover:bg-muted"><ArrowUp className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveItem(idx, 1); }} className="p-1 rounded hover:bg-muted"><ArrowDown className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeItem(idx); }} className="p-1 rounded hover:bg-destructive/10"><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
                  </div>
                </div>
              );
            }

            const field = item as FormFieldDef;
            const paletteMatch = FIELD_PALETTE.find((p) => p.type === field.type);
            const FieldIcon = paletteMatch?.icon || Type;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedIdx(idx)}
                className={`group rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-card shadow-sm"
                    : "border-transparent hover:border-muted-foreground/20 bg-card"
                }`}
              >
                <div className="flex items-start gap-2 p-3">
                  <div className="flex items-center gap-1 pt-0.5 shrink-0">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/20" />
                    <FieldIcon className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs font-medium truncate">
                        {field.label || "Untitled Field"}
                      </span>
                      {field.required && <span className="text-destructive text-xs">*</span>}
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto shrink-0">
                        {paletteMatch?.label || field.type}
                      </Badge>
                    </div>
                    {field.type === "textarea" ? (
                      <div className="h-10 border border-input rounded-md bg-muted/20" />
                    ) : field.type === "select" ? (
                      <div className="h-8 border border-input rounded-md bg-muted/20 flex items-center px-2 text-[10px] text-muted-foreground">
                        {field.options?.slice(0, 3).join(", ") || "No options"}
                        {(field.options?.length || 0) > 3 && "..."}
                      </div>
                    ) : (
                      <div className="h-8 border border-input rounded-md bg-muted/20 flex items-center px-2 text-[10px] text-muted-foreground">
                        {field.placeholder || field.label || "Type here..."}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); moveItem(idx, -1); }} className="p-0.5 rounded hover:bg-muted"><ArrowUp className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveItem(idx, 1); }} className="p-0.5 rounded hover:bg-muted"><ArrowDown className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateItem(idx); }} className="p-0.5 rounded hover:bg-muted"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeItem(idx); }} className="p-0.5 rounded hover:bg-destructive/10"><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Field settings */}
      {selectedItem && !isSection(selectedItem) && (
        <div className="w-60 border-l border-border bg-card overflow-y-auto shrink-0 p-4 space-y-4 hidden md:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold">Field Settings</p>
            </div>
            <button onClick={() => setSelectedIdx(null)} className="p-1 rounded hover:bg-muted">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-muted-foreground">Label</Label>
              <Input
                value={(selectedItem as FormFieldDef).label}
                onChange={(e) => updateItem(selectedIdx!, { label: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-muted-foreground">Placeholder</Label>
              <Input
                value={(selectedItem as FormFieldDef).placeholder || ""}
                onChange={(e) => updateItem(selectedIdx!, { placeholder: e.target.value } as any)}
                placeholder="Optional..."
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-medium text-muted-foreground">Required</Label>
              <Switch
                checked={(selectedItem as FormFieldDef).required}
                onCheckedChange={(v) => updateItem(selectedIdx!, { required: v })}
                className="scale-75"
              />
            </div>

            {(selectedItem as FormFieldDef).type === "select" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground">Options</Label>
                {((selectedItem as FormFieldDef).options || []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex gap-1">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...((selectedItem as FormFieldDef).options || [])];
                        newOpts[optIdx] = e.target.value;
                        updateItem(selectedIdx!, { options: newOpts });
                      }}
                      className="h-7 text-xs flex-1"
                    />
                    <button
                      onClick={() => {
                        const newOpts = ((selectedItem as FormFieldDef).options || []).filter((_, i) => i !== optIdx);
                        updateItem(selectedIdx!, { options: newOpts });
                      }}
                      className="p-1 rounded hover:bg-destructive/10"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] w-full"
                  onClick={() => {
                    const opts = (selectedItem as FormFieldDef).options || [];
                    updateItem(selectedIdx!, { options: [...opts, `Option ${opts.length + 1}`] });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-destructive hover:text-destructive w-full justify-start"
                onClick={() => removeItem(selectedIdx!)}
              >
                <Trash2 className="w-3 h-3 mr-1.5" /> Delete Field
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] bg-background flex flex-col" style={{ margin: 0, padding: 0 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <Badge variant="outline" className="text-[9px] capitalize">{mode}</Badge>
          {mode === "advanced" && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {items.filter((i) => !isSection(i)).length} fields
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showPreview ? "secondary" : "ghost"}
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createForm.isPending || updateForm.isPending}
            className="gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            {editingForm ? "Save" : "Create"}
          </Button>
        </div>
      </div>

      {showPreview ? (
        <div className="flex-1 overflow-auto bg-secondary/30 py-8">
          {renderPreview()}
        </div>
      ) : mode === "simple" ? (
        renderSimpleCanvas()
      ) : (
        renderAdvancedCanvas()
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function CRMForms() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: forms, isLoading } = useLeadForms(businessId);
  const deleteForm = useDeleteLeadForm();
  const updateForm = useUpdateLeadForm();
  const createContact = useCreateContact();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTemplate, setQuickAddTemplate] = useState<typeof QUICK_ADD_TEMPLATES[0] | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<any>(null);

  // Fetch all contacts that came from forms (any status — to track conversions)
  const formSlugs = useMemo(() => forms?.map((f) => f.slug) || [], [forms]);
  const { data: allFormContacts } = useQuery({
    queryKey: ["form-contacts", businessId, formSlugs],
    enabled: !!businessId && formSlugs.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email, phone, company, notes, tags, status, created_at")
        .eq("business_id", businessId!)
        .contains("tags", ["form-lead"]);
      if (error) throw error;
      return data || [];
    },
  });

  const getSubmissionCount = (slug: string) => {
    return allFormContacts?.filter((s) => s.tags?.includes(slug)).length || 0;
  };

  const getFormSubmissions = (slug: string) => {
    return allFormContacts?.filter((s) => s.tags?.includes(slug)) || [];
  };

  // Analytics
  const totalForms = forms?.length || 0;
  const totalSubmissions = allFormContacts?.length || 0;
  const totalConverted = allFormContacts?.filter((c) => c.status === "contact").length || 0;
  const conversionRate = totalSubmissions > 0 ? Math.round((totalConverted / totalSubmissions) * 100) : 0;

  const getFormUrl = (slug: string) => {
    const origin = window.location.origin;
    // If on a lovable preview/dev URL, use the published domain instead
    if (origin.includes("lovable.app") && origin.includes("preview")) {
      return `https://manaa.lovable.app/f/${slug}`;
    }
    return `${origin}/f/${slug}`;
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(getFormUrl(slug));
    toast({ title: "Link copied!" });
  };

  const handleQuickAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quickAddTemplate || !businessId) return;
    const fd = new FormData(e.currentTarget);
    try {
      await createContact.mutateAsync({
        business_id: businessId,
        name: (fd.get("name") as string).trim(),
        email: (fd.get("email") as string || "").trim(),
        phone: (fd.get("phone") as string || "").trim(),
        status: quickAddTemplate.fields.status,
        notes: quickAddTemplate.fields.notes,
        tags: [quickAddTemplate.name.toLowerCase().replace(/\s+/g, "-")],
      });
      setQuickAddOpen(false);
      setQuickAddTemplate(null);
      toast({ title: `Lead added from ${quickAddTemplate.name}!` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleFormActive = async (formId: string, currentlyActive: boolean) => {
    try {
      await updateForm.mutateAsync({ id: formId, is_active: !currentlyActive });
      toast({ title: currentlyActive ? "Form deactivated" : "Form activated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Submissions viewer
  if (viewingSubmissions) {
    const subs = getFormSubmissions(viewingSubmissions.slug);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setViewingSubmissions(null)} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back to Forms
          </Button>
          <div className="h-5 w-px bg-border" />
          <h3 className="text-sm font-medium">{viewingSubmissions.title} — Submissions</h3>
          <Badge variant="secondary" className="text-[9px]">{subs.length}</Badge>
        </div>

        {subs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No submissions yet. Share your form link to start capturing leads.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => copyLink(viewingSubmissions.slug)}>
                <Copy className="w-3 h-3 mr-1.5" /> Copy Form Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {subs.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {s.email && <span className="text-xs text-muted-foreground">{s.email}</span>}
                        {s.phone && <span className="text-xs text-muted-foreground">{s.phone}</span>}
                        {s.company && <span className="text-xs text-muted-foreground">{s.company}</span>}
                      </div>
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.notes}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (builderOpen && businessId) {
    return (
      <FormBuilder
        key={editingForm?.id || "new"}
        onClose={() => { setBuilderOpen(false); setEditingForm(null); }}
        businessId={businessId}
        editingForm={editingForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalForms}</p>
              <p className="text-[10px] text-muted-foreground">Total Forms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Inbox className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalSubmissions}</p>
              <p className="text-[10px] text-muted-foreground">Total Submissions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalConverted}</p>
              <p className="text-[10px] text-muted-foreground">Converted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{conversionRate}%</p>
              <p className="text-[10px] text-muted-foreground">Conversion Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Quick-Add Templates */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Quick Add Lead</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_ADD_TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => { setQuickAddTemplate(t); setQuickAddOpen(true); }}
              className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left"
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-xs font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {quickAddTemplate && <span className="text-lg">{quickAddTemplate.icon}</span>}
              {quickAddTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input name="name" required placeholder="Customer name" className="h-9" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input name="phone" placeholder="+234..." className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input name="email" type="email" placeholder="email@..." className="h-9" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" size="sm" disabled={createContact.isPending}>Add Lead</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shareable Forms */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Lead Capture Forms</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setEditingForm(null); setBuilderOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Form
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : !forms?.length ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No forms yet. Create one to start capturing leads online.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {forms.map((f) => (
              <Card key={f.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{f.title}</p>
                        <Badge variant={f.is_active ? "default" : "secondary"} className="text-[9px] px-1.5">
                          {f.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5">
                          {(f.fields as any[])?.length || 0} fields
                        </Badge>
                        <button
                          onClick={() => setViewingSubmissions(f)}
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          <Users className="w-3 h-3" />
                          {getSubmissionCount(f.slug)} submissions
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {getFormUrl(f.slug)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={f.is_active}
                        onCheckedChange={() => toggleFormActive(f.id, f.is_active)}
                        className="scale-75"
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingForm(f); setBuilderOpen(true); }} title="Edit form">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(f.slug)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                        <a href={`/f/${f.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteForm.mutateAsync({ id: f.id, businessId: businessId! })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
