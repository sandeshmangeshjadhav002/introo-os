import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Plus, Trash2, Edit2, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}></div>
)

export default function FinancePage() {
  const { supabase, organization } = useSupabase()
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    amount: '',
    status: 'draft',
    due_date: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [invoicesRes, paymentsRes] = await Promise.all([
        supabase.from('invoices').select('*, clients(company_name)').order('created_at', { ascending: false }),
        supabase.from('payments').select('*, invoices(invoice_number)').order('created_at', { ascending: false })
      ])
      
      if (invoicesRes.error) throw invoicesRes.error
      if (paymentsRes.error) throw paymentsRes.error
      
      setInvoices(invoicesRes.data || [])
      setPayments(paymentsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [supabase])

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const dataToSave = {
        ...invoiceForm,
        amount: parseFloat(invoiceForm.amount) || 0
      }
      
      if (editingInvoice) {
        const { error } = await supabase.from('invoices').update(dataToSave).eq('id', editingInvoice.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('invoices').insert({
          ...dataToSave,
          organization_id: organization?.id
        })
        if (error) throw error
      }
      setShowInvoiceModal(false)
      setEditingInvoice(null)
      setInvoiceForm({
        invoice_number: '',
        amount: '',
        status: 'draft',
        due_date: ''
      })
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInvoice = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const getInvoiceStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0)
  const pendingInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Finance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage invoices and payments</p>
        </div>
        <Button onClick={() => setShowInvoiceModal(true)}>
          <Plus size={18} className="mr-2" />
          Add Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingInvoices}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invoices</h2>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))
            ) : invoices.length > 0 ? (
              invoices.map(inv => (
                <div key={inv.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">#{inv.invoice_number}</h4>
                      {inv.clients?.company_name && <p className="text-sm text-gray-500">{inv.clients.company_name}</p>}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInvoiceStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Amount: ${parseFloat(inv.amount || 0).toLocaleString()}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingInvoice(inv); setInvoiceForm(inv); setShowInvoiceModal(true); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                <p>No invoices yet</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payments</h2>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            ) : payments.length > 0 ? (
              payments.map(pay => (
                <div key={pay.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        Payment for #{pay.invoices?.invoice_number || 'Unknown'}
                      </h4>
                      {pay.payment_method && <p className="text-sm text-gray-500">{pay.payment_method}</p>}
                    </div>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      ${parseFloat(pay.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  {pay.payment_date && (
                    <p className="text-sm text-gray-500">
                      Paid: {new Date(pay.payment_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No payments yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
            </h2>
            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Invoice Number</label>
                <input 
                  type="text"
                  required
                  value={invoiceForm.invoice_number}
                  onChange={(e) => setInvoiceForm({...invoiceForm, invoice_number: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="INV-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input 
                  type="number"
                  required
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="1000.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select 
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({...invoiceForm, status: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input 
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => { setShowInvoiceModal(false); setEditingInvoice(null); }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : (editingInvoice ? 'Update Invoice' : 'Add Invoice')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
