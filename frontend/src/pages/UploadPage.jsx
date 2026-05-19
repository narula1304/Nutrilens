import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { predictImage, logMeal } from '../services/api.jsx';

export default function UploadPage() {
    const { token } = useAuth();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [grams, setGrams] = useState(100); // Now allows empty string temporarily
    const [calculatedNutrition, setCalculatedNutrition] = useState(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setError('');
            setPrediction(null);
            setCalculatedNutrition(null);
            setSuccessMessage('');
            setGrams(100); // Reset to 100 on new file
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreviewUrl(null);
            setError('Please select a valid image file.');
        }
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handlePredict = async () => {
        if (!selectedFile || !token) {
            setError('Please select an image first.');
            return;
        }
        setError('');
        setSuccessMessage('');
        setIsPredicting(true);
        setPrediction(null);
        setCalculatedNutrition(null);

        try {
            const response = await predictImage(token, selectedFile);
            setPrediction(response.data);
            setGrams(100); // Ensure grams is 100 after prediction
        } catch (err) {
            console.error("Prediction failed:", err);
            setError('Failed to get prediction. Please try again.');
        } finally {
            setIsPredicting(false);
        }
    };

    const handleLogMeal = async () => {
        // Ensure grams is at least 1 before logging
        const finalGrams = grams === '' || grams < 1 ? 1 : grams;

        if (!prediction || !token) {
            setError('Please predict the meal first.');
            return;
        }
        setError('');
        setSuccessMessage('');
        setIsLogging(true);

        try {
            await logMeal(token, prediction.food_name, finalGrams);
            setSuccessMessage(`Successfully logged ${finalGrams}g of ${prediction.food_name}!`);
            setGrams(finalGrams); // Update state if it was corrected from empty
        } catch (err) {
            console.error("Logging failed:", err);
            setError('Failed to log meal. Please try again.');
        } finally {
            setIsLogging(false);
        }
    };

    // --- MODIFIED: Grams Change Handler ---
    const handleGramsChange = (e) => {
        const value = e.target.value;
        // Allow empty string or positive integers
        if (value === '' || /^[1-9]\d*$/.test(value)) {
             // If empty, set state to empty string, otherwise parse the number
            setGrams(value === '' ? '' : parseInt(value, 10));
        }
        // Ignore invalid input like negative numbers or decimals for now
    };

    // --- NEW: Grams Blur Handler ---
    // Ensure value is at least 1 when the input loses focus
    const handleGramsBlur = () => {
        if (grams === '' || grams < 1) {
            setGrams(1);
        }
    };


    useEffect(() => {
        // Use the current grams value, defaulting to 1 if empty for calculation
        const currentGrams = grams === '' ? 1 : grams;
        if (prediction?.nutrition_per_100g && currentGrams >= 1) {
            const baseNutrition = prediction.nutrition_per_100g;
            const multiplier = currentGrams / 100.0;

            setCalculatedNutrition({
                calories: baseNutrition.calories * multiplier,
                protein: baseNutrition.protein * multiplier,
                carbs: baseNutrition.carbs * multiplier,
                fat: baseNutrition.fat * multiplier,
                fiber: (baseNutrition.fiber || 0) * multiplier,
            });
        } else {
            setCalculatedNutrition(null);
        }
    }, [prediction, grams]);


    // --- Render Component ---
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Upload Your Meal</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Take a photo or upload an image to get instant nutrition insights.</p>
            </div>

            {/* --- Image Upload Section --- */}
            <div className="bg-background-light dark:bg-background-dark/50 rounded-xl p-6 mb-8 border border-primary/20 dark:border-primary/30">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <div
                    className="w-full aspect-video bg-center bg-cover rounded-lg mb-6 border border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400"
                    style={{ backgroundImage: `url(${previewUrl || ''})` }}
                >
                    {!previewUrl && "Image Preview"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleUploadButtonClick}
                        className="flex items-center justify-center gap-2 w-full bg-primary/20 dark:bg-primary/30 text-primary font-bold py-3 px-4 rounded-lg hover:bg-primary/30 dark:hover:bg-primary/40 transition-all transform hover:scale-105"
                    >
                        <span className="material-symbols-outlined">upload_file</span>
                        <span>{selectedFile ? 'Change Image' : 'Select Image'}</span>
                    </button>
                    <button
                        onClick={handlePredict}
                        disabled={!selectedFile || isPredicting}
                        className="flex items-center justify-center gap-2 w-full bg-primary text-black font-bold py-3 px-4 rounded-lg hover:bg-primary/80 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Loading spinner */}
                        {isPredicting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {!isPredicting && <span className="material-symbols-outlined">auto_awesome</span>}
                        <span>{isPredicting ? 'Analyzing...' : 'Analyze Meal'}</span>
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </div>

            {/* --- Prediction Results Section --- */}
            {calculatedNutrition && prediction && (
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Prediction: <span className="text-primary">{prediction.food_name}</span>
                        <span className="text-sm font-normal text-muted-light dark:text-muted-dark ml-2">({(prediction.confidence * 100).toFixed(1)}% confident)</span>
                    </h3>

                    <div className="overflow-x-auto bg-background-light dark:bg-background-dark/50 rounded-xl border border-primary/20 dark:border-primary/30 mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-primary/10 dark:bg-primary/20">
                                <tr>
                                    {/* Display current grams in header */}
                                    <th className="px-6 py-3" scope="col">Nutrient (for {grams === '' ? 1 : grams}g)</th>
                                    <th className="px-6 py-3 text-right" scope="col">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Display calculated values */}
                                <tr className="border-b border-primary/20 dark:border-primary/30">
                                    <th className="px-6 py-4 font-medium text-gray-900 dark:text-white" scope="row">Calories</th>
                                    <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{calculatedNutrition.calories.toFixed(1)} kcal</td>
                                </tr>
                                <tr className="border-b border-primary/20 dark:border-primary/30">
                                    <th className="px-6 py-4 font-medium text-gray-900 dark:text-white" scope="row">Protein</th>
                                    <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{calculatedNutrition.protein.toFixed(1)} g</td>
                                </tr>
                                <tr className="border-b border-primary/20 dark:border-primary/30">
                                    <th className="px-6 py-4 font-medium text-gray-900 dark:text-white" scope="row">Carbs</th>
                                    <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{calculatedNutrition.carbs.toFixed(1)} g</td>
                                </tr>
                                <tr className="border-b border-primary/20 dark:border-primary/30">
                                    <th className="px-6 py-4 font-medium text-gray-900 dark:text-white" scope="row">Fat</th>
                                    <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{calculatedNutrition.fat.toFixed(1)} g</td>
                                </tr>
                                {calculatedNutrition.fiber > 0 && (
                                    <tr>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white" scope="row">Fiber</th>
                                        <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{calculatedNutrition.fiber.toFixed(1)} g</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Grams Input and Log Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-6">
                        <div className="grow sm:grow-0">
                            <label htmlFor="grams" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portion Size (g)</label>
                            <input
                                type="number" // Changed to number to better handle input
                                id="grams"
                                value={grams} // Bind value to state
                                onChange={handleGramsChange} // Use new handler
                                onBlur={handleGramsBlur} // Use new blur handler
                                min="1" // HTML5 validation
                                className="w-full sm:w-32 rounded-lg border-border-light bg-white dark:bg-card-dark dark:border-border-dark dark:text-white dark:placeholder-muted-dark focus:border-primary focus:ring-primary"
                            />
                        </div>
                        <button
                            onClick={handleLogMeal}
                            disabled={isLogging}
                            className="w-full sm:w-auto bg-primary text-black font-bold py-3 px-8 rounded-lg hover:bg-primary/80 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLogging ? 'Logging...' : 'Log Meal'}
                        </button>
                    </div>
                    {successMessage && <p className="text-green-600 text-sm mt-4 text-center">{successMessage}</p>}
                </div>
            )}
        </div>
    );
}