// Enhanced WorkoutTracker.js with all requested features

import React, { useState, useEffect, useReducer, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from '../hooks/useWorkouts';
import toast from 'react-hot-toast';
import { 
  Play, Clock, LogOut, Plus, Trash2, Edit3, MoreHorizontal, 
  History, ChevronDown, ChevronUp, ArrowUp, ArrowDown, 
  Eye, X, RotateCcw, Timer, Weight, Repeat2
} from 'lucide-react';

// Exercise counting methods
const COUNTING_METHODS = {
  WEIGHT_REPS: 'weight_reps',
  WEIGHT_TIME: 'weight_time',
  TIME_ONLY: 'time_only',
  REPS_ONLY: 'reps_only',
  DISTANCE_TIME: 'distance_time'
};

// Set types for enhanced set tracking
const SET_TYPES = {
  NORMAL: 'normal',
  WARMUP: 'warmup',
  DROP: 'drop',
  SUPER: 'super',
  FAILURE: 'failure',
  REST_PAUSE: 'rest_pause'
};

// Enhanced workout reducer with new actions
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
        { 
          weight: '', 
          reps: '', 
          time: '',
          distance: '',
          rir: '3', 
          completed: false,
          setType: SET_TYPES.NORMAL
        }
      ];
      return addState;
      
    case 'REMOVE_SET':
      const { exerciseIndex: removeExIdx, setIndex: removeSetIdx } = action.payload;
      const removeState = { ...state };
      removeState.exercises = [...state.exercises];
      removeState.exercises[removeExIdx] = { ...state.exercises[removeExIdx] };
      removeState.exercises[removeExIdx].actualSets = state.exercises[removeExIdx].actualSets.filter((_, idx) => idx !== removeSetIdx);
      return removeState;
      
    case 'ADD_EXERCISE_TO_WORKOUT':
      const addExState = { ...state };
      addExState.exercises = [...state.exercises, action.payload];
      return addExState;
      
    case 'REMOVE_EXERCISE_FROM_WORKOUT':
      const removeExState = { ...state };
      removeExState.exercises = state.exercises.filter((_, idx) => idx !== action.payload);
      return removeExState;
      
    case 'REORDER_EXERCISES':
      const { fromIndex, toIndex } = action.payload;
      const reorderState = { ...state };
      const exercises = [...state.exercises];
      const [movedExercise] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, movedExercise);
      reorderState.exercises = exercises;
      return reorderState;
      
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
      
    case 'UPDATE_SET_TYPE':
      const { exerciseIndex: setTypeExIdx, setIndex: setTypeSetIdx, setType } = action.payload;
      const setTypeState = { ...state };
      setTypeState.exercises = [...state.exercises];
      setTypeState.exercises[setTypeExIdx] = { ...state.exercises[setTypeExIdx] };
      setTypeState.exercises[setTypeExIdx].actualSets = [...state.exercises[setTypeExIdx].actualSets];
      setTypeState.exercises[setTypeExIdx].actualSets[setTypeSetIdx] = {
        ...state.exercises[setTypeExIdx].actualSets[setTypeSetIdx],
        setType: setType
      };
      return setTypeState;
      
    case 'CLEAR_WORKOUT':
      return null;
      
    default:
      return state;
  }
};

// Get previous exercise data for showing last performance
const getPreviousExerciseData = (exerciseName, workoutHistory) => {
  for (let workout of workoutHistory) {
    if (workout.exercises) {
      const prevExercise = workout.exercises.find(ex => ex.name === exerciseName);
      if (prevExercise && prevExercise.actualSets) {
        const completedSets = prevExercise.actualSets.filter(set => set.completed);
        if (completedSets.length > 0) {
          return {
            date: new Date(workout.startTime).toLocaleDateString(),
            sets: completedSets
          };
        }
      }
    }
  }
  return null;
};

// Get set type styling
const getSetTypeStyle = (setType) => {
  switch (setType) {
    case SET_TYPES.WARMUP:
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case SET_TYPES.DROP:
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case SET_TYPES.SUPER:
      return 'bg-purple-50 border-purple-200 text-purple-800';
    case SET_TYPES.FAILURE:
      return 'bg-red-50 border-red-200 text-red-800';
    case SET_TYPES.REST_PAUSE:
      return 'bg-blue-50 border-blue-200 text-blue-800';
    default:
      return 'bg-white border-gray-200 text-gray-800';
  }
};

