import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, setCredentials } from './store/slices/authSlice';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import SelfReviewForm from './pages/SelfReviewForm';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewerAssessmentForm from './pages/ReviewerAssessmentForm';
import HRDashboard from './pages/HRDashboard';

import AdminDashboard from './pages/AdminDashboard';
import ReviewCycles from './pages/ReviewCycles';
import ProgressChecks from './pages/ProgressChecks';
import Reports from './pages/Reports';


const homeFor = (user) => {
  if (!user) return '/login';
  const role = user.role?.toUpperCase();
  if (role === 'ADMIN') return '/admin';
  if (role === 'HR') return '/hr';
  if (role === 'MANAGER') return '/reviewer';
  if (role === 'EMPLOYEE') return '/employee';
  return null;
};

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  // Sync localStorage with Redux on initial mount if needed
  useEffect(() => {
    const rawUser = localStorage.getItem('careHubUser');
    const token = localStorage.getItem('careHubToken');
    const refreshToken = localStorage.getItem('careHubRefreshToken');

    if (rawUser && token && !user) {
      try {
        dispatch(setCredentials({
          user: JSON.parse(rawUser),
          token,
          refreshToken,
        }));
      } catch {
        // invalid stored user
      }
    }
  }, [dispatch, user]);

  const guard = (allowedRoles, element) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    const currentRole = user.role?.toUpperCase();
    const isAllowed = allowedRoles.some((r) => {
      const target = r.toUpperCase();
      if (currentRole === 'ADMIN') return true;
      return currentRole === target;
    });

    if (!isAllowed) {
      return <Navigate to={homeFor(user) || '/login'} replace />;
    }

    return <AppLayout user={user}>{element}</AppLayout>;
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homeFor(user) || '/login'} replace />} />
      {/* Public Routes */}
      <Route
        path="/login"
        element={user && homeFor(user) ? <Navigate to={homeFor(user)} replace /> : <Login onLogin={(credentials) => dispatch(setCredentials(credentials))} />}
      />
      <Route
        path="/register"
        element={user && homeFor(user) ? <Navigate to={homeFor(user)} replace /> : <Register onLogin={(credentials) => dispatch(setCredentials(credentials))} />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee"
        element={guard(['EMPLOYEE'], <EmployeeDashboard />)}
      />
      <Route
        path="/self-review"
        element={guard(['EMPLOYEE', 'HR', 'ADMIN'], <SelfReviewForm />)}
      />

      {/* Reviewer / Manager Routes */}
      <Route
        path="/reviewer"
        element={guard(['MANAGER', 'ADMIN'], <ReviewerDashboard />)}
      />
      <Route
        path="/reviewer/assessment"
        element={guard(['MANAGER', 'HR', 'ADMIN'], <ReviewerAssessmentForm />)}
      />

      
      {/* HR Routes */}
      <Route
        path="/hr"
        element={guard(['HR'], <HRDashboard />)}
      />
      <Route path="/cycles" element={guard(['ADMIN', 'HR', 'MANAGER'], <ReviewCycles />)} />
      <Route path="/progress-checks" element={guard(['ADMIN', 'HR'], <ProgressChecks />)} />
      <Route path="/reports" element={guard(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'], <Reports />)} />

      {/* Admin Route */}
      <Route
        path="/admin"
        element={guard(['ADMIN'], <AdminDashboard />)}
      />

      {/* Catch-all fallback */}
      <Route
        path="*"
        element={<Navigate to={homeFor(user) || '/login'} replace />}
      />
    </Routes>
  );
}
