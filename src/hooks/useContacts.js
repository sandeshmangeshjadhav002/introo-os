import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useContacts({ includeArchived = false, includeDeleted = false } = {}) {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['contacts', organization?.id, includeArchived, includeDeleted],
    queryFn: async () => {
      if (!organization?.id) return []
      
      let query = supabase
        .from('contacts')
        .select('*, company:companies(company_name), assigned_to:users(full_name, email)')
        .order('created_at', { ascending: false })
      
      if (!includeDeleted) query = query.is('deleted_at', null)
      if (!includeArchived) query = query.eq('is_archived', false)
      
      const { data, error } = await query
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useContact(id) {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['contact', id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*, company:companies(*), deals(*), activities(*), notes(*)')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!id && !!organization?.id,
  })
}

export function useCreateContact() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contact) => {
      if (!organization?.id) throw new Error("No organization found. Please ensure you are part of an organization.");
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
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...contact }) => {
      if (!organization?.id) throw new Error("No organization found. Please ensure you are part of an organization.");
      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...contact,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['contact', data.id, organization?.id] })
    },
  })
}

export function useArchiveContact() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('contacts')
        .update({ is_archived: true, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['contact', data.id, organization?.id] })
    },
  })
}

export function useRestoreContact() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('contacts')
        .update({ is_archived: false, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['contact', data.id, organization?.id] })
    },
  })
}

export function useDeleteContact() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString(), updated_by: user?.id })
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
    },
  })
}

export function useFavoriteContact() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isFavorite }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update({ is_favorite: isFavorite, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['contact', data.id, organization?.id] })
    },
  })
}
