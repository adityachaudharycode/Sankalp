import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const change = (lng) => i18n.changeLanguage(lng)

  const languages = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'hi', label: 'हिं', flag: '🇮🇳' },
    { code: 'bn', label: 'বাং', flag: '🇧🇩' }
  ]

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {languages.map(lang => (
        <button
          key={lang.code}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
            i18n.language === lang.code
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
          onClick={() => change(lang.code)}
        >
          <span className="flex items-center gap-1">
            <span className="text-xs">{lang.flag}</span>
            {lang.label}
          </span>
        </button>
      ))}
    </div>
  )
}

