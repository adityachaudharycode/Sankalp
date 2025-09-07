import { useState } from 'react'

const tabs = {
  Poverty: {
    icon: '💰',
    color: 'blue',
    schemes: [
      { name: 'PM Jan Dhan Yojana', desc: 'Financial inclusion program ensuring access to banking services', link: 'https://pmjdy.gov.in/' },
      { name: 'NSAP', desc: 'National Social Assistance Programme for elderly, widows, and disabled', link: 'https://nsap.nic.in/' },
      { name: 'MGNREGA', desc: 'Rural employment guarantee scheme providing 100 days of work', link: 'https://nrega.nic.in/' },
      { name: 'PM-KISAN', desc: 'Direct income support to farmers with ₹6000 per year', link: 'https://pmkisan.gov.in/' },
    ]
  },
  Education: {
    icon: '📚',
    color: 'green',
    schemes: [
      { name: 'Sarva Shiksha Abhiyan', desc: 'Universal elementary education for all children aged 6-14', link: 'https://samagra.education.gov.in/' },
      { name: 'Mid-Day Meal Scheme', desc: 'Free lunch program in government schools', link: 'https://pmposhan.education.gov.in/' },
      { name: 'Beti Bachao Beti Padhao', desc: 'Save and educate the girl child initiative', link: 'https://wcd.nic.in/bbbp-scheme' },
      { name: 'Digital India', desc: 'Technology-enabled education and digital literacy', link: 'https://digitalindia.gov.in/' },
    ]
  },
  Hunger: {
    icon: '🍽️',
    color: 'orange',
    schemes: [
      { name: 'PM Garib Kalyan Anna Yojana', desc: 'Free food grains to 80 crore beneficiaries', link: 'https://www.pdsportal.nic.in/' },
      { name: 'POSHAN Abhiyaan', desc: 'National nutrition mission to reduce malnutrition', link: 'https://www.poshanabhiyaan.gov.in/' },
      { name: 'Integrated Child Development Services', desc: 'Nutrition and health services for children and mothers', link: 'https://icds-wcd.nic.in/' },
      { name: 'Antyodaya Anna Yojana', desc: 'Subsidized food for the poorest families', link: 'https://dfpd.gov.in/' },
    ]
  },
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600 border-blue-200 bg-blue-50',
  green: 'from-green-500 to-green-600 border-green-200 bg-green-50',
  orange: 'from-orange-500 to-orange-600 border-orange-200 bg-orange-50'
}

export default function Schemes() {
  const [current, setCurrent] = useState('Poverty')
  const currentTab = tabs[current]

  return (
    <section className="max-w-7xl mx-auto px-4 py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Government Schemes
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore comprehensive government programs designed to address poverty, education, and hunger across India.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {Object.entries(tabs).map(([key, tab]) => (
          <button
            key={key}
            onClick={() => setCurrent(key)}
            className={`group px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              current === key
                ? `bg-gradient-to-r ${colorClasses[tab.color].split(' ')[0]} ${colorClasses[tab.color].split(' ')[1]} text-white shadow-lg`
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{tab.icon}</span>
              {key}
            </span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {currentTab.schemes.map((scheme, index) => (
          <a
            key={scheme.name}
            href={scheme.link}
            target="_blank"
            rel="noreferrer"
            className="group p-6 rounded-2xl bg-white border border-gray-200 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r ${colorClasses[currentTab.color].split(' ')[0]} ${colorClasses[currentTab.color].split(' ')[1]} flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300`}>
                {currentTab.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                  {scheme.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3 group-hover:text-gray-700 transition-colors">
                  {scheme.desc}
                </p>
                <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                  Visit official website
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

