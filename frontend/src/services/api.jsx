import axios from 'axios';

// The URL of your FastAPI backend
const API_URL = 'http://127.0.0.1:8000';

// Create a re-usable 'instance' of axios
const api = axios.create({
  baseURL: API_URL,
});

// === Auth Functions ===

export const login = (email, password) => {
  // FastAPI's /token endpoint expects "form data"
  const formData = new URLSearchParams();
  formData.append('username', email); // It expects 'username'
  formData.append('password', password);

  return api.post('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

export const register = (email, password) => {
  return api.post('/register', { email, password });
};

export const getMe = (token) => {
  return api.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// === Profile Functions ===

export const getProfile = (token) => {
  return api.get('/profile/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateProfile = (token, profileData) => {
  // profileData should be { height_cm, weight_kg, age }
  return api.put('/profile/me', profileData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// === Meal & Prediction Functions ===

export const predictImage = (token, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  return api.post('/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
};



export const deleteMeal = (token, mealId) => {
  return api.delete(`/meals/${mealId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const logMeal = (token, foodName, grams) => {
  const mealData = {
    food_name: foodName,
    grams: parseFloat(grams),
  };
  return api.post('/meals', mealData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getMealHistory = (token) => {
  return api.get('/meals', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getNutritionData = () => {
  // No token needed, assuming this data is public or fetched after login
  return api.get('/nutrition-data');
};

// === ADD THIS CHATBOT FUNCTION ===
export const askChatbot = (token, userMessage) => {
  const requestData = { message: userMessage };
  return api.post('/chatbot', requestData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


// Export the base api instance if needed elsewhere
export default api;