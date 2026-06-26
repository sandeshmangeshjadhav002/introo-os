import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useClients() {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['clients', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useCreateClient() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (client) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...client,
          organization_id: organization.id,
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', organization?.id] })
    },
  })
}

export function useUpdateClient() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...client }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', organization?.id] })
    },
  })
}

export function useDeleteClient() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', organization?.id] })
    },
  })
}
