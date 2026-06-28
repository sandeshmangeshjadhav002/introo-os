import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useSubtasks(taskId) {
  const { supabase } = useSupabase()

  return useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      if (!taskId) return []
      
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!taskId,
  })
}

export function useCreateSubtask() {
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (subtask) => {
      const { data, error } = await supabase
        .from('subtasks')
        .insert(subtask)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.task_id] })
    },
  })
}

export function useUpdateSubtask() {
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...subtask }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .update(subtask)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.task_id] })
    },
  })
}

export function useDeleteSubtask() {
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, taskId }) => {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
      return taskId
    },
    onSuccess: (taskId) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
  })
}
