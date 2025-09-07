import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../services/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const profileDoc = await getDoc(doc(db, 'users', user.uid))
        setUserProfile(profileDoc.exists() ? profileDoc.data() : null)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email, password, userData) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      uid: user.uid,
      email,
      createdAt: new Date(),
      points: 0
    })
    return user
  }

  const logout = () => signOut(auth)

  const value = {
    user,
    userProfile,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