// Set type display names
const SET_TYPE_LABELS = {
  [SET_TYPES.NORMAL]: 'Normal',
  [SET_TYPES.WARMUP]: 'Warm-up',
  [SET_TYPES.DROP]: 'Drop Set',
  [SET_TYPES.SUPER]: 'Super Set',
  [SET_TYPES.FAILURE]: 'To Failure',
  [SET_TYPES.REST_PAUSE]: 'Rest-Pause'
};

// Enhanced WorkoutInput component with counting method support
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
  className = "w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500",
  countingMethod = COUNTING_METHODS.WEIGHT_REPS
}) => {
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    dispatch({
      type: 'UPDATE_SET',
      payload: { exerciseIndex, setIndex, field, value: newValue }
    });
  }, [dispatch, exerciseIndex, setIndex, field]);

  // Determine if this field should be shown based on counting method
  const shouldShow = useMemo(() => {
    switch (countingMethod) {
      case COUNTING_METHODS.WEIGHT_REPS:
        return field === 'weight' || field === 'reps';
      case COUNTING_METHODS.WEIGHT_TIME:
        return field === 'weight' || field === 'time';
      case COUNTING_METHODS.TIME_ONLY:
        return field === 'time';
      case COUNTING_METHODS.REPS_ONLY:
        return field === 'reps';
      case COUNTING_METHODS.DISTANCE_TIME:
        return field === 'distance' || field === 'time';
      default:
        return field === 'weight' || field === 'reps';
    }
  }, [countingMethod, field]);

  if (!shouldShow) return null;

  const inputProps = {
    type: field === 'time' ? 'text' : type,
    inputMode: field === 'time' ? 'text' : inputMode,
    placeholder: field === 'time' ? '00:00' : placeholder,
    pattern: field === 'time' ? '[0-9]*:?[0-9]*' : undefined
  };

  return (
    <input
      {...inputProps}
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

// Set type selector component
const SetTypeSelector = React.memo(({ exerciseIndex, setIndex, currentType, dispatch }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSetTypeChange = (setType) => {
    dispatch({
      type: 'UPDATE_SET_TYPE',
      payload: { exerciseIndex, setIndex, setType }
    });
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`px-2 py-1 text-xs rounded border ${getSetTypeStyle(currentType)} hover:opacity-80 flex items-center space-x-1`}
      >
        <span>{SET_TYPE_LABELS[currentType]}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10">
          {Object.entries(SET_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => handleSetTypeChange(type)}
              className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${currentType === type ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// Exercise reorder controls
const ExerciseReorderControls = ({ exerciseIndex, totalExercises, onReorder }) => (
  <div className="flex flex-col space-y-1">
    <button
      onClick={() => onReorder(exerciseIndex, exerciseIndex - 1)}
      disabled={exerciseIndex === 0}
      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
    <button
      onClick={() => onReorder(exerciseIndex, exerciseIndex + 1)}
      disabled={exerciseIndex === totalExercises - 1}
      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
    >
      <ArrowDown className="h-4 w-4" />
    </button>
  </div>
);

// Exercise history display component
const ExerciseHistoryDisplay = ({ exerciseName, workoutHistory }) => {
  const previousData = getPreviousExerciseData(exerciseName, workoutHistory);
  
  if (!previousData) {
    return (
      <div className="text-xs text-gray-500 italic">
        No previous data
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
      <div className="font-medium mb-1">Last time ({previousData.date}):</div>
      <div className="space-y-1">
        {previousData.sets.slice(0, 3).map((set, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
              {index + 1}
            </span>
            <span>
              {set.weight && `${set.weight}kg`}
              {set.weight && set.reps && ' × '}
              {set.reps && `${set.reps} reps`}
              {set.time && ` ${set.time}`}
              {set.rir && ` @ ${set.rir} RIR`}
            </span>
          </div>
        ))}
        {previousData.sets.length > 3 && (
          <div className="text-xs text-gray-400">
            +{previousData.sets.length - 3} more sets
          </div>
        )}
      </div>
    </div>
  );
};

// Add exercise to workout modal
const AddExerciseModal = ({ show, onClose, exercises, onAddExercise }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const categories = [...new Set(exercises.map(ex => ex.category))].sort();

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Exercise</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-y-auto max-h-96">
          {filteredExercises.map(exercise => (
            <button
              key={exercise.id}
              onClick={() => {
                onAddExercise(exercise);
                onClose();
              }}
              className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100"
            >
              <div className="font-medium">{exercise.name}</div>
              <div className="text-sm text-gray-600">{exercise.category} • {exercise.equipment}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Detailed workout history modal
const WorkoutHistoryModal = ({ show, onClose, workout }) => {
  if (!show || !workout) return null;

  const calculateWorkoutStats = (workout) => {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;

    workout.exercises?.forEach(exercise => {
      if (exercise.actualSets) {
        totalSets += exercise.actualSets.length;
        exercise.actualSets.forEach(set => {
          if (set.completed) {
            completedSets++;
            if (set.weight && set.reps) {
              let weight = parseFloat(set.weight) || 0;
              const reps = parseInt(set.reps) || 0;
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
  };

  const stats = calculateWorkoutStats(workout);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{workout.templateName}</h3>
              <p className="text-sm text-gray-600">
                {new Date(workout.startTime).toLocaleDateString()} • {Math.floor((workout.duration || 0) / 60)}min
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div>
              <div className="text-xl font-bold text-blue-600">{stats.completedSets}</div>
              <div className="text-xs text-gray-600">Sets</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">
                {Math.floor((workout.duration || 0) / 60)}min
              </div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">{stats.totalVolume}kg</div>
              <div className="text-xs text-gray-600">Volume</div>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-96 px-4 pb-4">
          <div className="space-y-4">
            {workout.exercises?.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="border border-gray-200 rounded-lg">
                <div className="p-3 bg-gray-50 border-b">
                  <h4 className="font-medium">{exercise.name}</h4>
                  <p className="text-sm text-gray-600">{exercise.category} • {exercise.equipment}</p>
                </div>
                
                <div className="p-3">
                  <div className="space-y-2">
                    {exercise.actualSets?.map((set, setIndex) => (
                      <div key={setIndex} className={`flex items-center justify-between p-2 rounded text-sm ${set.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-white border rounded-full flex items-center justify-center text-xs">
                            {setIndex + 1}
                          </span>
                          {set.setType !== SET_TYPES.NORMAL && (
                            <span className={`px-2 py-1 text-xs rounded ${getSetTypeStyle(set.setType)}`}>
                              {SET_TYPE_LABELS[set.setType]}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          {set.weight && <span>{set.weight}{exercise.weightUnit || 'kg'}</span>}
                          {set.reps && <span>{set.reps} reps</span>}
                          {set.time && <span>{set.time}</span>}
                          {set.distance && <span>{set.distance}</span>}
                          {set.rir && <span>{set.rir} RIR</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main WorkoutTracker component
const WorkoutTracker = () => {
  const { signOut } = useAuth();
  const { exercises, loading: exercisesLoading, addExercise } = useExercises();
  
  // Combine built-in exercises with custom exercises
  const allExercises = useMemo(() => {
    const builtInExercises = getAllExercises();
    const customExercises = exercises.filter(ex => ex.is_custom);
    return [...builtInExercises, ...customExercises];
  }, [exercises]);

  const [currentWorkout, dispatch] = useReducer(workoutReducer, null);
  const [activeTab, setActiveTab] = useState('templates');
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  // Initialize workout templates with error handling
  const [workoutTemplates, setWorkoutTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('workoutTemplates');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load workout templates:', error);
      return [];
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
  
  // UI state
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryWorkout, setSelectedHistoryWorkout] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', exercises: [] });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // RIR options
  const rirOptions = useMemo(() => [
    { value: '', label: 'RIR' },
    { value: '0', label: '0 RIR' },
    { value: '1', label: '1 RIR' },
    { value: '2', label: '2 RIR' },
    { value: '3', label: '3 RIR' },
    { value: '4+', label: '4+ RIR' }
  ], []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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

  // Save data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('workoutTemplates', JSON.stringify(workoutTemplates));
    } catch (error) {
      console.error('Failed to save workout templates:', error);
    }
  }, [workoutTemplates]);

  useEffect(() => {
    try {
      localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    } catch (error) {
      console.error('Failed to save workout history:', error);
    }
  }, [workoutHistory]);

  useEffect(() => {
    try {
      if (currentWorkout) {
        localStorage.setItem('currentWorkout', JSON.stringify(currentWorkout));
        localStorage.setItem('workoutStartTime', workoutStartTime?.toString() || '');
      } else {
        localStorage.removeItem('currentWorkout');
        localStorage.removeItem('workoutStartTime');
      }
    } catch (error) {
      console.error('Failed to save current workout:', error);
    }
  }, [currentWorkout, workoutStartTime]);

  // Calculate workout stats
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

  // Format duration
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

  // Start workout handler
  const startWorkout = (template) => {
    try {
      if (!template.exercises || template.exercises.length === 0) {
        toast.error('This template has no exercises. Please edit it first to add exercises.');
        return;
      }

      const workoutExercises = template.exercises.map(templateEx => {
        const exercise = allExercises.find(ex => ex.id === templateEx.exerciseId);
        return {
          ...exercise,
          plannedSets: templateEx.sets,
          plannedReps: templateEx.reps,
          weightUnit: templateEx.weightUnit || 'kg',
          countingMethod: templateEx.countingMethod || COUNTING_METHODS.WEIGHT_REPS,
          actualSets: Array(templateEx.sets).fill().map(() => ({
            weight: '',
            reps: '',
            time: '',
            distance: '',
            rir: '3',
            completed: false,
            setType: SET_TYPES.NORMAL
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

  // Add exercise to current workout
  const addExerciseToWorkout = (exercise) => {
    const workoutExercise = {
      ...exercise,
      plannedSets: 3,
      plannedReps: 10,
      weightUnit: 'kg',
      countingMethod: exercise.countingMethod || COUNTING_METHODS.WEIGHT_REPS,
      actualSets: Array(3).fill().map(() => ({
        weight: '',
        reps: '',
        time: '',
        distance: '',
        rir: '3',
        completed: false,
        setType: SET_TYPES.NORMAL
      }))
    };

    dispatch({ type: 'ADD_EXERCISE_TO_WORKOUT', payload: workoutExercise });
    toast.success(`Added ${exercise.name} to workout!`);
  };

  // Remove exercise from workout
  const removeExerciseFromWorkout = (exerciseIndex) => {
    dispatch({ type: 'REMOVE_EXERCISE_FROM_WORKOUT', payload: exerciseIndex });
    toast.success('Exercise removed from workout');
  };

  // Reorder exercises
  const reorderExercises = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    dispatch({ type: 'REORDER_EXERCISES', payload: { fromIndex, toIndex } });
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

  // Finish workout
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

  // Cancel workout
  const cancelWorkout = () => {
    if (window.confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      dispatch({ type: 'CLEAR_WORKOUT' });
      setWorkoutStartTime(null);
      setWorkoutDuration(0);
      setActiveTab('templates');
      toast.success('Workout cancelled');
    }
  };

  // Template management
  const handleCreateTemplate = () => {
    if (newTemplate.name.trim()) {
      const template = {
        id: Date.now(),
        name: newTemplate.name.trim(),
        exercises: []
      };
      setWorkoutTemplates(prev => [...prev, template]);
      setNewTemplate({ name: '', exercises: [] });
      setShowNewTemplate(false);
      toast.success('Template created successfully!');
    }
  };

  const editTemplate = (template) => {
    setEditingTemplate({ ...template });
    setShowTemplateEditor(true);
  };

  const saveTemplate = () => {
    if (!editingTemplate || !editingTemplate.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setWorkoutTemplates(prev => 
      prev.map(template => 
        template.id === editingTemplate.id ? editingTemplate : template
      )
    );
    setShowTemplateEditor(false);
    setEditingTemplate(null);
    toast.success('Template updated successfully!');
  };

  const deleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setWorkoutTemplates(prev => prev.filter(template => template.id !== templateId));
      toast.success('Template deleted');
    }
  };

  const updateTemplateExercise = (exerciseIndex, field, value) => {
    setEditingTemplate(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, idx) => 
        idx === exerciseIndex ? { ...ex, [field]: value } : ex
      )
    }));
  };

  // View workout history details
  const viewWorkoutHistory = (workout) => {
    setSelectedHistoryWorkout(workout);
    setShowHistoryModal(true);
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
                  onClick={() => setShowAddExerciseModal(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Exercise</span>
                </button>
                <button
                  onClick={finishWorkout}
                  className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full text-sm font-medium"
                >
                  Finish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-6">
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

            {workoutTemplates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🏋️</div>
                <p>No workout templates yet.</p>
                <p className="text-sm">Create your first template to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {workoutTemplates.map(template => (
                  <div key={template.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => editTemplate(template)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      {template.exercises?.length || 0} exercises
                    </div>
                    
                    <button
                      onClick={() => startWorkout(template)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Workout</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current Workout Tab */}
        {activeTab === 'current' && currentWorkout && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{currentWorkout.templateName}</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.completedSets}</div>
                  <div className="text-sm text-gray-600">Completed Sets</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatDuration(workoutDuration)}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalVolume}kg</div>
                  <div className="text-sm text-gray-600">Volume</div>
                </div>
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              {currentWorkout.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="bg-white rounded-lg shadow-sm border">
                  {/* Exercise Header */}
                  <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                        <p className="text-sm text-gray-600">{exercise.category} • {exercise.equipment}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <ExerciseReorderControls
                          exerciseIndex={exerciseIndex}
                          totalExercises={currentWorkout.exercises.length}
                          onReorder={reorderExercises}
                        />
                        
                        <button
                          onClick={() => toggleWeightUnit(exerciseIndex)}
                          className="text-sm bg-gray-100 px-3 py-1 rounded flex items-center space-x-1"
                        >
                          <span className={exercise.weightUnit === 'kg' ? 'font-semibold text-blue-600' : 'text-gray-600'}>KG</span>
                          <span className="text-gray-300">|</span>
                          <span className={exercise.weightUnit === 'lbs' ? 'font-semibold text-blue-600' : 'text-gray-600'}>LBS</span>
                        </button>
                        
                        <button
                          onClick={() => removeExerciseFromWorkout(exerciseIndex)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Previous Performance */}
                    <div className="mt-3">
                      <ExerciseHistoryDisplay 
                        exerciseName={exercise.name} 
                        workoutHistory={workoutHistory} 
                      />
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {exercise.actualSets.map((set, setIndex) => (
                        <div key={setIndex} className={`p-3 rounded-lg border-2 ${set.completed ? 'bg-green-50 border-green-200' : getSetTypeStyle(set.setType)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                                {setIndex + 1}
                              </span>
                              <SetTypeSelector
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                currentType={set.setType}
                                dispatch={dispatch}
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => completeSet(exerciseIndex, setIndex)}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  set.completed 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {set.completed ? '✓' : '○'}
                              </button>
                              
                              <button
                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                              <WorkoutInput
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                field="weight"
                                value={set.weight}
                                dispatch={dispatch}
                                countingMethod={exercise.countingMethod}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Reps</label>
                              <WorkoutInput
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                field="reps"
                                value={set.reps}
                                dispatch={dispatch}
                                countingMethod={exercise.countingMethod}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                              <WorkoutInput
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                field="time"
                                value={set.time}
                                dispatch={dispatch}
                                countingMethod={exercise.countingMethod}
                                placeholder="0:00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">RIR</label>
                              <select
                                value={set.rir}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_SET',
                                  payload: { exerciseIndex, setIndex, field: 'rir', value: e.target.value }
                                })}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                              >
                                {rirOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => addSet(exerciseIndex)}
                      className="w-full mt-3 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Set</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Workout Controls */}
            <div className="flex space-x-3">
              <button
                onClick={cancelWorkout}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
              >
                <X className="h-5 w-5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={finishWorkout}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <span>Finish Workout</span>
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Workout History</h2>
            
            {workoutHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workout history yet.</p>
                <p className="text-sm">Complete your first workout to see it here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutHistory.map((workout, index) => {
                  const stats = calculateWorkoutStats(workout);
                  const { completedSets, totalVolume } = stats;
                  
                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => viewWorkoutHistory(workout)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{workout.templateName}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {new Date(workout.startTime).toLocaleDateString()}
                          </span>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
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
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-3 h-16">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'templates' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <div className="text-xs font-medium">Templates</div>
          </button>
          <button
            onClick={() => setActiveTab('current')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'current' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
            disabled={!currentWorkout}
          >
            <Clock className="h-5 w-5" />
            <div className="text-xs font-medium">Current</div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'history' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <History className="h-5 w-5" />
            <div className="text-xs font-medium">History</div>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AddExerciseModal
        show={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        exercises={allExercises}
        onAddExercise={addExerciseToWorkout}
      />
      
      <WorkoutHistoryModal
        show={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        workout={selectedHistoryWorkout}
      />

      {/* New Template Modal */}
      {showNewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
            <input
              type="text"
              placeholder="Template name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewTemplate(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get all exercises (should be imported from your existing code)
const getAllExercises = () => {
  // This should return your existing exercise directory
  // For now, returning a basic structure
  return [
    { id: 1, name: 'Bench Press', category: 'Chest', equipment: 'Barbell', countingMethod: COUNTING_METHODS.WEIGHT_REPS },
    { id: 2, name: 'Squat', category: 'Legs & Glutes', equipment: 'Barbell', countingMethod: COUNTING_METHODS.WEIGHT_REPS },
    { id: 3, name: 'Plank', category: 'Core', equipment: 'Bodyweight', countingMethod: COUNTING_METHODS.TIME_ONLY },
    // Add more exercises...
  ];
};

export default WorkoutTracker;