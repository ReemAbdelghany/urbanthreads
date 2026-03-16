import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getBalance,
  getRedemptionConfigs,
  calculateCashback,
  generateCoupon,
  trackOrder
} from '../api/gameball'

export default function CheckoutPage(props) {
  const navigate = useNavigate()
  const { customerId, setPoints } = props
  const cart = useMemo(() => props.cart ?? [], [props.cart])

  // Phase 3a — balance
  const [balance, setBalance] = useState(null)
  // Phase 3b — redemption rules
  const [redemptionRules, setRedemptionRules] = useState([])
  // Phase 3c — cashback preview
  const [earnPreview, setEarnPreview] = useState(null)
  // Phase 3d — coupon
  const [couponCode, setCouponCode] = useState(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  // Phase 4 — order
  const [placing, setPlacing] = useState(false)
  // Delivery form
  const [firstName, setFirstName] = useState(props.user?.firstName || '')
  const [lastName, setLastName] = useState(props.user?.lastName || '')
  const [email, setEmail] = useState(props.user?.email || '')
  const [address, setAddress] = useState('')

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  )
  const totalDiscount = useMemo(
    () => couponDiscount + (props.redemptionApplied || 0),
    [couponDiscount, props.redemptionApplied]
  )
  const totalPaid = useMemo(
    () => Math.max(0, cartSubtotal + 10 + 12 - totalDiscount),
    [cartSubtotal, totalDiscount]
  )

  // fetch balance + redemption rules when the page loads
  useEffect(() => {
    if (!customerId) return

    // Phase 3a
    getBalance(customerId).then(res => {
      if (res) {
        setBalance(res)
        setPoints(res.avaliablePointsBalance || 0)
      }
    })

    // Phase 3b
    getRedemptionConfigs(customerId).then(res => {
      if (res && res.redemptionRules) {
        setRedemptionRules(res.redemptionRules.filter(r => r.isActive))
      }
    })
  }, [customerId, setPoints])

  // Phase 3c — recalculate preview when cart or discount changes
  useEffect(() => {
    if (!cart.length) return
    calculateCashback({
      customerId: customerId || 'guest',
      totalPaid,
      totalDiscount,
      totalShipping: 10,
      lineItems: cart.map(i => ({
        productId: i.id,
        quantity: i.qty,
        price: i.price,
        sku: i.sku,
        category: [i.category],
        title: i.name,
        taxes: 0,
        discount: 0
      }))
    }).then(res => {
      if (res && res.totalPoints !== undefined) setEarnPreview(res.totalPoints)
    })
  // totalPaid and totalDiscount are derived from these — including them fires the effect twice per change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, customerId, couponDiscount, props.redemptionApplied])

  // Phase 3d — generate coupon when user selects a rule
  const redeemWithCoupon = async (rule) => {
    if (!customerId) { props.openAuth('login'); return }
    props.toast('Generating your coupon...', 'info')
    try {
      const res = await generateCoupon({
        customerId,
        ruleId: Number(rule.id)
      })

      if (res && res._error) {
        props.toast(res.message || 'Could not apply reward', 'error')
        return
      }
      if (res && res.code) {
        setCouponCode(res.code)
        // Estimate discount from rule
        const discount = rule.coupon?.discountValue || 0
        const discountAmount = rule.coupon?.couponType === 'percentage_discount'
          ? (cartSubtotal * discount / 100)
          : discount
        setCouponDiscount(discountAmount)
        props.toast(`Coupon ${res.code} applied! Saving $${discountAmount.toFixed(2)} 🎁`, 'success')
      } else {
        props.toast('Could not generate coupon — check your points balance', 'error')
      }
    } catch (err) {
      props.toast('Coupon generation failed: ' + (err instanceof Error ? err.message : String(err)), 'error')
    }
  }

  const removeCoupon = () => {
    setCouponCode(null)
    setCouponDiscount(0)
  }

  // Phase 4 — submit order and navigate to confirmation
  const placeOrder = async () => {
    if (!props.user) { props.openAuth('login'); return }
    setPlacing(true)

    const orderId = `ORD_UT_${Date.now()}`

    const payload = {
      customerId,
      orderId,
      orderDate: new Date().toISOString(),
      totalPaid,
      totalPrice: cartSubtotal + 10 + 12,
      totalDiscount,
      totalShipping: 10,
      totalTax: 12,
      email,
      channel: 'web',
      lineItems: cart.map(i => ({
        productId: i.id,
        quantity: i.qty,
        price: i.price,
        sku: i.sku,
        category: [i.category],
        title: i.name,
        taxes: 0,
        discount: 0
      }))
    }

    // attach coupon if one was applied
    if (couponCode) {
      payload.redemption = { couponCodes: [couponCode] }
    }

    try {
      const res = await trackOrder(payload)

      const awarded = res?.rewardedPoints ?? earnPreview ?? Math.round(totalPaid * 2)
      props.setPoints(p => p + awarded)
      props.setRedemptionApplied(0)

      navigate('/confirmation', {
        state: {
          orderId,
          rewardedPoints: awarded,
          redeemedPoints: res?.redeemedPoints ?? 0
        }
      })
    } catch (err) {
      console.error('Order placement failed:', err)
      props.toast('Failed to place order. Please try again.', 'error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div>
      <div className="checkout-wrap">
        {/* Left — cart + delivery */}
        <div>
          <div className="back-link" onClick={() => navigate('/shop')}>← Continue Shopping</div>
          <h2 className="checkout-section-title">Your Order</h2>

          {cart.map(i => (
            <div className="cart-item" key={i.id}>
              <div className="cart-item-img">{i.emoji}</div>
              <div className="cart-item-info">
                <div className="cart-item-name">{i.name}</div>
                <div className="cart-item-meta">{i.category} · Qty {i.qty} · {i.sku}</div>
              </div>
              <div className="cart-item-price">${(i.price * i.qty).toFixed(2)}</div>
            </div>
          ))}

          <div className="separator"></div>
          <h2 className="checkout-section-title">Delivery Details</h2>
          <div className="form-grid">
            <div className="form-group"><label>First Name</label><input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
            <div className="form-group"><label>Last Name</label><input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
            <div className="form-group full"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="form-group full"><label>Address</label><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, Country" /></div>
          </div>
        </div>

        {/* Right — order summary */}
        <div>
          <div className="order-summary-card">
            <div className="os-title">Order Summary</div>

            {cart.map(i => (
              <div className="os-row" key={i.id}>
                <span>{i.name} ×{i.qty}</span>
                <span>${(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}

            <div className="separator" style={{ margin: '12px 0' }}></div>
            <div className="os-row"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
            <div className="os-row"><span>Shipping</span><span>$10.00</span></div>
            <div className="os-row"><span>Tax</span><span>$12.00</span></div>
            {totalDiscount > 0 && (
              <div className="os-row">
                <span>Discount</span>
                <span className="disc">-${totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="os-row total"><span>Total</span><span>${totalPaid.toFixed(2)}</span></div>

            {/* Points earn preview */}
            <div className="points-earn-preview">
              <div className="pep-label">🏆 You'll earn after this order</div>
              <div className="pep-value">
                {earnPreview !== null ? `${earnPreview.toLocaleString()} pts` : 'Calculating...'}
              </div>
              <div className="pep-sub">Added to your account after delivery</div>
            </div>

            {/* Redeem with points — show active rules */}
            {props.customerId && redemptionRules.length > 0 && !couponCode && (
              <div className="redeem-box">
                <h4>💎 Redeem Your Points</h4>
                <p style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 10 }}>
                  Balance: {balance === null ? 'Loading...' : `${(balance.avaliablePointsBalance ?? 0).toLocaleString()} pts (≈ $${balance.avaliablePointsValue ?? 0})`}
                </p>
                {redemptionRules.map(rule => (
                  <button
                    key={rule.id}
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}
                    onClick={() => redeemWithCoupon(rule)}
                  >
                    <span>
                      {rule.coupon?.options?.name ||
                        rule.coupon?.couponType?.replace(/_/g, ' ') ||
                        `Reward #${rule.id}`}
                      {rule.coupon?.discountValue
                        ? ` — ${rule.coupon.discountValue}${rule.coupon.couponType?.includes('percent') ? '%' : '$'} off`
                        : ''}
                    </span>
                    <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--terracotta)' }}>
                      {rule.pointsToRedeem ? `${rule.pointsToRedeem} pts` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Applied coupon */}
            {couponCode && (
              <div className="redeem-box">
                <span className="applied-badge">✓ Coupon {couponCode} applied</span>
                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '.78rem', cursor: 'pointer', marginLeft: 8 }}>
                  Remove
                </button>
              </div>
            )}

            <button
              className="btn btn-terra"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? 'Placing Order...' : 'Place Order'}
            </button>
            <p style={{ fontSize: '.72rem', color: 'var(--text2)', textAlign: 'center', marginTop: 10 }}>
              Secure checkout · Points awarded within 24h
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
