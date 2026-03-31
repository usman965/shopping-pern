import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import './PurchasedItemsPage.css'
import apiClient from '../../apiClient'
import AuthBar from '../../components/AuthBar/AuthBar'

function PurchasedItemsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const customerName = location.state?.name || localStorage.getItem('customerName') || 'User'
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const displayName = purchases[0]?.c_name || customerName

  useEffect(() => {
    const fetchPurchases = async () => {


      try {
        const response = await apiClient.get(`/purchases`)
        setPurchases(response.data?.purchases || [])
      } catch (error) {
        console.error(error)
        setErrorMessage('Failed to load purchased items.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchases()
  }, [])

  const handleRemovePurchase = async (orderId) => {
    if (!orderId) {
      window.alert('Order id missing. Please refresh purchases and try again.')
      return
    }

    try {
      await apiClient.delete(`/remove-purchase/${orderId}`)
      setPurchases((currentPurchases) =>
        currentPurchases.filter((purchase) => purchase.o_id !== orderId),
      )
    } catch (error) {
      console.error(error)
      window.alert('Failed to remove purchase.')
    }
  }

  return (
    <main className="purchases-page">
      <AuthBar userName={displayName} />
      <section className="purchases-card" aria-labelledby="purchases-heading">
        <h1 id="purchases-heading">Purchased Items</h1>
        <p className="purchases-subtitle">{displayName}, here are your purchases.</p>
        <button type="button" className="back-button" onClick={() => navigate('/products', { state: { name: customerName } })}>
          Back to Products
        </button>

        {isLoading ? (
          <p>Loading purchased items...</p>
        ) : errorMessage ? (
          <p>{errorMessage}</p>
        ) : purchases.length === 0 ? (
          <p>No purchased items found.</p>
        ) : (
          <ul className="purchases-list">
            {purchases.map((item, index) => (
              <li key={`${item.o_id}-${item.c_id}-${item.p_name}-${index}`} className="purchase-item">
                <span className="purchase-name">{item.p_name}</span>
                <span className="purchase-qty">Qty: {item.item_count}</span>
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => handleRemovePurchase(item.o_id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default PurchasedItemsPage
