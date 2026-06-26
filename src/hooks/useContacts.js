import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useContacts() {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['contacts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*, company:clients(company_name), assigned_to:users(full_name, email)')
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useCreateContact() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contact) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          organization_id: organization.id,
          created_by: user?.id,
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
    },
  })
}

export function useUpdateContact() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...contact }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
    },
  })
}

export function useDeleteContact() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
    },
  })
}
