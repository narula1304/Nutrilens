import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { logMeal } from '../services/api.jsx';

// Modal now accepts nutritionData prop
export default function QuickAddModal({ isOpen, onClose, onMealAdded, nutritionData }) {
  const { token } = useAuth();
  const [foodName, setFoodName] = useState('');
  const [grams, setGrams] = useState(100);

  // State for calculated calories based on lookup
  const [calculatedCalories, setCalculatedCalories] = useState(null);

  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState('');

  // --- CORRECTED: Grams Change Handler ---
  const handleGramsChange = (e) => {
    const value = e.target.value;
    // Allow empty string or any non-negative integer
    if (value === '' || /^\d*$/.test(value)) { // Use simpler regex allowing zeros
         // If empty, set state to empty string, otherwise parse the number
        setGrams(value === '' ? '' : parseInt(value, 10));
    }
    // Ignore invalid input like negative signs or decimals
  };

  // Ensure value is at least 1 when the input loses focus
  const handleGramsBlur = () => {
    if (grams === '' || grams < 1) {
      setGrams(1);
    }
  };

  // Calculate calories when foodName or grams change
  useEffect(() => {
    // Use the current grams value, defaulting to 1 if empty for calculation
    const currentGrams = grams === '' ? 1 : grams;
    if (foodName && currentGrams >= 1 && nutritionData) {
      const foodKey = foodName.trim().toLowerCase();
      if (nutritionData[foodKey] && nutritionData[foodKey].per_100g) {
        const caloriesPer100g = nutritionData[foodKey].per_100g.calories;
        const multiplier = currentGrams / 100.0;
        setCalculatedCalories(caloriesPer100g * multiplier);
        setError(''); // Clear error if food found
      } else {
        setCalculatedCalories(null); // Reset if food not found
      }
    } else {
      setCalculatedCalories(null); // Reset if input is invalid
    }
  }, [foodName, grams, nutritionData]); // Recalculate on change


  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure grams is at least 1 for submission
    const finalGrams = (grams === '' || grams < 1) ? 1 : grams;
    const foodKey = foodName.trim().toLowerCase();

    // Double check food exists before logging
    if (!foodName || !(nutritionData && nutritionData[foodKey])) {
      setError(`Food '${foodName}' not found in our database. Cannot quick add.`);
      return;
    }

    setError('');
    setIsLogging(true);

    try {
      if (!token) throw new Error("Not authenticated");
      const response = await logMeal(token, foodName.trim(), finalGrams);

      // Reset form and close modal
      setFoodName('');
      setGrams(100);
      setCalculatedCalories(null);
      onMealAdded(response.data);
      onClose();

    } catch (err) {
      console.error("Quick add failed:", err);
       if (err.response && err.response.status === 404) {
           setError(`Error logging '${foodName}'. It might not be in the server's database.`);
       } else {
           setError('Failed to log meal. Please try again.');
       }
    } finally {
      setIsLogging(false);
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
        setFoodName('');
        setGrams(100);
        setCalculatedCalories(null);
        setError('');
        setIsLogging(false);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark p-6 shadow-soft">
        <button onClick={onClose} className="absolute top-3 right-3 rounded-full p-1 text-muted-light hover:bg-gray-200 dark:text-muted-dark dark:hover:bg-gray-700" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>

        <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark mb-4">Quick Add Meal</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Food Name Input */}
          <div>
            <label htmlFor="quick-foodName" className="block text-sm font-medium text-foreground-light dark:text-foreground-dark">Food Name</label>
            <input
              type="text"
              id="quick-foodName"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border-border-light bg-white dark:bg-card-dark dark:border-border-dark dark:text-white dark:placeholder-muted-dark focus:border-primary focus:ring-primary"
              placeholder="e.g., Apple, Samosa"
            />
          </div>
          {/* Grams Input */}
           <div>
              <label htmlFor="quick-grams" className="block text-sm font-medium text-foreground-light dark:text-foreground-dark">Grams</label>
              <input
                  type="number" // Keep type="number" for mobile keyboards
                  id="quick-grams"
                  value={grams} // Bind value to state (can be '' or number)
                  onChange={handleGramsChange} // Use corrected handler
                  onBlur={handleGramsBlur}
                  min="1" // HTML5 validation hint
                  required
                  className="mt-1 block w-full rounded-lg border-border-light bg-white dark:bg-card-dark dark:border-border-dark dark:text-white dark:placeholder-muted-dark focus:border-primary focus:ring-primary"
              />
           </div>

          {/* Display Calculated Calories */}
          {calculatedCalories !== null && (
            <div className="text-sm text-center text-muted-light dark:text-muted-dark">
                Estimated Calories: <span className="font-semibold text-primary">{calculatedCalories.toFixed(0)} kcal</span>
            </div>
          )}
           {/* Display error if food not found during calculation */}
          {foodName && calculatedCalories === null && grams >= 1 && (
               <p className="text-orange-500 text-sm text-center">'{foodName}' not found in nutrition data.</p>
          )}

          {/* General Error Display */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLogging || calculatedCalories === null || grams < 1} // Ensure grams is valid number >= 1
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogging ? 'Logging...' : 'Log Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}