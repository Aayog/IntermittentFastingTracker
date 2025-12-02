import React, { useState, useEffect, useRef, useCallback } from 'react';
// Assuming lucide-react is available in the environment for icons.
// If not, you can replace these with inline SVG icons or Font Awesome.
import { Play, Pause, RotateCcw, Flame, Leaf, Zap, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react';


  // Define the different intermittent fasting phases with their thresholds, descriptions, and icons.
  // Thresholds are in milliseconds for easy comparison with elapsedTime.
  const fastingPhases = [
    {
      name: "Anabolic (0-4 hours)",
      description: "Your body is still digesting and absorbing nutrients from your last meal. Glucose levels are high, and insulin is elevated, promoting energy storage and inhibiting fat burning. Your body primarily uses glucose for fuel. Ketone production is minimal or non-existent.",
      threshold: 0 * 60 * 60 * 1000, // 0 hours
      icon: <Leaf className="w-8 h-8 text-green-500" /> // Icon for the anabolic phase
    },
    {
      name: "Catabolic / Glycogen Depletion (4-12 hours)",
      description: "Digestion is complete. Your body begins to deplete its stored glycogen (glucose) in the liver and muscles. Insulin levels start to drop significantly, and glucagon levels rise, signaling the body to release stored glucose. Fat burning gradually increases as glycogen stores diminish. Ketone levels remain low.",
      threshold: 4 * 60 * 60 * 1000, // 4 hours
      icon: <Zap className="w-8 h-8 text-yellow-500" /> // Icon for glycogen depletion
    },
    {
      name: "Fat Burning / Early Ketosis (12-18 hours)",
      description: "Glycogen stores are significantly depleted. Your body makes a metabolic switch to primarily burning stored fat for energy. Ketone production (e.g., beta-hydroxybutyrate) begins in the liver from fatty acids and starts to rise. Insulin levels are low, and growth hormone (HGH) levels start to rise, aiding in fat loss and muscle preservation. Glucose levels stabilize at a lower baseline.",
      threshold: 12 * 60 * 60 * 1000, // 12 hours
      icon: <Flame className="w-8 h-8 text-orange-500" /> // Icon for fat burning
    },
    {
      name: "Autophagy / Enhanced Ketosis (18-24 hours)",
      description: "Your body is firmly in ketosis, relying heavily on fat and ketones for fuel. Cellular repair processes, particularly autophagy (the body's self-cleaning mechanism, where damaged cells are recycled), become significantly more active. HGH levels continue to increase, supporting fat metabolism and muscle maintenance. Ketone levels are noticeably elevated.",
      threshold: 18 * 60 * 60 * 1000, // 18 hours
      icon: <HeartPulse className="w-8 h-8 text-red-500" /> // Icon for autophagy
    },
    {
      name: "Deep Autophagy / Immune Regeneration (24-48 hours)",
      description: "Autophagy is highly active, promoting profound cellular rejuvenation and removal of damaged cells. Your body may begin to regenerate immune cells (lymphocytes), leading to a stronger immune system. Ketone levels are consistently high, providing a stable and efficient energy source for the brain and body. Insulin sensitivity improves further.",
      threshold: 24 * 60 * 60 * 1000, // 24 hours
      icon: <ShieldCheck className="w-8 h-8 text-purple-500" /> // Icon for immune regeneration
    },
    {
      name: "Advanced Autophagy / Stem Cell Activation (48+ hours)",
      description: "Autophagy reaches peak levels, offering profound cellular cleansing and repair benefits. There's potential for stem cell activation, particularly in the immune system, leading to significant cellular regeneration and tissue repair. Ketone bodies are the primary fuel source, and insulin levels are at their lowest. This phase is associated with significant metabolic flexibility.",
      threshold: 48 * 60 * 60 * 1000, // 48 hours
      icon: <Sparkles className="w-8 h-8 text-blue-500" /> // Icon for stem cell activation
    }
  ];

  
// Main App component for the Intermittent Fasting Tracker
const App = () => {
  const [isFasting, setIsFasting] = useState(() => {
  const saved = localStorage.getItem("isFasting");
    return saved === "true"; 
  });

  const [startTime, setStartTime] = useState(() => {
    const saved = localStorage.getItem("startTime");
    return saved ? Number(saved) : null;
  });

  const [targetFastingHours, setTargetFastingHours] = useState(() => {
    const saved = localStorage.getItem("targetFastingHours");
    return saved ? Number(saved) : 18;
  });
  const [elapsedTime, setElapsedTime] = useState(0); // Elapsed time in milliseconds
  const [currentPhase, setCurrentPhase] = useState({}); // Stores the details of the current fasting phase
  const [estimatedEndTime, setEstimatedEndTime] = useState(null); // Timestamp for estimated end of fast

  // useRef to hold the interval ID, allowing it to persist across renders
  const intervalRef = useRef(null);

  // Helper function to format milliseconds into HH:MM:SS string
  const formatTime = (ms) => {
    if (ms < 0) ms = 0; // Ensure time doesn't go negative
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Pad with leading zeros if necessary and join with colons
    return [hours, minutes, seconds]
      .map(unit => String(unit).padStart(2, '0'))
      .join(':');
  };

  // Helper function to format a Date object into YYYY-MM-DDTHH:MM for datetime-local input
  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // useCallback hook to memoize the getFastingPhase function.
  const getFastingPhase = useCallback((timeElapsed) => {
    const sortedPhases = [...fastingPhases].sort((a, b) => a.threshold - b.threshold);
    let current = sortedPhases[0];
    for (let i = 0; i < sortedPhases.length; i++) {
      if (timeElapsed >= sortedPhases[i].threshold) {
        current = sortedPhases[i];
      } else {
        break;
      }
    }
    return current;
  }, []);

  // Function to calculate and set estimated end time
  const calculateEstimatedEndTime = useCallback((start, targetHours) => {
    if (start && targetHours) {
      const end = start + (targetHours * 60 * 60 * 1000);
      setEstimatedEndTime(end);
    } else {
      setEstimatedEndTime(null);
    }
  }, []);

  // Effect hook to initialize start time to current time and calculate estimated end time on mount
  useEffect(() => {
    const savedStartTime = localStorage.getItem("fast_start_time");
    const savedIsFasting = localStorage.getItem("fast_is_fasting");
    const savedTargetHours = localStorage.getItem("fast_target_hours");

    if (savedStartTime) setStartTime(Number(savedStartTime));
    if (savedIsFasting) setIsFasting(savedIsFasting === "true");
    if (savedTargetHours) setTargetFastingHours(Number(savedTargetHours));
  }, []);

  useEffect(() => {
    if (startTime !== null) {
      localStorage.setItem("fast_start_time", startTime.toString());
    }
  }, [startTime]);

  useEffect(() => {
    localStorage.setItem("isFasting", isFasting);
  }, [isFasting]);

  useEffect(() => {
    localStorage.setItem("fast_is_fasting", isFasting.toString());
  }, [isFasting]);

  useEffect(() => {
    localStorage.setItem("fast_target_hours", targetFastingHours.toString());
  }, [targetFastingHours]);


  // Effect hook to update elapsed time and current phase when the timer is running
  useEffect(() => {
    if (isFasting && startTime !== null) {
      // Clear any existing interval to prevent multiple timers running simultaneously
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        setElapsedTime(now - startTime); // Calculate elapsed time from the stored start time
      }, 1000);
    } else {
      // If not fasting, ensure the interval is cleared
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Update the current phase whenever elapsed time changes (or when isFasting/startTime changes)
    setCurrentPhase(getFastingPhase(elapsedTime));

    // Cleanup function: Clear the interval when the component unmounts or when isFasting becomes false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isFasting, startTime, elapsedTime, getFastingPhase]); // Dependencies for this effect

  // Function to start the fasting timer
  const startFasting = () => {
    if (!isFasting) {
      // Use the current `startTime` state, which is either default or user-set
      setIsFasting(true);
      // The useEffect above will pick up `isFasting` change and start the interval
    }
  };

  // Function to pause the fasting timer
  const pauseFasting = () => {
    if (isFasting) {
      setIsFasting(false);
      // The useEffect above will pick up `isFasting` change and clear the interval
    }
  };

  // Function to reset the fasting timer to initial state
  const resetFasting = () => {
    const now = Date.now();
    setIsFasting(false);
    setStartTime(now); // Reset start time to current moment
    setElapsedTime(0); // Reset elapsed time to zero
    setCurrentPhase(fastingPhases[0]); // Reset to the very first phase (Anabolic)
    calculateEstimatedEndTime(now, targetFastingHours); // Recalculate estimated end time
    localStorage.setItem("fast_start_time", now.toString());
    localStorage.setItem("fast_is_fasting", "false");
  };

  // Handle change for start time input
  const handleStartTimeChange = (e) => {
    const newDate = new Date(e.target.value);
    const newStartTimeMs = newDate.getTime();
    setStartTime(newStartTimeMs);
    // If fast is active, immediately update elapsed time based on new start time
    if (isFasting) {
      setElapsedTime(Date.now() - newStartTimeMs);
    } else {
      setElapsedTime(0); // If not fasting, resetting start time should reset elapsed to 0
    }
    calculateEstimatedEndTime(newStartTimeMs, targetFastingHours);
  };

  // Handle change for target fasting hours input
  const handleTargetHoursChange = (e) => {
    const hours = parseInt(e.target.value, 10);
    if (!isNaN(hours) && hours >= 1) { // Ensure it's a valid positive number
      setTargetFastingHours(hours);
      calculateEstimatedEndTime(startTime, hours); // Recalculate estimated end time
    }
  };

  return (
    // Main container for the app, styled with Tailwind CSS for full-screen background and centering.
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4 font-inter">
      {/* Central card for the fasting tracker UI */}
      <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-md text-center transform transition-all duration-300 hover:scale-[1.01]">
        {/* Application Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6 tracking-tight">
          Fasting Tracker
        </h1>

        {/* Input fields for Start Time and Target Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Fast Start Time:
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={formatDateTimeLocal(startTime)}
              onChange={handleStartTimeChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              disabled={isFasting} // Disable editing start time while fast is active
            />
          </div>
          <div>
            <label htmlFor="targetHours" className="block text-sm font-medium text-gray-700 mb-1">
              Target Fasting Hours:
            </label>
            <input
              type="number"
              id="targetHours"
              value={targetFastingHours}
              onChange={handleTargetHoursChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              disabled={isFasting} // Disable editing target hours while fast is active
            />
          </div>
        </div>

        {/* Timer Display Section */}
        <div className="bg-gray-100 rounded-2xl p-6 mb-4 shadow-inner">
          <p className="text-5xl md:text-7xl font-mono font-bold text-gray-900 mb-2">
            {formatTime(elapsedTime)} {/* Display formatted elapsed time */}
          </p>
          <p className="text-lg text-gray-600">
            {isFasting ? 'Fasting in Progress' : 'Ready to Start'} {/* Dynamic status message */}
          </p>
        </div>

        {/* Estimated End Time Display */}
        {estimatedEndTime && (
          <div className="bg-gray-100 rounded-2xl p-4 mb-8 shadow-inner text-center">
            <p className="text-md text-gray-700">
              Estimated Fast End: <span className="font-semibold">{new Date(estimatedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        )}


        {/* Control Buttons Section */}
        <div className="flex justify-center space-x-4 mb-10">
          {!isFasting ? ( // Show Start button if not fasting
            <button
              onClick={startFasting}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 active:scale-95"
            >
              <Play className="w-5 h-5 mr-2" /> Start Fast
            </button>
          ) : ( // Show Pause button if fasting
            <button
              onClick={pauseFasting}
              className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-xl shadow-lg hover:bg-yellow-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-yellow-300 active:scale-95"
            >
              <Pause className="w-5 h-5 mr-2" /> Pause Fast
            </button>
          )}
          {/* Reset Button */}
          <button
            onClick={resetFasting}
            className="flex items-center px-6 py-3 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-300 active:scale-95"
          >
            <RotateCcw className="w-5 h-5 mr-2" /> Reset
          </button>
        </div>

        {/* Fasting Phase Display Section */}
        {currentPhase && ( // Ensure currentPhase is not null before rendering
          <div className="bg-gray-50 rounded-2xl p-6 shadow-md text-left transition-all duration-300 ease-in-out transform hover:shadow-xl">
            <div className="flex items-center mb-3">
              {currentPhase.icon} {/* Display phase icon */}
              <h2 className="text-2xl font-bold text-gray-800 ml-3">
                {currentPhase.name} {/* Display phase name */}
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {currentPhase.description} {/* Display phase description */}
            </p>
            {/* Display information about the next phase, if applicable */}
            {elapsedTime < fastingPhases[fastingPhases.length - 1].threshold && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Next Phase:</p>
                    {/* Filter for phases that are yet to be reached, sort by threshold, and take the first one */}
                    {fastingPhases
                        .filter(phase => phase.threshold > elapsedTime)
                        .sort((a, b) => a.threshold - b.threshold)
                        .slice(0, 1) // Get only the very next phase
                        .map((nextPhase, index) => (
                            <div key={index} className="flex items-center text-gray-600 text-sm">
                                {nextPhase.icon}
                                <span className="ml-2 font-medium">{nextPhase.name}</span>
                                <span className="ml-2 text-gray-500">
                                    (at {Math.floor(nextPhase.threshold / (1000 * 60 * 60))} hours)
                                </span>
                            </div>
                        ))}
                </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-8 text-gray-200 text-sm opacity-80">
          Fasting phase information is for general guidance and not medical advice.
        </p>
      </div>
    </div>
  );
};

export default App; // Export the App component as default
