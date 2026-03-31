import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './ProductsPage.css'

function ProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const registeredName = location.state?.name || localStorage.getItem('customerName') || 'User'
  const customerId = Number(location.state?.customerId || localStorage.getItem('customerId')) || null
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/products')
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
    if (!customerId) {
      window.alert('Please login or sign up again to purchase.')
      return
    }

    try {
      await axios.post('http://localhost:3000/purchase', {
        product_id: product.p_id,
        customer_id: customerId,
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
      <section className="products-card" aria-labelledby="products-heading">
        <h1 id="products-heading">Products List</h1>
        <p className="products-subtitle">
          Welcome {registeredName}, here are the available products.
        </p>
        <button
          type="button"
          className="view-purchases-button"
          onClick={() => {
            if (!customerId) {
              window.alert('Please login or sign up first.')
              return
            }
            navigate(`/purchases/${customerId}`, { state: { name: registeredName, customerId } })
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
