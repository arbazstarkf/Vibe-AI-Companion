import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Wrapper component to handle navigation for authenticated users
const AppContent = () => {
  const { currentUser } = useAuth();

  return (
    <div className="App">
      {currentUser && <Navigation />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#ffffff',
            border: '1px solid #6366f1',
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App; 