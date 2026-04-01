import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PdfTemplateConfig } from "@/lib/pdf-parser";

export interface PdfTemplate {
  id: string;
  user_id: string;
  name: string;
  config: PdfTemplateConfig;
  created_at: string;
  updated_at: string;
}

export function usePdfTemplates() {
  return useQuery({
    queryKey: ["pdf_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_templates" as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as unknown as PdfTemplate[];
    },
  });
}

export function useCreatePdfTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: { name: string; config: PdfTemplateConfig }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("pdf_templates" as any)
        .insert({ user_id: user.id, name: template.name, config: template.config as any })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PdfTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf_templates"] }),
  });
}

export function useUpdatePdfTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, config }: { id: string; name: string; config: PdfTemplateConfig }) => {
      const { error } = await supabase
        .from("pdf_templates" as any)
        .update({ name, config: config as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf_templates"] }),
  });
}

export function useDeletePdfTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pdf_templates" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf_templates"] }),
  });
}
