import { useNavigate } from 'react-router-dom'
import { AUTH_TOKEN_KEY } from '../../apiClient'
import './AuthBar.css'

function AuthBar({ userName = 'User' }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem('customerId')
    localStorage.removeItem('customerName')
    navigate('/login')
  }

  return (
    <div className="auth-bar">
      <p className="auth-bar-text">Logged in as: {userName}</p>
      <button type="button" className="auth-bar-logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

export default AuthBar
