import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, LogOut } from 'lucide-react';

const WorkoutTracker = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Dumbbell className="text-blue-600" />
            Workout Tracker
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          🎉 Authentication Working!
        </h2>
        <p className="text-gray-600 mb-4">
          You're successfully logged in with Supabase authentication.
        </p>
        <p className="text-sm text-gray-500">
          Next: We'll add the full workout tracker functionality.
        </p>
      </div>
    </div>
  );
};

export default WorkoutTracker;
