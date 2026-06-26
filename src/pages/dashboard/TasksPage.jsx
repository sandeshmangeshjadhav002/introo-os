import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Clock, AlertTriangle } from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}></div>
)

export default function TasksPage() {
  const { supabase, organization } = useSupabase()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [tasksRes, projectsRes] = await Promise.all([
        supabase.from('tasks').select('*, projects(name), users(full_name)').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name').order('created_at', { ascending: false })
      ])
      if (tasksRes.error) throw tasksRes.error
      if (projectsRes.error) throw projectsRes.error
      
      setTasks(tasksRes.data || [])
      setProjects(projectsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editingTask) {
        const { error } = await supabase.from('tasks').update(formData).eq('id', editingTask.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tasks').insert(formData)
        if (error) throw error
      }
      setShowModal(false)
      setEditingTask(null)
      setFormData({
        project_id: '',
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: ''
      })
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent': return <AlertTriangle size={16} className="text-red-500" />
      case 'high': return <AlertCircle size={16} className="text-orange-500" />
      case 'medium': return <Clock size={16} className="text-yellow-500" />
      default: return <CheckCircle2 size={16} className="text-gray-400" />
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const columns = [
    { status: 'todo', title: 'To Do', color: 'from-gray-100 to-gray-200' },
    { status: 'in_progress', title: 'In Progress', color: 'from-blue-100 to-blue-200' },
    { status: 'review', title: 'Review', color: 'from-purple-100 to-purple-200' },
    { status: 'done', title: 'Done', color: 'from-green-100 to-green-200' }
  ]

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={loadData}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage tasks using Kanban board</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} className="mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <Card key={column.status} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{column.title}</h3>
            <div className="space-y-3 min-h-[300px]">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : tasks.filter(t => t.status === column.status).length > 0 ? (
                tasks.filter(t => t.status === column.status).map(task => (
                  <div 
                    key={task.id} 
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all cursor-move"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingTask(task); setFormData(task); setShowModal(true); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {task.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)}
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {task.projects && (
                      <div className="text-xs text-gray-500">Project: {task.projects.name}</div>
                    )}
                    {task.status !== 'done' && (
                      <div className="mt-3 flex gap-2">
                        {column.status === 'todo' && (
                          <button onClick={() => updateStatus(task.id, 'in_progress')} className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Start
                          </button>
                        )}
                        {column.status === 'in_progress' && (
                          <>
                            <button onClick={() => updateStatus(task.id, 'review')} className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              Review
                            </button>
                            <button onClick={() => updateStatus(task.id, 'done')} className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Complete
                            </button>
                          </>
                        )}
                        {column.status === 'review' && (
                          <button onClick={() => updateStatus(task.id, 'done')} className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Approve
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tasks in {column.title}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project</label>
                <select 
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Task Title</label>
                <input 
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Task description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input 
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => { setShowModal(false); setEditingTask(null); }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
