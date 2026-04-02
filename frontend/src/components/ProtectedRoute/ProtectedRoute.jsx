import { Navigate, useLocation } from 'react-router-dom'
import { hasUserSession } from '../../userSession'

function ProtectedRoute({ children }) {
  const location = useLocation()

  if (!hasUserSession()) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return children
}

export default ProtectedRoute
