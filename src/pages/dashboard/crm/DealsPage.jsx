import { useState } from 'react'
import { Plus, Edit2, Trash2, TrendingUp, Search, Filter, DollarSign } from 'lucide-react'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import Skeleton from '../../../components/Skeleton'
import EmptyState from '../../../components/EmptyState'
import { useDeals, useDealStages, useCreateDeal, useUpdateDeal, useDeleteDeal } from '../../../hooks/useDeals'
import { useContacts } from '../../../hooks/useContacts'
import { useClients } from '../../../hooks/useClients'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'

const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  amount: z.number().optional(),
  stage_id: z.string().optional(),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
  close_date: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  status: z.enum(['open', 'won', 'lost']).default('open'),
  description: z.string().optional(),
})

export default function DealsPage() {
  const { data: deals, isLoading: dealsLoading } = useDeals()
  const { data: stages, isLoading: stagesLoading } = useDealStages()
  const { data: contacts } = useContacts()
  const { data: clients } = useClients()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState('kanban')

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      stage_id: '',
      contact_id: '',
      company_id: '',
      close_date: '',
      probability: 50,
      status: 'open',
      description: '',
    }
  })

  const onSubmit = async (data) => {
    try {
      if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, ...data })
      } else {
        await createDeal.mutateAsync(data)
      }
      setIsModalOpen(false)
      setEditingDeal(null)
      reset()
    } catch (error) {
      console.error('Error saving deal:', error)
    }
  }

  const handleEdit = (deal) => {
    setEditingDeal(deal)
    reset({
      name: deal.name,
      amount: deal.amount,
      stage_id: deal.stage_id,
      contact_id: deal.contact_id || '',
      company_id: deal.company_id || '',
      close_date: deal.close_date || '',
      probability: deal.probability || 50,
      status: deal.status,
      description: deal.description || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      try {
        await deleteDeal.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting deal:', error)
      }
    }
  }

  const filteredDeals = deals?.filter(deal => 
    deal.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const dealsByStage = stages?.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.stage_id === stage.id)
    return acc
  }, {}) || {}

  const totalPipelineValue = filteredDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0)

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Deals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Pipeline value: <span className="font-semibold text-green-600">${totalPipelineValue.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List
            </button>
          </div>
          <Button onClick={() => { setEditingDeal(null); reset(); setIsModalOpen(true); }}>
            <Plus size={18} className="mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <Button variant="outline">
          <Filter size={18} className="mr-2" />
          Filter
        </Button>
      </div>

      {view === 'kanban' ? (
        /* Kanban View */
        <div className="flex gap-6 overflow-x-auto pb-4">
          {stagesLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-80">
                <Skeleton className="h-12 w-full mb-4" />
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, j) => <Skeleton key={j} className="h-32" />)}
                </div>
              </div>
            ))
          ) : stages?.length > 0 ? (
            stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {dealsByStage[stage.id]?.length || 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {dealsByStage[stage.id]?.map((deal) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleEdit(deal)}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{deal.name}</h4>
                      {deal.amount && (
                        <div className="flex items-center gap-1 text-lg font-semibold text-green-600 mb-2">
                          <DollarSign size={18} />
                          {deal.amount.toLocaleString()}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        {deal.contact && <span>{deal.contact.first_name} {deal.contact.last_name}</span>}
                        {deal.probability && <span className="text-blue-600 font-medium">{deal.probability}%</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1">
              <EmptyState
                icon={TrendingUp}
                title="No stages found"
                description="Create deal stages to get started"
              />
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <Card className="p-6">
          {dealsLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
                  <Skeleton className="h-12 w-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDeals.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${deal.stage?.color}20` }}>
                    <TrendingUp size={24} style={{ color: deal.stage?.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{deal.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {deal.amount && <span className="font-medium text-green-600">${deal.amount.toLocaleString()}</span>}
                      {deal.stage && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: deal.stage.color }} />{deal.stage.name}</span>}
                      {deal.contact && <span>{deal.contact.first_name} {deal.contact.last_name}</span>}
                    </div>
                  </div>
                  {deal.probability && (
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                      {deal.probability}%
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(deal)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No deals found"
              description={searchQuery ? "Try adjusting your search" : "Add your first deal to get started"}
              action={
                <Button onClick={() => { setEditingDeal(null); reset(); setIsModalOpen(true); }}>
                  <Plus size={18} className="mr-2" />
                  Add Deal
                </Button>
              }
            />
          )}
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingDeal(null); }}
        title={editingDeal ? 'Edit Deal' : 'Add Deal'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deal Name *</label>
            <input
              {...register('name')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
              <input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                {...register('probability', { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stage</label>
              <select
                {...register('stage_id')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a stage</option>
                {stages?.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Close Date</label>
              <input
                type="date"
                {...register('close_date')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact</label>
              <select
                {...register('contact_id')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a contact</option>
                {contacts?.map((contact) => (
                  <option key={contact.id} value={contact.id}>{contact.first_name} {contact.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
              <select
                {...register('company_id')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a company</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>{client.company_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="open">Open</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setIsModalOpen(false); setEditingDeal(null); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createDeal.isPending || updateDeal.isPending}
            >
              {createDeal.isPending || updateDeal.isPending ? 'Saving...' : (editingDeal ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
