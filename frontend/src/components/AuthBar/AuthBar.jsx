import { useNavigate } from 'react-router-dom'
import { clearUserSession } from '../../userSession'
import './AuthBar.css'

function AuthBar({ userName = 'User' }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearUserSession()
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
