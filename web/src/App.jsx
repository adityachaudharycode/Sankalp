import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Schemes from './components/Schemes'
import Testimonials from './components/Testimonials'
import CallToAction from './components/CallToAction'
import MapView from './components/MapView'
import Footer from './components/Footer'
import FloatingActionButton from './components/FloatingActionButton'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NGODashboard from './pages/NGODashboard'
import PublicDashboard from './pages/PublicDashboard'
import GovernmentDashboard from './pages/GovernmentDashboard'
import './index.css'
import Auth from './pages/Auth'

function Landing() {
  const { t } = useTranslation()
  const sampleMarkers = [
    { lat: 22.5726, lng: 88.3639, title: 'Food Distribution Issue - High Priority', severity: 'high' },
    { lat: 22.57, lng: 88.37, title: 'Education Support - Resolved', status: 'solved' },
    { lat: 22.58, lng: 88.36, title: 'Shelter Assistance - Low Priority', severity: 'low' },
    { lat: 22.56, lng: 88.35, title: 'Healthcare Access - Medium Priority', severity: 'medium' },
    { lat: 22.59, lng: 88.38, title: 'Clean Water Initiative - Resolved', status: 'solved' },
  ]

  return (
    <div className="min-h-screen text-gray-900 relative overflow-x-hidden">
      {/* Background with subtle pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-white to-blue-50/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]"></div>
      </div>

      <Navbar />

      {/* Add padding top to account for fixed navbar */}
      <div className="pt-16 md:pt-20">
        <Hero />
        <section id="features">
          <Features />
        </section>
        <section id="schemes">
          <Schemes />
        </section>
        <section id="map" className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text animate-fade-in-up">
              Live Issue Map
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 animate-fade-in-up animation-delay-200">
              Real-time visualization of community issues and their resolution status across different locations.
            </p>
          </div>
          <div className="glass-effect rounded-2xl shadow-xl p-6 border border-emerald-100/50 animate-scale-in animation-delay-400">
            <MapView markers={sampleMarkers} />
          </div>
        </section>
        <section id="testimonials">
          <Testimonials />
        </section>
        <CallToAction />
        <Footer />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/Auth" element={<Auth />} />
          <Route path="/login" element={<Auth/>} />
          <Route path="/register" element={<Auth />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/ngo-test" element={<NGODashboard />} />
          <Route path="/public-test" element={<PublicDashboard />} />
          <Route path="/govt-test" element={<GovernmentDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
