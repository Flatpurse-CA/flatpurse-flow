import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import manaaLogo from "@/assets/manaa-logo-icon.svg";

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  section?: string;
}

interface LeadFormData {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  theme_color: string;
  success_message: string;
}

export default function LeadForm() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<LeadFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectValues, setSelectValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("lead_forms")
        .select("id, title, description, fields, theme_color, success_message")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) {
        setError("Form not found or no longer active.");
      } else {
        setForm({
          ...data,
          fields: data.fields as unknown as FormField[],
          description: data.description || "",
          theme_color: data.theme_color || "#6366f1",
          success_message: data.success_message || "Thank you! We'll be in touch soon.",
        });
      }
      setLoading(false);
    })();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!slug) return;
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const fields: Record<string, string> = {};
    formData.forEach((v, k) => { fields[k] = String(v); });
    // merge select values
    Object.entries(selectValues).forEach(([k, v]) => { fields[k] = v; });

    try {
      const res = await supabase.functions.invoke("public-lead-submit", {
        body: { slug, fields },
      });
      if (res.error) throw new Error(res.error.message || "Submission failed");
      const data = res.data as { success?: boolean; error?: string };
      if (data?.error) throw new Error(data.error);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">{error || "Form not found."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: form.theme_color }} />
            <h2 className="text-lg font-semibold">{form.success_message}</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "textarea":
        return (
          <div key={field.name} className="space-y-1.5">
            <Label className="text-xs">{field.label}{field.required && " *"}</Label>
            <Textarea name={field.name} required={field.required} placeholder={field.label} className="min-h-[60px]" />
          </div>
        );
      case "select":
        return (
          <div key={field.name} className="space-y-1.5">
            <Label className="text-xs">{field.label}{field.required && " *"}</Label>
            <Select
              value={selectValues[field.name] || ""}
              onValueChange={(v) => setSelectValues((p) => ({ ...p, [field.name]: v }))}
              required={field.required}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return (
          <div key={field.name} className="space-y-1.5">
            <Label className="text-xs">{field.label}{field.required && " *"}</Label>
            <Input name={field.name} type={field.type} required={field.required} placeholder={field.label} className="h-9" />
          </div>
        );
    }
  };

  // Group fields by section
  const sections: string[] = [];
  const sectionMap: Record<string, FormField[]> = {};
  const unsectioned: FormField[] = [];

  form.fields.forEach((f) => {
    if (f.section) {
      if (!sections.includes(f.section)) sections.push(f.section);
      if (!sectionMap[f.section]) sectionMap[f.section] = [];
      sectionMap[f.section].push(f);
    } else {
      unsectioned.push(f);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center space-y-1">
              <div
                className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center mb-2"
                style={{ backgroundColor: form.theme_color }}
              >
                <span className="text-lg font-bold" style={{ color: "#fff" }}>
                  {form.title[0]?.toUpperCase()}
                </span>
              </div>
              <h1 className="text-lg font-semibold">{form.title}</h1>
              {form.description && (
                <p className="text-xs text-muted-foreground">{form.description}</p>
              )}
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-md p-2 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Unsectioned fields */}
              {unsectioned.length > 0 && (
                <div className="space-y-3">
                  {unsectioned.map(renderField)}
                </div>
              )}

              {/* Sectioned fields */}
              {sections.map((sectionName) => (
                <div key={sectionName} className="space-y-3">
                  <div className="border-b border-border pb-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {sectionName}
                    </h3>
                  </div>
                  {sectionMap[sectionName].map(renderField)}
                </div>
              ))}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
                style={{ backgroundColor: form.theme_color }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <img src={manaaLogo} alt="Manaa" className="w-3 h-3" />
          <span>Powered by Manaa</span>
        </div>
      </div>
    </div>
  );
}
