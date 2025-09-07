import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

function useCountUp(target, duration = 2000) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          let raf
          const start = performance.now()
          const loop = (now) => {
            const p = Math.min(1, (now - start) / duration)
            setValue(Math.floor(p * target))
            if (p < 1) raf = requestAnimationFrame(loop)
          }
          raf = requestAnimationFrame(loop)
          return () => cancelAnimationFrame(raf)
        }
      },
      { threshold: 0.3 }
    )

    const element = document.getElementById('stats-section')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [target, duration, started])

  return value
}

export default function Hero() {
  const { t } = useTranslation()
  const served = useCountUp(2847)
  const issues = useCountUp(1256)
  const volunteers = useCountUp(342)
  const schools = useCountUp(89)

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-60"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -50, 20, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-60"
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -20, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-bl from-emerald-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-60"
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.05, 0.95, 1]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-100 via-blue-100 to-purple-100 text-emerald-800 text-sm font-medium mb-8 shadow-lg hover:shadow-xl cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="animate-pulse mr-2">🌟</span>
            SANKALP - Connecting Communities for Change
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 gradient-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t('landingTitle')}
          </motion.h1>

          <motion.p
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t('landingDesc')}
          </motion.p>
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {[
              { icon: "🍽️", text: "End Hunger", color: "from-emerald-100 to-green-100" },
              { icon: "💰", text: "Erase Poverty", color: "from-blue-100 to-indigo-100" },
              { icon: "🧠", text: "Empower Minds", color: "from-purple-100 to-pink-100" }
            ].map((item, index) => (
              <motion.div
                key={item.text}
                className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r ${item.color} backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl animate-bounce-slow">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <motion.a
              href="#report"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center gap-2">
                📢 Report Issue
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </motion.a>

            <motion.a
              href="#map"
              className="px-8 py-4 rounded-xl border-2 border-emerald-300 text-gray-700 font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-all glass-effect"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              🗺️ Explore Map
            </motion.a>
          </motion.div>
        </div>

        {/* Enhanced Stats Section */}
        <motion.div
          id="stats-section"
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <Stat icon="👥" label="People Served" value={served} color="emerald" index={0} />
          <Stat icon="✅" label="Issues Resolved" value={issues} color="blue" index={1} />
          <Stat icon="🤝" label="Active Volunteers" value={volunteers} color="purple" index={2} />
          <Stat icon="🏫" label="Partner Schools" value={schools} color="indigo" index={3} />
        </motion.div>
      </div>
    </section>
  )
}

function Stat({ icon, label, value, color, index }) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  return (
    <motion.div
      className="group p-6 rounded-2xl glass-effect border border-emerald-100/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-center">
        <motion.div
          className="text-4xl mb-3"
          whileHover={{ scale: 1.2, rotate: 10 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.div>
        <motion.div
          className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent mb-2`}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          {value.toLocaleString()}+
        </motion.div>
        <div className="text-gray-600 text-sm font-medium group-hover:text-gray-800 transition-colors">{label}</div>
        <motion.div
          className="mt-3 h-1 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 rounded-full"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
    </motion.div>
  )
}

