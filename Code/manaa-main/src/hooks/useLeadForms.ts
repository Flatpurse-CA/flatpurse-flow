import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeadForm {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  description: string;
  fields: any[];
  is_active: boolean;
  theme_color: string;
  success_message: string;
  created_at: string;
  updated_at: string;
}

export function useLeadForms(businessId: string | undefined) {
  return useQuery({
    queryKey: ["lead-forms", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_forms" as any)
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LeadForm[];
    },
  });
}

export function useCreateLeadForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: {
      business_id: string;
      title: string;
      slug: string;
      description?: string;
      fields?: any[];
    }) => {
      const { data, error } = await supabase
        .from("lead_forms" as any)
        .insert(vals)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["lead-forms", vars.business_id] }),
  });
}

export function useUpdateLeadForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: { id: string; is_active?: boolean; title?: string; description?: string; fields?: any[] }) => {
      const { data, error } = await supabase
        .from("lead_forms" as any)
        .update(vals)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as LeadForm;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["lead-forms", data.business_id] }),
  });
}

export function useDeleteLeadForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("lead_forms" as any).delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["lead-forms", businessId] }),
  });
}
