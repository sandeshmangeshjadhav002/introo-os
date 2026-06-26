import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Plus, Trash2, Edit2, User, AlertCircle } from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}></div>
)

export default function CrmPage() {
  const { supabase, organization } = useSupabase()
  const [clients, setClients] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    status: 'active',
    notes: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [clientsRes, leadsRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*, users(full_name)').order('created_at', { ascending: false })
      ])
      
      if (clientsRes.error) throw clientsRes.error
      if (leadsRes.error) throw leadsRes.error
      
      setClients(clientsRes.data || [])
      setLeads(leadsRes.data || [])
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
      if (editingClient) {
        const { error } = await supabase.from('clients').update(formData).eq('id', editingClient.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clients').insert({
          ...formData,
          organization_id: organization?.id
        })
        if (error) throw error
      }
      setShowModal(false)
      setEditingClient(null)
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        status: 'active',
        notes: ''
      })
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData(client)
    setShowModal(true)
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      case 'lead': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeadStageColor = (stage) => {
    switch(stage) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-purple-100 text-purple-800'
      case 'proposal': return 'bg-orange-100 text-orange-800'
      case 'negotiation': return 'bg-pink-100 text-pink-800'
      case 'closed_won': return 'bg-green-100 text-green-800'
      case 'closed_lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CRM</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage leads, customers, and sales pipeline.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} className="mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Clients</h2>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : clients.length > 0 ? (
            <div className="space-y-4">
              {clients.map(client => (
                <div key={client.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {client.company_name?.[0] || 'C'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{client.company_name}</h3>
                    {client.contact_name && <p className="text-sm text-gray-600 dark:text-gray-400">{client.contact_name}</p>}
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(client)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>No clients yet. Add your first client!</p>
            </div>
          )}
        </Card>

        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Leads</h2>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : leads.length > 0 ? (
            <div className="space-y-4">
              {leads.map(lead => (
                <div key={lead.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                    {lead.name?.[0] || 'L'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{lead.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {lead.value ? `Value: $${lead.value.toLocaleString()}` : 'No value set'}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getLeadStageColor(lead.stage)}`}>
                      {lead.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>No leads yet. Start generating leads!</p>
            </div>
          )}
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input 
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Company Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Name</label>
                <input 
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => { setShowModal(false); setEditingClient(null); }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : (editingClient ? 'Update Client' : 'Add Client')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
