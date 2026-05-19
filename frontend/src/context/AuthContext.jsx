import React, { createContext, useState, useContext, useEffect } from 'react';
import { getMe } from '../services/api.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This useEffect now *only* runs once on app load
  // to check if a token is already in localStorage.
  useEffect(() => {
    const loadUserFromToken = async () => {
      if (token) {
        try {
          const response = await getMe(token);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user from token, logging out.');
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    loadUserFromToken();
  }, []); // The empty array [] means this runs only once

  // --- MODIFIED: loginAction is now async ---
  // It now fetches the user data itself.
  const loginAction = async (newToken) => {
    try {
      // 1. Fetch user data with the new token
      const response = await getMe(newToken);

      // 2. Set token and user in state
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(response.data);

    } catch (error) {
      console.error('Failed to fetch user after login', error);
      // If getMe fails, clear everything
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      // Re-throw the error so the login page can catch it
      throw error; 
    }
  };

  const logoutAction = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // We can navigate here or let the ProtectedRoute handle it
    // window.location.href = '/login'; // Simple way to force redirect
  };

  const value = {
    token,
    user,
    setUser,
    loginAction,
    logoutAction,
    loading,
  };

  // Don't render children until we've checked for a user
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};