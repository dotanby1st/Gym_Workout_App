import React, { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from '../hooks/useWorkouts';
import { Plus, Target, Clock, Edit2, Trash2, Play, Check, History, BarChart3, User, LogOut, Settings, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Complete exercise directory from the document
const EXERCISE_DIRECTORY = {
  "Abdominal": {
    "Bodyweight": [
      "Bicycle Crunch", "Copenhagen Plank", "Core Twist", "Crunch", "Dead Bug", "Dragon Flag",
      "Hanging Knee Raise", "Hanging Leg Raise", "Hanging Sit-Up", "Hanging Windshield Wiper",
      "Hollow Body Crunch", "Hollow Hold", "Jackknife Sit-Up", "Kneeling Ab Wheel Roll-Out",
      "Kneeling Plank", "Kneeling Side Plank", "L-Sit", "Lying Leg Raise", "Lying Windshield Wiper",
      "Lying Windshield Wiper with Bent Knees", "Mountain Climbers", "Oblique Crunch", "Oblique Sit-Up",
      "Plank", "Side Plank", "Sit-Up"
    ],
    "Cable": ["Cable Crunch"],
    "Machine": ["Machine Crunch"]
  },
  "Back": {
    "Barbell": ["Barbell Row", "Barbell Shrug", "Seal Row"],
    "Bodyweight": [
      "Assisted Muscle Up", "Assisted Pull Up", "Inverted Row", "Muscle Up", "Pull Up",
      "Superman Raise", "Weighted Muscle Up", "Weighted Pull Up"
    ],
    "Cable": [
      "Cable Close Grip Seated Row", "Cable Wide Grip Seated Row", "Close Grip Lat Pulldown",
      "One Handed Cable Row", "One Handed Lat Pulldown", "Straight Arm Lat Pullover",
      "Wide Grip Lat Pulldown"
    ],
    "Dumbbell": ["Dumbbell Row", "Dumbbell Shrug", "Dumbbell Single Hand Row"],
    "Machine": ["Seated Machine Row"]
  },
  "Bicep": {
    "Barbell": ["Barbell Curl", "Barbell Preacher Curl"],
    "Cable": [
      "Bayesian Curl", "Cable Curl With Bar", "Cable Hammer Curl (Rope)", "One Hand Bayesian Curl"
    ],
    "Dumbbell": [
      "Dumbbell Curl", "Dumbbell Lying Curl", "Dumbbell Preacher Curl", "Hammer Curl",
      "Seated Dumbbell Curl", "Spider Curl", "Zottman Curl"
    ],
    "Machine": ["Machine Bicep Curl"]
  },
  "Calf": {
    "Barbell": ["Barbell Seated Calf Raise", "Barbell Standing Calf Raise"],
    "Machine": [
      "Machine Calf Raise", "Machine Donkey Calf Raise", "Machine Seated Calf Raise",
      "Machine Standing Calf Raise"
    ]
  },
  "Chest": {
    "Barbell": [
      "Decline Barbell Bench Press", "Flat Barbell Bench Press", "Incline Barbell Bench Press"
    ],
    "Bodyweight": [
      "Assisted Chest Dip", "Chest Dip", "Decline Push-Up", "Incline Push-Up", "Push-Up",
      "Weighted Chest Dip"
    ],
    "Cable": ["Cable Chest Fly", "Cable Chest Press", "Seated Cable Chest Fly"],
    "Dumbbell": [
      "Decline Dumbbell Chest Press", "Dumbbell Chest Fly", "Flat Dumbbell Chest Press",
      "Incline Dumbbell Chest Press"
    ],
    "Machine": [
      "Machine Chest Fly", "Machine Chest Press", "Pec Deck", "Smith Machine Decline Bench Press",
      "Smith Machine Flat Bench Press", "Smith Machine Incline Bench Press"
    ]
  },
  "Forearm & Grip": {
    "Barbell": [
      "Barbell Wrist Curl", "Barbell Wrist Curl Behind the Back", "Barbell Wrist Extension"
    ],
    "Bodyweight": ["Bar Hang"],
    "Cable": ["Cable Wrist Curl", "Cable Wrist Extension", "Reverse Grip Curl"],
    "Dumbbell": ["Dumbbell Wrist Curl", "Dumbbell Wrist Extension", "Reverse Grip Curl"]
  },
  "Legs & Glutes": {
    "Barbell": [
      "Back Squat", "Barbell Deadlift", "Barbell Lunge", "Barbell Stiff Legged Deadlift",
      "Barbell Walking Lunge", "Front Squat", "Pause Squat", "Sumo Squat", "Zercher Squat"
    ],
    "Bodyweight": [
      "Body Weight Lunge", "Box Jump", "Box Squat", "Bulgarian Split Squat", "Jumping Lunge",
      "Nordic Curl", "Pistol Squat", "Step Up"
    ],
    "Cable": ["Cable Kick Back", "Cable Step Up"],
    "Dumbbell": [
      "Dumbbell Deadlift", "Dumbbell Lunge", "Dumbbell Squat", "Dumbbell Stiff Legged Deadlift",
      "Dumbbell Walking Lunge"
    ],
    "Machine": [
      "Hack Squat Machine", "Hip Abduction Machine", "Hip Adduction Machine", "Leg Extension",
      "Leg Press", "Lying Leg Curl", "One-Legged Leg Extension", "One-Legged Lying Leg Curl",
      "One-Legged Seated Leg Curl"
    ],
    "Resistance Band": ["Hip Adduction Against Band"]
  },
  "Shoulder": {
    "Barbell": [
      "Barbell Behind the Neck Overhead Press", "Barbell Front Raise", "Barbell Upright Row",
      "Jerk", "Overhead Press", "Push Press"
    ],
    "Bodyweight": ["Handstand Push Ups"],
    "Cable": [
      "Cable External Shoulder Rotation", "Cable Front Raise", "Cable Internal Shoulder Rotation",
      "Cable Lateral Raise", "Cable Single Hand Front Raise", "Cable Single Hand Lateral Raise",
      "Face Pull", "Standing Rear Delt Cable Crossover"
    ],
    "Dumbbell": [
      "Arnold Press", "Dumbbell Front Raise", "Dumbbell Lateral Raise", "Dumbbell Rear Delt Row",
      "Dumbbell Reverse Flyes", "Dumbbell Shoulder Press", "Seated Dumbbell Front Raise",
      "Seated Dumbbell Shoulder Press", "Seated Lateral Raise"
    ],
    "Machine": [
      "Machine Lateral Raise", "Machine Reverse Fly", "Machine Shoulder Press",
      "Machine Single Hand Reverse Fly", "Seated Smith Machine Shoulder Press"
    ],
    "Other Equipment": ["Plate Front Raise"],
    "Resistance Band": ["Band External Shoulder Rotation", "Band Internal Shoulder Rotation"]
  },
  "Triceps": {
    "Barbell": [
      "Barbell Lying Triceps Extension", "Barbell Seated Triceps Extension",
      "Barbell Standing Triceps Extension", "Close Grip"
    ],
    "Bodyweight": ["Assisted Tricep Dip", "Diamond Push-Up", "Tricep Dip"],
    "Cable": [
      "Crossbody Cable Triceps Extension", "Overhead Cable Triceps Extension",
      "Single Hand Tricep Pushdown", "Tricep Pushdown With Bar", "Tricep Pushdown With Rope"
    ],
    "Dumbbell": ["Dumbbell Lying Triceps Extension", "Dumbbell Standing Triceps Extension"]
  }
};

// Flatten exercise directory for easy searching
const getAllExercises = () => {
  const exercises = [];
  let id = 1;
  
  Object.entries(EXERCISE_DIRECTORY).forEach(([category, equipmentTypes]) => {
    Object.entries(equipmentTypes).forEach(([equipment, exerciseList]) => {
      exerciseList.forEach(exerciseName => {
        exercises.push({
          id: id++,
          name: exerciseName,
          category: category,
          equipment: equipment,
          is_custom: false,
          user_id: null
        });
      });
    });
  });
  
  return exercises;
};

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
  
  // Search functionality
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');

  // Get unique categories and equipment for filters
  const categories = useMemo(() => {
    const cats = [...new Set(allExercises.map(ex => ex.category))].sort();
    return cats;
  }, [allExercises]);

  const equipmentTypes = useMemo(() => {
    const equipment = [...new Set(allExercises.map(ex => ex.equipment))].sort();
    return equipment;
  }, [allExercises]);

  // Filter exercises based on search criteria
  const filteredExercises = useMemo(() => {
    return allExercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || exercise.category === selectedCategory;
      const matchesEquipment = !selectedEquipment || exercise.equipment === selectedEquipment;
      
      return matchesSearch && matchesCategory && matchesEquipment;
    });
  }, [allExercises, exerciseSearchTerm, selectedCategory, selectedEquipment]);

  // RIR options with proper structure
  const rirOptions = useMemo(() => [
    { value: '', label: 'RIR' },
    { value: '0', label: '0 RIR' },
    { value: '1', label: '1 RIR' },
    { value: '2', label: '2 RIR' },
    { value: '3', label: '3 RIR' },
    { value: '4+', label: '4+ RIR' }
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

  // Save current workout to localStorage
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

  // Load saved workout on component mount
  useEffect(() => {
    try {
      const savedWorkout = localStorage.getItem('currentWorkout');
      const savedStartTime = localStorage.getItem('workoutStartTime');
      
      if (savedWorkout && savedStartTime) {
        dispatch({ type: 'SET_WORKOUT', payload: JSON.parse(savedWorkout) });
        const startTime = parseInt(savedStartTime);
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

  // Clear search filters
  const clearFilters = () => {
    setExerciseSearchTerm('');
    setSelectedCategory('');
    setSelectedEquipment('');
  };

  // Rest of the component methods remain the same...
  // [Previous methods: handleAddExercise, handleAddMeasurement, handleCreateTemplate, etc.]

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

  // Create template handler
  const handleCreateTemplate = () => {
    if (newTemplate.name.trim()) {
      try {
        const template = {
          id: Date.now(),
          name: newTemplate.name.trim(),
          exercises: []
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
        const exercise = allExercises.find(ex => ex.id === templateEx.exerciseId);
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
      setWorkoutTemplates(prev => prev.filter(template => template.id !== templateId));
      toast.success('Template deleted');
    }
  };

  // Update template exercise handler
  const updateTemplateExercise = (exerciseIndex, field, value) => {
    setEditingTemplate(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, idx) => 
        idx === exerciseIndex ? { ...ex, [field]: value } : ex
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
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
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
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workout templates yet.</p>
                <p className="text-sm">Create your first template to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutTemplates.map(template => (
                  <div key={template.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => editTemplate(template)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-800 p-1"
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
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                        <p className="text-sm text-gray-600">{exercise.category} • {exercise.equipment}</p>
                      </div>
                      <button
                        onClick={() => toggleWeightUnit(exerciseIndex)}
                        className="text-sm bg-gray-100 px-3 py-1 rounded flex items-center space-x-1"
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
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Weight ({exercise.weightUnit})
                              </label>
                              <WorkoutInput
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                field="weight"
                                value={set.weight}
                                dispatch={dispatch}
                                step="0.25"
                                min="0"
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
                                min="0"
                                max="50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">RIR</label>
                              <WorkoutSelect
                                exerciseIndex={exerciseIndex}
                                setIndex={setIndex}
                                field="rir"
                                value={set.rir}
                                dispatch={dispatch}
                                options={rirOptions}
                              />
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
                    <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
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
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No measurements yet.</p>
                <p className="text-sm">Add your first measurement to track progress!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {measurements.map(measurement => (
                  <div key={measurement.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{measurement.type}</h3>
                        <p className="text-sm text-gray-600">{measurement.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">{measurement.value}</div>
                        <div className="text-xs text-gray-600">
                          {measurement.type === 'Weight' ? 'kg' : 'cm'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exercises Tab with Search */}
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

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearchTerm}
                  onChange={(e) => setExerciseSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {exerciseSearchTerm && (
                  <button
                    onClick={() => setExerciseSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Equipment</option>
                  {equipmentTypes.map(equipment => (
                    <option key={equipment} value={equipment}>{equipment}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(exerciseSearchTerm || selectedCategory || selectedEquipment) && (
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              )}

              {/* Results Count */}
              <div className="text-sm text-gray-600 text-center">
                Showing {filteredExercises.length} of {allExercises.length} exercises
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              {filteredExercises.map(exercise => (
                <div key={exercise.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{exercise.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Category:</span> {exercise.category}</p>
                        <p><span className="font-medium">Equipment:</span> {exercise.equipment}</p>
                      </div>
                    </div>
                    {exercise.is_custom && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        Custom
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredExercises.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No exercises found.</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
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
                  ? 'text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      
      {/* New Template Modal */}
      {showNewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Create New Template</h3>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Template name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => setShowNewTemplate(false)}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <input
                type="text"
                placeholder="Template name"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Exercises</h4>
                {editingTemplate.exercises?.map((exercise, index) => {
                  const exerciseData = allExercises.find(ex => ex.id === exercise.exerciseId);
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{exerciseData?.name || 'Unknown Exercise'}</span>
                        <button
                          onClick={() => {
                            setEditingTemplate(prev => ({
                              ...prev,
                              exercises: prev.exercises.filter((_, idx) => idx !== index)
                            }));
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Sets</label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => updateTemplateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Reps</label>
                          <input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) => updateTemplateExercise(index, 'reps', parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                          <select
                            value={exercise.weightUnit}
                            onChange={(e) => updateTemplateExercise(index, 'weightUnit', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="kg">KG</option>
                            <option value="lbs">LBS</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <button
                  onClick={() => {
                    // For now, just add a placeholder - in a real app you'd have an exercise picker
                    const exerciseId = allExercises[0]?.id;
                    if (exerciseId) {
                      setEditingTemplate(prev => ({
                        ...prev,
                        exercises: [...(prev.exercises || []), {
                          exerciseId,
                          sets: 3,
                          reps: 10,
                          weightUnit: 'kg'
                        }]
                      }));
                    }
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Exercise</span>
                </button>
              </div>
            </div>
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setEditingTemplate(null);
                }}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={newExercise.equipment}
                onChange={(e) => setNewExercise(prev => ({ ...prev, equipment: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select equipment</option>
                {equipmentTypes.map(equipment => (
                  <option key={equipment} value={equipment}>{equipment}</option>
                ))}
              </select>
            </div>
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => {
                  setShowNewExercise(false);
                  setNewExercise({ name: '', category: '', equipment: '' });
                }}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExercise}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
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
              <h3 className="text-lg font-semibold text-gray-900">Add New Measurement</h3>
            </div>
            <div className="p-4 space-y-4">
              <select
                value={newMeasurement.type}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select measurement type</option>
                <option value="Weight">Weight (kg)</option>
                <option value="Body Fat %">Body Fat %</option>
                <option value="Chest">Chest (cm)</option>
                <option value="Waist">Waist (cm)</option>
                <option value="Arms">Arms (cm)</option>
                <option value="Thighs">Thighs (cm)</option>
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
                onClick={() => {
                  setShowNewMeasurement(false);
                  setNewMeasurement({ type: '', value: '', date: new Date().toISOString().split('T')[0] });
                }}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMeasurement}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTracker;