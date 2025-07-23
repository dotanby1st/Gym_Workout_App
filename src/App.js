import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import WorkoutTracker from './components/WorkoutTracker';
import { Toaster } from 'react-hot-toast';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? <WorkoutTracker /> : <AuthForm />}
      <Toaster position="top-right" />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
