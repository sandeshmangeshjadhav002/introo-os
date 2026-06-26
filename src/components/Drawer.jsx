import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Drawer({ isOpen, onClose, title, children, position = 'right' }) {
  const positions = {
    left: 'left-0',
    right: 'right-0'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ [position]: '-100%' }}
            animate={{ [position]: 0 }}
            exit={{ [position]: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${positions[position]} bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col`}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
