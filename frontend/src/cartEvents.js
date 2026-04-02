export const CART_COUNT_CHANGED_EVENT = 'shopping-pern-cart-count-changed'

export function notifyCartCountChanged() {
  window.dispatchEvent(new Event(CART_COUNT_CHANGED_EVENT))
}
