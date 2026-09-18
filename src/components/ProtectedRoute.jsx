import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentToken, selectCurrentUser } from '../store/slices/authSlice';

export default function ProtectedRoute({ children }) {
  const token = useSelector(selectCurrentToken);
  const user = useSelector(selectCurrentUser);
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
