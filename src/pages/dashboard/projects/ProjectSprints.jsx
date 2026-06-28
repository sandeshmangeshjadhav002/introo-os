import { useState } from 'react'
import { Plus, Timer, Calendar, Edit2, Trash2 } from 'lucide-react'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import Skeleton from '../../../components/Skeleton'
import EmptyState from '../../../components/EmptyState'
import { useProjects } from '../../../hooks/useProjects'
import { useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint } from '../../../hooks/useSprints'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const sprintSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).default('planned'),
  goal: z.string().optional(),
})

export default function ProjectSprints() {
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: sprints, isLoading: sprintsLoading } = useSprints()
  const createSprint = useCreateSprint()
  const updateSprint = useUpdateSprint()
  const deleteSprint = useDeleteSprint()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState(null)

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      project_id: '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'planned',
      goal: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      if (editingSprint) {
        await updateSprint.mutateAsync({ id: editingSprint.id, ...data })
      } else {
        await createSprint.mutateAsync(data)
      }
      setIsModalOpen(false)
      setEditingSprint(null)
      reset()
    } catch (error) {
      console.error('Error saving sprint:', error)
    }
  }

  const handleEditSprint = (sprint) => {
    setEditingSprint(sprint)
    setValue('project_id', sprint.project_id)
    setValue('name', sprint.name)
    setValue('description', sprint.description || '')
    setValue('start_date', sprint.start_date || '')
    setValue('end_date', sprint.end_date || '')
    setValue('status', sprint.status)
    setValue('goal', sprint.goal || '')
    setIsModalOpen(true)
  }

  const handleDeleteSprint = async (sprint) => {
    if (confirm('Are you sure you want to delete this sprint?')) {
      try {
        await deleteSprint.mutateAsync({ id: sprint.id, projectId: sprint.project_id })
      } catch (error) {
        console.error('Error deleting sprint:', error)
      }
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'planned': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'completed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sprints</h2>
        <Button onClick={() => { setEditingSprint(null); reset(); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" />
          New Sprint
        </Button>
      </div>

      {sprintsLoading || projectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : sprints?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map(sprint => (
            <Card key={sprint.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <Timer size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditSprint(sprint)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteSprint(sprint)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{sprint.name}</h3>
              {sprint.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{sprint.description}</p>
              )}
              {sprint.goal && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{sprint.goal}</p>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sprint.status)}`}>
                  {sprint.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {sprint.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(sprint.start_date).toLocaleDateString()}
                  </span>
                )}
                {sprint.start_date && sprint.end_date && <span>-</span>}
                {sprint.end_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(sprint.end_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Timer} 
          title="No sprints yet" 
          description="Create your first sprint to start planning"
          action={
            <Button onClick={() => { setEditingSprint(null); reset(); setIsModalOpen(true); }}>
              <Plus size={18} className="mr-2" />
              New Sprint
            </Button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingSprint(null); }} 
        title={editingSprint ? "Edit Sprint" : "Create New Sprint"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project *</label>
            <select
              {...register('project_id')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select Project</option>
              {projects?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.project_id && <p className="text-sm text-red-500 mt-1">{errors.project_id.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              {...register('name')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Sprint name"
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Sprint description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                {...register('start_date')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                {...register('end_date')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal</label>
            <textarea
              {...register('goal')}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Sprint goal"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => { setIsModalOpen(false); setEditingSprint(null); }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createSprint.isPending || updateSprint.isPending}>
              {createSprint.isPending || updateSprint.isPending ? 'Saving...' : (editingSprint ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
