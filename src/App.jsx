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

const homeFor = (user) => {
  if (!user) return '/login';
  const role = user.role?.toUpperCase();
  if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'HR' || role === 'HR_HRBP') {
    return '/hr';
  }
  if (role === 'MANAGER' || role === 'REVIEWER') {
    return '/reviewer';
  }
  return '/employee';
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
      if (target === 'SUPER_ADMIN' && currentRole === 'SUPER_ADMIN') return true;
      if (currentRole === 'SUPER_ADMIN') return true;
      if (target === 'HR' && (currentRole === 'HR' || currentRole === 'HR_ADMIN' || currentRole === 'HR_HRBP')) return true;
      if (target === 'REVIEWER' && (currentRole === 'REVIEWER' || currentRole === 'MANAGER')) return true;
      if (target === 'EMPLOYEE' && currentRole === 'EMPLOYEE') return true;
      return currentRole === target;
    });

    if (!isAllowed) {
      return <Navigate to={homeFor(user)} replace />;
    }

    return <AppLayout user={user}>{element}</AppLayout>;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to={homeFor(user)} replace /> : <Login onLogin={(u) => dispatch(setCredentials({ user: u }))} />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={homeFor(user)} replace /> : <Register onLogin={(u) => dispatch(setCredentials({ user: u }))} />}
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
        element={guard(['Employee', 'EMPLOYEE'], <EmployeeDashboard />)}
      />
      <Route
        path="/self-review"
        element={guard(['Employee', 'EMPLOYEE', 'HR', 'HR_ADMIN', 'SUPER_ADMIN'], <SelfReviewForm />)}
      />

      {/* Reviewer / Manager Routes */}
      <Route
        path="/reviewer"
        element={guard(['Reviewer', 'MANAGER', 'SUPER_ADMIN'], <ReviewerDashboard />)}
      />
      <Route
        path="/reviewer/assessment"
        element={guard(['Reviewer', 'MANAGER', 'HR', 'HR_ADMIN', 'SUPER_ADMIN'], <ReviewerAssessmentForm />)}
      />

      {/* HR Admin Routes */}
      <Route
        path="/hr"
        element={guard(['HR', 'HR_ADMIN', 'HR_HRBP', 'SUPER_ADMIN'], <HRDashboard />)}
      />

      {/* Catch-all fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? homeFor(user) : '/login'} replace />}
      />
    </Routes>
  );
}
