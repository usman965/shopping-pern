import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MyCartPage.css";
import apiClient from "../../apiClient";
import { notifyCartCountChanged } from "../../cartEvents";
import AuthBar from "../../components/AuthBar/AuthBar";

function MyCartPage() {
  const location = useLocation();
  const registeredName =
    location.state?.name || localStorage.getItem("customerName") || "User";
  const [myCart, setMyCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);

  const getUnitPrice = (product) => {
    if (product.p_price != null && product.p_price !== "") {
      return Number(product.p_price);
    }
    const count = Number(product.item_count) || 1;
    return Number(product.total_price) / count;
  };

  const getItemCount = (product) => {
    const n = Number(product.item_count);
    if (Number.isFinite(n) && n >= 1) return n;
    return 1;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get("/my-cart");
        setMyCart(response.data?.my_cart || []);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load my cart.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const adjustCartQuantity = async (product, delta) => {
    const current = getItemCount(product);
    const next = current + delta;
    if (next < 0) return;

    const product_id = product.p_id;
    const quantity = next <= 0 ? 0 : next;
    const unit = getUnitPrice(product);

    setBusyProductId(product_id);
    try {
      await apiClient.post("/subtract-cart-item-count", {
        product_id,
        quantity,
      });
      notifyCartCountChanged();

      if (quantity === 0) {
        setMyCart((prev) => prev.filter((p) => p.p_id !== product_id));
      } else {
        setMyCart((prev) =>
          prev.map((p) =>
            p.p_id === product_id
              ? {
                  ...p,
                  item_count: quantity,
                  total_price: unit * quantity,
                }
              : p,
          ),
        );
      }
    } catch (error) {
      console.error(error);
      window.alert(`Failed to update ${product.p_name} quantity.`);
    } finally {
      setBusyProductId(null);
    }
  };



  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      // Call your backend API to create a checkout session
      const response = await apiClient.post("/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          // Add any data you need to send to your backend
          // For example: amount, product details, etc.
        }),
      });

      const data = response.data;
      console.log("🚀 ~ handleSubmit ~ data:", data);

      // Check for backend error
      if (data.error) {
        throw new Error(data.message || data.error);
      }

      // Use the hosted checkout URL if available, otherwise fallback to session ID
      if (data.url) {
        // Use the hosted checkout URL (recommended approach)
        window.location.href = data.url;
      } else {
        // Fallback to session ID approach
        const sessionId =
          data.sessionId ||
          data.checkoutSessionClientSecret?.split("_secret_")[0];

        if (!sessionId) {
          throw new Error("No session ID or URL received from server");
        }

        // Simple redirect to Stripe Checkout
        window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "An error occurred while processing payment");
    }
  };

  return (
    <main className="products-page">
      <AuthBar userName={registeredName} />
      <section className="products-card" aria-labelledby="products-heading">
        <h1 id="products-heading">My Cart</h1>
        <p className="products-subtitle">Here are the products in your cart.</p>

        {error && <p>{error}</p>}

        {isLoading ? (
          <p>Loading my cart...</p>
        ) : errorMessage ? (
          <p>{errorMessage}</p>
        ) : myCart.length === 0 ? (
          <p>No products in your cart.</p>
        ) : (
          <ul className="products-list">
            {myCart.map((product) => {
              const count = getItemCount(product);
              const isBusy = busyProductId === product.p_id;
              return (
                <li key={product.p_id} className="product-item cart-line">
                  <span className="product-name">{product.p_name}</span>
                  <div
                    className="cart-qty-controls"
                    role="group"
                    aria-label={`Quantity for ${product.p_name}`}
                  >
                    <button
                      type="button"
                      className="cart-qty-btn"
                      disabled={isBusy}
                      onClick={() => adjustCartQuantity(product, -1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="cart-qty-value">{count}</span>
                    <button
                      type="button"
                      className="cart-qty-btn"
                      disabled={isBusy}
                      onClick={() => adjustCartQuantity(product, 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="product-price">
                    ${Number(product.total_price).toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {myCart.length > 0 && (
          <button
            style={{
              marginTop: "30px",
            }}
            type="button"
            className="purchase-button"
            onClick={() => handleSubmit()}
          >
            Checkout
          </button>
        )}
      </section>
    </main>
  );
}

export default MyCartPage;
