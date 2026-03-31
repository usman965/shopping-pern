import { useNavigate } from 'react-router-dom'
import './LoginPage.css'
import apiClient, { AUTH_TOKEN_KEY } from '../../apiClient'

function LoginPage() {
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const response = await apiClient.post('/login', { email, password })
      console.log("🚀 ~ handleSubmit ~ response:", response)
      const token = response.data?.user?.token
      const user = response.data?.user

      if (!user) {
        window.alert('No user found with this email.')
        return
      }

      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
      }

      localStorage.setItem('customerId', String(user.c_id || ''))
      localStorage.setItem('customerName', user.c_name || 'User')
      navigate('/products', {
        state: { name: user.c_name || 'User', customerId: user.c_id || null },
      })
    } catch (error) {
      console.error(error)
      window.alert('Login failed. Please try again.')
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
