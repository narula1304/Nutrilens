import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// --- Import Real Pages ---
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ChatbotPage from './pages/ChatbotPage.jsx'; // Assuming you haven't created it yet
// --- Import Layout ---
import Layout from './components/Layout.jsx'; 

// --- Create placeholder pages (for now) ---
const NotFound = () => <h1>404 - Page Not Found</h1>;

// This component wraps protected pages in the main app layout
const AppLayout = () => (
  <Layout>
    <Outlet /> {/* This is where the page (e.g., Dashboard) will be rendered */}
  </Layout>
);

// This component protects your private pages
const ProtectedRoute = () => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // If token exists, show the <AppLayout />
  return <AppLayout />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* --- Public Routes (no layout) --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* --- Protected Routes (wrapped in layout) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
          </Route>

          {/* --- Not Found Route --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;