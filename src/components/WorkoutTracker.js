import React, { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from '../hooks/useWorkouts';
import { Plus, Target, Clock, Edit2, Trash2, Play, Check, History, BarChart3, User, LogOut, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const workoutReducer = (state, action) => {
  switch (action.type) {
    case 'SET_WORKOUT':
      return action.payload;
    case 'UPDATE_SET':
      const { exerciseIndex, setIndex, field, value } = action.payload;
      const newState = { ...state };
      newState.exercises = [...state.exercises];
      newState.exercises[exerciseIndex] = { ...state.exercises[exerciseIndex] };
      newState.exercises[exerciseIndex].actualSets = [...state.exercises[exerciseIndex].actualSets];
      newState.exercises[exerciseIndex].actualSets[setIndex] = {
        ...state.exercises[exerciseIndex].actualSets[setIndex],
        [field]: value
      };
      return newState;
    case 'ADD_SET':
      const addState = { ...state };
      addState.exercises = [...state.exercises];
      addState.exercises[action.payload] = { ...state.exercises[action.payload] };
      addState.exercises[action.payload].actualSets = [
        ...state.exercises[action.payload].actualSets,
        { weight: '', reps: '', rir: '3', completed: false }
      ];
      return addState;
    case 'REMOVE_SET':
      const { exerciseIndex: removeExIdx, setIndex: removeSetIdx } = action.payload;
      const removeState = { ...state };
      removeState.exercises = [...state.exercises];
      removeState.exercises[removeExIdx] = { ...state.exercises[removeExIdx] };
      removeState.exercises[removeExIdx].actualSets = state.exercises[removeExIdx].actualSets.filter((_, idx) => idx !== removeSetIdx);
      return removeState;
    case 'TOGGLE_WEIGHT_UNIT':
      const toggleState = { ...state };
      toggleState.exercises = [...state.exercises];
      toggleState.exercises[action.payload] = { ...state.exercises[action.payload] };
      const currentUnit = toggleState.exercises[action.payload].weightUnit;
      toggleState.exercises[action.payload].weightUnit = currentUnit === 'kg' ? 'lbs' : 'kg';
      return toggleState;
    case 'COMPLETE_SET':
      const { exerciseIndex: exIdx, setIndex: sIdx } = action.payload;
      const completeState = { ...state };
      completeState.exercises = [...state.exercises];
      completeState.exercises[exIdx] = { ...state.exercises[exIdx] };
      completeState.exercises[exIdx].actualSets = [...state.exercises[exIdx].actualSets];
      completeState.exercises[exIdx].actualSets[sIdx] = {
        ...state.exercises[exIdx].actualSets[sIdx],
        completed: !state.exercises[exIdx].actualSets[sIdx].completed
      };
      return completeState;
    case 'CLEAR_WORKOUT':
      return null;
    default:
      return state;
  }
};

// Optimized input component with proper form attributes
const WorkoutInput = React.memo(({ 
  exerciseIndex, 
  setIndex, 
  field, 
  type = "number", 
  inputMode = "numeric", 
  placeholder = "0", 
  value = "", 
  disabled = false, 
  dispatch,
  min,
  max,
  step,
  className = "w-full p-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
}) => {
  const inputRef = useRef(null);
  
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    dispatch({
      type: 'UPDATE_SET',
      payload: { exerciseIndex, setIndex, field, value: newValue }
    });
  }, [dispatch, exerciseIndex, setIndex, field]);

  const inputId = `${field}_${exerciseIndex}_${setIndex}`;
  const inputName = `${field}_${exerciseIndex}_${setIndex}`;

  return (
    <input
      ref={inputRef}
      id={inputId}
      name={inputName}
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      className={`${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      autoComplete="off"
    />
  );
});

// Optimized select component with proper form attributes
const WorkoutSelect = React.memo(({ 
  exerciseIndex, 
  setIndex, 
  field, 
  value = "", 
  disabled = false, 
  dispatch,
  options = [],
  className = "w-full p-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
}) => {
  const handleChange = useCallback((e) => {
    dispatch({
      type: 'UPDATE_SET',
      payload: { exerciseIndex, setIndex, field, value: e.target.value }
    });
  }, [dispatch, exerciseIndex, setIndex, field]);

  const selectId = `${field}_${exerciseIndex}_${setIndex}`;
  const selectName = `${field}_${exerciseIndex}_${setIndex}`;

  return (
    <select
      id={selectId}
      name={selectName}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={`${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

const WorkoutTracker = () => {
  const { user, signOut } = useAuth();
  const { exercises, loading: exercisesLoading, addExercise } = useExercises();
  const [activeTab, setActiveTab] = useState('templates');
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [currentWorkout, dispatch] = useReducer(workoutReducer, null);
  
  // Initialize workout templates with error handling
  const [workoutTemplates, setWorkoutTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('workoutTemplates');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          name: 'Push Day',
          exercises: [
            { exerciseId: 1, sets: 3, reps: '8-10', weightUnit: 'kg' },
            { exerciseId: 2, sets: 3, reps: '8-10', weightUnit: 'kg' }
          ]
        }
      ];
    } catch (error) {
      console.error('Failed to load workout templates:', error);
      return [
        {
          id: 1,
          name: 'Push Day',
          exercises: [
            { exerciseId: 1, sets: 3, reps: '8-10', weightUnit: 'kg' },
            { exerciseId: 2, sets: 3, reps: '8-10', weightUnit: 'kg' }
          ]
        }
      ];
    }
  });
  
  // Initialize workout history with error handling
  const [workoutHistory, setWorkoutHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('workoutHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load workout history:', error);
      return [];
    }
  });
  
  // Initialize measurements with error handling
  const [measurements, setMeasurements] = useState(() => {
    try {
      const saved = localStorage.getItem('measurements');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load measurements:', error);
      return [];
    }
  });
  
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [showNewMeasurement, setShowNewMeasurement] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', exercises: [] });
  const [newExercise, setNewExercise] = useState({ name: '', category: '', equipment: '' });
  const [newMeasurement, setNewMeasurement] = useState({ 
    type: '', 
    value: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [selectedExerciseHistory, setSelectedExerciseHistory] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // RIR options with proper structure
  const rirOptions = useMemo(() => [
    { value: '', label: 'RIR' },
    { value: '0', label: '0 RIR' },
    { value: '1', label: '1 RIR' },
    { value: '2', label: '2 RIR' },
    { value: '3', label: '3 RIR' },
    { value: '4', label: '4 RIR' },
    { value: '5+', label: '5+ RIR' }
  ], []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save workout templates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('workoutTemplates', JSON.stringify(workoutTemplates));
    } catch (error) {
      console.error('Failed to save workout templates:', error);
    }
  }, [workoutTemplates]);

  // Save workout history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    } catch (error) {
      console.error('Failed to save workout history:', error);
    }
  }, [workoutHistory]);

  // Save measurements to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('measurements', JSON.stringify(measurements));
    } catch (error) {
      console.error('Failed to save measurements:', error);
    }
  }, [measurements]);

  // Auto-save current workout to localStorage
  useEffect(() => {
    if (currentWorkout) {
      try {
        localStorage.setItem('currentWorkout', JSON.stringify({
          workout: currentWorkout,
          startTime: workoutStartTime
        }));
      } catch (error) {
        console.error('Failed to save current workout:', error);
      }
    } else {
      localStorage.removeItem('currentWorkout');
    }
  }, [currentWorkout, workoutStartTime]);

  // Load saved workout on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('currentWorkout');
      if (saved) {
        const { workout, startTime } = JSON.parse(saved);
        dispatch({ type: 'SET_WORKOUT', payload: workout });
        setWorkoutStartTime(startTime);
        if (startTime) {
          setWorkoutDuration(Math.floor((Date.now() - startTime) / 1000));
        }
        setActiveTab('current');
      }
    } catch (error) {
      console.error('Failed to load saved workout:', error);
    }
  }, []);

  // Update workout duration
  useEffect(() => {
    let interval;
    if (workoutStartTime) {
      interval = setInterval(() => {
        setWorkoutDuration(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStartTime]);

  // Format duration helper
  const formatDuration = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Format current time
  const formatCurrentTime = useCallback(() => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [currentTime]);

  // Add exercise handler
  const handleAddExercise = async () => {
    if (newExercise.name && newExercise.category && newExercise.equipment) {
      try {
        await addExercise(newExercise);
        setNewExercise({ name: '', category: '', equipment: '' });
        setShowNewExercise(false);
        toast.success('Exercise added successfully!');
      } catch (error) {
        console.error('Failed to add exercise:', error);
        toast.error('Failed to add exercise');
      }
    }
  };

  // Add measurement handler
  const handleAddMeasurement = () => {
    if (newMeasurement.type && newMeasurement.value && newMeasurement.date) {
      try {
        setMeasurements(prev => [...prev, {
          id: Date.now(),
          type: newMeasurement.type,
          value: parseFloat(newMeasurement.value),
          date: newMeasurement.date
        }]);
        setNewMeasurement({ type: '', value: '', date: new Date().toISOString().split('T')[0] });
        setShowNewMeasurement(false);
        toast.success('Measurement added successfully!');
      } catch (error) {
        console.error('Failed to add measurement:', error);
        toast.error('Failed to add measurement');
      }
    }
  };

  // Create template handler - FIXED
  const handleCreateTemplate = () => {
    if (newTemplate.name.trim()) {
      try {
        const template = {
          id: Date.now(),
          name: newTemplate.name.trim(),
          exercises: [] // Start with empty exercises array
        };
        setWorkoutTemplates(prev => [...prev, template]);
        setNewTemplate({ name: '', exercises: [] });
        setShowNewTemplate(false);
        toast.success('Template created successfully! You can now edit it to add exercises.');
      } catch (error) {
        console.error('Failed to create template:', error);
        toast.error('Failed to create template');
      }
    }
  };

  // Start workout handler
  const startWorkout = (template) => {
    try {
      if (!template.exercises || template.exercises.length === 0) {
        toast.error('This template has no exercises. Please edit it first to add exercises.');
        return;
      }

      const workoutExercises = template.exercises.map(templateEx => {
        const exercise = exercises.find(ex => ex.id === templateEx.exerciseId);
        return {
          ...exercise,
          plannedSets: templateEx.sets,
          plannedReps: templateEx.reps,
          weightUnit: templateEx.weightUnit,
          actualSets: Array(templateEx.sets).fill().map(() => ({
            weight: '',
            reps: '',
            rir: '3',
            completed: false
          }))
        };
      }).filter(Boolean);

      const workout = {
        id: Date.now(),
        templateName: template.name,
        exercises: workoutExercises,
        startTime: Date.now()
      };

      dispatch({ type: 'SET_WORKOUT', payload: workout });
      setWorkoutStartTime(Date.now());
      setWorkoutDuration(0);
      setActiveTab('current');
      toast.success(`Started ${template.name} workout!`);
    } catch (error) {
      console.error('Failed to start workout:', error);
      toast.error('Failed to start workout');
    }
  };

  // Add set to exercise
  const addSet = (exerciseIndex) => {
    dispatch({ type: 'ADD_SET', payload: exerciseIndex });
  };

  // Remove set from exercise
  const removeSet = (exerciseIndex, setIndex) => {
    dispatch({ type: 'REMOVE_SET', payload: { exerciseIndex, setIndex } });
  };

  // Toggle weight unit
  const toggleWeightUnit = (exerciseIndex) => {
    dispatch({ type: 'TOGGLE_WEIGHT_UNIT', payload: exerciseIndex });
  };

  // Complete set
  const completeSet = (exerciseIndex, setIndex) => {
    dispatch({ type: 'COMPLETE_SET', payload: { exerciseIndex, setIndex } });
  };

  // Calculate workout stats with proper error handling
  const calculateWorkoutStats = useCallback((workout = currentWorkout) => {
    if (!workout || !workout.exercises || !Array.isArray(workout.exercises)) {
      return { totalSets: 0, completedSets: 0, totalVolume: 0 };
    }

    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;

    workout.exercises.forEach(exercise => {
      if (exercise.actualSets && Array.isArray(exercise.actualSets)) {
        totalSets += exercise.actualSets.length;
        exercise.actualSets.forEach(set => {
          if (set && set.completed) {
            completedSets++;
            if (set.weight && set.reps) {
              let weight = parseFloat(set.weight) || 0;
              const reps = parseInt(set.reps) || 0;
              
              // Convert lbs to kg for volume calculation
              if (exercise.weightUnit === 'lbs') {
                weight = weight / 2.205;
              }
              
              totalVolume += weight * reps;
            }
          }
        });
      }
    });

    return { totalSets, completedSets, totalVolume: Math.round(totalVolume) };
  }, [currentWorkout]);

  // Finish workout handler with better error handling
  const finishWorkout = () => {
    if (!currentWorkout) return;

    try {
      const stats = calculateWorkoutStats(currentWorkout);
      
      if (stats.completedSets === 0) {
        toast.error('Complete at least one set before finishing your workout!');
        return;
      }

      const completedWorkout = {
        ...currentWorkout,
        endTime: Date.now(),
        duration: workoutDuration,
        stats: {
          totalSets: stats.totalSets,
          completedSets: stats.completedSets,
          totalVolume: stats.totalVolume
        }
      };

      setWorkoutHistory(prev => [completedWorkout, ...prev]);
      dispatch({ type: 'CLEAR_WORKOUT' });
      setWorkoutStartTime(null);
      setWorkoutDuration(0);
      setActiveTab('templates');
      
      toast.success(`Workout completed! ${stats.completedSets} sets finished 💪`);
    } catch (error) {
      console.error('Failed to finish workout:', error);
      toast.error('Failed to finish workout');
    }
  };

  // Cancel workout handler
  const cancelWorkout = () => {
    if (window.confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      dispatch({ type: 'CLEAR_WORKOUT' });
      setWorkoutStartTime(null);
      setWorkoutDuration(0);
      setActiveTab('templates');
      toast.success('Workout cancelled');
    }
  };

  // Edit template handler
  const editTemplate = (template) => {
    setEditingTemplate({ ...template });
    setShowTemplateEditor(true);
  };

  // Save template handler
  const saveTemplate = () => {
    if (!editingTemplate || !editingTemplate.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      setWorkoutTemplates(prev => 
        prev.map(template => 
          template.id === editingTemplate.id ? editingTemplate : template
        )
      );
      setShowTemplateEditor(false);
      setEditingTemplate(null);
      toast.success('Template updated successfully!');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  };

  // Delete template handler
  const deleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        setWorkoutTemplates(prev => prev.filter(template => template.id !== templateId));
        toast.success('Template deleted successfully!');
      } catch (error) {
        console.error('Failed to delete template:', error);
        toast.error('Failed to delete template');
      }
    }
  };

  // Add exercise to template
  const addExerciseToTemplate = (exerciseId) => {
    if (!editingTemplate) return;
    
    const exerciseExists = editingTemplate.exercises.some(ex => ex.exerciseId === exerciseId);
    if (exerciseExists) {
      toast.error('Exercise already in template');
      return;
    }

    setEditingTemplate(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        exerciseId,
        sets: 3,
        reps: '8-10',
        weightUnit: 'kg'
      }]
    }));
  };

  // Remove exercise from template
  const removeExerciseFromTemplate = (exerciseId) => {
    if (!editingTemplate) return;
    
    setEditingTemplate(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.exerciseId !== exerciseId)
    }));
  };

  // Update template exercise
  const updateTemplateExercise = (exerciseId, field, value) => {
    if (!editingTemplate) return;
    
    setEditingTemplate(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.exerciseId === exerciseId ? { ...ex, [field]: value } : ex
      )
    }));
  };

  if (exercisesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exercises...</p>
        </div>
      </div>
    );
  }

  const stats = calculateWorkoutStats();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8" viewBox="0 0 1024 1024" fill="currentColor">
                <path fill="#FCDF19" d="M685.000000,1025.000000 C456.666656,1025.000000 228.833328,1025.000000 1.000000,1025.000000 C1.000000,683.666687 1.000000,342.333344 1.000000,1.000000 C342.333344,1.000000 683.666687,1.000000 1025.000000,1.000000 C1025.000000,342.333344 1025.000000,683.666687 1025.000000,1025.000000 C911.833313,1025.000000 798.666687,1025.000000 685.000000,1025.000000 Z"/>
              </svg>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lift Buddy</h1>
                <div className="text-sm text-gray-600 font-mono">
                  {formatCurrentTime()}
                </div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Active Workout Banner */}
      {currentWorkout && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">{formatDuration(workoutDuration)}</span>
                </div>
                <div className="text-sm opacity-90">
                  {stats.completedSets}/{stats.totalSets} sets
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={finishWorkout}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  Finish
                </button>
                <button
                  onClick={cancelWorkout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="mt-2 text-sm opacity-90">
              {currentWorkout.templateName} • {stats.totalVolume}kg volume
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Workout Templates</h2>
              <button
                onClick={() => setShowNewTemplate(true)}
                className="bg-blue-600 text-white p-2 rounded-full"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {workoutTemplates.map(template => (
                <div key={template.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                      </p>
                      {template.exercises.length > 0 && (
                        <div className="space-y-1">
                          {template.exercises.slice(0, 2).map(templateEx => {
                            const exercise = exercises.find(ex => ex.id === templateEx.exerciseId);
                            return exercise ? (
                              <div key={templateEx.exerciseId} className="text-sm text-gray-600">
                                • {exercise.name} ({templateEx.sets} sets)
                              </div>
                            ) : null;
                          })}
                          {template.exercises.length > 2 && (
                            <div className="text-sm text-gray-500">
                              +{template.exercises.length - 2} more exercises
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editTemplate(template)}
                        className="text-gray-400 hover:text-blue-600 p-1"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => startWorkout(template)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    disabled={template.exercises.length === 0}
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Workout</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Workout Tab */}
        {activeTab === 'current' && currentWorkout && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{currentWorkout.templateName}</h2>
            
            <div className="space-y-4">
              {currentWorkout.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Exercise Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                      <button
                        onClick={() => toggleWeightUnit(exerciseIndex)}
                        className="flex items-center space-x-1 bg-white border border-gray-300 rounded-full px-3 py-1 text-sm"
                      >
                        <span className={exercise.weightUnit === 'kg' ? 'font-semibold text-blue-600' : 'text-gray-600'}>KG</span>
                        <span className="text-gray-300">|</span>
                        <span className={exercise.weightUnit === 'lbs' ? 'font-semibold text-blue-600' : 'text-gray-600'}>LBS</span>
                      </button>
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {exercise.actualSets.map((set, setIndex) => (
                        <div key={setIndex} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-gray-700">Set {setIndex + 1}</span>
                            <div className="flex items-center space-x-2">
                              <input
                                id={`completed_${exerciseIndex}_${setIndex}`}
                                name={`completed_${exerciseIndex}_${setIndex}`}
                                type="checkbox"
                                checked={set.completed}
                                onChange={() => completeSet(exerciseIndex, setIndex)}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              {exercise.actualSets.length > 1 && (
                                <button
                                  onClick={() => removeSet(exerciseIndex, setIndex)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Weight ({exercise.weightUnit})
                              </label>
                              <WorkoutInput
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                field="weight"
                                type="number"
                                value={set.weight}
                                min="0"
                                step="0.5"
                                placeholder="0"
                                dispatch={dispatch}
                                className="w-full p-2 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Reps</label>
                              <WorkoutInput
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                field="reps"
                                type="number"
                                value={set.reps}
                                min="1"
                                max="50"
                                placeholder="0"
                                dispatch={dispatch}
                                className="w-full p-2 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">RIR</label>
                              <WorkoutSelect
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                field="rir"
                                value={set.rir}
                                options={rirOptions}
                                dispatch={dispatch}
                                className="w-full p-2 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addSet(exerciseIndex)}
                      className="w-full mt-3 border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Set</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Workout History</h2>
            
            {workoutHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workouts yet</h3>
                <p className="text-gray-600">Complete your first workout to see it here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutHistory.map(workout => {
                  // Safely extract stats with defaults
                  const workoutStats = workout.stats || calculateWorkoutStats(workout);
                  const completedSets = workoutStats.completedSets || 0;
                  const totalSets = workoutStats.totalSets || 0;
                  const totalVolume = workoutStats.totalVolume || 0;
                  
                  return (
                    <div key={workout.id} className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{workout.templateName}</h3>
                        <span className="text-sm text-gray-600">
                          {new Date(workout.startTime).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                          <div className="text-xl font-bold text-blue-600">{completedSets}</div>
                          <div className="text-xs text-gray-600">Sets</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-600">
                            {formatDuration(workout.duration || 0)}
                          </div>
                          <div className="text-xs text-gray-600">Duration</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-purple-600">{totalVolume}kg</div>
                          <div className="text-xs text-gray-600">Volume</div>
                        </div>
                      </div>

                      {workout.exercises && workout.exercises.length > 0 && (
                        <div className="pt-3 border-t">
                          <div className="text-sm text-gray-600">
                            <strong>Exercises:</strong> {workout.exercises.map(ex => ex.name).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Progress</h2>
              <button
                onClick={() => setShowNewMeasurement(true)}
                className="bg-blue-600 text-white p-2 rounded-full"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {measurements.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No measurements yet</h3>
                <p className="text-gray-600">Add your first measurement to track progress!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {measurements.map(measurement => (
                  <div key={measurement.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{measurement.type}</h3>
                        <p className="text-sm text-gray-600">{measurement.date}</p>
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        {measurement.value} {measurement.type === 'Weight' ? 'kg' : 'cm'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Exercise Library</h2>
              <button
                onClick={() => setShowNewExercise(true)}
                className="bg-blue-600 text-white p-2 rounded-full"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {exercises.map(exercise => (
                <div key={exercise.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{exercise.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Category:</span> {exercise.category}</p>
                    <p><span className="font-medium">Equipment:</span> {exercise.equipment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 safe-area-pb">
        <div className="flex justify-around">
          {[
            { id: 'templates', icon: Target, label: 'Templates' },
            { id: 'current', icon: Play, label: 'Current', disabled: !currentWorkout },
            { id: 'history', icon: History, label: 'History' },
            { id: 'progress', icon: BarChart3, label: 'Progress' },
            { id: 'exercises', icon: User, label: 'Exercises' }
          ].map(({ id, icon: Icon, label, disabled }) => (
            <button
              key={id}
              onClick={() => !disabled && setActiveTab(id)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-600'
                  : disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Current Exercises */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Current Exercises</h4>
                {editingTemplate.exercises.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No exercises added yet</p>
                ) : (
                  <div className="space-y-3">
                    {editingTemplate.exercises.map(templateEx => {
                      const exercise = exercises.find(ex => ex.id === templateEx.exerciseId);
                      return exercise ? (
                        <div key={templateEx.exerciseId} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{exercise.name}</h5>
                            <button
                              onClick={() => removeExerciseFromTemplate(templateEx.exerciseId)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Sets</label>
                              <input
                                type="number"
                                value={templateEx.sets}
                                onChange={(e) => updateTemplateExercise(templateEx.exerciseId, 'sets', parseInt(e.target.value) || 1)}
                                className="w-full p-2 border border-gray-300 rounded text-center"
                                min="1"
                                max="10"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Reps</label>
                              <input
                                type="text"
                                value={templateEx.reps}
                                onChange={(e) => updateTemplateExercise(templateEx.exerciseId, 'reps', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-center"
                                placeholder="8-10"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Unit</label>
                              <select
                                value={templateEx.weightUnit}
                                onChange={(e) => updateTemplateExercise(templateEx.exerciseId, 'weightUnit', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm"
                              >
                                <option value="kg">KG</option>
                                <option value="lbs">LBS</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Add Exercises */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Add Exercises</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {exercises
                    .filter(exercise => !editingTemplate.exercises.some(ex => ex.exerciseId === exercise.id))
                    .map(exercise => (
                      <div key={exercise.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">{exercise.name}</h5>
                          <p className="text-sm text-gray-600">{exercise.category}</p>
                        </div>
                        <button
                          onClick={() => addExerciseToTemplate(exercise.id)}
                          className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setEditingTemplate(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Exercise Modal */}
      {showNewExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add New Exercise</h3>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="text"
                placeholder="Exercise name"
                value={newExercise.name}
                onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newExercise.category}
                onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                <option value="Chest">Chest</option>
                <option value="Back">Back</option>
                <option value="Legs">Legs</option>
                <option value="Shoulders">Shoulders</option>
                <option value="Arms">Arms</option>
                <option value="Core">Core</option>
              </select>
              <input
                type="text"
                placeholder="Equipment (e.g., Barbell, Dumbbell)"
                value={newExercise.equipment}
                onChange={(e) => setNewExercise(prev => ({ ...prev, equipment: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => setShowNewExercise(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExercise}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Exercise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Measurement Modal */}
      {showNewMeasurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Measurement</h3>
            </div>
            <div className="p-4 space-y-4">
              <select
                value={newMeasurement.type}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select measurement type</option>
                <option value="Weight">Weight</option>
                <option value="Chest">Chest</option>
                <option value="Waist">Waist</option>
                <option value="Arms">Arms</option>
                <option value="Thighs">Thighs</option>
              </select>
              <input
                type="number"
                step="0.1"
                placeholder="Value"
                value={newMeasurement.value}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, value: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={newMeasurement.date}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => setShowNewMeasurement(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMeasurement}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Measurement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Template Modal */}
      {showNewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Create Template</h3>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="text"
                placeholder="Template name (e.g., Push Day, Pull Day)"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => setShowNewTemplate(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTracker;