import { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Plus, Trash2, Edit2, User, AlertCircle, Calendar, CheckCircle } from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}></div>
)

export default function HrPage() {
  const { supabase, organization } = useSupabase()
  const [employees, setEmployees] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [employeeForm, setEmployeeForm] = useState({
    department: '',
    designation: '',
    joining_date: '',
    salary: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [employeesRes, leaveRes] = await Promise.all([
        supabase.from('employees').select('*, users(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('leave_requests').select('*, employees(*)').order('created_at', { ascending: false })
      ])
      
      if (employeesRes.error) throw employeesRes.error
      if (leaveRes.error) throw leaveRes.error
      
      setEmployees(employeesRes.data || [])
      setLeaveRequests(leaveRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [supabase])

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editingEmployee) {
        const { error } = await supabase.from('employees').update(employeeForm).eq('id', editingEmployee.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('employees').insert({
          ...employeeForm,
          organization_id: organization?.id
        })
        if (error) throw error
      }
      setShowEmployeeModal(false)
      setEditingEmployee(null)
      setEmployeeForm({
        department: '',
        designation: '',
        joining_date: '',
        salary: ''
      })
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLeaveAction = async (id, status) => {
    try {
      await supabase.from('leave_requests').update({ status }).eq('id', id)
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const getLeaveStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Human Resources</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage employees and leave requests</p>
        </div>
        <Button onClick={() => setShowEmployeeModal(true)}>
          <Plus size={18} className="mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Employees</h2>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : employees.length > 0 ? (
              employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {emp.users?.full_name?.[0] || 'E'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{emp.users?.full_name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">{emp.designation} · {emp.department}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingEmployee(emp); setEmployeeForm(emp); setShowEmployeeModal(true); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <User size={48} className="mx-auto mb-4 opacity-50" />
                <p>No employees yet</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Leave Requests</h2>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : leaveRequests.length > 0 ? (
              leaveRequests.map(req => (
                <div key={req.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {req.leave_type}
                      </h4>
                      <p className="text-sm text-gray-500">
                        <Calendar size={14} className="inline mr-1" />
                        {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeaveStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  {req.reason && <p className="text-sm text-gray-500 mb-3">{req.reason}</p>}
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleLeaveAction(req.id, 'approved')} className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle size={12} className="inline mr-1" />
                        Approve
                      </button>
                      <button onClick={() => handleLeaveAction(req.id, 'rejected')} className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No leave requests
              </div>
            )}
          </div>
        </Card>
      </div>

      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {editingEmployee ? 'Edit Employee' : 'Add Employee'}
            </h2>
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <input 
                    type="text"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Designation</label>
                  <input 
                    type="text"
                    value={employeeForm.designation}
                    onChange={(e) => setEmployeeForm({...employeeForm, designation: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Software Engineer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Joining Date</label>
                  <input 
                    type="date"
                    value={employeeForm.joining_date}
                    onChange={(e) => setEmployeeForm({...employeeForm, joining_date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Salary</label>
                  <input 
                    type="number"
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm({...employeeForm, salary: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => { setShowEmployeeModal(false); setEditingEmployee(null); }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Add Employee')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
