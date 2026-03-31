import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './ProductsPage.css'
import apiClient from '../../apiClient'
import AuthBar from '../../components/AuthBar/AuthBar'

function ProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const registeredName = location.state?.name || localStorage.getItem('customerName') || 'User'
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/products')
        setProducts(response.data?.products || [])
      } catch (error) {
        console.error(error)
        setErrorMessage('Failed to load products.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handlePurchase = async (product) => {

    try {
      await apiClient.post('/purchase', {
        product_id: product.p_id,
        quantity: 1,
      })
      window.alert(`Purchased ${product.p_name} successfully.`)
    } catch (error) {
      console.error(error)
      window.alert(`Failed to purchase ${product.p_name}.`)
    }
  }

  return (
    <main className="products-page">
      <AuthBar userName={registeredName} />
      <section className="products-card" aria-labelledby="products-heading">
        <h1 id="products-heading">Products List</h1>
        <p className="products-subtitle">
          Welcome {registeredName}, here are the available products.
        </p>
        <button
          type="button"
          className="view-purchases-button"
          onClick={() => {
    
            navigate(`/purchases`, { state: { name: registeredName } })
          }}
        >
          View Purchased Items
        </button>

        {isLoading ? (
          <p>Loading products...</p>
        ) : errorMessage ? (
          <p>{errorMessage}</p>
        ) : products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          <ul className="products-list">
            {products.map((product) => (
              <li key={product.p_id} className="product-item">
                <span className="product-name">{product.p_name}</span>
                <span className="product-price">${Number(product.p_price).toFixed(2)}</span>
                <button
                  type="button"
                  className="purchase-button"
                  onClick={() => handlePurchase(product)}
                >
                  Purchase
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default ProductsPage
