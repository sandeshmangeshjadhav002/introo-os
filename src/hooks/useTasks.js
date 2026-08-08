import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../context/SupabaseContext";

export function useTasks(options = {}) {
  const { projectId, sprintId } = options;
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["tasks", organization?.id, projectId, sprintId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from("tasks")
        .select(
          `
          *,
          project:projects(id, name, status, color),
          assigned_user:users!tasks_assigned_to_fkey(full_name, email, avatar_url),
          creator:users!tasks_created_by_fkey(full_name, email, avatar_url),
          sprint:sprints(id, name, status),
          subtasks:subtasks(id, title, is_completed, order_index)
        `,
        )
        .eq("organization_id", organization.id)
        .order("order_index", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      if (sprintId) {
        query = query.eq("sprint_id", sprintId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!organization?.id,
    staleTime: 15_000,
  });
}

export function useTask(taskId) {
  const { supabase, organization } = useSupabase();

  return useQuery({
    queryKey: ["task", organization?.id, taskId],
    queryFn: async () => {
      if (!organization?.id || !taskId) return null;

      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          project:projects(id, name, status, color),
          assigned_user:users!tasks_assigned_to_fkey(full_name, email, avatar_url),
          creator:users!tasks_created_by_fkey(full_name, email, avatar_url),
          sprint:sprints(id, name, status),
          subtasks:subtasks(id, title, is_completed, order_index),
          comments:task_comments(id, content, created_at, user:users(full_name, email, avatar_url)),
          files:task_files(id, file_name, file_url, file_size, file_type, created_at)
        `,
        )
        .eq("id", taskId)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!organization?.id && !!taskId,
  });
}

export function useCreateTask() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task) => {
      if (!organization?.id) throw new Error("No organization selected");
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...task,
          organization_id: organization.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["task", organization?.id, data.id],
        });
      }
    },
  });
}

export function useUpdateTask() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...task }) => {
      if (!organization?.id) throw new Error("No organization selected");

      const updates = { ...task };
      if (updates.status === "done" && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      } else if (updates.status !== undefined && updates.status !== "done") {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["task", organization?.id, data.id],
        });
      }
    },
  });
}

export function useUpdateTaskStatus() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const updates = { status };
      if (status === "done") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: ["task", organization?.id, data.id],
        });
      }
    },
  });
}

export function useDeleteTask() {
  const { supabase, organization } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      if (!organization?.id) throw new Error("No organization selected");

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: ["task", organization?.id, id],
        });
      }
    },
  });
}

export function useDuplicateTask() {
  const { supabase, organization, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId) => {
      if (!organization?.id) throw new Error("No organization selected");
      if (!user?.id) throw new Error("Not authenticated");

      const { data: originalTask, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .eq("organization_id", organization.id)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (!originalTask) throw new Error("Task not found");

      const { subtasks, ...taskFields } = originalTask;
      const { id, created_at, updated_at, completed_at, ...duplicateFields } =
        taskFields;

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...duplicateFields,
          title: `${duplicateFields.title} (Copy)`,
          status: "todo",
          progress: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
