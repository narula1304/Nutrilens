import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getProfile, updateProfile } from '../services/api.jsx';

export default function ProfilePage() {
  const { user, token, setUser } = useAuth(); // Get user, token, and setUser to update context

  // --- State Variables ---
  const [profileData, setProfileData] = useState({
    height_cm: '',
    weight_kg: '',
    age: '',
    daily_calorie_target: null, // Initialize target as null
  });
  const [initialProfileData, setInitialProfileData] = useState({}); // To compare changes
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Fetch Profile on Load ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await getProfile(token);
        // Set form fields, handling null values from DB
        const fetchedData = {
            height_cm: response.data.height_cm || '',
            weight_kg: response.data.weight_kg || '',
            age: response.data.age || '',
            daily_calorie_target: response.data.daily_calorie_target || null,
        };
        setProfileData(fetchedData);
        setInitialProfileData(fetchedData); // Store initial data
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Could not load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  // --- Handle Input Changes ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow empty string or numbers
    const processedValue = value === '' ? '' : parseFloat(value);
    // Basic validation: ensure non-negative for number fields
     if (name === 'age' && processedValue !== '' && processedValue < 0) return;
     if ((name === 'height_cm' || name === 'weight_kg') && processedValue !== '' && processedValue < 0) return;

    setProfileData(prev => ({ ...prev, [name]: processedValue }));
    setSuccessMessage(''); // Clear success message on change
  };

  // --- Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsUpdating(true);

    // Prepare data, sending null if field is empty
    const dataToSend = {
      height_cm: profileData.height_cm === '' ? null : profileData.height_cm,
      weight_kg: profileData.weight_kg === '' ? null : profileData.weight_kg,
      age: profileData.age === '' ? null : profileData.age,
    };

    // Only send if data actually changed
    if (JSON.stringify(dataToSend) === JSON.stringify({
        height_cm: initialProfileData.height_cm === '' ? null : initialProfileData.height_cm,
        weight_kg: initialProfileData.weight_kg === '' ? null : initialProfileData.weight_kg,
        age: initialProfileData.age === '' ? null : initialProfileData.age,
    })) {
        setSuccessMessage("No changes detected.");
        setIsUpdating(false);
        return;
    }


    try {
      if (!token) throw new Error("Not authenticated");
      const response = await updateProfile(token, dataToSend);
      // Update local state with response (includes new calorie target)
      const updatedData = {
         height_cm: response.data.height_cm || '',
         weight_kg: response.data.weight_kg || '',
         age: response.data.age || '',
         daily_calorie_target: response.data.daily_calorie_target || null,
      };
      setProfileData(updatedData);
      setInitialProfileData(updatedData); // Update initial data baseline
      // Update user context if needed (optional)
      setUser(prevUser => ({
          ...prevUser,
          profile: { ...prevUser.profile, ...response.data }
      }));
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Could not update profile. Please try again.");
      // Optionally reset form to initial state on error
      // setProfileData(initialProfileData);
    } finally {
      setIsUpdating(false);
    }
  };


  // --- Render Loading/Error States ---
   if (loading) {
    return <div className="text-center p-10">Loading profile...</div>;
  }
   if (error && !profileData.height_cm && !profileData.weight_kg && !profileData.age) { // Only show major error if no data loaded
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }


  // --- Render Component ---
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-foreground-light dark:text-foreground-dark">Your Profile</h2>
        <p className="text-muted-light dark:text-muted-dark">Update your personal details and health goals.</p>
        {/* Display update errors/success here */}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        {successMessage && <p className="text-green-600 text-sm mt-4">{successMessage}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* --- Form Card --- */}
        <div className="md:col-span-2 rounded-xl border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark mb-6">Personal Information</h3>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground-light dark:text-foreground-dark">Email address</label>
              <input type="email" name="email" id="email" disabled
                className="mt-1 block w-full rounded-lg border-border-light bg-gray-100 dark:bg-gray-700/50 dark:border-border-dark dark:text-muted-dark cursor-not-allowed"
                value={user?.email || ''} // Display user's email
              />
              <p className="mt-1 text-xs text-muted-light dark:text-muted-dark">Email cannot be changed.</p>
            </div>

            <div>
              <label htmlFor="height_cm" className="block text-sm font-medium text-foreground-light dark:text-foreground-dark">Height (cm)</label>
              <input type="number" name="height_cm" id="height_cm"
                className="mt-1 block w-full rounded-lg border-border-light bg-white dark:bg-card-dark dark:border-border-dark dark:text-white dark:placeholder-muted-dark focus:border-primary focus:ring-primary"
                placeholder="e.g. 175"
                value={profileData.height_cm}
                onChange={handleChange}
                min="0" // HTML5 validation
              />
            </div>

            <div>
              <label htmlFor="weight_kg" className="block text-sm font-medium text-foreground-light dark:text-foreground-dark">Weight (kg)</label>
              <input type="number" name="weight_kg" id="weight_kg"
                className="mt-1 block w-full rounded-lg border-border-light bg-white dark:bg-card-dark dark:border-border-dark dark:text-white dark:placeholder-muted-dark focus:border-primary focus:ring-primary"
                placeholder="e.g. 70"
                value={profileData.weight_kg}
                onChange={handleChange}
                min="0" // HTML5 validation
                step="0.1" // Allow decimals for weight
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-foreground-light dark:text-foreground-dark">Age</label>
              <input type="number" name="age" id="age"
                className="mt-1 block w-full rounded-lg border-border-light bg-white dark:bg-card-dark dark:border-border-dark dark:text-white dark:placeholder-muted-dark focus:border-primary focus:ring-primary"
                placeholder="e.g. 25"
                value={profileData.age}
                onChange={handleChange}
                min="0" // HTML5 validation
              />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit"
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-black transition-all hover:bg-primary-dark shadow-md hover:shadow-lg disabled:opacity-50">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* --- Goal Card --- */}
        <div className="md:col-span-1 rounded-xl border border-primary/50 bg-primary/10 dark:bg-primary/20 p-6 shadow-soft self-start"> {/* self-start added */}
          <h3 className="text-lg font-semibold text-primary-dark dark:text-primary-light mb-4">Your Daily Goal</h3>
          <p className="text-muted-light dark:text-muted-dark mb-4 text-sm">
            Automatically calculated based on your profile details to help you stay on track.
          </p>
          <div className="text-center bg-card-light dark:bg-card-dark rounded-lg p-6">
            <p className="text-sm text-muted-light dark:text-muted-dark">Daily Calorie Target</p>
            <p className="text-5xl font-bold text-primary my-2">
              {/* Display calculated target */}
              {profileData.daily_calorie_target ? profileData.daily_calorie_target : 'N/A'}
            </p>
            <p className="text-sm text-muted-light dark:text-muted-dark">kcal</p>
          </div>
        </div>
      </div>
    </div>
  );
}