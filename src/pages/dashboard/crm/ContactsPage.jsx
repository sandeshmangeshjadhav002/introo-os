import { useState } from 'react'
import { Plus, Edit2, Trash2, Mail, Phone, User, Search, Filter } from 'lucide-react'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import Skeleton from '../../../components/Skeleton'
import EmptyState from '../../../components/EmptyState'
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '../../../hooks/useContacts'
import { useClients } from '../../../hooks/useClients'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company_id: z.string().optional(),
  job_title: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
})

export default function ContactsPage() {
  const { data: contacts, isLoading } = useContacts()
  const { data: clients } = useClients()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      status: 'active',
    }
  })

  const onSubmit = async (data) => {
    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, ...data })
      } else {
        await createContact.mutateAsync(data)
      }
      setIsModalOpen(false)
      setEditingContact(null)
      reset()
    } catch (error) {
      console.error('Error saving contact:', error)
    }
  }

  const handleEdit = (contact) => {
    setEditingContact(contact)
    reset({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      company_id: contact.company_id || '',
      job_title: contact.job_title || '',
      status: contact.status,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting contact:', error)
      }
    }
  }

  const filteredContacts = contacts?.filter(contact => 
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your contacts</p>
        </div>
        <Button onClick={() => { setEditingContact(null); reset(); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search contacts..."
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

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {contact.first_name[0]}{contact.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {contact.phone}
                      </span>
                    )}
                    {contact.company?.company_name && (
                      <span className="text-gray-400">{contact.company.company_name}</span>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  contact.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  contact.status === 'lead' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {contact.status}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
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
            icon={User}
            title="No contacts found"
            description={searchQuery ? "Try adjusting your search" : "Add your first contact to get started"}
            action={
              <Button onClick={() => { setEditingContact(null); reset(); setIsModalOpen(true); }}>
                <Plus size={18} className="mr-2" />
                Add Contact
              </Button>
            }
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingContact(null); }}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {errors.first_name && <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {errors.last_name && <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              {...register('phone')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
            <input
              {...register('job_title')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setIsModalOpen(false); setEditingContact(null); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createContact.isPending || updateContact.isPending}
            >
              {createContact.isPending || updateContact.isPending ? 'Saving...' : (editingContact ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
