import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useTasks() {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['tasks', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name), assigned_to:users(full_name, email)')
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useCreateTask() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organization?.id] })
    },
  })
}

export function useUpdateTask() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...task }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(task)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organization?.id] })
    },
  })
}

export function useDeleteTask() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organization?.id] })
    },
  })
}
