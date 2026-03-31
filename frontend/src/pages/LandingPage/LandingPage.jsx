import { Link } from 'react-router-dom'
import './LandingPage.css'

function LandingPage() {
  const customerId = Number(localStorage.getItem('customerId')) || null

  return (
    <main className="landing-page">
      <section className="landing-card" aria-labelledby="landing-heading">
        <h1 id="landing-heading">Welcome</h1>
        <p className="landing-subtitle">Please choose how you want to continue.</p>
        <div className="landing-actions">
          <Link className="landing-button" to="/login">
            Login
          </Link>
          <Link className="landing-button secondary" to="/signup">
            Sign Up
          </Link>
          {customerId && (
            <Link className="landing-button outline" to={`/purchases/${customerId}`}>
              Purchased Items
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}

export default LandingPage
