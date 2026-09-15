import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import SelfReviewForm from './pages/SelfReviewForm';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewerAssessmentForm from './pages/ReviewerAssessmentForm';
import HRDashboard from './pages/HRDashboard';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

const homeFor = (user) => user?.role === 'Employee' ? '/employee' : user?.role === 'Reviewer' ? '/reviewer' : '/hr';
export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('careHubUser') || 'null'));
  const guard = (roles, page) => user && roles.includes(user.role) ? page : <Navigate to={user ? homeFor(user) : '/login'} replace />;
  return <><Navbar user={user} onLogout={() => setUser(null)} /><Routes><Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={setUser} />} /><Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onLogin={setUser} />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/employee" element={guard(['Employee'], <EmployeeDashboard />)} /><Route path="/self-review" element={guard(['Employee'], <SelfReviewForm />)} /><Route path="/reviewer" element={guard(['Reviewer'], <ReviewerDashboard />)} /><Route path="/reviewer/assessment" element={guard(['Reviewer'], <ReviewerAssessmentForm />)} /><Route path="/hr" element={guard(['HR'], <HRDashboard />)} /><Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} /></Routes></>;
}
