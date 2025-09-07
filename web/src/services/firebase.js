import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// TODO: replace with your Firebase web app config (env recommended)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Government Schemes Service
export const governmentSchemesService = {
  async getPovertyData() {
    try {
      const querySnapshot = await getDocs(collection(db, 'povertyData'))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching poverty data:', error)
      return []
    }
  },

  async getSchemes() {
    try {
      const querySnapshot = await getDocs(collection(db, 'governmentSchemes'))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching schemes:', error)
      return []
    }
  },

  async initializeSampleData() {
    try {
      // Sample poverty data
      const samplePovertyData = [
        {
          region: 'Delhi',
          povertyRate: 15.2,
          unemploymentRate: 8.5,
          literacyRate: 86.3,
          population: 32000000,
          coordinates: { lat: 28.6139, lng: 77.2090 }
        },
        {
          region: 'Mumbai',
          povertyRate: 18.7,
          unemploymentRate: 6.2,
          literacyRate: 89.2,
          population: 20400000,
          coordinates: { lat: 19.0760, lng: 72.8777 }
        },
        {
          region: 'Kolkata',
          povertyRate: 22.1,
          unemploymentRate: 9.8,
          literacyRate: 87.1,
          population: 14850000,
          coordinates: { lat: 22.5726, lng: 88.3639 }
        },
        {
          region: 'Chennai',
          povertyRate: 16.9,
          unemploymentRate: 7.3,
          literacyRate: 90.2,
          population: 10970000,
          coordinates: { lat: 13.0827, lng: 80.2707 }
        }
      ]

      // Sample government schemes
      const sampleSchemes = [
        {
          name: 'Pradhan Mantri Awas Yojana',
          description: 'Housing for All scheme',
          category: 'shelter',
          budget: 1200000000,
          beneficiaries: 12000000,
          status: 'active'
        },
        {
          name: 'Mid Day Meal Scheme',
          description: 'Free meals for school children',
          category: 'food',
          budget: 120000000,
          beneficiaries: 120000000,
          status: 'active'
        },
        {
          name: 'Ayushman Bharat',
          description: 'Health insurance for poor families',
          category: 'healthcare',
          budget: 6400000000,
          beneficiaries: 500000000,
          status: 'active'
        }
      ]

      // Add sample data to Firestore
      for (const data of samplePovertyData) {
        await addDoc(collection(db, 'povertyData'), data)
      }

      for (const scheme of sampleSchemes) {
        await addDoc(collection(db, 'governmentSchemes'), scheme)
      }

      console.log('Sample data initialized successfully')
    } catch (error) {
      console.error('Error initializing sample data:', error)
    }
  }
}
