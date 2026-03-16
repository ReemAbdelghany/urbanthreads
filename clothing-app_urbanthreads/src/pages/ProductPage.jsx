import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PRODUCTS } from '../data/products'
import { MOCK_REVIEWS } from '../data/reviews'
import { calculateCashback, sendEvent } from '../api/gameball'

export default function ProductPage(props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = PRODUCTS.find(p => p.id === id)
  const [reviewList, setReviewList] = useState(MOCK_REVIEWS)
  const [earnPreview, setEarnPreview] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewType, setReviewType] = useState('text')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')

  useEffect(() => {
    if (!product) return
    calculateCashback({
      customerId: props.customerId || 'guest',
      totalPaid: product.price,
      totalDiscount: 0,
      totalShipping: 0,
      lineItems: [{
        productId: product.id,
        quantity: 1,
        price: product.price,
        sku: product.sku,
        category: [product.category],
        title: product.name,
        taxes: 0,
        discount: 0
      }]
    }).then(res => {
      if (res && res.totalPoints !== undefined) setEarnPreview(res.totalPoints)
    })
  }, [product?.id, props.customerId]) // product?.id intentional — PRODUCTS.find() returns a new ref every render

  if (!product) return <div style={{padding:40}}>Product not found</div>

  const addToCartAndGo = () => {
    if (!props.user) { props.openAuth && props.openAuth('login'); return }
    const existing = props.cart.find(i => i.id === product.id)
    if (existing) {
      props.setCart(props.cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
    } else {
      props.setCart([...props.cart, { id: product.id, name: product.name, price: product.price, emoji: product.emoji, category: product.category, sku: product.sku, qty: 1 }])
    }
    props.toast('Added to cart!','success')
    navigate('/checkout')
  }

  const submitReview = async () => {
    if (!props.user) { props.openAuth('login'); return }
    if (!reviewBody.trim()) { props.toast('Please write your review', 'error'); return }

    try {
      await sendEvent({
        customerId: props.customerId,
        events: {
          write_review: {
            product_id: product.id,
            product_name: product.name,
            rating: reviewRating,
            review_text: reviewBody,
            has_image: reviewType === 'image',
            review_type: reviewType === 'image' ? 'with_image' : 'text_only',
            platform: 'web'
          }
        }
      })
    } catch (err) {
      console.error('Failed to send review event:', err)
    }

    const lastInitial = props.user.lastName?.[0] ?? ''
    setReviewList(prev => [{
      name: `${props.user.firstName} ${lastInitial}.`,
      rating: reviewRating,
      text: reviewBody,
      hasImg: reviewType === 'image',
      date: 'Just now'
    }, ...prev])

    setShowReviewForm(false)
    setReviewBody('')

    const msg = reviewType === 'image'
      ? 'Review with photo submitted! Bonus points incoming 📷'
      : 'Review submitted! Points on their way ⭐'
    props.toast(msg, 'success')
  }

  return (
    <div>
      <div className="product-detail-grid">
        <div>
          <div className="pd-img" id="pd-img">{product.emoji}</div>
        </div>
        <div className="pd-info">
          <div className="back-link" onClick={() => navigate('/shop')}>← Back to Shop</div>
          <div className="product-category">{product.category}</div>
          <h1>{product.name}</h1>
          <div className="pd-price">${product.price}.00</div>
          <p className="pd-desc">{product.desc}</p>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:'.75rem',textTransform:'uppercase',letterSpacing:'.5px',color:'var(--text2)',fontWeight:600,display:'block',marginBottom:8}}>Size</label>
            <div className="pd-sizes">
              <button className="size-btn">XS</button>
              <button className="size-btn active">S</button>
              <button className="size-btn">M</button>
              <button className="size-btn">L</button>
              <button className="size-btn">XL</button>
            </div>
          </div>
          <div className="pd-actions">
            <button className="btn btn-primary" onClick={addToCartAndGo} style={{flex:1,justifyContent:'center'}}>Add to Cart</button>
            <button className="btn btn-outline">♡</button>
          </div>
          <div className="points-earn-preview">
            <div className="pep-label">🏆 You'll Earn</div>
            <div className="pep-value">{earnPreview !== null ? `${earnPreview.toLocaleString()} pts` : `~${Math.round(product.price * 2)} pts`}</div>
            <div className="pep-sub">Points added after your order is confirmed</div>
          </div>
        </div>
      </div>

      <div style={{padding:'0 48px 60px',maxWidth:1100,margin:'0 auto'}}>
        <div className="separator"></div>
        <div style={{maxWidth:700}}>
          <h2 style={{fontFamily:'Cormorant Garamond, serif',fontSize:'1.8rem',fontWeight:400,marginBottom:24}}>Customer Reviews</h2>
          <div id="reviews-list">
            {reviewList.map((r, idx) => (
              <div className="review-card" key={idx}>
                <div className="review-header">
                  <div className="reviewer-avatar">{r.name[0]}</div>
                  <div>
                    <div className="reviewer-name">{r.name}</div>
                    <div className="review-date">{r.date}</div>
                  </div>
                </div>
                <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                <div className="review-text">{r.text}</div>
                {r.hasImg ? <div className="review-has-img">📷 Includes photo</div> : null}
              </div>
            ))}
          </div>

          {showReviewForm ? (
            <div className="write-review-card">
              <h3 style={{fontFamily:'Cormorant Garamond, serif',fontSize:'1.3rem',fontWeight:400,marginBottom:16}}>Write a Review</h3>
              <div className="img-toggle">
                <button type="button" className={`img-opt${reviewType === 'text' ? ' active' : ''}`} onClick={() => setReviewType('text')}>Text Review</button>
                <button type="button" className={`img-opt${reviewType === 'image' ? ' active' : ''}`} onClick={() => setReviewType('image')}>With Photo 📷 <span style={{fontSize:'.7rem',color:'var(--terracotta)'}}>+Bonus pts</span></button>
              </div>
              <div className="star-picker">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`star-pick${s <= reviewRating ? ' active' : ''}`} onClick={() => setReviewRating(s)}>★</span>
                ))}
              </div>
              <div className="form-group" style={{marginTop:12}}>
                <textarea
                  value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid var(--border)',fontFamily:'inherit',fontSize:'.88rem',resize:'vertical'}}
                />
              </div>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button className="btn btn-terra btn-sm" onClick={submitReview}>Submit Review</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowReviewForm(false); setReviewBody('') }}>Cancel</button>
              </div>
            </div>
          ) : props.user ? (
            <button className="btn btn-outline" style={{marginTop:20}} onClick={() => setShowReviewForm(true)}>
              ✍️ Write a Review
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
