import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useChannels(options = {}) {
  const { type } = options
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['channels', organization?.id, type],
    queryFn: async () => {
      if (!organization?.id) return []

      let query = supabase
        .from('channels')
        .select(`
          *,
          channel_members:channel_members!left(*),
          created_by:users(id, full_name, email)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useCreateChannel() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channel) => {
      const { data, error } = await supabase
        .from('channels')
        .insert({
          ...channel,
          organization_id: organization?.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUpdateChannel() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...channel }) => {
      const { data, error } = await supabase
        .from('channels')
        .update(channel)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useDeleteChannel() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}
