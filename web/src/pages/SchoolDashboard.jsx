import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { db, storage } from '../services/firebase'
import { collection, addDoc, query, where, onSnapshot, orderBy, doc, setDoc, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import * as XLSX from 'xlsx'
import toast, { Toaster } from 'react-hot-toast'
import {
  AcademicCapIcon,
  UserGroupIcon,
  CameraIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  CalendarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
)

export default function SchoolDashboard() {
  const { user, userProfile, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [processedImage, setProcessedImage] = useState(null)
  const [faceDetectionResults, setFaceDetectionResults] = useState(null)

  // Setup form for first-time users
  const [setupForm, setSetupForm] = useState({
    className: '',
    section: '',
    totalStudents: ''
  })

  // Test function to create a sample class
  const createTestClass = async () => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    try {
      console.log('Creating test class...')
      await addDoc(collection(db, 'schoolClasses'), {
        className: 'Test Class',
        section: 'A',
        totalStudents: 30,
        schoolId: user.uid,
        schoolName: userProfile?.schoolName || 'Test School',
        createdAt: new Date()
      })
      toast.success('Test class created successfully!')
    } catch (error) {
      console.error('Error creating test class:', error)
      toast.error(`Failed to create test class: ${error.message}`)
    }
  }

  // Local storage helper functions
  const saveImageToLocalStorage = (imageData, filename) => {
    try {
      const localImages = JSON.parse(localStorage.getItem('schoolImages') || '[]')
      const imageEntry = {
        id: Date.now().toString(),
        filename,
        data: imageData,
        timestamp: new Date().toISOString(),
        schoolId: user?.uid,
        uploaded: false
      }
      localImages.push(imageEntry)

      // Keep only last 50 images to prevent storage overflow
      if (localImages.length > 50) {
        localImages.splice(0, localImages.length - 50)
      }

      localStorage.setItem('schoolImages', JSON.stringify(localImages))
      return imageEntry.id
    } catch (error) {
      console.error('Failed to save image to local storage:', error)
      return null
    }
  }

  const getImageFromLocalStorage = (imageId) => {
    try {
      const localImages = JSON.parse(localStorage.getItem('schoolImages') || '[]')
      return localImages.find(img => img.id === imageId)
    } catch (error) {
      console.error('Failed to get image from local storage:', error)
      return null
    }
  }

  const getLocalStorageStats = () => {
    try {
      const localImages = JSON.parse(localStorage.getItem('schoolImages') || '[]')
      const userImages = localImages.filter(img => img.schoolId === user?.uid)
      const totalSize = JSON.stringify(localImages).length
      return {
        count: userImages.length,
        totalCount: localImages.length,
        sizeKB: Math.round(totalSize / 1024),
        maxSizeKB: 5120 // 5MB limit for localStorage
      }
    } catch (error) {
      return { count: 0, totalCount: 0, sizeKB: 0, maxSizeKB: 5120 }
    }
  }

  const clearOldLocalImages = () => {
    try {
      const localImages = JSON.parse(localStorage.getItem('schoolImages') || '[]')
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentImages = localImages.filter(img => new Date(img.timestamp) > oneWeekAgo)
      localStorage.setItem('schoolImages', JSON.stringify(recentImages))
      toast.success(`Cleared ${localImages.length - recentImages.length} old images from local storage`)
    } catch (error) {
      toast.error('Failed to clear old images')
    }
  }

  // Handle image file selection with preview
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB')
        return
      }

      setImageForm(prev => ({ ...prev, photo: file }))

      // Create preview URL and save to local storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target.result
        setImagePreview(imageData)

        // Save to local storage as backup
        const filename = `${file.name}_${Date.now()}`
        const localId = saveImageToLocalStorage(imageData, filename)
        if (localId) {
          console.log('Image saved to local storage with ID:', localId)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Student registration form
  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNumber: '',
    classId: '',
    parentContact: '',
    address: ''
  })

  // Daily attendance form
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyAttendance, setDailyAttendance] = useState({})

  // Image upload form
  const [imageForm, setImageForm] = useState({
    photo: null,
    classId: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  useEffect(() => {
    if (!user) return

    // Load classes
    console.log('Setting up classes listener for user:', user.uid)
    const classesQuery = query(
      collection(db, 'schoolClasses'),
      where('schoolId', '==', user.uid)
    )
    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      console.log('Classes snapshot received:', snapshot.docs.length, 'documents')
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const aTime = a.createdAt?.toDate?.() || new Date(0)
        const bTime = b.createdAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })
      console.log('Classes data:', classesData)
      setClasses(classesData)
      setIsFirstTime(classesData.length === 0)
    }, (error) => {
      console.error('Error fetching classes:', error)
      toast.error(`Error fetching classes: ${error.message}`)
    })

    // Load students
    const studentsQuery = query(
      collection(db, 'students'),
      where('schoolId', '==', user.uid)
    )
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const aTime = a.createdAt?.toDate?.() || new Date(0)
        const bTime = b.createdAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })
      setStudents(studentsData)
    })

    // Load attendance
    const attendanceQuery = query(
      collection(db, 'dailyAttendance'),
      where('schoolId', '==', user.uid)
    )
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAttendance(attendanceData)
    })

    // Load image analysis results
    const mealsQuery = query(
      collection(db, 'imageAnalysis'),
      where('schoolId', '==', user.uid)
    )
    const unsubscribeMeals = onSnapshot(mealsQuery, (snapshot) => {
      const mealsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMeals(mealsData)
    })

    return () => {
      unsubscribeClasses()
      unsubscribeStudents()
      unsubscribeAttendance()
      unsubscribeMeals()
    }
  }, [user])

  // Handle class setup for first-time users
  const handleSetupSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!setupForm.className.trim()) {
      toast.error('Please enter a class name')
      setLoading(false)
      return
    }

    if (!setupForm.section.trim()) {
      toast.error('Please enter a section')
      setLoading(false)
      return
    }

    if (!setupForm.totalStudents || parseInt(setupForm.totalStudents) <= 0) {
      toast.error('Please enter a valid number of students')
      setLoading(false)
      return
    }

    if (!user) {
      toast.error('User not authenticated. Please log in again.')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting to create class with data:', {
        ...setupForm,
        schoolId: user.uid,
        schoolName: userProfile?.schoolName,
        totalStudents: parseInt(setupForm.totalStudents),
        createdAt: new Date()
      })

      await addDoc(collection(db, 'schoolClasses'), {
        ...setupForm,
        schoolId: user.uid,
        schoolName: userProfile?.schoolName,
        totalStudents: parseInt(setupForm.totalStudents),
        createdAt: new Date()
      })

      setSetupForm({ className: '', section: '', totalStudents: '' })
      toast.success('Class added successfully!')
      setActiveTab('students')
    } catch (error) {
      console.error('Error adding class:', error)
      toast.error(`Failed to add class: ${error.message || 'Unknown error'}`)
    }
    setLoading(false)
  }

  // Handle student registration
  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const selectedClassData = classes.find(c => c.id === studentForm.classId)
      if (!selectedClassData) {
        toast.error('Please select a valid class')
        setLoading(false)
        return
      }

      // Check if class has reached its student limit
      const currentStudentsInClass = students.filter(student => student.classId === studentForm.classId)
      const classLimit = selectedClassData.totalStudents

      if (currentStudentsInClass.length >= classLimit) {
        toast.error(`Cannot add more students! Class ${selectedClassData.className} - Section ${selectedClassData.section} has reached its limit of ${classLimit} students.`)
        setLoading(false)
        return
      }

      // Check for duplicate roll numbers in the same class
      const duplicateRollNumber = currentStudentsInClass.find(student =>
        student.rollNumber === studentForm.rollNumber
      )

      if (duplicateRollNumber) {
        toast.error(`Roll number ${studentForm.rollNumber} already exists in this class!`)
        setLoading(false)
        return
      }

      console.log('Attempting to register student with data:', {
        ...studentForm,
        schoolId: user.uid,
        className: selectedClassData?.className,
        section: selectedClassData?.section,
        createdAt: new Date()
      })

      await addDoc(collection(db, 'students'), {
        ...studentForm,
        schoolId: user.uid,
        className: selectedClassData?.className,
        section: selectedClassData?.section,
        createdAt: new Date()
      })
      setStudentForm({
        name: '',
        rollNumber: '',
        classId: '',
        parentContact: '',
        address: ''
      })
      toast.success(`Student registered successfully! (${currentStudentsInClass.length + 1}/${classLimit} students in class)`)
    } catch (error) {
      console.error('Error registering student:', error)
      toast.error(`Failed to register student: ${error.message || 'Unknown error'}`)
    }
    setLoading(false)
  }

  // Handle daily attendance submission
  const handleAttendanceSubmit = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first')
      return
    }

    setLoading(true)
    try {
      // Check if attendance already exists for this class and date
      const dateStr = new Date(attendanceDate).toDateString()
      const existingAttendance = attendance.find(record =>
        record.classId === selectedClass.id &&
        record.date?.toDate?.()?.toDateString() === dateStr
      )

      if (existingAttendance) {
        toast.error(`Attendance for ${selectedClass.className} - Section ${selectedClass.section} on ${dateStr} has already been recorded!`)
        setLoading(false)
        return
      }

      const attendanceData = {
        schoolId: user.uid,
        classId: selectedClass.id,
        className: selectedClass.className,
        section: selectedClass.section,
        date: new Date(attendanceDate),
        attendance: dailyAttendance,
        totalStudents: Object.keys(dailyAttendance).length,
        presentCount: Object.values(dailyAttendance).filter(status => status === 'present').length,
        createdAt: new Date()
      }

      await addDoc(collection(db, 'dailyAttendance'), attendanceData)
      setDailyAttendance({})
      toast.success('Attendance recorded successfully!')
    } catch (error) {
      console.error('Error recording attendance:', error)
      toast.error(`Failed to record attendance: ${error.message}`)
    }
    setLoading(false)
  }

  // Handle image upload and face detection
  const handleImageSubmit = async (e) => {
    e.preventDefault()
    if (!imageForm.photo) {
      toast.error('Please upload an image')
      return
    }

    if (!imageForm.classId) {
      toast.error('Please select a class')
      return
    }

    setLoading(true)

    try {
      // Upload and process image with Flask backend
      console.log('Uploading and processing image with Flask backend...')

      const formData = new FormData()
      formData.append('image', imageForm.photo)

      const response = await fetch('http://localhost:5001/upload-and-process', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Flask processing completed:', result)

      // Check if there was an error
      if (result.error) {
        throw new Error(result.details || result.error)
      }

      // Save results to Firestore
      const selectedClassData = classes.find(c => c.id === imageForm.classId)
      const analysisData = {
        schoolId: user.uid,
        classId: imageForm.classId,
        className: selectedClassData?.className,
        section: selectedClassData?.section,
        imageUrl: `http://localhost:5001${result.original_image.url}`,
        annotatedImageUrl: `http://localhost:5001${result.annotated_image.url}`,
        detectedFaces: result.student_count || result.face_count || 0,
        totalStudentsInClass: selectedClassData?.totalStudents || 0,
        detectedFaceBoxes: result.faces || [],
        confidence: result.confidence || 0.85,
        date: new Date(imageForm.date),
        createdAt: new Date(),
        // Flask server storage info
        originalFilename: result.original_image.filename,
        annotatedFilename: result.annotated_image.filename,
        storageType: 'flask_server',
        yoloUsed: result.yolo_used,
        processedAt: result.processed_at
      }

      await addDoc(collection(db, 'imageAnalysis'), analysisData)

      // Set results for display
      setFaceDetectionResults({
        studentCount: result.student_count,
        face_count: result.face_count,
        detectedFaces: result.faces,
        confidence: result.confidence
      })
      setProcessedImage(result.annotated_image.base64)
      setAnalysisResult(analysisData)

      toast.success(`Face detection completed! Found ${result.student_count || result.face_count || 0} faces`)

      // Reset form but keep results visible
      setImageForm({
        photo: null,
        classId: '',
        date: new Date().toISOString().split('T')[0]
      })
      setImagePreview(null)
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error(`Failed to process image: ${error.message}`)
    }
    setLoading(false)
  }

  // Export comprehensive data to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new()
    const timestamp = new Date().toLocaleString()

    // Generate filename with timestamp
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
    const filename = `School_Data_${dateStr}_${timeStr}.xlsx`

    // Create separate sheets for each class attendance
    classes.forEach(classData => {
      const classAttendance = attendance.filter(record => record.classId === classData.id)
      const classStudents = students.filter(student => student.classId === classData.id)

      if (classAttendance.length > 0) {
        const attendanceData = []

        classAttendance.forEach(record => {
          const recordDate = record.date?.toDate?.()?.toLocaleDateString() || 'Unknown'
          const recordTime = record.createdAt?.toDate?.()?.toLocaleTimeString() || 'Unknown'

          // Add header row for each date
          attendanceData.push({
            'Date': recordDate,
            'Time Recorded': recordTime,
            'Class': `${record.className} - Section ${record.section}`,
            'Student Name': '',
            'Roll Number': '',
            'Status': '',
            'Total Present': record.presentCount,
            'Total Absent': record.totalStudents - record.presentCount,
            'Attendance Rate': `${((record.presentCount / record.totalStudents) * 100).toFixed(1)}%`
          })

          // Add individual student attendance
          Object.entries(record.attendance || {}).forEach(([studentId, status]) => {
            const student = classStudents.find(s => s.id === studentId)
            attendanceData.push({
              'Date': '',
              'Time Recorded': '',
              'Class': '',
              'Student Name': student?.name || 'Unknown',
              'Roll Number': student?.rollNumber || 'Unknown',
              'Status': status === 'present' ? 'Present' : 'Absent',
              'Total Present': '',
              'Total Absent': '',
              'Attendance Rate': ''
            })
          })

          // Add empty row for separation
          attendanceData.push({})
        })

        const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData)
        const sheetName = `${classData.className}_${classData.section}_Attendance`.replace(/[^\w]/g, '_')
        XLSX.utils.book_append_sheet(workbook, attendanceSheet, sheetName)
      }
    })

    // Export overall attendance summary
    if (attendance.length > 0) {
      const summaryData = attendance.map(record => ({
        Date: record.date?.toDate?.()?.toLocaleDateString() || 'Unknown',
        'Time Recorded': record.createdAt?.toDate?.()?.toLocaleString() || 'Unknown',
        Class: `${record.className} - ${record.section}`,
        'Total Students': record.totalStudents,
        'Present Count': record.presentCount,
        'Absent Count': record.totalStudents - record.presentCount,
        'Attendance Rate': `${((record.presentCount / record.totalStudents) * 100).toFixed(1)}%`
      }))

      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Attendance_Summary')
    }

    // Export students data - separate sheet per class
    classes.forEach(classData => {
      const classStudents = students.filter(student => student.classId === classData.id)

      if (classStudents.length > 0) {
        const studentsData = classStudents.map(student => ({
          'Student Name': student.name,
          'Roll Number': student.rollNumber,
          'Class': `${student.className} - ${student.section}`,
          'Parent Contact': student.parentContact || 'Not provided',
          'Address': student.address || 'Not provided',
          'Registration Date': student.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown',
          'Registration Time': student.createdAt?.toDate?.()?.toLocaleTimeString() || 'Unknown'
        }))

        const studentsSheet = XLSX.utils.json_to_sheet(studentsData)
        const sheetName = `${classData.className}_${classData.section}_Students`.replace(/[^\w]/g, '_')
        XLSX.utils.book_append_sheet(workbook, studentsSheet, sheetName)
      }
    })

    // Export overall students summary
    if (students.length > 0) {
      const studentData = students.map(student => {
        const classData = classes.find(c => c.id === student.classId)
        return {
          'Student Name': student.name,
          'Roll Number': student.rollNumber,
          'Class': classData ? `${classData.className} - ${classData.section}` : 'Unknown',
          'Parent Contact': student.parentContact || 'Not provided',
          'Address': student.address || 'Not provided',
          'Registration Date': student.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown',
          'Registration Time': student.createdAt?.toDate?.()?.toLocaleTimeString() || 'Unknown'
        }
      })

      const studentSheet = XLSX.utils.json_to_sheet(studentData)
      XLSX.utils.book_append_sheet(workbook, studentSheet, 'All_Students')
    }

    // Export face detection analysis
    if (meals.length > 0) {
      const analysisData = meals.map(record => ({
        Date: record.date?.toDate?.()?.toLocaleDateString() || 'Unknown',
        Class: `${record.className} - ${record.section}`,
        'Expected Students': record.totalStudentsInClass,
        'Detected Faces': record.detectedFaces,
        'Difference': record.detectedFaces - record.totalStudentsInClass,
        'Accuracy': record.totalStudentsInClass > 0
          ? `${Math.max(0, 100 - Math.abs(record.detectedFaces - record.totalStudentsInClass) / record.totalStudentsInClass * 100).toFixed(1)}%`
          : 'N/A',
        'Confidence': `${((record.confidence || 0.85) * 100).toFixed(1)}%`
      }))

      const analysisSheet = XLSX.utils.json_to_sheet(analysisData)
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Face Detection')
    }

    // Export class summary
    if (classes.length > 0) {
      const classData = classes.map(cls => {
        const classStudents = students.filter(s => s.classId === cls.id)
        const classAttendance = attendance.filter(a => a.classId === cls.id)
        const avgAttendance = classAttendance.length > 0
          ? classAttendance.reduce((sum, record) => sum + (record.presentCount / record.totalStudents), 0) / classAttendance.length * 100
          : 0

        return {
          'Class Name': cls.className,
          'Section': cls.section,
          'Total Students': cls.totalStudents,
          'Registered Students': classStudents.length,
          'Attendance Records': classAttendance.length,
          'Average Attendance': `${avgAttendance.toFixed(1)}%`,
          'Created Date': cls.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'
        }
      })

      const classSheet = XLSX.utils.json_to_sheet(classData)
      XLSX.utils.book_append_sheet(workbook, classSheet, 'Class Summary')
    }

    if (workbook.SheetNames.length === 0) {
      toast.error('No data to export')
      return
    }

    XLSX.writeFile(workbook, filename)
    toast.success('School report exported successfully!')
  }

  // Export data for a specific class
  const exportClassData = (classData) => {
    const workbook = XLSX.utils.book_new()

    // Generate filename with class info and timestamp
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
    const className = `${classData.className}_${classData.section}`.replace(/[^\w]/g, '_')
    const filename = `${className}_Data_${dateStr}_${timeStr}.xlsx`

    // Get class-specific data
    const classStudents = students.filter(student => student.classId === classData.id)
    const classAttendance = attendance.filter(record => record.classId === classData.id)
    const classAnalysis = meals.filter(record => record.classId === classData.id)

    // Export students for this class
    if (classStudents.length > 0) {
      const studentsData = classStudents.map(student => ({
        'Student Name': student.name,
        'Roll Number': student.rollNumber,
        'Class': `${student.className} - ${student.section}`,
        'Parent Contact': student.parentContact || 'Not provided',
        'Address': student.address || 'Not provided',
        'Registration Date': student.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown',
        'Registration Time': student.createdAt?.toDate?.()?.toLocaleTimeString() || 'Unknown'
      }))

      const studentsSheet = XLSX.utils.json_to_sheet(studentsData)
      XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students')
    }

    // Export attendance for this class
    if (classAttendance.length > 0) {
      const attendanceData = []

      classAttendance.forEach(record => {
        const recordDate = record.date?.toDate?.()?.toLocaleDateString() || 'Unknown'
        const recordTime = record.createdAt?.toDate?.()?.toLocaleTimeString() || 'Unknown'

        // Add header row for each date
        attendanceData.push({
          'Date': recordDate,
          'Time Recorded': recordTime,
          'Student Name': '',
          'Roll Number': '',
          'Status': '',
          'Total Present': record.presentCount,
          'Total Absent': record.totalStudents - record.presentCount,
          'Attendance Rate': `${((record.presentCount / record.totalStudents) * 100).toFixed(1)}%`
        })

        // Add individual student attendance
        Object.entries(record.attendance || {}).forEach(([studentId, status]) => {
          const student = classStudents.find(s => s.id === studentId)
          attendanceData.push({
            'Date': '',
            'Time Recorded': '',
            'Student Name': student?.name || 'Unknown',
            'Roll Number': student?.rollNumber || 'Unknown',
            'Status': status === 'present' ? 'Present' : 'Absent',
            'Total Present': '',
            'Total Absent': '',
            'Attendance Rate': ''
          })
        })

        // Add empty row for separation
        attendanceData.push({})
      })

      const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData)
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance')
    }

    // Export image analysis for this class
    if (classAnalysis.length > 0) {
      const analysisData = classAnalysis.map(record => ({
        'Date': record.date?.toDate?.()?.toLocaleDateString() || 'Unknown',
        'Analysis Time': record.createdAt?.toDate?.()?.toLocaleString() || 'Unknown',
        'Faces Detected': record.detectedFaces,
        'Expected Students': record.totalStudentsInClass,
        'Attendance Rate': record.totalStudentsInClass > 0
          ? `${((record.detectedFaces / record.totalStudentsInClass) * 100).toFixed(1)}%`
          : '0%',
        'Confidence': record.confidence ? `${(record.confidence * 100).toFixed(1)}%` : 'N/A',
        'Image URL': record.imageUrl || 'N/A'
      }))

      const analysisSheet = XLSX.utils.json_to_sheet(analysisData)
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Image_Analysis')
    }

    // Check if workbook has any sheets
    if (Object.keys(workbook.Sheets).length === 0) {
      toast.error(`No data available for ${classData.className} - Section ${classData.section}`)
      return
    }

    XLSX.writeFile(workbook, filename)
    toast.success(`Data for ${classData.className} - Section ${classData.section} exported successfully!`)
  }

  // Get students for selected class
  const getStudentsForClass = (classId) => {
    return students.filter(student => student.classId === classId)
  }

  // Toggle attendance for a student
  const toggleAttendance = (studentId, status) => {
    setDailyAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster position="top-right" />

      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <AcademicCapIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  School Dashboard
                </h1>
                <p className="text-gray-600">{userProfile?.schoolName}</p>
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Modern Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-blue-100">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
            { id: 'setup', label: 'Class Setup', icon: AcademicCapIcon },
            { id: 'students', label: 'Students', icon: UserGroupIcon },
            { id: 'attendance', label: 'Attendance', icon: CalendarIcon },
            { id: 'image-analysis', label: 'Face Detection', icon: CameraIcon },
            { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
              {tab.id === 'attendance' && attendance.length > 0 && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                  {attendance.length}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-2xl text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Classes</p>
                    <p className="text-3xl font-bold">{classes.length}</p>
                  </div>
                  <AcademicCapIcon className="h-12 w-12 text-blue-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Total Students</p>
                    <p className="text-3xl font-bold">{students.length}</p>
                  </div>
                  <UsersIcon className="h-12 w-12 text-green-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-2xl text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Attendance Records</p>
                    <p className="text-3xl font-bold">{attendance.length}</p>
                  </div>
                  <CalendarIcon className="h-12 w-12 text-purple-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-2xl text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Image Analysis</p>
                    <p className="text-3xl font-bold">{meals.length}</p>
                  </div>
                  <CameraIcon className="h-12 w-12 text-orange-200" />
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('attendance')}
                  className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Mark Attendance</p>
                    <p className="text-sm text-gray-600">Record daily attendance</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('image-analysis')}
                  className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <CameraIcon className="h-8 w-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Face Detection</p>
                    <p className="text-sm text-gray-600">Analyze student images</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportToExcel}
                  className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-8 w-8 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Export Data</p>
                    <p className="text-sm text-gray-600">Download Excel report</p>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Class Setup Section */}
        {activeTab === 'setup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PlusIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Add New Class</h2>
              </div>

              <form onSubmit={handleSetupSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class Name</label>
                  <input
                    type="text"
                    value={setupForm.className}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Class 5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                  <input
                    type="text"
                    value={setupForm.section}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, section: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Students</label>
                  <input
                    type="number"
                    value={setupForm.totalStudents}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, totalStudents: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter number of students"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? 'Adding...' : 'Add Class'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={createTestClass}
                  disabled={loading}
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  Create Test Class (Debug)
                </motion.button>
              </form>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Existing Classes</h2>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {classes.map(cls => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{cls.className} - Section {cls.section}</h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {cls.totalStudents} students
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Current: {students.filter(s => s.classId === cls.id).length}/{cls.totalStudents} enrolled
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => exportClassData(cls)}
                        className="ml-3 px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                        title={`Export data for ${cls.className} - Section ${cls.section}`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
                {classes.length === 0 && (
                  <div className="text-center py-12">
                    <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No classes added yet</p>
                    <p className="text-gray-400 text-sm">Add your first class to get started</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Student Registration Section */}
        {activeTab === 'students' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Register Student</h2>
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
                  <input
                    type="text"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Roll Number</label>
                  <input
                    type="text"
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, rollNumber: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter roll number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                  <select
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} - Section {cls.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Contact</label>
                  <input
                    type="tel"
                    value={studentForm.parentContact}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, parentContact: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Parent's phone number"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? 'Registering...' : 'Register Student'}
                </motion.button>
              </form>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Registered Students</h2>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {students.length} students
                </span>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {students.map(student => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-800">{student.name}</h3>
                        <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                        <p className="text-sm text-gray-600">{student.className} - {student.section}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Active
                      </span>
                    </div>
                  </motion.div>
                ))}
                {students.length === 0 && (
                  <div className="text-center py-12">
                    <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No students registered yet</p>
                    <p className="text-gray-400 text-sm">Register students to start taking attendance</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Interactive Attendance Section */}
        {activeTab === 'attendance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Class Selection and Date */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Daily Attendance</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
                  <select
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const classData = classes.find(c => c.id === e.target.value)
                      setSelectedClass(classData)
                      setDailyAttendance({})
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Choose a class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} - Section {cls.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex items-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={exportToExcel}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                    <span>Export Excel</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Student Attendance List */}
            {selectedClass && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedClass.className} - Section {selectedClass.section}
                  </h3>
                  <div className="flex space-x-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      Present: {Object.values(dailyAttendance).filter(status => status === 'present').length}
                    </span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                      Absent: {Object.values(dailyAttendance).filter(status => status === 'absent').length}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 mb-6">
                  {getStudentsForClass(selectedClass.id).map(student => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{student.name}</h4>
                          <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleAttendance(student.id, 'present')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            dailyAttendance[student.id] === 'present'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleAttendance(student.id, 'absent')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            dailyAttendance[student.id] === 'absent'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                          }`}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAttendanceSubmit}
                  disabled={loading || Object.keys(dailyAttendance).length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? 'Saving...' : 'Save Attendance'}
                </motion.button>
              </div>
            )}

            {/* Recent Attendance Records */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Attendance Records</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {attendance.slice(0, 10).map(record => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-800">{record.className} - {record.section}</h4>
                        <p className="text-sm text-gray-600">
                          {record.presentCount}/{record.totalStudents} present
                          ({((record.presentCount / record.totalStudents) * 100).toFixed(1)}%)
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                        {record.date?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {attendance.length === 0 && (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No attendance records yet</p>
                    <p className="text-gray-400 text-sm">Start marking attendance to see records here</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Image Analysis & Face Detection Section */}
        {activeTab === 'image-analysis' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Image Upload Form */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CameraIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Face Detection Analysis</h2>
                </div>

                {/* Storage Status */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Flask Server + YOLO</div>
                    <div className="text-sm font-medium text-gray-700">
                      Images stored in uploads folder
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-600">Flask + YOLO Ready</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleImageSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
                    <select
                      value={imageForm.classId}
                      onChange={(e) => setImageForm(prev => ({ ...prev, classId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Choose a class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.className} - Section {cls.section} ({cls.totalStudents} students)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={imageForm.date}
                      onChange={(e) => setImageForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Student Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                      required
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                          />
                          <p className="text-sm text-green-600">✓ {imageForm.photo?.name}</p>
                          <p className="text-xs text-gray-500">Click to change image</p>
                        </div>
                      ) : (
                        <div>
                          <CameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-700">Click to upload image</p>
                          <p className="text-sm text-gray-500">YOLO will detect faces automatically</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? 'Processing...' : 'Analyze Image with YOLO'}
                </motion.button>
              </form>
            </div>

            {/* Face Detection Results */}
            {faceDetectionResults && processedImage && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Detection Results</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <img
                      src={processedImage}
                      alt="Processed with face detection"
                      className="w-full rounded-xl shadow-lg border-2 border-red-200"
                    />
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
                      Red boxes show detected faces
                    </p>
                    {faceDetectionResults.detectedFaces && (
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {faceDetectionResults.detectedFaces.length} face regions detected
                      </p>
                    )}
                    {analysisResult && (
                      <div className="mt-2 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          analysisResult.storageType === 'flask_server'
                            ? 'bg-blue-100 text-blue-800'
                            : analysisResult.storageType === 'local'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {analysisResult.storageType === 'flask_server' ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              Flask + YOLO
                            </>
                          ) : analysisResult.storageType === 'local' ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                              </svg>
                              Local Storage
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/>
                              </svg>
                              Cloud Storage
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <h4 className="font-bold text-green-800 text-lg">Faces Detected</h4>
                      <p className="text-3xl font-bold text-green-600">{faceDetectionResults.detectedFaces.length}</p>
                    </div>

                    {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-blue-800 text-lg">Expected Students</h4>
                      <p className="text-3xl font-bold text-blue-600">
                        {classes.find(c => c.id === imageForm.classId)?.totalStudents || 0}
                      </p>
                    </div>

                    <div className={`p-6 rounded-xl border ${
                      Math.abs(faceDetectionResults.studentCount - (classes.find(c => c.id === imageForm.classId)?.totalStudents || 0)) <= 2
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                        : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                    }`}>
                      <h4 className={`font-bold text-lg ${
                        Math.abs(faceDetectionResults.studentCount - (classes.find(c => c.id === imageForm.classId)?.totalStudents || 0)) <= 2
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}>
                        Status
                      </h4>
                      <p className={`text-sm ${
                        Math.abs(faceDetectionResults.studentCount - (classes.find(c => c.id === imageForm.classId)?.totalStudents || 0)) <= 2
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {Math.abs(faceDetectionResults.studentCount - (classes.find(c => c.id === imageForm.classId)?.totalStudents || 0)) <= 2
                          ? 'Count matches expected range'
                          : 'Significant discrepancy detected'
                        } */}
                      {/* </p>
                    </div> */}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis History */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Analysis History</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {meals.map(record => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800">{record.className} - {record.section}</h4>
                        <p className="text-sm text-gray-600">
                          Detected: {record.detectedFaces} faces | Expected: {record.totalStudentsInClass}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                        {record.date?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                      </span>
                    </div>
                    {record.imageUrl && (
                      <div className="flex items-center space-x-2 mt-2">
                        <EyeIcon className="h-4 w-4 text-gray-500" />
                        <a
                          href={record.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View processed image
                        </a>
                      </div>
                    )}
                  </motion.div>
                ))}
                {meals.length === 0 && (
                  <div className="text-center py-12">
                    <CameraIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No analysis records yet</p>
                    <p className="text-gray-400 text-sm">Upload images to start face detection analysis</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Attendance vs Face Detection Comparison Chart */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Student Count Analysis</h2>
              </div>

              {meals.length > 0 && (
                <div className="h-96">
                  <Bar
                    data={{
                      labels: meals.slice(0, 10).map(record =>
                        `${record.className}-${record.section}`
                      ),
                      datasets: [
                        {
                          label: 'Expected Students',
                          data: meals.slice(0, 10).map(record => record.totalStudentsInClass),
                          backgroundColor: 'rgba(59, 130, 246, 0.5)',
                          borderColor: 'rgb(59, 130, 246)',
                          borderWidth: 2
                        },
                        {
                          label: 'Detected Faces',
                          data: meals.slice(0, 10).map(record => record.detectedFaces),
                          backgroundColor: 'rgba(16, 185, 129, 0.5)',
                          borderColor: 'rgb(16, 185, 129)',
                          borderWidth: 2
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Students in Class vs Detected in Images'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Attendance Trends */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Attendance Rate by Class</h3>
                {attendance.length > 0 && (
                  <div className="h-64">
                    <Doughnut
                      data={{
                        labels: [...new Set(attendance.map(record => `${record.className}-${record.section}`))],
                        datasets: [{
                          data: [...new Set(attendance.map(record => `${record.className}-${record.section}`))].map(classLabel => {
                            const classRecords = attendance.filter(record => `${record.className}-${record.section}` === classLabel)
                            const avgAttendance = classRecords.reduce((sum, record) =>
                              sum + (record.presentCount / record.totalStudents), 0) / classRecords.length
                            return (avgAttendance * 100).toFixed(1)
                          }),
                          backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(139, 92, 246, 0.8)',
                          ]
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Detection Accuracy</h3>
                {meals.length > 0 && (
                  <div className="space-y-4">
                    {meals.slice(0, 5).map(record => {
                      const accuracy = record.totalStudentsInClass > 0
                        ? Math.max(0, 100 - Math.abs(record.detectedFaces - record.totalStudentsInClass) / record.totalStudentsInClass * 100)
                        : 0
                      return (
                        <div key={record.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{record.className}-{record.section}</span>
                            <span className="text-sm text-gray-600">{accuracy.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                accuracy >= 80 ? 'bg-green-500' :
                                accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${accuracy}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
