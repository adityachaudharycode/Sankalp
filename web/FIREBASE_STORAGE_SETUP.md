# Firebase Storage Setup Instructions

## 🚨 **IMPORTANT: Fix Storage Permission Error**

The error `Firebase Storage: User does not have permission to access` occurs because Firebase Storage security rules are blocking uploads. Follow these steps to fix it:

## 📋 **Step 1: Apply Storage Rules**

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project** (sankalp4.0 or your project name)
3. **Navigate to Storage** in the left sidebar
4. **Click on "Rules" tab** at the top
5. **Replace the existing rules** with the content from `firebase-storage.rules` file

### Quick Fix (Temporary - for testing only):
If you want to test immediately, you can use these permissive rules temporarily:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING**: The above rules allow any authenticated user to upload/download anything. Use only for testing!

### Production Rules (Recommended):
Use the rules from `firebase-storage.rules` file which include:
- Proper authentication checks
- File type validation (images only)
- File size limits (10MB max)
- Path-based permissions
- User ownership validation

## 📋 **Step 2: Verify Authentication**

Make sure users are properly authenticated:

1. **Check Authentication Status**: Ensure user is logged in before uploading
2. **Verify User Object**: Check that `user.uid` exists
3. **Check Auth Token**: Ensure Firebase Auth token is valid

## 📋 **Step 3: Test the Upload**

1. **Login as NGO user**
2. **Go to NGO Dashboard → Image Uploads tab**
3. **Fill out the form and select an image**
4. **Click "Submit for Approval"**
5. **Check browser console for detailed logs**

## 🔧 **Debugging Steps**

If you still get errors:

### 1. Check Browser Console
Look for detailed error logs that start with:
- `🔄 Starting image upload...`
- `📁 Upload path:`
- `⬆️ Uploading to Firebase Storage...`

### 2. Verify Firebase Configuration
Check that your `.env` file has correct Firebase config:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Check Storage Bucket
Ensure your Firebase project has Storage enabled:
1. Go to Firebase Console → Storage
2. If not set up, click "Get started"
3. Choose your location and security rules

### 4. Verify User Authentication
In browser console, check:
```javascript
// Check if user is authenticated
console.log('Current user:', firebase.auth().currentUser)
```

## 🎯 **Expected Behavior After Fix**

1. **NGO uploads image** → Success message appears
2. **Government dashboard** → Image appears in "NGO Approval" tab
3. **Government approves** → NGO gets points
4. **NGO leaderboard** → Rankings update automatically

## 📞 **Still Having Issues?**

If the problem persists:

1. **Check Firebase Console Logs**: Go to Firebase Console → Functions → Logs
2. **Verify Billing**: Ensure Firebase project has billing enabled (required for Storage)
3. **Check Quotas**: Verify you haven't exceeded storage limits
4. **Try Different Browser**: Test in incognito mode
5. **Clear Cache**: Clear browser cache and localStorage

## 🔄 **Alternative Quick Fix**

If you need immediate testing, you can temporarily modify the upload path in the code:

```javascript
// Change this line in NGODashboard.jsx
const storagePath = `temp/${user.uid}-${timestamp}-${safeFileName}`
```

This uploads to the `temp/` folder which has more permissive rules.

---

**Remember**: Always use proper security rules in production to protect your users' data!
