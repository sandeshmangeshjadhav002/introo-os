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
          project:projects(id, name, status, color)
        `,
        )
        .eq("organization_id", organization.id)
        .order("start_date", { ascending: true, nullsFirst: false });

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

export function useSprint(sprintId) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["sprint", organization?.id, sprintId],
    queryFn: async () => {
      if (!organization?.id || !sprintId) return null;

      const { data, error } = await supabase
        .from("sprints")
        .select(
          `
          *,
          project:projects(id, name, status, color),
          task_count:tasks(id)
        `,
        )
        .eq("id", sprintId)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id && !!sprintId,
  });
}

export function useCreateSprint() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sprint) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { data, error } = await supabase
        .from("sprints")
        .insert({
          ...sprint,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id, data?.project_id],
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["sprint", organization?.id, data.id],
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
      if (!organization?.id) throw new Error("No organization selected");

      const { data, error } = await supabase
        .from("sprints")
        .update(sprint)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id, data?.project_id],
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["sprint", organization?.id, data.id],
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
      if (!organization?.id) throw new Error("No organization selected");

      const { error } = await supabase
        .from("sprints")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw new Error(error.message);
      return { id, projectId };
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id, projectId],
      });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: ["sprint", organization?.id, id],
        });
      }
    },
  });
}

export function useActivateSprint() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { error } = await supabase.rpc("activate_sprint", {
        sprint_id: id,
        org_id: organization.id,
      });

      if (error) {
        const { data, error: updateError } = await supabase
          .from("sprints")
          .update({ status: "active" })
          .eq("id", id)
          .eq("organization_id", organization.id)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);
        return data;
      }

      const { data } = await supabase
        .from("sprints")
        .select()
        .eq("id", id)
        .single();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id, data?.project_id],
      });
    },
  });
}

export function useCompleteSprint() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { data, error } = await supabase
        .from("sprints")
        .update({ status: "completed" })
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["sprints", organization?.id, data?.project_id],
      });
    },
  });
}
