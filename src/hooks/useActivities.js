import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useActivities({ dealId, contactId, companyId } = {}) {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['activities', organization?.id, dealId, contactId, companyId],
    queryFn: async () => {
      if (!organization?.id) return []
      
      let query = supabase
        .from('activities')
        .select('*, created_by:users(full_name, email), assigned_to:users(full_name, email)')
        .eq('organization_id', organization.id)
      
      if (dealId) query = query.eq('deal_id', dealId)
      if (contactId) query = query.eq('contact_id', contactId)
      if (companyId) query = query.eq('company_id', companyId)
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useCreateActivity() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (activity) => {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...activity,
          organization_id: organization.id,
          created_by: user?.id,
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
