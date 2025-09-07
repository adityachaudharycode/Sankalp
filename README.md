# SANKALP - Multilingual Poverty, Hunger & Education Platform

**SANKALP - A commitment to end hunger, erase poverty, and empower minds**

A scalable web application connecting the public, NGOs/volunteers, schools, and government to address poverty, hunger, and education issues.

## Features

### 🌐 Landing Page
- Overview of platform features
- Government schemes display (poverty, education, hunger)
- Multilingual support (English, Hindi, Bengali)
- Interactive map with issue visualization

### 👥 User Roles & Dashboards

#### Public Users
- Report issues (food, education, shelter, healthcare)
- Track own reported issues
- View issues on interactive map
- Issue status tracking (open → solved)

#### NGOs/Volunteers
- View all open issues on map with severity filtering
- Solve issues by uploading verification images
- Points system for gamification
- Leaderboard rankings
- Issue history and inbox

#### Schools
- One-time class and section setup
- Daily attendance recording
- Meal distribution with photo upload
- YOLOv8 integration for student counting verification
- Monthly BMI tracking with flagging system
- Discrepancy detection between reported and actual counts

#### Government
- Comprehensive transparency dashboard
- View all issues, volunteers, and schools
- Access to meal distribution records
- Student health monitoring
- Aggregate statistics and reporting
- Flagged records for inspection

## Tech Stack

### Frontend
- **React 19** with JSX
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Router** for navigation
- **react-i18next** for internationalization
- **Leaflet** for interactive maps

### Backend
- **Firebase Authentication** (Email/Password)
- **Firestore Database** for structured data
- **Firebase Storage** for images/documents
- **Firebase Cloud Functions** for serverless logic
- **Firebase Security Rules** for data protection

### AI/ML
- **YOLOv8** for student counting from meal photos
- **Flask API** for YOLO service
- **Docker** containerization for YOLO service

## Project Structure

```
├── web/                    # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── services/       # Firebase services
│   │   └── i18n.js        # Internationalization setup
├── functions/              # Firebase Cloud Functions
│   └── src/
│       └── index.ts       # Cloud Functions code
├── yolo-service/          # YOLOv8 microservice
│   ├── app.py            # Flask API
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Container configuration
├── firestore.rules       # Database security rules
├── storage.rules         # Storage security rules
├── firebase.json         # Firebase configuration
└── firestore.indexes.json # Database indexes
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Python 3.9+ (for YOLO service)
- Firebase CLI
- Docker (optional, for YOLO service)

### 2. Firebase Setup
1. Create a new Firebase project
2. Enable Authentication, Firestore, and Storage
3. Copy your Firebase config to `web/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Frontend Setup
```bash
cd web
npm install
npm run dev
```

### 4. Firebase Functions Setup
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 5. YOLO Service Setup
```bash
cd yolo-service
pip install -r requirements.txt
python app.py
```

Or with Docker:
```bash
cd yolo-service
docker build -t yolo-service .
docker run -p 8080:8080 yolo-service
```

### 6. Deploy Security Rules
```bash
firebase deploy --only firestore:rules,storage
```

## Key Features Implementation

### Authentication & Authorization
- Role-based access control with Firebase custom claims
- Protected routes based on user roles
- Secure API endpoints with proper validation

### Issue Management
- Real-time issue tracking with Firestore
- Geolocation-based issue reporting
- Status updates with verification images
- Points system for volunteer engagement

### School Management
- Class and section setup
- Daily attendance tracking
- Meal distribution with photo verification
- BMI monitoring with health flagging
- YOLO integration for accurate student counting

### Government Transparency
- Comprehensive dashboard with all data
- Real-time statistics and reporting
- Flagged records for manual inspection
- Export capabilities for official reporting

### Multilingual Support
- English, Hindi, and Bengali languages
- Easy addition of new languages
- Context-aware translations
- RTL support ready

## Security Features

- Firebase Security Rules for data protection
- Role-based access control
- Input validation and sanitization
- Secure file uploads with type checking
- API rate limiting and authentication

## Scalability Features

- Serverless architecture with Firebase
- Optimized database queries with indexes
- CDN delivery for static assets
- Microservice architecture for YOLO processing
- Horizontal scaling ready

## Development

### Running Locally
```bash
# Frontend
cd web && npm run dev

# Firebase Emulators
firebase emulators:start

# YOLO Service
cd yolo-service && python app.py
```

### Building for Production
```bash
# Frontend
cd web && npm run build

# Deploy to Firebase
firebase deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
