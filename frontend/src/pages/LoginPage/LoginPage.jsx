import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './LoginPage.css'
import apiClient from '../../apiClient'
import { hasUserSession, saveUserSession } from '../../userSession'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/products'

  useEffect(() => {
    if (hasUserSession()) {
      navigate(from === '/login' ? '/products' : from, { replace: true })
    }
  }, [navigate, from])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const response = await apiClient.post('/login', { email, password })
      const user = response.data?.user
      const token = response.data?.token ?? user?.token

      if (!user) {
        window.alert('No user found with this email.')
        return
      }

      saveUserSession({ token, user, fallbackName: user.c_name || 'User' })
      navigate(from, {
        replace: true,
        state: { name: user.c_name || 'User', customerId: user.c_id || null },
      })
    } catch (error) {
      console.log ("usman", error.response.data.message)
      window.alert(error.response.data.message??'Login failed. Please try again.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <h1 id="login-heading">Login</h1>
        <p className="login-subtitle">Enter your email to continue.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />

          <button type="submit">Login</button>
        </form>
        <p className="auth-switch">
          New user? <button type="button" onClick={() => navigate('/signup')}>Sign up</button>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
