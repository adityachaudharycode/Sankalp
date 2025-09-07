import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    appName: 'SANKALP',
    login: 'Login',
    register: 'Register',
    landingTitle: 'Connect public, NGOs, schools and government',
    landingDesc: 'SANKALP - A commitment to end hunger, erase poverty, and empower minds. Report issues, solve them, track meals and education — with transparency.',
    schemes: 'Government Schemes',
    mapIssues: 'Map of Issues',
    multilingual: 'Multilingual',
  }},
  hi: { translation: {
    appName: 'संकल्प',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    landingTitle: 'जनता, एनजीओ, स्कूल और सरकार को जोड़ें',
    landingDesc: 'संकल्प - भूख मिटाने, गरीबी हटाने और मन को सशक्त बनाने की प्रतिबद्धता। मुद्दे रिपोर्ट करें, हल करें, भोजन और शिक्षा ट्रैक करें — पारदर्शिता के साथ।',
    schemes: 'सरकारी योजनाएँ',
    mapIssues: 'समस्याओं का मानचित्र',
    multilingual: 'बहुभाषी',
  }},
  bn: { translation: {
    appName: 'সংকল্প',
    login: 'লগইন',
    register: 'রেজিস্টার',
    landingTitle: 'জনগণ, এনজিও, স্কুল এবং সরকারকে সংযুক্ত করুন',
    landingDesc: 'সংকল্প - ক্ষুধা নিবারণ, দারিদ্র্য দূরীকরণ এবং মনকে ক্ষমতায়নের অঙ্গীকার। সমস্যা রিপোর্ট করুন, সমাধান করুন, খাবার ও শিক্ষা ট্র্যাক করুন — স্বচ্ছতার সাথে।',
    schemes: 'সরকারি প্রকল্প',
    mapIssues: 'সমস্যার মানচিত্র',
    multilingual: 'বহুভাষিক',
  }},
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n

