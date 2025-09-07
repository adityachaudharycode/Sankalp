import React, { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'

export default function FirebaseRulesChecker() {
  const { user } = useAuth()
  const [rulesStatus, setRulesStatus] = useState({
    canRead: null,
    canWrite: null,
    testing: false,
    error: null
  })

  const testFirebaseRules = async () => {
    if (!user) {
      setRulesStatus({
        canRead: false,
        canWrite: false,
        testing: false,
        error: 'User not authenticated'
      })
      return
    }

    setRulesStatus(prev => ({ ...prev, testing: true, error: null }))

    try {
      // Test read permissions
      console.log('🔍 Testing Firestore read permissions...')
      const testQuery = collection(db, 'ngo_profiles')
      await getDocs(testQuery)
      console.log('✅ Read permissions: OK')
      
      // Test write permissions
      console.log('🔍 Testing Firestore write permissions...')
      const testDoc = await addDoc(collection(db, 'test_collection'), {
        testData: 'Firebase rules test',
        timestamp: new Date(),
        userId: user.uid
      })
      console.log('✅ Write permissions: OK')
      
      // Clean up test document
      await deleteDoc(testDoc)
      console.log('✅ Delete permissions: OK')

      setRulesStatus({
        canRead: true,
        canWrite: true,
        testing: false,
        error: null
      })
    } catch (error) {
      console.error('❌ Firebase rules test failed:', error)
      
      let canRead = false
      let canWrite = false
      
      // Try to determine what failed
      try {
        await getDocs(collection(db, 'ngo_profiles'))
        canRead = true
      } catch (readError) {
        console.error('❌ Read test failed:', readError)
      }

      setRulesStatus({
        canRead,
        canWrite,
        testing: false,
        error: error.message
      })
    }
  }

  useEffect(() => {
    if (user) {
      testFirebaseRules()
    }
  }, [user])

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800">Authentication Required</h4>
            <p className="text-sm text-yellow-700">Please log in to test Firebase permissions</p>
          </div>
        </div>
      </div>
    )
  }

  if (rulesStatus.testing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div>
            <h4 className="font-medium text-blue-800">Testing Firebase Rules...</h4>
            <p className="text-sm text-blue-700">Checking read/write permissions</p>
          </div>
        </div>
      </div>
    )
  }

  if (rulesStatus.error && !rulesStatus.canRead && !rulesStatus.canWrite) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-red-600 text-lg">❌</span>
          <div className="flex-1">
            <h4 className="font-medium text-red-800 mb-2">Firebase Permission Denied</h4>
            <p className="text-sm text-red-700 mb-3">
              The donation system cannot access Firebase due to security rules restrictions.
            </p>
            <div className="bg-red-100 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-800 font-mono">{rulesStatus.error}</p>
            </div>
            <div className="space-y-2 text-sm text-red-700">
              <p><strong>Quick Fix:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a></li>
                <li>Select your project → Firestore Database → Rules</li>
                <li>Replace rules with development-friendly version</li>
                <li>Click "Publish" and refresh this page</li>
              </ol>
            </div>
            <button
              onClick={testFirebaseRules}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Test Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (rulesStatus.canRead && rulesStatus.canWrite) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-green-600 text-lg">✅</span>
          <div>
            <h4 className="font-medium text-green-800">Firebase Rules: Working</h4>
            <p className="text-sm text-green-700">
              Read ✅ | Write ✅ | Blockchain donation system ready!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-yellow-600 text-lg">⚠️</span>
        <div>
          <h4 className="font-medium text-yellow-800">Partial Firebase Access</h4>
          <p className="text-sm text-yellow-700">
            Read: {rulesStatus.canRead ? '✅' : '❌'} | 
            Write: {rulesStatus.canWrite ? '✅' : '❌'}
          </p>
          <button
            onClick={testFirebaseRules}
            className="mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
          >
            Test Again
          </button>
        </div>
      </div>
    </div>
  )
}
