import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SignUpPage.css'
import apiClient from '../../apiClient'
import { hasUserSession, saveUserSession } from '../../userSession'

function SignUpPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (hasUserSession()) {
      navigate('/products', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const signupResponse = await apiClient.post('/signup', { name, email, password })
      const user = signupResponse.data?.user
      const signupToken = signupResponse.data?.token ?? user?.token

      saveUserSession({
        token: signupToken,
        user,
        fallbackName: typeof name === 'string' ? name : 'User',
      })
      navigate('/products', {
        state: {
          name: user?.c_name || (typeof name === 'string' ? name : 'User'),
          customerId: user?.c_id || null,
        },
      })
    } catch (error) {
      console.error(error)
      window.alert('Sign up failed. Please try again.')
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-card" aria-labelledby="signup-heading">
        <h1 id="signup-heading">Create your account</h1>
        <p className="signup-subtitle">
          Register with your name and email to get started.
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            required
          />

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
            autoComplete="new-password"
            placeholder="Create a password"
            required
          />

          <button type="submit">Sign up</button>
        </form>
        <p className="auth-switch">
          Already have an account? <button type="button" onClick={() => navigate('/login')}>Login</button>
        </p>
      </section>
    </main>
  )
}

export default SignUpPage
