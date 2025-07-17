# Vaulture - Facial Recognition Photo Storage

A secure photo storage application with facial recognition authentication using Next.js, face-api.js, and MongoDB.

## 🚀 Features

- **Facial Recognition Authentication** - Login and enroll using face detection
- **Secure Photo Storage** - Upload and manage photos with MongoDB GridFS
- **User Profiles** - Manage personal information and preferences
- **Responsive Design** - Modern UI that works on all devices
- **Session Management** - Secure session handling with cookies

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: Face-api.js, facial recognition
- **File Storage**: MongoDB GridFS for image storage
- **Database**: MongoDB with Mongoose ODM

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd photo-wallet
npm install
```

### 2. Set up MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB locally
# macOS with Homebrew:
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Or download from: https://www.mongodb.com/try/download/community
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string

### 3. Environment Configuration

Create `.env.local` file:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/photo-wallet
# Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/photo-wallet

# Next.js Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Download Face Recognition Models

```bash
# Create models directory
mkdir -p public/models

# Download face-api.js models
cd public/models
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
photo-wallet/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentication APIs
│   │   ├── photos/        # Photo management APIs
│   │   ├── profile/       # User profile APIs
│   │   └── upload/        # File upload API
│   ├── dashboard/         # Dashboard page
│   ├── profile/           # Profile management page
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── FaceRecognition.tsx
│   ├── PhotoGallery.tsx
│   └── PhotoUpload.tsx
├── lib/                   # Utility libraries
│   ├── auth-mongo.ts      # MongoDB auth functions
│   ├── gridfs.ts          # GridFS utilities
│   └── mongodb.ts         # Database connection
├── models/                # Mongoose models
│   ├── User.ts
│   ├── Session.ts
│   └── Photo.ts
└── public/
    └── models/            # Face recognition models
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  bio: String,
  faceDescriptors: [[Number]], // Array of face descriptor arrays
  createdAt: Date,
  updatedAt: Date
}
```

### Sessions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Photos Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  gridfsId: ObjectId, // Reference to GridFS file
  uploadedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication Flow

1. **Enrollment**: User captures 5 face images for registration
2. **Login**: User authenticates using facial recognition
3. **Session**: Secure session management with cookies
4. **Profile**: User can update personal information

## 📸 Photo Management

- **Upload**: Drag & drop or click to upload images
- **Storage**: Images stored in MongoDB GridFS
- **Gallery**: View all uploaded photos
- **Delete**: Remove photos from storage
- **Security**: Users can only access their own photos

## 🛡️ Security Features

- **Face Recognition**: Biometric authentication
- **Session Management**: Secure cookie-based sessions
- **File Validation**: Image type and size validation
- **Access Control**: User-specific photo access
- **Data Encryption**: MongoDB connection security

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Environment Variables for Production
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/photo-wallet
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
# Connect to MongoDB shell
mongosh

# Switch to database
use photo-wallet

# View collections
show collections

# Query users
db.users.find()

# Query photos
db.photos.find()
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Face Recognition Models Not Loading**
   - Ensure all model files are downloaded to `public/models/`
   - Check browser console for 404 errors

2. **MongoDB Connection Issues**
   - Verify MongoDB is running locally
   - Check connection string in `.env.local`
   - Ensure network access for cloud MongoDB

3. **Photo Upload Failures**
   - Check file size limits (10MB max)
   - Verify image file types
   - Ensure GridFS bucket exists

4. **Authentication Issues**
   - Clear browser cookies
   - Check session expiration
   - Verify face detection is working

### Performance Tips

- Use MongoDB indexes for faster queries
- Implement image compression for large files
- Consider CDN for image serving in production
- Monitor GridFS chunk sizes for optimal performance 