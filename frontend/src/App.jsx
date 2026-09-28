import React from 'react';
// CRITICAL FIX: Changed BrowserRouter to HashRouter for native APK support
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import OrderLayout from './pages/OrderLayout';

// Admin Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import PatientProfile from './pages/PatientProfile';
import Billing from './pages/Billing';
import QueueManager from './pages/QueueManager';
import Settings from './pages/Settings';

// Standalone Terminal Pages
import Kiosk from './pages/Kiosk';
import StaffTablet from './pages/StaffTablet';
import QueueTV from './pages/QueueTV';

// Authentication Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Standalone Terminal Routes (Fullscreen, No Sidebar) */}
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/staff" element={<StaffTablet />} />
        <Route path="/tv" element={<QueueTV />} />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <OrderLayout />
            </ProtectedRoute>
          }
        >
          {/* Auto-redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="records" element={<Records />} />
          <Route path="records/:id" element={<PatientProfile />} />
          <Route path="billing" element={<Billing />} />
          <Route path="queue" element={<QueueManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all route for unknown URLs */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}