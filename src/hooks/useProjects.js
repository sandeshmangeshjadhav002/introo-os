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
        .select(
          `
          *,
          owner:users!projects_owner_id_fkey(full_name, email),
          created_by_user:users!projects_created_by_fkey(full_name, email)
        `,
        )
        .eq("organization_id", organization.id)
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 30_000,
  });
}

export function useAllProjects() {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["all-projects", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          owner:users!projects_owner_id_fkey(full_name, email),
          created_by_user:users!projects_created_by_fkey(full_name, email)
        `,
        )
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!organization?.id,
  });
}

export function useProject(projectId) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["project", organization?.id, projectId],
    queryFn: async () => {
      if (!organization?.id || !projectId) return null;

      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          owner:users!projects_owner_id_fkey(full_name, email),
          created_by_user:users!projects_created_by_fkey(full_name, email),
          project_members:project_members(*, user:users(full_name, email, avatar_url))
        `,
        )
        .eq("id", projectId)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id && !!projectId,
  });
}

export function useCreateProject() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project) => {
      if (!organization?.id) throw new Error("No organization selected");
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .insert({
          ...project,
          organization_id: organization.id,
          created_by: user?.id,
          owner_id: project?.owner_id || user?.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-projects", organization?.id],
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["project", organization?.id, data.id],
        });
      }
    },
  });
}

export function useUpdateProject() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...project }) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { data, error } = await supabase
        .from("projects")
        .update({ ...project, updated_by: user?.id })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-projects", organization?.id],
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["project", organization?.id, data.id],
        });
      }
    },
  });
}

export function useDeleteProject() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-projects", organization?.id],
      });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: ["project", organization?.id, id],
        });
      }
    },
  });
}

export function useToggleFavoriteProject() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_favorite }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({ is_favorite, updated_by: user?.id })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-projects", organization?.id],
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["project", organization?.id, data.id],
        });
      }
    },
  });
}

export function useArchiveProject() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({ archived, updated_by: user?.id })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-projects", organization?.id],
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["project", organization?.id, data.id],
        });
      }
    },
  });
}
