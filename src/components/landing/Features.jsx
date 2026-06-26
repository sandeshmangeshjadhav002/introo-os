import { motion } from 'framer-motion'
import {
  Layout,
  Users,
  Briefcase,
  MessageSquare,
  Calendar,
  FileText,
  UserCheck,
  DollarSign,
  Settings
} from 'lucide-react'
import Card from '../Card'

const features = [
  {
    icon: Layout,
    title: 'Dashboard',
    desc: 'Get a complete overview of your business performance with real-time analytics and insights.',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    icon: Users,
    title: 'CRM',
    desc: 'Manage leads, customers, and sales pipeline all in one place with powerful CRM tools.',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: Briefcase,
    title: 'Project Management',
    desc: 'Plan, track, and deliver projects with Kanban boards, Gantt charts, and task management.',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: MessageSquare,
    title: 'Team Chat',
    desc: 'Communicate with your team in real-time with channels, direct messages, and file sharing.',
    color: 'from-orange-500 to-red-600'
  },
  {
    icon: Calendar,
    title: 'Calendar',
    desc: 'Schedule meetings, track events, and manage your team\'s availability in one shared calendar.',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    icon: FileText,
    title: 'Documents',
    desc: 'Store, organize, and share documents with your team with built-in file management.',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    icon: UserCheck,
    title: 'HR',
    desc: 'Manage employees, track attendance, and handle leave requests all in one HR module.',
    color: 'from-pink-500 to-purple-600'
  },
  {
    icon: DollarSign,
    title: 'Finance',
    desc: 'Create invoices, track expenses, and manage your financials with powerful finance tools.',
    color: 'from-teal-500 to-green-600'
  },
  {
    icon: Settings,
    title: 'Settings',
    desc: 'Customize your workspace, manage your team, and configure your business settings.',
    color: 'from-gray-500 to-gray-600'
  }
]

export default function Features() {
  return (
    <section className="py-24 px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need in one place</h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            All the tools your business needs to succeed, beautifully designed and perfectly integrated
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
            >
              <Card className="p-8 hover:shadow-medium transition-shadow">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
