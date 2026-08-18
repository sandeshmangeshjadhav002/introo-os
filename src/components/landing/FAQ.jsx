import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Card from '../Card'

export default function FAQ({ faqs = [] }) {
  const [openId, setOpenId] = useState(null)

  if (!faqs.length) return null

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-[#64748B] dark:text-gray-400">Got questions? We've got answers</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id || faq.question} className="overflow-hidden">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full px-6 py-4 text-left flex justify-between items-center gap-4"
              >
                <span className="font-semibold text-lg text-[#0F172A] dark:text-gray-100">{faq.question}</span>
                <span className="text-[#64748B] dark:text-gray-400 shrink-0">
                  {openId === faq.id ? <ChevronUp /> : <ChevronDown />}
                </span>
              </button>
              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-4 text-[#64748B] dark:text-gray-400"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
