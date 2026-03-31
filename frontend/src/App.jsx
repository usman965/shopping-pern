import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/LoginPage/LoginPage.jsx'
import PurchasedItemsPage from './pages/PurchasedItemsPage/PurchasedItemsPage.jsx'
import ProductsPage from './pages/ProductsPage/ProductsPage.jsx'
import SignUpPage from './pages/SignUpPage/SignUpPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/purchases" element={<PurchasedItemsPage />} />
      <Route path="/purchases/:customerId" element={<PurchasedItemsPage />} />
    </Routes>
  )
}

export default App
