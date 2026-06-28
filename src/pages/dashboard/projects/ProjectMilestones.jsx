import { useState } from 'react'
import { Plus, TrendingUp, Calendar, CheckCircle2, Edit2, Trash2 } from 'lucide-react'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import Skeleton from '../../../components/Skeleton'
import EmptyState from '../../../components/EmptyState'
import { useProjects } from '../../../hooks/useProjects'
import { useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone } from '../../../hooks/useMilestones'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const milestoneSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']).default('pending'),
  progress: z.number().min(0).max(100).default(0),
  assigned_to: z.string().optional().nullable(),
})

export default function ProjectMilestones() {
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: milestones, isLoading: milestonesLoading } = useMilestones()
  const createMilestone = useCreateMilestone()
  const updateMilestone = useUpdateMilestone()
  const deleteMilestone = useDeleteMilestone()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      project_id: '',
      title: '',
      description: '',
      due_date: '',
      status: 'pending',
      progress: 0,
      assigned_to: null,
    },
  })

  const onSubmit = async (data) => {
    try {
      if (editingMilestone) {
        await updateMilestone.mutateAsync({ id: editingMilestone.id, ...data })
      } else {
        await createMilestone.mutateAsync(data)
      }
      setIsModalOpen(false)
      setEditingMilestone(null)
      reset()
    } catch (error) {
      console.error('Error saving milestone:', error)
    }
  }

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone)
    setValue('project_id', milestone.project_id)
    setValue('title', milestone.title)
    setValue('description', milestone.description || '')
    setValue('due_date', milestone.due_date || '')
    setValue('status', milestone.status)
    setValue('progress', milestone.progress)
    setValue('assigned_to', milestone.assigned_to || null)
    setIsModalOpen(true)
  }

  const handleDeleteMilestone = async (milestone) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      try {
        await deleteMilestone.mutateAsync({ id: milestone.id, projectId: milestone.project_id })
      } catch (error) {
        console.error('Error deleting milestone:', error)
      }
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'cancelled': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Milestones</h2>
        <Button onClick={() => { setEditingMilestone(null); reset(); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" />
          New Milestone
        </Button>
      </div>

      {milestonesLoading || projectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : milestones?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map(milestone => (
            <Card key={milestone.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                  <TrendingUp size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditMilestone(milestone)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteMilestone(milestone)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{milestone.title}</h3>
              {milestone.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{milestone.description}</p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                  {milestone.status.replace('_', ' ')}
                </span>
                {milestone.due_date && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(milestone.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              {milestone.progress !== undefined && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{milestone.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-600"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={TrendingUp} 
          title="No milestones yet" 
          description="Create your first milestone to track project goals"
          action={
            <Button onClick={() => { setEditingMilestone(null); reset(); setIsModalOpen(true); }}>
              <Plus size={18} className="mr-2" />
              New Milestone
            </Button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingMilestone(null); }} 
        title={editingMilestone ? "Edit Milestone" : "Create New Milestone"}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              {...register('title')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter milestone title"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter milestone description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                {...register('due_date')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              {...register('progress', { valueAsNumber: true })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => { setIsModalOpen(false); setEditingMilestone(null); }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createMilestone.isPending || updateMilestone.isPending}>
              {createMilestone.isPending || updateMilestone.isPending ? 'Saving...' : (editingMilestone ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
