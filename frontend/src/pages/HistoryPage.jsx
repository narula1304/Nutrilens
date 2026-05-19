import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getMealHistory, deleteMeal } from '../services/api.jsx'; 

// Helper function to format the timestamp
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    // Example format: Oct 29, 2025, 1:45 PM
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};

// Helper function to group meals by date
const groupMealsByDate = (meals) => {
    // Check if meals is a valid array
    if (!Array.isArray(meals)) {
        console.error("groupMealsByDate received invalid input:", meals);
        return []; // Return an empty array if input is bad
    }

    const grouped = {};
    meals.forEach(meal => {
        try {
            // Ensure timestamp is valid before processing
            if (!meal.timestamp) {
                console.warn("Meal missing timestamp:", meal);
                return; // Skip this meal
            }
            const dateObj = new Date(meal.timestamp);
            // Check if the date object is valid
            if (isNaN(dateObj.getTime())) {
                 console.warn("Invalid timestamp found in meal:", meal);
                 return; // Skip meals with invalid dates
            }

            const date = dateObj.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(meal);
            // Meals should already be sorted by time within the day
            // because the input 'meals' array is pre-sorted.
        } catch (e) {
            console.error("Error processing meal in groupMealsByDate:", meal, e);
            // Continue processing other meals
        }
    });

    // Return sorted dates (newest first)
    try {
      // Sort based on the Date object representation of the date string
      return Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    } catch(e) {
      console.error("Error sorting grouped dates:", e);
      return []; // Return empty array on sorting error
    }
};


export default function HistoryPage() {
  const { token } = useAuth();
  const [mealHistory, setMealHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Fetch meal history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await getMealHistory(token);
        // Ensure response.data is an array before sorting
        const mealsData = Array.isArray(response.data) ? response.data : [];
        const sortedMeals = mealsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setMealHistory(sortedMeals);
      } catch (err) {
        console.error("Failed to fetch meal history:", err);
        setError("Could not load meal history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  // Handle Meal Deletion
  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Are you sure you want to delete this meal entry?")) {
        return;
    }
    if (!token) {
        setError("Authentication error.");
        return;
    }
    setDeletingId(mealId);
    setError('');
    try {
        await deleteMeal(token, mealId);
        setMealHistory(currentHistory => currentHistory.filter(meal => meal.id !== mealId));
    } catch (err) {
        console.error("Failed to delete meal:", err);
        setError("Could not delete meal entry. Please try again.");
    } finally {
        setDeletingId(null);
    }
  };

  // Group meals by date for rendering
  const groupedMeals = groupMealsByDate(mealHistory);

  // Render Logic
  if (loading) {
    return <div className="text-center p-10">Loading meal history...</div>;
  }
  if (error && mealHistory.length === 0) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Your Meal History</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Track your dietary journey and analyze your nutritional intake over time.</p>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>

      {mealHistory.length === 0 && !loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">You haven't logged any meals yet.</p>
      ) : (
        <div className="space-y-12">
          {/* Check groupedMeals before mapping */}
          {groupedMeals && groupedMeals.map(([date, meals]) => (
            <div key={date}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-6">{date}</h2>
              <div className="grid grid-cols-1 gap-8">
                {/* Check meals array before mapping */}
                {Array.isArray(meals) && meals.map((meal) => (
                  <div key={meal.id} className="bg-white/30 dark:bg-black/20 p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 relative">
                    {/* Placeholder image */}
                    <div className="w-full md:w-48 h-32 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                      <span>{meal.food_name ? meal.food_name.substring(0, 1).toUpperCase() : '?'}</span>
                    </div>
                    <div className="grow">
                      <p className="text-sm font-medium text-primary">{new Date(meal.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1 capitalize">{meal.food_name || 'Unknown Food'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{meal.grams?.toFixed(0) || '?'}g</p> {/* Use optional chaining */}
                      <div className="mt-3 flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-gray-500 dark:text-gray-400">
                         <span><span className="font-semibold text-gray-700 dark:text-gray-300">{meal.calories?.toFixed(0) || '?'}</span> kcal</span>
                         <span className="text-secondary-light dark:text-secondary-light"><span className="font-semibold">{meal.protein?.toFixed(1) || '?'}</span> g P</span>
                         <span className="text-tertiary-light dark:text-tertiary-light"><span className="font-semibold">{meal.carbs?.toFixed(1) || '?'}</span> g C</span>
                         <span className="text-primary-light dark:text-primary-light"><span className="font-semibold">{meal.fat?.toFixed(1) || '?'}</span> g F</span>
                         {meal.fiber != null && meal.fiber > 0 && <span><span className="font-semibold text-gray-700 dark:text-gray-300">{meal.fiber.toFixed(1)}</span> g Fi</span>}
                      </div>
                    </div>
                    {/* Delete Button */}
                    <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        disabled={deletingId === meal.id}
                        className="absolute top-4 right-4 md:relative md:top-auto md:right-auto bg-red-500/10 text-red-500 font-semibold py-2 px-3 rounded-full text-xs hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        aria-label={`Delete ${meal.food_name || 'meal'} entry`}
                    >
                      {deletingId === meal.id ? '...' : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}