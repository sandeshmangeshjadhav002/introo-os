import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../context/SupabaseContext";

export function useSprints(projectId) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["sprints", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("sprints")
        .select(
          `
          *,
          project:projects!inner(name, organization_id)
        `,
        )
        .eq("projects.organization_id", organization.id)
        .order("start_date", { ascending: true });

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

export function useCreateSprint() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sprint) => {
      const { data, error } = await supabase
        .from("sprints")
        .insert(sprint)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id],
      });
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ["sprints", organization?.id, data.project_id],
        });
      }
    },
  });
}

export function useUpdateSprint() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...sprint }) => {
      const { data, error } = await supabase
        .from("sprints")
        .update(sprint)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id],
      });
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: ["sprints", organization?.id, data.project_id],
        });
      }
    },
  });
}

export function useDeleteSprint() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      const { error } = await supabase.from("sprints").delete().eq("id", id);

      if (error) throw new Error(error.message);
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id],
      });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["sprints", organization?.id, projectId],
        });
      }
    },
  });
}
