import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import './PurchasedItemsPage.css'
import apiClient from '../../apiClient'
import AuthBar from '../../components/AuthBar/AuthBar'

function PurchasedItemsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const customerName =
    localStorage.getItem('customerName') || location.state?.name || 'User'
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



  return (
    <main className="purchases-page">
      <AuthBar userName={displayName} />
      <section className="purchases-card" aria-labelledby="purchases-heading">
        <h1 id="purchases-heading">Purchased Items</h1>


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
   
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default PurchasedItemsPage
