import { useState } from 'react'
import { Plus, CheckSquare, CheckCircle2, Clock, AlertCircle, Edit2, Trash2, Search } from 'lucide-react'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import Skeleton from '../../../components/Skeleton'
import EmptyState from '../../../components/EmptyState'
import { useProjects } from '../../../hooks/useProjects'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../../hooks/useTasks'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const taskSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).default('todo'),
  due_date: z.string().optional(),
  assigned_to: z.string().optional().nullable(),
  estimated_hours: z.number().optional().nullable(),
  sprint_id: z.string().optional().nullable(),
})

export default function ProjectTasks() {
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      project_id: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      due_date: '',
      assigned_to: null,
      estimated_hours: null,
      sprint_id: null,
    },
  })

  const onSubmit = async (data) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, ...data })
      } else {
        await createTask.mutateAsync(data)
      }
      setIsModalOpen(false)
      setEditingTask(null)
      reset()
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setValue('project_id', task.project_id)
    setValue('title', task.title)
    setValue('description', task.description || '')
    setValue('priority', task.priority)
    setValue('status', task.status)
    setValue('due_date', task.due_date || '')
    setValue('assigned_to', task.assigned_to || null)
    setValue('estimated_hours', task.estimated_hours || null)
    setValue('sprint_id', task.sprint_id || null)
    setIsModalOpen(true)
  }

  const handleDeleteTask = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const filteredTasks = tasks?.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent': return <AlertCircle size={16} className="text-red-500" />
      case 'high': return <AlertCircle size={16} className="text-orange-500" />
      case 'medium': return <Clock size={16} className="text-yellow-500" />
      case 'low': return <CheckCircle2 size={16} className="text-green-500" />
      default: return null
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'todo': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'review': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'done': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <Button onClick={() => { setEditingTask(null); reset(); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" />
          New Task
        </Button>
      </div>

      <Card className="p-6">
        {tasksLoading || projectsLoading ? (
          <div className="space-y-4">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getPriorityIcon(task.priority)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {task.project && <span className="text-gray-500">Project: {task.project.name}</span>}
                      {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <button onClick={() => handleEditTask(task)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={CheckSquare} 
            title="No tasks yet" 
            description="Create your first task to get started"
            action={
              <Button onClick={() => { setEditingTask(null); reset(); setIsModalOpen(true); }}>
                <Plus size={18} className="mr-2" />
                New Task
              </Button>
            }
          />
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }} 
        title={editingTask ? "Edit Task" : "Create New Task"}
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
              placeholder="Enter task title"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter task description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                {...register('priority')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input
              type="date"
              {...register('due_date')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => { setIsModalOpen(false); setEditingTask(null); }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createTask.isPending || updateTask.isPending}>
              {createTask.isPending || updateTask.isPending ? 'Saving...' : (editingTask ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
