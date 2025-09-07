import React, { useState } from 'react'
import { addSampleNGOs } from '../utils/sampleNGOData'
import toast from 'react-hot-toast'

export default function AdminDataInitializer() {
  const [loading, setLoading] = useState(false)

  const handleAddSampleNGOs = async () => {
    setLoading(true)
    try {
      const result = await addSampleNGOs()
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to add sample NGOs: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            🔧 Development Tools
          </h3>
          <p className="text-blue-600 text-sm">
            Initialize sample NGO data for testing the blockchain donation system
          </p>
        </div>
        <button
          onClick={handleAddSampleNGOs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding NGOs...' : 'Add Sample NGOs'}
        </button>
      </div>
    </div>
  )
}
