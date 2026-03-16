const BASE = import.meta.env.VITE_GB_BASE_URL
const API_KEY = import.meta.env.VITE_GB_API_KEY
const SECRET_KEY = import.meta.env.VITE_GB_SECRET_KEY

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options)
    const data = await res.json()
    if (!res.ok) {
      console.error('Gameball API error', res.status, data)
      return { _error: true, _status: res.status, ...data }
    }
    return data
  } catch (err) {
    console.error('Gameball fetch failed:', err instanceof Error ? err.message : String(err))
    return null
  }
}

// Phase 1 — register customer (called on sign-up)
export async function registerCustomer(payload) {
  return safeFetch(`${BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: API_KEY },
    body: JSON.stringify(payload)
  })
}

// Phase 2 — fire a custom event (write_review, profile_completed, etc.)
// points come from campaigns tied to the event, not from the event itself
export async function sendEvent(payload) {
  return safeFetch(`${BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: API_KEY },
    body: JSON.stringify(payload)
  })
}

// Phase 3a — points balance (fetched when checkout mounts)
export async function getBalance(customerId) {
  return safeFetch(`${BASE}/customers/${encodeURIComponent(customerId)}/balance`, {
    headers: { apikey: API_KEY, secretkey: SECRET_KEY }
  })
}

// Phase 3b — active redemption rules for this customer
export async function getRedemptionConfigs(customerId) {
  return safeFetch(
    `${BASE}/configurations/redemption?customerId=${encodeURIComponent(customerId)}`,
    { headers: { apikey: API_KEY } }
  )
}

// Phase 3c — preview how many points this cart will earn (read-only, no side effects)
export async function calculateCashback(payload) {
  return safeFetch(`${BASE}/orders/cashback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: API_KEY },
    body: JSON.stringify(payload)
  })
}

// Phase 3d — exchange points for a discount coupon
export async function generateCoupon(payload) {
  return safeFetch(`${BASE}/coupons/predefined`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
      secretkey: SECRET_KEY
    },
    body: JSON.stringify(payload)
  })
}

// Phase 4 — submit the completed order; this is what actually awards points
export async function trackOrder(payload) {
  return safeFetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
      secretkey: SECRET_KEY
    },
    body: JSON.stringify(payload)
  })
}

// Phase 5 — verify what points were awarded for an order
export async function getOrderTransactions(orderId) {
  return safeFetch(
    `${BASE}/orders/${encodeURIComponent(orderId)}/transactions`,
    { headers: { apikey: API_KEY, secretkey: SECRET_KEY } }
  )
}

// Phase 6 — tier progress for the profile page
export async function getTierProgress(customerId) {
  return safeFetch(
    `${BASE}/customers/${encodeURIComponent(customerId)}/tier-progress`,
    { headers: { apikey: API_KEY, secretkey: SECRET_KEY } }
  )
}

// Phase 6b — badge/achievement progress
export async function getCampaignsProgress(customerId) {
  return safeFetch(
    `${BASE}/customers/${encodeURIComponent(customerId)}/reward-campaigns-progress`,
    { headers: { apikey: API_KEY, secretkey: SECRET_KEY } }
  )
}
