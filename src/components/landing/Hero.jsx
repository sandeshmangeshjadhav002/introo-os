import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '../Button'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function Hero() {
  const features = [
    'All-in-one business operating system',
    'Trusted by 500+ companies worldwide',
    '24/7 customer support and onboarding'
  ]

  return (
    <section className="py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
            <CheckCircle size={16} />
            All-in-one Business OS
          </span>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
            Run your entire business from
            <br />
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              one powerful platform
            </span>
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
            CRM, project management, team chat, calendar, documents, HR, and finance — everything you need to run your business in one beautiful, intuitive interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/register">
              <Button size="lg" className="h-14 px-10 text-lg">
                Start Free Trial
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg">
                View Demo
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-text-secondary">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle size={18} className="text-success flex-shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-3xl p-3 shadow-soft"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-medium">
            <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { label: 'Active Users', value: '10,000+' },
                { label: 'Companies', value: '500+' },
                { label: 'Countries', value: '40+' },
              ].map((stat, i) => (
                <div key={i} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-4xl font-bold text-text-primary mb-2">{stat.value}</p>
                  <p className="text-text-secondary text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
