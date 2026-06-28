import { FileText, FolderOpen, Plus, Search } from 'lucide-react'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Skeleton from '../../../components/Skeleton'
import EmptyState from '../../../components/EmptyState'

export default function ProjectFiles() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <Button>
          <Plus size={18} className="mr-2" />
          Upload File
        </Button>
      </div>

      <EmptyState 
        icon={FolderOpen} 
        title="Coming Soon" 
        description="File management features are under development"
      />
    </div>
  )
}
