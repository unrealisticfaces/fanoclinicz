import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import OrderLayout from './pages/OrderLayout';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import PatientProfile from './pages/PatientProfile';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import QueueManager from './pages/QueueManager';
import QueueTV from './pages/QueueTV';
import Kiosk from './pages/Kiosk'; 
import StaffTablet from './pages/StaffTablet'; // <-- IMPORT THIS

const ProtectedRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <OrderLayout /> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Standalone Fullscreen Hardware Routes (No Sidebars) */}
      <Route path="/tv" element={<QueueTV />} />
      <Route path="/kiosk" element={<Kiosk />} />
      <Route path="/staff" element={<StaffTablet />} /> {/* <-- ADD THIS */}
      
      {/* Main Clinic System Routes (With Sidebar & Auth Required) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/records" element={<Records />} />
        <Route path="/records/:id" element={<PatientProfile />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/queue" element={<QueueManager />} /> {/* Fallback for Receptionist */}
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}