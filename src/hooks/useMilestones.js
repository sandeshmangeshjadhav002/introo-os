import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../context/SupabaseContext";

export function useMilestones(projectId) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["milestones", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("milestones")
        .select(
          `
          *, 
          assigned_user:users!milestones_assigned_to_fkey(full_name, email, avatar_url),
          project:projects(id, name, status, color)
        `,
        )
        .eq("organization_id", organization.id)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 30_000,
  });
}

export function useMilestone(milestoneId) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["milestone", organization?.id, milestoneId],
    queryFn: async () => {
      if (!organization?.id || !milestoneId) return null;

      const { data, error } = await supabase
        .from("milestones")
        .select(
          `
          *, 
          assigned_user:users!milestones_assigned_to_fkey(full_name, email, avatar_url),
          project:projects(id, name, status, color)
        `,
        )
        .eq("id", milestoneId)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id && !!milestoneId,
  });
}

export function useCreateMilestone() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestone) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { data, error } = await supabase
        .from("milestones")
        .insert({
          ...milestone,
          organization_id: organization.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id, data?.project_id],
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["milestone", organization?.id, data.id],
        });
      }
    },
  });
}

export function useUpdateMilestone() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...milestone }) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { data, error } = await supabase
        .from("milestones")
        .update({ ...milestone, updated_by: user?.id })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id, data?.project_id],
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["milestone", organization?.id, data.id],
        });
      }
    },
  });
}

export function useDeleteMilestone() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { error } = await supabase
        .from("milestones")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw new Error(error.message);
      return { id, projectId };
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id, projectId],
      });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: ["milestone", organization?.id, id],
        });
      }
    },
  });
}
