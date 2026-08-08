import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../context/SupabaseContext";

export function useActivities({
  dealId,
  contactId,
  companyId,
  leadId,
  includeArchived = false,
  includeDeleted = false,
} = {}) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: [
      "activities",
      organization?.id,
      dealId,
      contactId,
      companyId,
      leadId,
      includeArchived,
      includeDeleted,
    ],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("activities")
        .select(
          "*, created_by:users(full_name, email), assigned_to:users(full_name, email)",
        )
        .eq("organization_id", organization.id);

      if (!includeDeleted) query = query.is("deleted_at", null);
      if (!includeArchived) query = query.eq("is_archived", false);

      if (dealId) query = query.eq("deal_id", dealId);
      if (contactId) query = query.eq("contact_id", contactId);
      if (companyId) query = query.eq("company_id", companyId);
      if (leadId) query = query.eq("lead_id", leadId);

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useActivity(id) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["activity", id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data, error } = await supabase
        .from("activities")
        .select(
          "*, created_by:users(full_name, email), assigned_to:users(full_name, email)",
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

export function useCreateActivity() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity) => {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          ...activity,
          organization_id: organization.id,
          created_by: user?.id,
          user_id: user?.id,
          action: activity?.action || activity?.type,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateActivity() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...activity }) => {
      const { data, error } = await supabase
        .from("activities")
        .update({
          ...activity,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({
        queryKey: ["activity", data.id, organization?.id],
      });
    },
  });
}

export function useArchiveActivity() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from("activities")
        .update({ is_archived: true, updated_by: user?.id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({
        queryKey: ["activity", data.id, organization?.id],
      });
    },
  });
}

export function useRestoreActivity() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from("activities")
        .update({ is_archived: false, updated_by: user?.id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({
        queryKey: ["activity", data.id, organization?.id],
      });
    },
  });
}

export function useDeleteActivity() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("activities")
        .update({ deleted_at: new Date().toISOString(), updated_by: user?.id })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
