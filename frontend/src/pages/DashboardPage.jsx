import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getMealHistory, getProfile, getNutritionData } from '../services/api.jsx';
import QuickAddModal from '../components/QuickAddModal.jsx';
import WeightChart from '../components/WeightChart.jsx';

// --- Circle Progress Component ---
const CircleProgress = ({ value, target, label, unit, colorClass }) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const validTarget = target && target > 0 ? target : 1;
    const progress = validTarget > 0 ? (value / validTarget) : 0;
    const offset = circumference * (1 - Math.min(progress, 1));
    const finalOffset = isNaN(offset) || offset < 0 ? 0 : offset;
    const strokeColorClass = colorClass ? colorClass.replace('text-', 'stroke-') : 'stroke-primary';

    return (
        <div className="relative flex flex-col items-center justify-center rounded-xl border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark p-6 shadow-soft dark:shadow-soft-dark transition-all hover:shadow-lg dark:hover:shadow-xl hover:-translate-y-1">
            <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                <circle
                    className="stroke-gray-200 dark:stroke-gray-700"
                    cx="60" cy="60" fill="none" r={radius} strokeWidth="12"
                ></circle>
                <circle
                    className={`progress-circle-bar ${strokeColorClass}`}
                    cx="60" cy="60" fill="none" r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={finalOffset}
                    strokeLinecap="round" strokeWidth="12"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-foreground-light dark:text-foreground-dark">{Math.round(value)}</span>
                <span className="text-sm text-muted-light dark:text-muted-dark">{unit}</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground-light dark:text-foreground-dark">{label}</h3>
            <p className="text-sm text-muted-light dark:text-muted-dark">{target && target > 0 ? `${target} target` : '? target'}</p>
        </div>
    );
};

