import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layout,
  Users,
  Briefcase,
  Clock,
  MessageSquare,
  Calendar,
  FileText,
  UserCheck,
  DollarSign,
  Settings,
  Shield,
  Plus,
  Search
} from 'lucide-react'

const actions = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: Layout, path: '/dashboard' },
  { id: 'crm', label: 'Go to CRM', icon: Users, path: '/dashboard/crm' },
  { id: 'projects', label: 'Go to Projects', icon: Briefcase, path: '/dashboard/projects' },
  { id: 'tasks', label: 'Go to Tasks', icon: Clock, path: '/dashboard/tasks' },
  { id: 'chat', label: 'Go to Chat', icon: MessageSquare, path: '/dashboard/chat' },
  { id: 'calendar', label: 'Go to Calendar', icon: Calendar, path: '/dashboard/calendar' },
  { id: 'documents', label: 'Go to Documents', icon: FileText, path: '/dashboard/documents' },
  { id: 'hr', label: 'Go to HR', icon: UserCheck, path: '/dashboard/hr' },
  { id: 'finance', label: 'Go to Finance', icon: DollarSign, path: '/dashboard/finance' },
  { id: 'settings', label: 'Go to Settings', icon: Settings, path: '/dashboard/settings' },
  { id: 'admin', label: 'Go to Admin', icon: Shield, path: '/dashboard/admin' },
  { id: 'new-project', label: 'Create New Project', icon: Plus, action: 'new-project' },
  { id: 'new-task', label: 'Create New Task', icon: Plus, action: 'new-task' },
  { id: 'new-client', label: 'Create New Client', icon: Plus, action: 'new-client' }
]

export default function CommandPalette({ isOpen, onClose }) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Filter actions based on search term (defined first before it's used!)
  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(search.toLowerCase())
  )

  // Reset selected index when search changes or when we open
  useEffect(() => {
    setSelectedIndex(0)
  }, [search, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setSearch('')
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onClose()
      }
      
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, filteredActions.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          handleSelect(filteredActions[selectedIndex])
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredActions, selectedIndex, onClose])

  const handleSelect = (action) => {
    if (!action) return
    if (action.path) {
      navigate(action.path)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Search size={20} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">ESC</span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredActions.length > 0 ? (
            filteredActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => handleSelect(action)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    index === selectedIndex ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <span className={`font-medium ${
                    index === selectedIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {action.label}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No results found for "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
