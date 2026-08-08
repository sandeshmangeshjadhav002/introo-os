import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../context/SupabaseContext";

export function useDeals({
  includeArchived = false,
  includeDeleted = false,
  pipelineId,
} = {}) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: [
      "deals",
      organization?.id,
      includeArchived,
      includeDeleted,
      pipelineId,
    ],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("deals")
        .select(
          `
          *,
          stage:deal_stages(*),
          pipeline:pipelines(*),
          contact:contacts(first_name, last_name, email),
          company:companies(name),
          assigned_to:users(full_name, email)
        `,
        )
        .order("created_at", { ascending: false });

      if (!includeDeleted) query = query.is("deleted_at", null);
      if (!includeArchived) query = query.eq("is_archived", false);
      if (pipelineId) query = query.eq("pipeline_id", pipelineId);

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useDeal(id) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["deal", id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data, error } = await supabase
        .from("deals")
        .select(
          `
          *,
          stage:deal_stages(*),
          pipeline:pipelines(*),
          contact:contacts(*),
          company:companies(*),
          assigned_to:users(full_name, email),
          activities(*),
          notes(*),
          stage_history:stage_history(*, changed_by:users(full_name, email))
        `,
        )
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function usePipelines() {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["pipelines", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("pipelines")
        .select("*, stages:deal_stages(*)")
        .is("deleted_at", null)
        .order("position", { ascending: true });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useDealStages({ pipelineId } = {}) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["dealStages", organization?.id, pipelineId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("deal_stages")
        .select("*")
        .order("position", { ascending: true });

      if (pipelineId) query = query.eq("pipeline_id", pipelineId);

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useCreateDeal() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deal) => {
      const { data, error } = await supabase
        .from("deals")
        .insert({
          ...deal,
          organization_id: organization.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Create stage history
      if (deal.stage_id) {
        await supabase.from("stage_history").insert({
          organization_id: organization.id,
          deal_id: data.id,
          to_stage_id: deal.stage_id,
          changed_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", organization?.id] });
    },
  });
}

export function useUpdateDeal() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...deal }) => {
      // Get current deal to check if stage changed
      const { data: currentDeal } = await supabase
        .from("deals")
        .select("stage_id")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("deals")
        .update({
          ...deal,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Create stage history if stage changed
      if (deal.stage_id && deal.stage_id !== currentDeal?.stage_id) {
        await supabase.from("stage_history").insert({
          organization_id: organization.id,
          deal_id: id,
          from_stage_id: currentDeal?.stage_id,
          to_stage_id: deal.stage_id,
          changed_by: user?.id,
        });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals", organization?.id] });
      queryClient.invalidateQueries({
        queryKey: ["deal", data.id, organization?.id],
      });
    },
  });
}

export function useArchiveDeal() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from("deals")
        .update({ is_archived: true, updated_by: user?.id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals", organization?.id] });
      queryClient.invalidateQueries({
        queryKey: ["deal", data.id, organization?.id],
      });
    },
  });
}

export function useRestoreDeal() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from("deals")
        .update({ is_archived: false, updated_by: user?.id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals", organization?.id] });
      queryClient.invalidateQueries({
        queryKey: ["deal", data.id, organization?.id],
      });
    },
  });
}

export function useDeleteDeal() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("deals")
        .update({ deleted_at: new Date().toISOString(), updated_by: user?.id })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", organization?.id] });
    },
  });
}

export function useFavoriteDeal() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isFavorite }) => {
      const { data, error } = await supabase
        .from("deals")
        .update({ is_favorite: isFavorite, updated_by: user?.id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals", organization?.id] });
      queryClient.invalidateQueries({
        queryKey: ["deal", data.id, organization?.id],
      });
    },
  });
}
