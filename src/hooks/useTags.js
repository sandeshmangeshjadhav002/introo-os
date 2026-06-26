import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '../context/SupabaseContext'

export function useTags() {
  const { supabase, organization } = useSupabase()

  return useQuery({
    queryKey: ['tags', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return []
      
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!organization?.id,
  })
}

export function useCreateTag() {
  const { supabase, organization } = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tag) => {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          ...tag,
          organization_id: organization.id,
        })
        .select()
        .single()
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', organization?.id] })
    },
  })
}
