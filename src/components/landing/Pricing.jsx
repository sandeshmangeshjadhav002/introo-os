import { motion } from 'framer-motion'
import Card from '../Card'
import Button from '../Button'
import { Check } from 'lucide-react'

export default function Pricing({ plans = [] }) {
  if (!plans.length) return null

  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-xl text-[#64748B] dark:text-gray-400">Choose the plan that fits your business</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`p-8 h-full flex flex-col ${plan.popular ? 'border-2 border-[#2563EB]' : ''}`}>
                {plan.popular && (
                  <span className="inline-block px-3 py-1 bg-[#2563EB] text-white text-xs rounded-full mb-4">Most Popular</span>
                )}
                <h3 className="text-2xl font-bold mb-2 text-[#0F172A] dark:text-gray-100">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-[#0F172A] dark:text-gray-100">${plan.price}</span>
                  <span className="text-[#64748B] dark:text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start text-[#475569] dark:text-gray-300 gap-2">
                      <Check size={18} className="text-[#22C55E] mt-0.5 shrink-0" /> <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? 'primary' : 'outline'}>
                  Get Started
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
