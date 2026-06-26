import { Users, TrendingUp, DollarSign, Target, Plus } from 'lucide-react'
import KPICard from '../../../components/KPICard'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Skeleton from '../../../components/Skeleton'
import EmptyState from '../../../components/EmptyState'
import { useClients } from '../../../hooks/useClients'
import { useContacts } from '../../../hooks/useContacts'
import { useDeals } from '../../../hooks/useDeals'
import { useLeads } from '../../../hooks/useLeads'

export default function CrmDashboard() {
  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: contacts, isLoading: contactsLoading } = useContacts()
  const { data: deals, isLoading: dealsLoading } = useDeals()
  const { data: leads, isLoading: leadsLoading } = useLeads()

  const totalPipelineValue = deals?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0
  const wonDeals = deals?.filter(deal => deal.status === 'won') || []
  const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0)

  const recentItems = [
    ...(clients?.slice(0, 3).map(c => ({ ...c, type: 'client', name: c.company_name })) || []),
    ...(contacts?.slice(0, 3).map(c => ({ ...c, type: 'contact', name: `${c.first_name} ${c.last_name}` })) || []),
    ...(deals?.slice(0, 3).map(d => ({ ...d, type: 'deal', name: d.name })) || []),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CRM Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Overview of your sales pipeline</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {clientsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <KPICard
              title="Total Leads"
              value={leads?.length || 0}
              icon={Target}
              color="purple"
            />
            <KPICard
              title="Total Deals"
              value={deals?.length || 0}
              icon={TrendingUp}
              color="blue"
            />
            <KPICard
              title="Pipeline Value"
              value={`$${totalPipelineValue.toLocaleString()}`}
              icon={DollarSign}
              color="green"
            />
            <KPICard
              title="Contacts"
              value={contacts?.length || 0}
              icon={Users}
              color="orange"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Items</h2>
          </div>
          {clientsLoading || contactsLoading || dealsLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.type === 'client' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'contact' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {item.type === 'client' && <Users size={18} />}
                    {item.type === 'contact' && <Users size={18} />}
                    {item.type === 'deal' && <TrendingUp size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No recent activity"
              description="Start by adding leads, contacts, or deals to your CRM"
            />
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full justify-start">
              <Plus size={18} className="mr-2" />
              Add Lead
            </Button>
            <Button className="w-full justify-start">
              <Plus size={18} className="mr-2" />
              Add Contact
            </Button>
            <Button className="w-full justify-start">
              <Plus size={18} className="mr-2" />
              Add Deal
            </Button>
            <Button className="w-full justify-start">
              <Plus size={18} className="mr-2" />
              Add Company
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
