import { useState } from 'react'
import { Users, Shield, Database, Settings as SettingsIcon, Plus, Edit2, Trash2, Search, MoreVertical } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '../../context/SupabaseContext'

const userSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['super_admin', 'admin', 'manager', 'employee']).default('employee'),
})

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'employee',
    },
  })
  const { supabase } = useSupabase()

  const [users] = useState([
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'admin', status: 'active', joined: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'manager', status: 'active', joined: '2024-03-22' },
    { id: 3, name: 'Bob Wilson', email: 'bob@company.com', role: 'employee', status: 'active', joined: '2024-05-10' },
    { id: 4, name: 'Alice Brown', email: 'alice@company.com', role: 'employee', status: 'inactive', joined: '2023-11-05' },
  ])

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  const getRoleBadge = (role) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      manager: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      employee: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role]}`}>
        {role.replace('_', ' ')}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        status === 'active'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {status}
      </span>
    )
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    reset({
      full_name: user.name,
      email: user.email,
      role: user.role,
    })
    setIsModalOpen(true)
  }

  const onSubmit = (data) => {
    console.log('Saving user:', data)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your workspace</p>
        </div>
        {activeTab === 'users' && (
          <Button onClick={() => { setEditingUser(null); reset(); setIsModalOpen(true); }}>
            <Plus size={18} className="mr-2" />
            Add User
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <Card className="p-6">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['super_admin', 'admin', 'manager', 'employee'].map(role => (
            <Card key={role} className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 capitalize">{role.replace('_', ' ')}</h3>
              <p className="text-sm text-gray-500 mt-1">Manage permissions for this role</p>
              <Button variant="outline" size="sm" className="mt-4">
                Edit Permissions
              </Button>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Export Data</h3>
            <p className="text-sm text-gray-500 mt-1">Export all your workspace data</p>
            <Button className="mt-4">Export Data</Button>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Import Data</h3>
            <p className="text-sm text-gray-500 mt-1">Import data from CSV files</p>
            <Button variant="outline" className="mt-4">Import Data</Button>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Workspace Settings</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your workspace configuration</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workspace Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                defaultValue="My Company"
              />
            </div>
            <Button>Save Settings</Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input
              {...register('full_name')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              {...register('role')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
