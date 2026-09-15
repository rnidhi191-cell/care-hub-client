import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  return localStorage.getItem('careHubToken') ? children : <Navigate to="/login" replace />;
}
