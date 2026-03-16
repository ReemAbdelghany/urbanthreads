import { useNavigate, useLocation } from 'react-router-dom'

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { orderId, rewardedPoints, redeemedPoints } = location.state || {}

  return (
    <div>
      <div style={{textAlign:'center',padding:100,maxWidth:600,margin:'0 auto'}}>
        <div style={{fontSize:'4rem',marginBottom:20}}>🎉</div>
        <h1 style={{fontFamily:'Cormorant Garamond, serif',fontSize:'2.8rem',fontWeight:400,marginBottom:12}}>
          Order Confirmed!
        </h1>
        <p style={{color:'var(--text2)',fontSize:'1rem',marginBottom:8}}>
          Thank you for shopping with UrbanThreads. Your order is on its way.
        </p>
        {orderId && (
          <p style={{color:'var(--text2)',fontSize:'.82rem',marginBottom:32,fontFamily:'DM Mono, monospace'}}>
            Order ID: {orderId}
          </p>
        )}

        <div className="points-earn-preview" style={{maxWidth:300,margin:'0 auto 32px'}}>
          <div className="pep-label">🏆 Points Earned This Order</div>
          <div className="pep-value">
            {rewardedPoints !== undefined ? `${rewardedPoints.toLocaleString()} pts` : '— pts'}
          </div>
          {redeemedPoints > 0 && (
            <div className="pep-sub">{redeemedPoints} pts redeemed for discount</div>
          )}
          <div className="pep-sub">Added to your account</div>
        </div>

        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={() => navigate('/shop')}>Continue Shopping</button>
          <button className="btn btn-outline" onClick={() => navigate('/profile')}>View My Rewards</button>
        </div>
      </div>
    </div>
  )
}
