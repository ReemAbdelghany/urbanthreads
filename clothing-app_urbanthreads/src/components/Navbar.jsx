import { useNavigate } from 'react-router-dom'

export default function Navbar({ user, cartCount = 0, onOpenAuth }) {
  const navigate = useNavigate()
  return (
    <nav>
      <div className="nav-logo" onClick={() => navigate('/')}>Urban<span>Threads</span></div>
      <div className="nav-links">
        <span className="nav-link" onClick={() => navigate('/')}>Home</span>
        <span className="nav-link" onClick={() => navigate('/shop')}>Shop</span>
        {user && (
          <span className="nav-link" onClick={() => navigate('/profile')}>My Account</span>
        )}
      </div>
      <div className="nav-actions">
        <button className="nav-icon-btn" onClick={() => navigate('/checkout')} title="Cart">
          🛒
          <span className="cart-badge">{cartCount}</span>
        </button>
        {!user ? (
          <button className="btn-nav-cta" onClick={onOpenAuth}>Sign In</button>
        ) : (
          <button className="btn-nav-cta" style={{ background: 'var(--terracotta)' }} onClick={() => navigate('/profile')}>My Account</button>
        )}
      </div>
    </nav>
  )
}
