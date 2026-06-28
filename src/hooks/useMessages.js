import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useMessages(channelId) {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      if (!channelId) return []

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(id, full_name, email, avatar_url)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!channelId,
  })
}

export function useCreateMessage() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (message) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.channel_id] })
    },
  })
}

export function useUpdateMessage() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...message }) => {
      const { data, error } = await supabase
        .from('messages')
        .update({ ...message, is_edited: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

export function useDeleteMessage() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}
