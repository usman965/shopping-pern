import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx'
import SiteBrand from './components/SiteBrand/SiteBrand.jsx'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/LoginPage/LoginPage.jsx'
import PurchasedItemsPage from './pages/PurchasedItemsPage/PurchasedItemsPage.jsx'
import ProductsPage from './pages/ProductsPage/ProductsPage.jsx'
import SignUpPage from './pages/SignUpPage/SignUpPage.jsx'
import MyCartPage from './pages/MyCart/MyCartPage.jsx'

function App() {
  return (
    <>
      <SiteBrand />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchases"
        element={
          <ProtectedRoute>
            <PurchasedItemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchases/:customerId"
        element={
          <ProtectedRoute>
            <PurchasedItemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-cart"
        element={
          <ProtectedRoute>
            <MyCartPage />
          </ProtectedRoute>
        }
      />
    </Routes>
    </>
  )
}

export default App
