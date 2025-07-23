import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .order('category', { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      toast.error('Failed to load exercises');
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user]);

  const addExercise = async (exerciseData) => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          ...exerciseData,
          user_id: user.id,
          is_custom: true
        }])
        .select()
        .single();

      if (error) throw error;
      setExercises(prev => [...prev, data]);
      toast.success('Exercise created successfully!');
      return { data, error: null };
    } catch (error) {
      toast.error('Failed to create exercise');
      return { data: null, error };
    }
  };

  return {
    exercises,
    loading,
    addExercise,
    refetch: fetchExercises
  };
};
