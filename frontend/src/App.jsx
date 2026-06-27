import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NavigationPage from './pages/NavigationPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, AuthContext } from './context/AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null; // Wait for initial auth check

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function Layout({ darkMode, setDarkMode }) {
  const { user } = useContext(AuthContext);
  
  // Hide sidebar/layout entirely if not authenticated (Login/Register handles own UI)
  if (!user) {
     return (
       <Routes>
         <Route path="/login" element={<LoginPage />} />
         <Route path="/register" element={<RegisterPage />} />
         <Route path="*" element={<Navigate to="/login" replace />} />
       </Routes>
     );
  }

  return (
    <div className={`flex h-screen w-full ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen w-full bg-theme-main text-theme-main transition-colors duration-300">
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 overflow-auto bg-theme-main p-4 md:p-6 lg:p-8 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Navigate to="/navigation" />} />
            
            <Route path="/navigation" element={
               <ProtectedRoute><NavigationPage darkMode={darkMode} /></ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
               <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            
            <Route path="/admin" element={
               <ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/navigation" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout darkMode={darkMode} setDarkMode={setDarkMode} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
