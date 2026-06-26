import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden`}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
