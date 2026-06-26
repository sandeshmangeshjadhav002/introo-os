import { motion } from 'framer-motion'
import Card from './Card'

export default function KPICard({ title, value, icon: Icon, trend, trendUp, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    purple: 'bg-purple-500/10 text-purple-600',
    orange: 'bg-orange-500/10 text-orange-600',
    red: 'bg-red-500/10 text-red-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
            {trend && (
              <p className={`text-sm font-medium mt-2 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trendUp ? '↑' : '↓'}</span>
                {trend}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${colors[color]}`}>
            <Icon size={28} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
