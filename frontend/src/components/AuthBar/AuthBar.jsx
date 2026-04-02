import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import { CART_COUNT_CHANGED_EVENT } from "../../cartEvents";
import {
  clearUserSession,
  getStoredCustomerId,
} from "../../userSession";
import "./AuthBar.css";

function getInitials(displayName) {
  const trimmed = String(displayName || "User").trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase() || "U";
}

function AuthBar({ userName = "User" }) {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const fetchCartCount = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/cart-item-count");
      const n = data?.data?.cartItemCount;
      setCartCount(Number.isFinite(Number(n)) ? Number(n) : 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    fetchCartCount();
    const onChange = () => fetchCartCount();
    window.addEventListener(CART_COUNT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CART_COUNT_CHANGED_EVENT, onChange);
  }, [fetchCartCount]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    clearUserSession();
    navigate("/login");
  };

  const handleMyCart = () => {
    navigate("/my-cart");
  };

  const handlePurchasedItems = () => {
    setMenuOpen(false);
    const customerId = getStoredCustomerId();
    if (customerId != null) {
      navigate(`/purchases/${customerId}`, {
        state: { name: userName, customerId },
      });
    } else {
      navigate("/purchases", { state: { name: userName } });
    }
  };

  const displayCount = cartCount === null ? "…" : String(cartCount);
  const initials = getInitials(userName);

  return (
    <div className="auth-bar">
      <button
        type="button"
        className="auth-bar-cart"
        onClick={handleMyCart}
      >
        My Cart ({displayCount})
      </button>

      <div className="auth-bar-menu-wrap" ref={menuRef}>
        <button
          type="button"
          className="auth-bar-avatar"
          aria-label="Account menu"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="auth-bar-avatar-initials" aria-hidden>
            {initials}
          </span>
        </button>

        {menuOpen ? (
          <div className="auth-bar-dropdown" role="menu">
            <div className="auth-bar-dropdown-header">{userName}</div>
            <button
              type="button"
              className="auth-bar-dropdown-item"
              role="menuitem"
              onClick={handlePurchasedItems}
            >
              Purchased items
            </button>
            <button
              type="button"
              className="auth-bar-dropdown-item auth-bar-dropdown-item-danger"
              role="menuitem"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AuthBar;
