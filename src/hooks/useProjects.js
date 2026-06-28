import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../context/SupabaseContext";

export function useProjects() {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["projects", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("*, created_by:users(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id,
  });
}

export function useCreateProject() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          ...project,
          organization_id: organization.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", organization?.id],
      });
    },
  });
}

export function useUpdateProject() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...project }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(project)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", organization?.id],
      });
    },
  });
}

export function useDeleteProject() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", organization?.id],
      });
    },
  });
}
