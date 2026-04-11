import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import About from './pages/About';
import Contact from './pages/Contact';

// Admin Pages
import Overview from './pages/admin/Overview';
import Traffic from './pages/admin/Traffic';
import Rules from './pages/admin/Rules';
import Settings from './pages/admin/Settings';
import Alerts from './pages/admin/Alerts';
import Cases from './pages/admin/Cases';
import Patterns from './pages/admin/Patterns';
import Reports from './pages/admin/Reports';

// User Pages
import UserDashboard from './pages/user/UserDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="auth" element={<Auth />} />
          </Route>

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={<ProtectedRoute requireRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="traffic" element={<Traffic />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="rules" element={<Rules />} />
              <Route path="settings" element={<Settings />} />
              <Route path="cases" element={<Cases />} />
              <Route path="patterns" element={<Patterns />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>

          {/* User Routes - Protected */}
          <Route path="/user" element={<ProtectedRoute requireRole="user" />}>
            <Route element={<UserLayout />}>
              <Route index element={<UserDashboard />} />
              {/* Add future user routes here */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
