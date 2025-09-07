import { motion } from 'framer-motion'

export default function Features() {
  const items = [
    {
      icon: '🏛️',
      title: 'Government Schemes',
      desc: 'Access comprehensive information about poverty, education, and hunger relief programs.',
      color: 'blue'
    },
    {
      icon: '🗺️',
      title: 'Interactive Map',
      desc: 'Visualize issues in real-time with severity-based markers and location tracking.',
      color: 'green'
    },
    {
      icon: '🌍',
      title: 'Multilingual Support',
      desc: 'Available in English, हिंदी, and বাংলা for inclusive accessibility.',
      color: 'purple'
    },
    {
      icon: '📊',
      title: 'Real-time Analytics',
      desc: 'Track progress with live statistics and transparent reporting dashboards.',
      color: 'indigo'
    },
    {
      icon: '🤝',
      title: 'Community Driven',
      desc: 'Connect volunteers, NGOs, schools, and government for collaborative solutions.',
      color: 'pink'
    },
    {
      icon: '🎯',
      title: 'Impact Tracking',
      desc: 'Monitor meal distribution, education progress, and health outcomes with AI verification.',
      color: 'orange'
    }
  ]

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-blue-600',
    pink: 'from-pink-500 to-rose-600',
    orange: 'from-orange-500 to-amber-600'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-20 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-blue-50/30 rounded-3xl"></div>

      <motion.div
        className="text-center mb-16 relative"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="text-4xl md:text-5xl font-bold mb-4 gradient-text"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          Powerful Features for Change
        </motion.h2>
        <motion.p
          className="text-xl text-gray-600 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Everything you need to report, track, and solve community issues with transparency and efficiency.
        </motion.p>
      </motion.div>

      <motion.div
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {items.map((feature, index) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            className="group relative p-8 rounded-2xl glass-effect border border-emerald-100/50 hover:shadow-2xl transition-all duration-500 cursor-pointer"
            whileHover={{
              y: -8,
              scale: 1.02,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-emerald-50/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative">
              <motion.div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${colorClasses[feature.color]} text-white text-2xl mb-6 shadow-lg animate-glow`}
                whileHover={{
                  scale: 1.15,
                  rotate: 5,
                  transition: { duration: 0.3 }
                }}
              >
                {feature.icon}
              </motion.div>

              <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-emerald-700 transition-colors">
                {feature.title}
              </h3>

              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors mb-4">
                {feature.desc}
              </p>

              <motion.div
                className="flex items-center text-sm font-medium text-emerald-500 group-hover:text-emerald-600 transition-colors"
                whileHover={{ x: 5 }}
              >
                Learn more
                <motion.svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

