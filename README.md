# VIBE AI Companion

**Voice Interactive Behavioral e-Companion** - An intelligent AI companion with voice interaction capabilities, built with React, Node.js, and Google Cloud services.

## 🚀 Features

- **Smart Voice Interaction**: Natural voice conversations with AI responses
- **Text-to-Speech**: AI responses converted to audio for immersive experience
- **Voice Recording**: Browser-based audio recording and playback using WebRTC
- **User Authentication**: Authentication with Firebase
- **Chat History**: Persistent conversation history stored in Firestore
- **Responsive Design**: Modern UI built with Material-UI
- **Cloud Storage**: Google Cloud Storage Bucket for audio file management


## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Material-UI** - Component library
- **React Router** - Client-side routing
- **Firebase** - Authentication and database
- **Framer Motion** - Animations
- **React Hot Toast** - Notifications
- **WebRTC** - Browser-based audio recording

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Google Cloud Speech-to-Text** - Voice recognition
- **Google Cloud Text-to-Speech** - Voice synthesis
- **Google Generative AI (Gemini)** - AI conversation
- **Google Cloud Storage** - File storage


## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Google Cloud Platform** account and SDK
- **Firebase** project
- **Git**

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/arbazstarkf/Vibe-AI-Companion.git
cd Vibe-AI-Companion
```

### 2. Install Dependencies

Install all dependencies for both client and server:

```bash
npm run install-all
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Google Cloud Platform Setup

#### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Speech-to-Text API**
   - **Text-to-Speech API**
   - **Cloud Storage API**
   - **App Engine Admin API**

#### Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Create a new service account
3. Assign the following roles:
   - **Cloud Speech Client**
   - **Cloud Speech-to-Text service agent**
   - **Storage Object Admin**
   - **Storage Object Viewer**
   - **App Engine Admin**

4. Create and download the JSON key file

#### Create Cloud Storage Bucket

1. Go to **Cloud Storage** > **Buckets**
2. Create a new bucket for storing audio files

### 4. Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or choose your existing Google Cloud Project
3. Enable **Authentication** with Google sign-in
4. Create a **Firestore Database**

#### Get Firebase Configuration

1. Go to **Project Settings** > **General**
2. Scroll down to **Your apps** section
3. Add a web app and copy the configuration

### 5. Get Gemini API Key from Google AI Studio

1. **Go to Google AI Studio**  
   Visit [Google AI Studio](https://aistudio.google.com/app/apikey).

2. **Sign in with your Google Account**  
   Use the Google account you want to associate with your API usage.

3. **Create a New API Key**  
   - Click on the **"Create API Key"** button.
   - If prompted, review and accept the terms of service.

4. **Copy Your API Key**  
   - Once the key is generated, click the copy icon to copy your API key.

5. **Add the API Key to Your Environment Variables**  
   - In your `server/.env` file, add:
     ```
     GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
     ```
   - Replace `your-gemini-api-key` with the key you copied.

6. **Set API Key in App Engine**  
   - Ensure the `app.yaml` file includes:
     ```yaml
     env_variables:
       GOOGLE_GENERATIVE_AI_API_KEY: "your-gemini-api-key"
     ```


### 6. Environment Configuration

#### Server Environment Variables

Create a `.env` file in the `server` directory :

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/your-service-account-key.json
GOOGLE_CLOUD_STORAGE_BUCKET=your-storage-bucket-name

# App Configuration
PORT=8080
NODE_ENV=production
FRONTEND_URL=https://your-firebase-app.web.app

# Google Generative AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

#### Client Environment Variables

Create a `.env` file in the `client` directory :

```bash
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_API_URL=https://your-app-engine-project-id.uc.r.appspot.com/api
```

### 7. Place Service Account Key

Locate your downloaded Google Cloud service account JSON key file and update the `GOOGLE_CLOUD_KEY_FILE` path in your server `.env` file.

### 8. App Engine & Firebase Hosting Deployment

#### Backend (App Engine)

1. In the `server` directory, create an `app.yaml`:
   ```yaml
   runtime: nodejs20
   env: standard
   instance_class: F2
   automatic_scaling:
     target_cpu_utilization: 0.65
     min_instances: 1
     max_instances: 3
   env_variables:
     FIREBASE_PROJECT_ID: "your-firebase-project-id"
     FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
     FIREBASE_CLIENT_EMAIL: "your-service-account-email@project.iam.gserviceaccount.com"
     GOOGLE_CLOUD_PROJECT_ID: "your-google-cloud-project-id"
     GOOGLE_CLOUD_KEY_FILE: "keys/your-service-account-key.json"
     GOOGLE_CLOUD_STORAGE_BUCKET: "your-storage-bucket-name"
     PORT: "8080"
     NODE_ENV: "production"
     FRONTEND_URL: "https://your-firebase-app.web.app"
     GOOGLE_GENERATIVE_AI_API_KEY: "your-gemini-api-key"
   ```
   
2. Deploy:
   ```bash
   gcloud app deploy
   ```

#### Frontend (Firebase Hosting)

1. Build your React app:
   ```bash
   cd client
   npm run build
   ```
2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

## 🚀 Running the Application

- **Frontend:** https://your-firebase-app.web.app
- **Backend:** https://your-app-engine-project-id.uc.r.appspot.com

## 🛡️ Security & Best Practices

- **Never commit secrets, private keys, or service account files to git.**
- Use `.gitignore` to exclude `.env`, `keys/`, and any secret files.
- Use environment variables for all credentials and secrets.
- All TTS audio is stored in Google Cloud Storage (no local file writes).

## 📁 Project Structure

```
Vibe-AI-Companion/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── keys/             # Service account keys (gitignored)
│   ├── index.js          # Server entry point
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Arbaz Khan**


## 📞 Support

For support and troubleshooting:

- Ask Gemini [Gemini](ttps://gemini.google.com/app)
- Check the [Google Cloud Documentation](https://cloud.google.com/docs)
- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Check the [Google AI Studio Documentation](https://aistudio.google.com/app/docs)


---

