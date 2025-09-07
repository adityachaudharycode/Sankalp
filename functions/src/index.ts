import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

// Set custom claims for user roles
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Only allow authenticated users
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { uid, role } = data
  
  // Validate role
  const validRoles = ['public', 'ngo', 'volunteer', 'school', 'government']
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role')
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role })
    return { success: true }
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to set user role')
  }
})

// YOLO webhook for student counting
export const processYoloDetection = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const { imageUrl, schoolId, mealId } = req.body
    
    // Mock YOLO detection - replace with actual YOLO API call
    const mockStudentCount = Math.floor(Math.random() * 20) + 5
    
    // Update meal record with YOLO count
    await admin.firestore().collection('schoolMeals').doc(mealId).update({
      modelCount: mockStudentCount,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ studentCount: mockStudentCount })
  } catch (error) {
    console.error('YOLO processing error:', error)
    res.status(500).json({ error: 'Failed to process image' })
  }
})

// Update user points when issue is solved
export const updateUserPoints = functions.firestore
  .document('issues/{issueId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Check if issue was just solved
    if (before.status !== 'solved' && after.status === 'solved' && after.solvedBy) {
      try {
        const userRef = admin.firestore().collection('users').doc(after.solvedBy)
        const userDoc = await userRef.get()
        
        if (userDoc.exists) {
          const currentPoints = userDoc.data()?.points || 0
          const pointsToAdd = after.severity === 'high' ? 15 : after.severity === 'medium' ? 10 : 5
          
          await userRef.update({
            points: currentPoints + pointsToAdd
          })
        }
      } catch (error) {
        console.error('Error updating user points:', error)
      }
    }
  })
