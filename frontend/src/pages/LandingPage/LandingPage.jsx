import { Link } from 'react-router-dom'
import './LandingPage.css'
import { getStoredCustomerId, hasUserSession } from '../../userSession'

function LandingPage() {
  const sessionActive = hasUserSession()
  const customerId = getStoredCustomerId()

  return (
    <main className="landing-page">
      <section className="landing-card" aria-labelledby="landing-heading">
        <h1 id="landing-heading">Welcome</h1>
        <p className="landing-subtitle">Please choose how you want to continue.</p>
        <div className="landing-actions">
          {sessionActive ? (
            <>
              <Link className="landing-button" to="/products">
                Continue to products
              </Link>
              {customerId != null && (
                <Link className="landing-button outline" to={`/purchases/${customerId}`}>
                  Purchased items
                </Link>
              )}
            </>
          ) : (
            <>
              <Link className="landing-button" to="/login">
                Login
              </Link>
              <Link className="landing-button secondary" to="/signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default LandingPage
