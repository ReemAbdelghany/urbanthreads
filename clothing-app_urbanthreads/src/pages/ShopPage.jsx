import { PRODUCTS } from '../data/products'
import ProductCard from '../components/ProductCard'
import { useNavigate } from 'react-router-dom'

export default function ShopPage() {
  const navigate = useNavigate()
  const openProduct = (p) => navigate(`/product/${p.id}`)

  return (
    <div>
      <div className="section">
        <div className="products-heading">
          <div>
            <div className="section-tag">All Products</div>
            <h2>The Full Collection</h2>
          </div>
        </div>
        <div className="product-grid" id="shop-products">
          {PRODUCTS.map(p => <ProductCard key={p.id} product={p} onClick={openProduct} />)}
        </div>
      </div>
    </div>
  )
}
