import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useCompanies({ includeArchived = false, includeDeleted = false } = {}) {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['companies', organization?.id, includeArchived, includeDeleted],
    queryFn: async () => {
      if (!organization?.id) return []
      
      let query = supabase
        .from('companies')
        .select('*, contacts(*), deals(*), activities(*)')
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

export function useCompany(id) {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['company', id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null
      
      const { data, error } = await supabase
        .from('companies')
        .select('*, contacts(*), deals(*), activities(*), notes(*)')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!id && !!organization?.id,
  })
}

export function useCreateCompany() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (company) => {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          ...company,
          organization_id: organization.id,
          created_by: user?.id,
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', organization?.id] })
    },
  })
}

export function useUpdateCompany() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...company }) => {
      const { data, error } = await supabase
        .from('companies')
        .update({
          ...company,
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
      queryClient.invalidateQueries({ queryKey: ['companies', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['company', data.id, organization?.id] })
    },
  })
}

export function useArchiveCompany() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ is_archived: true, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['company', data.id, organization?.id] })
    },
  })
}

export function useRestoreCompany() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ is_archived: false, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['company', data.id, organization?.id] })
    },
  })
}

export function useDeleteCompany() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('companies')
        .update({ deleted_at: new Date().toISOString(), updated_by: user?.id })
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', organization?.id] })
    },
  })
}

export function useFavoriteCompany() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isFavorite }) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ is_favorite: isFavorite, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['company', data.id, organization?.id] })
    },
  })
}
