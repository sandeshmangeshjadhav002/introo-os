import { useState } from 'react'
import { User, Bell, Lock, Palette, Globe, Shield, Trash2, Save } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '../../context/SupabaseContext'
import { useTheme } from '../../context/ThemeContext'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
})

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { profile } = useSupabase()
  const { theme, setTheme } = useTheme()
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: '',
    },
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
  ]

  const onSubmit = (data) => {
    console.log('Saving profile:', data)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences</p>
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

      {activeTab === 'profile' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Profile Settings</h3>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <Button variant="outline">Change Avatar</Button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                {...register('full_name')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => reset()}>Reset</Button>
              <Button type="submit">
                <Save size={18} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { id: 'email', label: 'Email Notifications', description: 'Receive email updates' },
              { id: 'push', label: 'Push Notifications', description: 'Receive push notifications' },
              { id: 'mentions', label: 'Mentions', description: 'Get notified when someone mentions you' },
              { id: 'tasks', label: 'Task Updates', description: 'Get notified about task changes' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.label}</h4>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Security Settings</h3>
          <div className="space-y-4">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Change Password</h4>
              <p className="text-sm text-gray-500 mb-4">Update your password regularly</p>
              <Button variant="outline">Change Password</Button>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500 mb-4">Add an extra layer of security</p>
              <Button variant="outline">Enable 2FA</Button>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Active Sessions</h4>
              <p className="text-sm text-gray-500 mb-4">Manage your active login sessions</p>
              <Button variant="outline">View Sessions</Button>
            </div>
            <div className="pt-4">
              <h4 className="font-medium text-red-600 dark:text-red-400">Danger Zone</h4>
              <p className="text-sm text-gray-500 mb-4">Permanently delete your account</p>
              <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 size={18} className="mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'appearance' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Appearance</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Theme</h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'system', label: 'System' },
                ].map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => setTheme(themeOption.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      theme === themeOption.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {themeOption.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'language' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Language & Region</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
            <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </Card>
      )}
    </div>
  )
}
