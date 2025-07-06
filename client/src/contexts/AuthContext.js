import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { handleError, isOnline } from '../utils/errorHandler';
import toast from 'react-hot-toast';

// Firebase configuration (you'll need to add your own config)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileSettings, setProfileSettings] = useState({
    personality: 'young_friend',
    language: 'english'
  });

  // Load user profile settings from Firestore
  const loadUserProfile = async (user) => {
    if (!user) return;
    
    try {
      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setProfileSettings({
          personality: userData.settings?.personality || 'young_friend',
          language: userData.settings?.language || 'english'
        });
      } else {
        // Create default profile for new user
        await setDoc(userDoc, {
          email: user.email,
          name: user.displayName,
          profilePicture: user.photoURL,
          settings: {
            personality: 'young_friend',
            language: 'english'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setProfileSettings({
          personality: 'young_friend',
          language: 'english'
        });
      }
    } catch (error) {
      handleError(error, 'Loading user profile', false);
      // Use default settings if profile loading fails
      setProfileSettings({
        personality: 'young_friend',
        language: 'english'
      });
    }
  };

  // Google Sign In with enhanced error handling
  const signInWithGoogle = async () => {
    if (!isOnline()) {
      handleError(new Error('No internet connection'), 'Sign in', true);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      
      // Load user profile after successful sign in
      await loadUserProfile(result.user);
      
      toast.success('Welcome to VIBE! 🎉');
    } catch (error) {
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in. Please try again.';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign in was cancelled.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked. Please allow pop-ups for this site.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many sign-in attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        default:
          errorMessage = 'Sign in failed. Please try again.';
      }
      
      handleError(new Error(errorMessage), 'Sign in', true);
    }
  };

  // Email/Password Sign In with enhanced error handling
  const signInWithEmail = async (email, password) => {
    if (!isOnline()) {
      handleError(new Error('No internet connection'), 'Sign in', true);
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await loadUserProfile(result.user);
      toast.success('Welcome back to VIBE! 🎉');
    } catch (error) {
      let errorMessage = 'Failed to sign in. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many sign-in attempts. Please try again later.';
          break;
        default:
          errorMessage = 'Sign in failed. Please try again.';
      }
      
      handleError(new Error(errorMessage), 'Sign in', true);
    }
  };

  // Email/Password Sign Up with enhanced error handling
  const signUpWithEmail = async (email, password) => {
    if (!isOnline()) {
      handleError(new Error('No internet connection'), 'Sign up', true);
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await loadUserProfile(result.user);
      toast.success('Welcome to VIBE! 🎉');
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.';
          break;
        default:
          errorMessage = 'Failed to create account. Please try again.';
      }
      
      handleError(new Error(errorMessage), 'Sign up', true);
    }
  };

  // Sign Out with enhanced error handling
  const signOutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setProfileSettings({
        personality: 'young_friend',
        language: 'english'
      });
      toast.success('Signed out successfully');
    } catch (error) {
      handleError(error, 'Sign out', true);
    }
  };

  // Update user profile settings
  const updateProfileSettings = async (newSettings) => {
    if (!currentUser) return;
    
    try {
      const userDoc = doc(db, 'users', currentUser.uid);
      await setDoc(userDoc, {
        ...currentUser,
        settings: newSettings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setProfileSettings(newSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      handleError(error, 'Updating profile settings', true);
    }
  };

  // Listen for auth state changes with error handling
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user || null);
        
        if (user) {
          await loadUserProfile(user);
        } else {
          setProfileSettings({
            personality: 'young_friend',
            language: 'english'
          });
        }
      } catch (error) {
        handleError(error, 'Auth state change', false);
        setCurrentUser(user || null);
      } finally {
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    profileSettings,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    updateProfileSettings,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 