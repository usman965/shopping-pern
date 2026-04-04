import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../../apiClient";
import "./CheckoutSuccessPage.css";
import { notifyCartCountChanged } from "../../cartEvents";

function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const handlePurchase = async () => {
    try {
      await apiClient.post("/purchase");
      notifyCartCountChanged();
      window.alert(`Purchased products successfully.`);
    } catch (error) {
      console.error(error);
      window.alert(`Failed to purchase products.`);
    }
  };

  useEffect(() => {
    if (!sessionId) {
      setError("Missing payment session. Return to cart and try again.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await apiClient.get(
          `/checkout-session/${encodeURIComponent(sessionId)}`,
        );
        if (!cancelled) {
          if (data?.success && data?.session) {
            await handlePurchase();
            setDetails(data.session);
          } else {
            setError(data?.message || "Could not load payment details.");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e.response?.data?.message ||
              "Could not verify payment. If you were charged, check your email for a receipt.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="checkout-success-page">
      <section className="checkout-success-card">
        <h1>Payment</h1>
        {loading ? (
          <p>Confirming your payment…</p>
        ) : error ? (
          <>
            <p className="checkout-success-error">{error}</p>
            <Link to="/my-cart" className="checkout-success-link">
              Back to cart
            </Link>
          </>
        ) : details ? (
          <>
            <p className="checkout-success-ok">
              Thank you — your payment was received.
            </p>
            <dl className="checkout-success-dl">
              <div>
                <dt>Status</dt>
                <dd>{details.payment_status}</dd>
              </div>
              {details.amount_total != null && (
                <div>
                  <dt>Amount</dt>
                  <dd>
                    {(details.amount_total / 100).toFixed(2)}{" "}
                    {String(details.currency || "usd").toUpperCase()}
                  </dd>
                </div>
              )}
              {details.customer_email ? (
                <div>
                  <dt>Email</dt>
                  <dd>{details.customer_email}</dd>
                </div>
              ) : null}
              {Array.isArray(details.line_items) &&
              details.line_items.length > 0 ? (
                <div className="checkout-success-line-items">
                  <dt>Items</dt>
                  <dd>
                    <ul className="checkout-success-items">
                      {details.line_items.map((item, i) => (
                        <li key={`${item.description}-${i}`}>
                          <span>
                            {item.description || "Item"} × {item.quantity ?? 1}
                          </span>
                          {item.amount_total != null ? (
                            <span>
                              {" "}
                              ({(item.amount_total / 100).toFixed(2)}{" "}
                              {String(
                                item.currency || details.currency || "usd",
                              ).toUpperCase()}
                              )
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Reference</dt>
                <dd className="checkout-success-mono">{details.id}</dd>
              </div>
            </dl>
            <Link to="/products" className="checkout-success-link">
              Continue shopping
            </Link>
          </>
        ) : null}
      </section>
    </main>
  );
}

export default CheckoutSuccessPage;
