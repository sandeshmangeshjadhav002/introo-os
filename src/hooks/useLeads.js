import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useLeads({ includeArchived = false, includeDeleted = false } = {}) {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['leads', organization?.id, includeArchived, includeDeleted],
    queryFn: async () => {
      if (!organization?.id) return []
      
      let query = supabase
        .from('leads')
        .select('*, company:companies(company_name), contact:contacts(first_name, last_name, email), assigned_to:users(full_name, email)')
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

export function useLead(id) {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['lead', id, organization?.id],
    queryFn: async () => {
      if (!id || !organization?.id) return null
      
      const { data, error } = await supabase
        .from('leads')
        .select('*, company:companies(*), contact:contacts(*), assigned_to:users(full_name, email), activities(*), notes(*)')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!id && !!organization?.id,
  })
}

export function useCreateLead() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lead) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          organization_id: organization.id,
          created_by: user?.id,
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
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...lead }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...lead,
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
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['lead', data.id, organization?.id] })
    },
  })
}

export function useConvertLead() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadId, dealData, contactData, companyData }) => {
      // Get lead data
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      // Create company if needed
      let companyId = lead.company_id
      if (companyData && !companyId) {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({
            ...companyData,
            organization_id: organization.id,
            created_by: user?.id,
          })
          .select()
          .single()
        companyId = newCompany.id
      }

      // Create contact if needed
      let contactId = lead.contact_id
      if (contactData && !contactId) {
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            ...contactData,
            organization_id: organization.id,
            created_by: user?.id,
            company_id: companyId,
          })
          .select()
          .single()
        contactId = newContact.id
      }

      // Create deal
      const { data: deal } = await supabase
        .from('deals')
        .insert({
          ...dealData,
          organization_id: organization.id,
          created_by: user?.id,
          company_id: companyId,
          contact_id: contactId,
        })
        .select()
        .single()

      // Update lead status to converted
      await supabase
        .from('leads')
        .update({
          status: 'converted',
          updated_by: user?.id,
        })
        .eq('id', leadId)

      return { deal, contactId, companyId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['deals', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['contacts', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['companies', organization?.id] })
    },
  })
}

export function useArchiveLead() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ is_archived: true, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['lead', data.id, organization?.id] })
    },
  })
}

export function useRestoreLead() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ is_archived: false, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['lead', data.id, organization?.id] })
    },
  })
}

export function useDeleteLead() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('leads')
        .update({ deleted_at: new Date().toISOString(), updated_by: user?.id })
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
    },
  })
}

export function useFavoriteLead() {
  const { supabase, organization, user } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isFavorite }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ is_favorite: isFavorite, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads', organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['lead', data.id, organization?.id] })
    },
  })
}
