import { PRODUCTS } from '../data/products'
import ProductCard from '../components/ProductCard'
import { useNavigate } from 'react-router-dom'

export default function HomePage(props) {
  const navigate = useNavigate()
  const openProduct = (p) => navigate(`/product/${p.id}`)

  return (
    <div>
      {props.user && props.points > 0 && (
        <div className="loyalty-banner">
          <span>🎁 You have <strong>{props.points.toLocaleString()} points</strong> — redeem them at checkout for instant savings!</span>
          <span onClick={() => navigate('/profile')} style={{ cursor: 'pointer', color: 'var(--terra-light)' }}>
            View Rewards →
          </span>
        </div>
      )}
      <div className="section">
        <div className="products-heading">
          <div>
            <div className="section-tag">Featured</div>
            <h2>This Season's Edit</h2>
          </div>
        </div>
        <div className="product-grid" id="home-products">
          {PRODUCTS.slice(0,4).map(p => <ProductCard key={p.id} product={p} onClick={openProduct} />)}
        </div>
      </div>
    </div>
  )
}
