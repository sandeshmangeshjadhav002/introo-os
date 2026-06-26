import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useDeals() {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['deals', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          stage:deal_stages(*),
          contact:contacts(first_name, last_name, email),
          company:clients(company_name),
          assigned_to:users(full_name, email)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useDealStages() {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['dealStages', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const { data, error } = await supabase
        .from('deal_stages')
        .select('*')
        .order('position', { ascending: true })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useCreateDeal() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (deal) => {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          ...deal,
          organization_id: organization.id,
          created_by: user?.id,
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', organization?.id] })
    },
  })
}

export function useUpdateDeal() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...deal }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(deal)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', organization?.id] })
    },
  })
}

export function useDeleteDeal() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', organization?.id] })
    },
  })
}
