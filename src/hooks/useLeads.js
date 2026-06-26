import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useLeads() {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['leads', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const { data, error } = await supabase
        .from('leads')
        .select('*, assigned_to:users(full_name, email)')
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useCreateLead() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lead) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          organization_id: organization.id,
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
    },
  })
}

export function useUpdateLead() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...lead }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(lead)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
    },
  })
}

export function useDeleteLead() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
    },
  })
}
