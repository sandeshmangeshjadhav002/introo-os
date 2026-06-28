import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  TrendingUp, 
  Users, 
  FolderKanban, 
  Timer, 
  FileText 
} from 'lucide-react'
import ProjectOverview from './projects/ProjectOverview'
import ProjectTasks from './projects/ProjectTasks'
import ProjectMilestones from './projects/ProjectMilestones'
import ProjectSprints from './projects/ProjectSprints'
import ProjectFiles from './projects/ProjectFiles'

export default function ProjectsPage() {
  const location = useLocation()

  const navItems = [
    { path: '', label: 'Overview', icon: LayoutDashboard },
    { path: 'tasks', label: 'Tasks', icon: CheckSquare },
    { path: 'milestones', label: 'Milestones', icon: TrendingUp },
    { path: 'sprints', label: 'Sprints', icon: Timer },
    { path: 'files', label: 'Files', icon: FileText },
  ]

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Projects Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Projects</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all your projects in one place</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-8">
        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ''}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-950 overflow-y-auto p-8">
        <Routes>
          <Route index element={<ProjectOverview />} />
          <Route path="tasks" element={<ProjectTasks />} />
          <Route path="milestones" element={<ProjectMilestones />} />
          <Route path="sprints" element={<ProjectSprints />} />
          <Route path="files" element={<ProjectFiles />} />
        </Routes>
      </div>
    </div>
  )
}
