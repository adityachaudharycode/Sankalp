# Firebase Rules Setup - Fix Permission Errors

## 🚨 **URGENT: Fix Permission Denied Errors**

The errors you're seeing are caused by restrictive Firebase Firestore security rules. Here's how to fix them:

## 🔧 **Quick Fix (2 minutes)**

### **Step 1: Go to Firebase Console**
1. Open https://console.firebase.google.com/
2. Select your project (sankalp4.0)
3. Click **"Firestore Database"** in the left sidebar
4. Click **"Rules"** tab at the top

### **Step 2: Apply Development Rules**
Copy and paste this into the rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users to read/write (DEVELOPMENT ONLY)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Step 3: Publish Rules**
1. Click **"Publish"** button
2. Wait for confirmation message
3. Refresh your website

## ✅ **Expected Results After Fix**

Once you apply the rules, you should see:
- ✅ Sample NGOs automatically loaded
- ✅ Sample donations created
- ✅ No more permission errors in console
- ✅ Donation system fully functional

## 🔍 **What Was Happening**

The errors occurred because:
1. **`ngo_profiles` collection**: Couldn't create sample NGO data
2. **`donations` collection**: Couldn't create sample donation records
3. **Firestore listeners**: Couldn't read existing data

## 🎯 **Test After Applying Rules**

1. **Refresh the website** (http://localhost:5174/)
2. **Go to Public Dashboard** → "Donate" tab
3. **Check NGO Directory** - should show 6 sample NGOs
4. **Check console** - should show success messages:
   ```
   ✅ Added NGO: Hope Foundation
   ✅ Added NGO: Green Earth Initiative
   ✅ Added donation: 0.5 MATIC to Hope Foundation
   ```

## 🔒 **Production Rules (Later)**

For production, use the more secure rules from `firestore.rules` file which include:
- Proper authentication checks
- Role-based permissions
- Data validation
- User ownership verification

## 📞 **Still Having Issues?**

If you still see permission errors after applying the rules:

1. **Wait 1-2 minutes** for rules to propagate
2. **Hard refresh** the browser (Ctrl+F5)
3. **Check Firebase Console** → Authentication to ensure users are logged in
4. **Try logging out and back in** to refresh authentication tokens

## ⚠️ **Important Notes**

- The development rules above are **permissive** and should only be used for testing
- They allow any authenticated user to read/write any data
- For production, always use proper security rules with role-based access
- The `firestore.rules` file contains production-ready rules

---

**Apply the development rules now and your blockchain donation system will work perfectly!** 🚀
