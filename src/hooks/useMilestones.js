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
          assigned_to:users(full_name, email),
          project:projects!inner(name, organization_id)
        `,
        )
        .eq("projects.organization_id", organization.id)
        .order("due_date", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useCreateMilestone() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestone) => {
      const { data, error } = await supabase
        .from("milestones")
        .insert(milestone)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id],
      });
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ["milestones", organization?.id, data.project_id],
        });
      }
    },
  });
}

export function useUpdateMilestone() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...milestone }) => {
      const { data, error } = await supabase
        .from("milestones")
        .update(milestone)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id],
      });
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ["milestones", organization?.id, data.project_id],
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
      const { error } = await supabase.from("milestones").delete().eq("id", id);

      if (error) throw new Error(error.message);
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", organization?.id],
      });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["milestones", organization?.id, projectId],
        });
      }
    },
  });
}
