function bgForId(id) {
  const palette = ['#f0ebe4','#e8e0d5','#ede5db','#e5ddd0']
  const i = Math.abs((id && id.charCodeAt(5)) || 0) % palette.length
  return palette[i]
}

export default function ProductCard({ product, onClick }) {
  const bg = bgForId(product.id)
  return (
    <div className="product-card" onClick={() => onClick?.(product)}>
      <div className="product-img" style={{ background: bg }}>
        {product.badge ? <div className="product-badge">{product.badge}</div> : null}
        <span style={{ fontSize: '6rem' }}>{product.emoji}</span>
      </div>
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-rating">★★★★★ <span>{product.rating} ({product.reviews})</span></div>
        <div className="product-price">${product.price}.00</div>
      </div>
    </div>
  )
}