// --- Bar Progress Component ---
const BarProgress = ({ label, value, colorClass }) => {
    return (
        <div>
            <div className="mb-1 flex justify-between">
                <span className={`font-medium ${colorClass ? colorClass.replace('bg-', 'text-') : 'text-primary'}`}>{label}</span>
                <span className="text-sm font-medium text-muted-light dark:text-muted-dark">{value}%</span>
            </div>
            <div className={`h-3 w-full rounded-full ${colorClass ? colorClass + '/20' : 'bg-primary/20'}`}>
                <div className={`h-3 rounded-full ${colorClass || 'bg-primary'}`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
};


// === Main Dashboard Component ===
export default function DashboardPage() {
    const { user, token } = useAuth();

    // --- Helper Functions Moved Inside ---
    const isToday = (someDate) => {
        if (!someDate) return false;
        try {
            const today = new Date();
            const dateToCheck = new Date(someDate);
            return dateToCheck.getDate() === today.getDate() &&
                   dateToCheck.getMonth() === today.getMonth() &&
                   dateToCheck.getFullYear() === today.getFullYear();
        } catch (e) {
            console.error("Error checking date (isToday):", e);
            return false;
        }
    };

    const isWithinLastNDays = (someDate, days) => {
        if (!someDate) return false;
        try {
            const dateToCheck = new Date(someDate);
            if (isNaN(dateToCheck.getTime())) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const NDaysAgo = new Date();
            NDaysAgo.setDate(today.getDate() - (days - 1));
            NDaysAgo.setHours(0, 0, 0, 0);
            dateToCheck.setHours(0, 0, 0, 0);
            return dateToCheck >= NDaysAgo && dateToCheck <= today;
        } catch (e) {
            console.error("Error checking date (isWithinLastNDays):", e);
            return false;
        }
    };

    const getDayOfWeek = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return -1;
            return date.getDay(); // 0=Sun, 6=Sat
        } catch (e) {
            return -1;
        }
    };
    // --- End Helper Functions ---

    // --- State Variables ---
    const [profile, setProfile] = useState(user?.profile || {});
    const [allMeals, setAllMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nutritionDb, setNutritionDb] = useState(null);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
             if (!token) { setError("Not authenticated"); setLoading(false); return; }
             try {
               setLoading(true); setError('');
               const [profileRes, historyRes, nutritionRes] = await Promise.all([
                 getProfile(token), getMealHistory(token), getNutritionData()
               ]);
               setProfile(profileRes.data);
               const mealsData = Array.isArray(historyRes.data) ? historyRes.data : [];
               const sortedMeals = mealsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
               setAllMeals(sortedMeals);
               setNutritionDb(nutritionRes.data);
             } catch (err) { console.error("Fetch Error:", err); setError("Could not load data."); }
             finally { setLoading(false); }
        };
        fetchData();
    }, [token]);

    // Calculate Weekly Consistency
    const weeklyConsistency = () => {
        const consistency = Array(7).fill({ metGoal: false, total: 0 });
        const dailyTotals = {};
        const today = new Date();
        const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentTarget = profile?.daily_calorie_target || 0;

        allMeals.forEach(meal => {
            if (isWithinLastNDays(meal.timestamp, 7)) { // CALL HELPER
                try {
                    const dateStr = new Date(meal.timestamp).toISOString().split('T')[0];
                    if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
                    dailyTotals[dateStr] += meal.calories || 0;
                } catch (e) { console.error("Error processing meal timestamp:", meal, e); }
            }
        });

        let currentStreak = 0;
        let streakBroken = false;
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const total = dailyTotals[dateStr] || 0;
            const metGoal = currentTarget > 0 && total > 0 && total <= currentTarget;

            consistency[6 - i] = { date: date, metGoal: metGoal, total: total };

            // Calculate streak (counting backwards from today)
            if (i === 0 && metGoal) { currentStreak = 1; } // Today met
            else if (i > 0 && metGoal && !streakBroken) { currentStreak++; } // Previous day met and streak not broken
            else if (i > 0 && (!metGoal || total === 0)) { streakBroken = true; } // Break streak if missed or zero logged

        }

        const displayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const displayConsistency = displayOrder.map(dayName => {
            const todayDayIndex = today.getDay(); // 0=Sun, 1=Mon...
            const targetDayIndex = dayMap.indexOf(dayName); // 0=Sun, 1=Mon...
            // Calculate how many days ago this day name occurred relative to today
            let daysAgo = (todayDayIndex - targetDayIndex + 7) % 7;
            const consistencyIndex = 6 - daysAgo; // Map daysAgo to index in consistency array (0=oldest, 6=today)
            return {
                day: dayName,
                total: consistency[consistencyIndex]?.total ?? 0,
                metGoal: consistency[consistencyIndex]?.metGoal ?? false
            };
        });
        return { days: displayConsistency, streak: currentStreak };
    };

    const consistencyData = weeklyConsistency();


    // Calculate Today's Totals
    const todaysMeals = allMeals.filter(meal => isToday(meal.timestamp)); // CALL HELPER
    const todayTotals = todaysMeals.reduce((acc, meal) => {
        acc.calories += meal.calories || 0;
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fat += meal.fat || 0;
        return acc;
     }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const targetData = {
        calories: profile?.daily_calorie_target || 0,
        protein: 150, carbs: 250, fat: 70, // Placeholders
    };
    const totalMacrosGrams = todayTotals.protein + todayTotals.carbs + todayTotals.fat;
    const proteinPercent = totalMacrosGrams > 0 ? Math.round((todayTotals.protein / totalMacrosGrams) * 100) : 0;
    const carbsPercent = totalMacrosGrams > 0 ? Math.round((todayTotals.carbs / totalMacrosGrams) * 100) : 0;
    const fatPercent = totalMacrosGrams > 0 ? Math.round((todayTotals.fat / totalMacrosGrams) * 100) : 0;
    const caloriesExceeded = targetData.calories > 0 && todayTotals.calories > targetData.calories;

    // Prepare weight data for the chart
    const weightChartData = [];
    if (profile?.weight_kg) {
         const todayDate = new Date().toISOString().split('T')[0];
         weightChartData.push({ date: todayDate, weight: profile.weight_kg });
    }

    // Modal Handlers
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const handleMealAdded = (newMeal) => {
        const updatedAllMeals = [newMeal, ...allMeals].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAllMeals(updatedAllMeals);
    };

    // --- Render Loading/Error States ---
    if (loading) { return <div className="text-center p-10">Loading dashboard...</div>; }
    if (error && !nutritionDb) { return <div className="text-center p-10 text-red-500">Error: {error}</div>; }

    // --- Render Dashboard ---
    return (
        <>
            <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground-light dark:text-foreground-dark">
                        Welcome Back, {user?.email ? user.email.split('@')[0] : 'User'}!
                    </h2>
                    <p className="text-muted-light dark:text-muted-dark">Here's your nutritional snapshot for today.</p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-black transition-all hover:bg-primary-dark shadow-md hover:shadow-lg"
                >
                    <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                    <span>Quick Add Meal</span>
                </button>
            </div>

            {caloriesExceeded && (
                <div className="mb-6 rounded-lg border border-orange-500/50 bg-orange-500/10 p-4 text-center dark:bg-orange-500/20">
                    <p className="font-semibold text-orange-700 dark:text-orange-300">
                        ⚠️ You've exceeded your daily calorie target of {targetData.calories} kcal!
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Progress Circles */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <CircleProgress value={todayTotals.calories} target={targetData.calories} label="Calories" unit="kcal" colorClass="text-primary"/>
                        <CircleProgress value={todayTotals.protein} target={targetData.protein} label="Protein" unit="g" colorClass="text-secondary"/>
                        <CircleProgress value={todayTotals.carbs} target={targetData.carbs} label="Carbs" unit="g" colorClass="text-tertiary"/>
                    </div>
                </div>
                {/* Macro Distribution */}
                <div className="rounded-xl border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark p-6 shadow-soft dark:shadow-soft-dark">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark">Macro Distribution</h3>
                        <p className="text-sm text-muted-light dark:text-muted-dark">Today</p>
                    </div>
                    <div className="mt-6 space-y-5">
                        <BarProgress label="Protein" value={proteinPercent} colorClass="bg-secondary" />
                        <BarProgress label="Carbs" value={carbsPercent} colorClass="bg-tertiary" />
                        <BarProgress label="Fats" value={fatPercent} colorClass="bg-primary" />
                    </div>
                </div>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
                {/* Weight Progress */}
                <div className="rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 shadow-soft dark:shadow-soft-dark">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark">Weight Progress</h3>
                        <p className="text-sm text-muted-light dark:text-muted-dark">Current Weight</p>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-4xl font-bold text-foreground-light dark:text-foreground-dark">
                            {profile?.weight_kg ? `${profile.weight_kg} kg` : 'N/A'}
                        </p>
                    </div>
                    <WeightChart weightData={weightChartData} />
                </div>
                {/* Weekly Consistency */}
                <div className="rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark">Weekly Consistency</h3>
                        <p className="text-sm text-muted-light dark:text-muted-dark">Streak of meeting calorie goals ({targetData.calories > 0 ? targetData.calories + ' kcal target' : 'target not set'}).</p>
                    </div>
                    <div className="flex justify-around items-center mt-6">
                        {consistencyData.days.map(({ day, metGoal, total }, index) => (
                            <div key={index} className="flex flex-col items-center gap-1">
                                <div className={`h-10 w-10 flex items-center justify-center rounded-full font-bold text-sm ${
                                    metGoal
                                        ? 'bg-primary text-white'
                                        : total > 0
                                            ? 'bg-orange-400/30 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300'
                                            : 'bg-gray-200 dark:bg-gray-700 text-muted-light dark:text-muted-dark'
                                }`}>
                                    {day[0]}
                                </div>
                                <span className="text-xs text-muted-light dark:text-muted-dark">{day}</span>
                                <span className={`text-xs font-medium ${
                                    metGoal ? 'text-primary' :
                                    total > targetData.calories && targetData.calories > 0 ? 'text-red-500' :
                                    'text-muted-light dark:text-muted-dark'
                                }`}>
                                    {total > 0 ? Math.round(total) : '-'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-xl font-bold text-foreground-light dark:text-foreground-dark">
                            {consistencyData.streak > 0 ? `${consistencyData.streak} Day Streak! 🔥` : 'No Current Streak'}
                        </p>
                        <p className="text-sm text-muted-light dark:text-muted-dark">
                            {consistencyData.streak > 0 ? 'Keep it up!' : 'Log meals consistently!'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Render the Modal */}
            {nutritionDb && (<QuickAddModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onMealAdded={handleMealAdded}
                nutritionData={nutritionDb}
            />)}
        </>
    );
}