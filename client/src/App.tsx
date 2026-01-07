import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import Auth from './components/Auth';
import VerifySuccess from './components/VerifySuccess';
import ProtectedRoute from './components/ProtectedRoute';
import UpdatePassword from './components/UpdatePassword';
import PublicRoute from './components/PublicRoute';
import { Toaster } from 'sonner';
import { PomodoroProvider } from './context/PomodoroContext';

import Privacy from './components/Privacy';
import Terms from './components/Terms';

function App() {
  return (
    <PomodoroProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          <Route path="/auth" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />
          <Route path="/verify-success" element={<VerifySuccess />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } />
          <Route path="/update-password" element={
            <ProtectedRoute>
              <UpdatePassword />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" theme="dark" richColors />
      </Router>
    </PomodoroProvider>
  );
}

export default App;
