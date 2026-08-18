import { motion } from 'framer-motion'
import Card from '../Card'
import { MessageSquare } from 'lucide-react'

export default function Testimonials({ testimonials = [] }) {
  if (!testimonials.length) return null

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">What our customers say</h2>
          <p className="text-xl text-[#64748B] dark:text-gray-400">Trusted by thousands of businesses</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full flex flex-col">
                <MessageSquare size={28} className="text-[#2563EB] mb-4" />
                <div className="text-yellow-400 mb-4">★★★★★</div>
                <p className="text-[#475569] dark:text-gray-300 mb-6 italic flex-1">"{testimonial.content}"</p>
                <div>
                  <p className="font-bold text-[#0F172A] dark:text-gray-100">{testimonial.name}</p>
                  <p className="text-[#64748B] dark:text-gray-400 text-sm">{testimonial.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
