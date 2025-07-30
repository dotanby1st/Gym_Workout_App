import React, { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from '../hooks/useWorkouts';
import { Plus, Dumbbell, Calendar, Target, Clock, Edit2, Trash2, Play, Check, History, BarChart3, User, Filter, LogOut, Settings } from 'lucide-react';
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
        completed: true
      };
      return completeState;
    case 'CLEAR_WORKOUT':
      return null;
    default:
      return state;
  }
};

const WorkoutInput = React.memo(({ 
  exerciseIndex, 
  setIndex, 
  field, 
  type, 
  inputMode, 
  placeholder, 
  value, 
  disabled, 
  dispatch,
  className = "p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
}) => {
  const inputRef = useRef(null);
  
  const handleChange = useCallback((e) => {
    dispatch({
      type: 'UPDATE_SET',
      payload: { exerciseIndex, setIndex, field, value: e.target.value }
    });
  }, [dispatch, exerciseIndex, setIndex, field]);

  return (
    <input
      ref={inputRef}
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={className}
    />
  );
});

const WorkoutSelect = React.memo(({ 
  exerciseIndex, 
  setIndex, 
  field, 
  value, 
  disabled, 
  dispatch,
  options,
  className = "p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
}) => {
  const handleChange = useCallback((e) => {
    dispatch({
      type: 'UPDATE_SET',
      payload: { exerciseIndex, setIndex, field, value: e.target.value }
    });
  }, [dispatch, exerciseIndex, setIndex, field]);

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={className}
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
  const [activeTab, setActiveTab] = useState('workouts');
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [currentWorkout, dispatch] = useReducer(workoutReducer, null);
  const [workoutTemplates, setWorkoutTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('workoutTemplates');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          name: 'Push Day',
          exercises: [
            { exerciseId: 1, sets: 3, reps: '8-10', weightUnit: 'kg' },
            { exerciseId: 10, sets: 3, reps: '8-10', weightUnit: 'lbs' }
          ]
        }
      ];
    } catch (error) {
      return [
        {
          id: 1,
          name: 'Push Day',
          exercises: [
            { exerciseId: 1, sets: 3, reps: '8-10', weightUnit: 'kg' },
            { exerciseId: 10, sets: 3, reps: '8-10', weightUnit: 'lbs' }
          ]
        }
      ];
    }
  });
  
  const [workoutHistory, setWorkoutHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('workoutHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
  
  const [measurements, setMeasurements] = useState(() => {
    try {
      const saved = localStorage.getItem('measurements');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
  
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [showNewMeasurement, setShowNewMeasurement] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', exercises: [] });
  const [newExercise, setNewExercise] = useState({ name: '', category: '', equipment: '' });
  const [newMeasurement, setNewMeasurement] = useState({ type: '', value: '', date: new Date().toISOString().split('T')[0] });
  const [selectedExerciseHistory, setSelectedExerciseHistory] = useState(null);

  const rirOptions = useMemo(() => [
    { value: '', label: 'RIR' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: 'Fail', label: 'Fail' }
  ], []);

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
      localStorage.setItem('measurements', JSON.stringify(measurements));
    } catch (error) {
      console.error('Failed to save measurements:', error);
    }
  }, [measurements]);

  useEffect(() => {
    let interval;
    if (workoutStartTime) {
      interval = setInterval(() => {
        setWorkoutDuration(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStartTime]);

  const formatDuration = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleAddExercise = async () => {
    if (newExercise.name && newExercise.category && newExercise.equipment) {
      await addExercise(newExercise);
      setNewExercise({ name: '', category: '', equipment: '' });
      setShowNewExercise(false);
    }
  };

  const handleAddMeasurement = () => {
    if (newMeasurement.type && newMeasurement.value && newMeasurement.date) {
      setMeasurements(prev => [...prev, {
        id: Date.now(),
        type: newMeasurement.type,
        value: parseFloat(newMeasurement.value),
        date: newMeasurement.date
      }]);
      setNewMeasurement({ type: '', value: '', date: new Date().toISOString().split('T')[0] });
      setShowNewMeasurement(false);
    }
  };

  const handleCreateTemplate = () => {
    if (newTemplate.name.trim()) {
      const template = {
        id: Date.now(),
        name: newTemplate.name.trim(),
        exercises: [
          { exerciseId: 1, sets: 3, reps: '8-10', weightUnit: 'kg' },
          { exerciseId: 10, sets: 3, reps: '8-10', weightUnit: 'kg' }
        ]
      };
      setWorkoutTemplates(prev => [...prev, template]);
      setNewTemplate({ name: '', exercises: [] });
      setShowNewTemplate(false);
      toast.success('Template created and saved!');
    } else {
      toast.error('Please enter a template name');
    }
  };

  const startWorkout = useCallback((template) => {
    const startTime = Date.now();
    setWorkoutStartTime(startTime);
    
    const workout = {
      ...template,
      startTime: new Date(startTime),
      completedSets: {},
      exercises: template.exercises.map((ex) => ({
        ...ex,
        actualSets: Array(ex.sets).fill(null).map(() => ({
          weight: '',
          reps: '',
          rir: '',
          completed: false
        }))
      }))
    };
    
    dispatch({ type: 'SET_WORKOUT', payload: workout });
    setActiveTab('current');
  }, []);

  const finishWorkout = useCallback(() => {
    if (currentWorkout) {
      const completedWorkout = {
        ...currentWorkout,
        endTime: new Date(),
        duration: workoutDuration,
        id: Date.now()
      };
      setWorkoutHistory(prev => [completedWorkout, ...prev]);
      toast.success('Workout completed! 💪');
    }
    
    dispatch({ type: 'CLEAR_WORKOUT' });
    setWorkoutStartTime(null);
    setWorkoutDuration(0);
    setActiveTab('workouts');
  }, [currentWorkout, workoutDuration]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully!');
  };

  const toggleExerciseWeightUnit = useCallback((exerciseIndex) => {
    dispatch({ type: 'TOGGLE_WEIGHT_UNIT', payload: exerciseIndex });
  }, []);

  const completeSet = useCallback((exerciseIndex, setIndex) => {
    if (!currentWorkout) return;
    
    const set = currentWorkout.exercises[exerciseIndex].actualSets[setIndex];
    if (!set?.weight || !set?.reps || !set?.rir) {
      toast.error('Please fill in all fields before completing the set');
      return;
    }
    
    dispatch({ type: 'COMPLETE_SET', payload: { exerciseIndex, setIndex } });
    toast.success('Set completed! 💪');
  }, [currentWorkout]);

  const exercisesByCategory = useMemo(() => {
    return exercises.reduce((acc, exercise) => {
      if (!acc[exercise.category]) {
        acc[exercise.category] = [];
      }
      acc[exercise.category].push(exercise);
      return acc;
    }, {});
  }, [exercises]);
  const ExerciseList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Exercises</h2>
        <button
          onClick={() => setShowNewExercise(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Add Exercise
        </button>
      </div>

      {exercisesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading exercises...</p>
        </div>
      ) : (
        Object.entries(exercisesByCategory).map(([category, categoryExercises]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1">{category}</h3>
            <div className="grid gap-2">
              {categoryExercises
                .sort((a, b) => a.equipment.localeCompare(b.equipment))
                .map(exercise => (
                <div 
                  key={exercise.id} 
                  className="bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedExerciseHistory(exercise.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                      <p className="text-sm text-gray-600">{exercise.equipment}</p>
                      {exercise.is_custom && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Custom</span>}
                    </div>
                    <div className="text-sm text-gray-500">Tap for history</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const WorkoutTemplates = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Workout Templates</h2>
        <button 
          onClick={() => setShowNewTemplate(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          New Template
        </button>
      </div>
      
      <div className="grid gap-4">
        {workoutTemplates.map(template => (
          <div key={template.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-800">{template.name}</h3>
              <button
                onClick={() => startWorkout(template)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"
              >
                <Play size={16} />
                Start
              </button>
            </div>
            <div className="space-y-2">
              {template.exercises.map((ex, idx) => {
                const exercise = exercises.find(e => e.id === ex.exerciseId);
                return (
                  <div key={`${template.id}-${idx}-${ex.exerciseId}`} className="text-sm text-gray-600 flex items-center gap-2">
                    <Target size={16} />
                    <span>{exercise?.name || 'Unknown Exercise'}: {ex.sets} sets × {ex.reps} reps ({ex.weightUnit?.toUpperCase() || 'KG'})</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CurrentWorkout = () => {
    if (!currentWorkout) {
      return (
        <div className="text-center py-8">
          <Dumbbell size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No active workout. Start one from your templates!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-gray-800">{currentWorkout.name}</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-mono bg-blue-50 px-3 py-1 rounded">
                <Clock size={20} className="text-blue-600" />
                <span className="text-blue-600">{formatDuration(workoutDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {currentWorkout.exercises.map((ex, exerciseIndex) => {
            const exercise = exercises.find(e => e.id === ex.exerciseId);
            
            return (
              <div key={`exercise-${exerciseIndex}`} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">{exercise?.name || 'Unknown Exercise'}</h3>
                  <button
                    onClick={() => toggleExerciseWeightUnit(exerciseIndex)}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                  >
                    <Settings size={14} />
                    {ex.weightUnit?.toUpperCase() || 'KG'}
                  </button>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: ex.sets }, (_, setIndex) => {
                    const set = ex.actualSets[setIndex] || { weight: '', reps: '', rir: '', completed: false };
                    const isCompleted = set.completed;
                    
                    return (
                      <div key={`set-${exerciseIndex}-${setIndex}`} className={`grid grid-cols-5 gap-2 p-2 rounded ${isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium">Set {setIndex + 1}</span>
                        </div>
                        
                        <WorkoutInput
                          exerciseIndex={exerciseIndex}
                          setIndex={setIndex}
                          field="weight"
                          type="text"
                          inputMode="decimal"
                          placeholder={`Weight (${ex.weightUnit || 'kg'})`}
                          value={set.weight}
                          disabled={isCompleted}
                          dispatch={dispatch}
                        />
                        
                        <WorkoutInput
                          exerciseIndex={exerciseIndex}
                          setIndex={setIndex}
                          field="reps"
                          type="text"
                          inputMode="numeric"
                          placeholder="Reps"
                          value={set.reps}
                          disabled={isCompleted}
                          dispatch={dispatch}
                        />
                        
                        <WorkoutSelect
                          exerciseIndex={exerciseIndex}
                          setIndex={setIndex}
                          field="rir"
                          value={set.rir}
                          disabled={isCompleted}
                          dispatch={dispatch}
                          options={rirOptions}
                        />
                        
                        <button 
                          onClick={() => completeSet(exerciseIndex, setIndex)}
                          disabled={isCompleted}
                          className={`p-1 rounded text-sm font-bold ${
                            isCompleted 
                              ? 'bg-green-200 text-green-800 cursor-not-allowed' 
                              : 'bg-gray-200 text-gray-700 hover:bg-green-200 hover:text-green-800'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={finishWorkout}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold"
        >
          Finish Workout
        </button>
      </div>
    );
  };

  const HistoryTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Workout History</h2>
      <div className="space-y-3">
        {workoutHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No workouts completed yet</p>
        ) : (
          workoutHistory.map(workout => (
            <div key={workout.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{workout.name}</h3>
                <div className="text-sm text-gray-600">{formatDuration(workout.duration)}</div>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(workout.startTime).toLocaleDateString()} • {new Date(workout.startTime).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const MeasurementsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Measurements</h2>
        <button
          onClick={() => setShowNewMeasurement(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Add Measurement
        </button>
      </div>
      
      <div className="space-y-3">
        {measurements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No measurements logged yet</p>
        ) : (
          measurements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(measurement => (
            <div key={measurement.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">{measurement.type}</h3>
                  <p className="text-sm text-gray-600">{measurement.date}</p>
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {measurement.value} {measurement.type === 'Body Weight' ? 'kg' : 'cm'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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

      <div className="p-4">
        {activeTab === 'workouts' && <WorkoutTemplates />}
        {activeTab === 'exercises' && <ExerciseList />}
        {activeTab === 'current' && <CurrentWorkout />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'measurements' && <MeasurementsTab />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
        <div className="flex justify-around">
          {[
            { id: 'workouts', icon: Dumbbell, label: 'Templates' },
            { id: 'exercises', icon: Target, label: 'Exercises' },
            { id: 'current', icon: Play, label: 'Current' },
            { id: 'history', icon: History, label: 'History' },
            { id: 'measurements', icon: BarChart3, label: 'Measurements' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                activeTab === id ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon size={18} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {showNewExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Create Custom Exercise</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Exercise name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <select
                value={newExercise.category}
                onChange={(e) => setNewExercise({...newExercise, category: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">Select category</option>
                <option value="Chest">Chest</option>
                <option value="Back">Back</option>
                <option value="Legs">Legs</option>
                <option value="Shoulders">Shoulders</option>
                <option value="Arms">Arms</option>
                <option value="Core">Core</option>
              </select>
              <select
                value={newExercise.equipment}
                onChange={(e) => setNewExercise({...newExercise, equipment: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">Select equipment</option>
                <option value="Barbell">Barbell</option>
                <option value="Dumbbell">Dumbbell</option>
                <option value="Cable">Cable</option>
                <option value="Machine">Machine</option>
                <option value="Bodyweight">Bodyweight</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAddExercise}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
                >
                  Create Exercise
                </button>
                <button
                  onClick={() => setShowNewExercise(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Create New Template</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Template name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <p className="text-sm text-gray-600">Template will be created with default exercises.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTemplate}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
                >
                  Create Template
                </button>
                <button
                  onClick={() => setShowNewTemplate(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewMeasurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Add Measurement</h3>
            <div className="space-y-4">
              <select
                value={newMeasurement.type}
                onChange={(e) => setNewMeasurement({...newMeasurement, type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">Select measurement type</option>
                <option value="Body Weight">Body Weight (kg)</option>
                <option value="Waist">Waist Circumference (cm)</option>
                <option value="Chest">Chest Circumference (cm)</option>
                <option value="Arms">Arm Circumference (cm)</option>
                <option value="Thighs">Thigh Circumference (cm)</option>
              </select>
              <input
                type="number"
                step="0.1"
                placeholder="Value"
                value={newMeasurement.value}
                onChange={(e) => setNewMeasurement({...newMeasurement, value: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={newMeasurement.date}
                onChange={(e) => setNewMeasurement({...newMeasurement, date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddMeasurement}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
                >
                  Add Measurement
                </button>
                <button
                  onClick={() => setShowNewMeasurement(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTracker;
