import { motion } from 'framer-motion'

export default function Card({ children, className = '', glass = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${
        glass ? 'glass' : 'bg-white dark:bg-gray-900'
      } rounded-xl shadow-soft border border-gray-100/50 dark:border-gray-800 ${className}`}
    >
      {children}
    </motion.div>
  )
}
