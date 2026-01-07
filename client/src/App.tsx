import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import Auth from './components/Auth';
import VerifySuccess from './components/VerifySuccess';
import { Toaster } from 'sonner';

import Privacy from './components/Privacy';
import Terms from './components/Terms';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/verify-success" element={<VerifySuccess />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/dashboard" element={<DashboardLayout />} />
      </Routes>
      <Toaster position="top-right" theme="dark" richColors />
    </Router>
  );
}

export default App;
