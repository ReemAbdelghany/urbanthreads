import { useEffect, useState } from 'react'
import { getBalance, getTierProgress, getCampaignsProgress, sendEvent } from '../api/gameball'

export default function ProfilePage(props) {
  const { customerId, setPoints } = props
  const [campaigns, setCampaigns] = useState([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [balance, setBalance] = useState(null)
  const [tier, setTier] = useState(null)

  useEffect(() => {
    async function load() {
      if (!customerId) return
      const [bal, t, camps] = await Promise.all([
        getBalance(customerId),
        getTierProgress(customerId),
        getCampaignsProgress(customerId)
      ])
      if (bal) setBalance(bal)
      if (t) setTier(t)
      if (camps && Array.isArray(camps)) setCampaigns(camps)
      setCampaignsLoading(false)
    }
    load()
  }, [customerId])

  useEffect(() => {
    if (balance) {
      setPoints(balance.avaliablePointsBalance || 0)
    }
  }, [balance, setPoints])

  const completeProfile = async () => {
    if (!props.user) { props.openAuth?.('login'); return }

    try {
      await sendEvent({
        customerId,
        events: {
          profile_completed: {
            display_name: `${props.user.firstName} ${props.user.lastName}`,
            email: props.user.email,
            phone: props.user.phone || '',
            date_of_birth: '',
            address: '',
            fields_filled: 5,
            completion_percentage: 100
          }
        }
      })
      setProfileCompleted(true)
      props.toast('Profile completed! Badge unlocked 🏅', 'success')
      const updated = await getCampaignsProgress(customerId)
      if (updated) setCampaigns(updated)
    } catch (err) {
      console.error('Failed to send profile_completed event:', err)
      props.toast('Could not complete profile — please try again', 'error')
    }
  }

  return (
    <div>
      <div className="profile-wrap">
        {props.user && !profileCompleted && (
          <div id="profile-complete-banner">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <div>
              <div style={{fontWeight:600,fontSize:'.9rem',marginBottom:2}}>⚡ Complete Your Profile — Earn Bonus Points!</div>
              <div style={{fontSize:'.8rem',color:'var(--text2)'}}>Add your address and date of birth to unlock your first badge</div>
            </div>
            <button className="btn btn-terra btn-sm" onClick={completeProfile}>Complete Now</button>
            </div>
          </div>
        )}

        <div className="profile-hero">
          <div className="profile-avatar-lg">{props.user ? props.user.firstName?.[0] : 'U'}</div>
          <div className="profile-info-hero">
            <h2 id="pf-name">{props.user ? `${props.user.firstName} ${props.user.lastName}` : 'Guest User'}</h2>
            <div className="email">{props.user ? props.user.email : ''}</div>
            <div className={`tier-chip ${
              tier?.current?.name?.toLowerCase() === 'silver' ? 'tier-silver' :
              tier?.current?.name?.toLowerCase() === 'gold' ? 'tier-gold' :
              tier?.current?.name?.toLowerCase() === 'platinum' ? 'tier-platinum' :
              'tier-basic'
            }`}>
              {tier?.current?.name === 'Silver' ? '🥈' :
               tier?.current?.name === 'Gold' ? '🥇' :
               tier?.current?.name === 'Platinum' ? '💎' : '🏅'} {tier?.current?.name || 'Basic'} Member
            </div>
          </div>
        </div>

        <div className="points-strip">
          <div className="pts-card highlight">
            <div className="lbl">Available Points</div>
            <div className="val">{(balance?.avaliablePointsBalance||0).toLocaleString()}</div>
            <div className="sub">≈ ${(balance?.avaliablePointsValue||0).toFixed(2)}</div>
          </div>
          <div className="pts-card">
            <div className="lbl">Pending</div>
            <div className="val">{(balance?.pendingPoints||0).toLocaleString()}</div>
            <div className="sub">≈ ${(balance?.pendingPointsValue||0).toFixed(2)}</div>
          </div>
          <div className="pts-card">
            <div className="lbl">Lifetime Earned</div>
            <div className="val">{(balance?.totalEarnedPoints||0).toLocaleString()}</div>
            <div className="sub">all time</div>
          </div>
        </div>

        <div className="tier-progress-card">
          <h3>🏅 VIP Tier Progress</h3>
          <div className="tier-bar-wrap">
            <span>{tier?.current?.name || 'Basic'}</span>
            <span style={{color:'var(--text2)',fontSize:'.78rem'}}>
              {tier?.progress||0} / {tier?.next?.minPorgress||0} USD
            </span>
            <span>{tier?.next?.name || '—'}</span>
          </div>
          <div className="tier-bar"><div className="tier-fill" style={{width: `${Math.min(100, Math.round((tier?.progress||0) / (tier?.next?.minPorgress||1) * 100))}%`}}></div></div>
          <div className="tier-labels">
            <span>Current: {tier?.current?.name || 'Basic'}</span>
            <span><span>{Math.max(0,(tier?.next?.minPorgress||0) - (tier?.progress||0))}</span> USD to next</span>
          </div>
        </div>

        <div className="badges-card">
          <h3>🎖️ Badges & Achievements</h3>
          {campaignsLoading ? (
            <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>Loading badges...</p>
          ) : campaigns.length === 0 ? (
            <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>No badges configured yet.</p>
          ) : (
            <div className="badges-grid">
              {campaigns.map((c) => {
                const earned = c.achievedCount > 0
                const progress = c.completionPercentage || 0
                const icon = c.rewardCampaignConfiguration?.icon
                const name = c.rewardsCampaignName || c.rewardCampaignConfiguration?.name || 'Badge'
                const description = c.rewardCampaignConfiguration?.description || ''

                return (
                  <div key={c.rewardsCampaignId} className={`badge-cell ${earned ? 'earned' : ''}`}>
                    {icon
                      ? <img src={icon} alt={name} className="b-icon" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                      : <span className="b-icon">🏅</span>
                    }
                    <div className="b-name">{name}</div>
                    {description && (
                      <div className="b-status" style={{ fontSize: '.68rem', marginBottom: 2 }}>{description}</div>
                    )}
                    <div className="b-status">
                      {earned ? `Achieved${c.achievedCount > 1 ? ` ×${c.achievedCount}` : ''}` : progress > 0 ? `${progress}% complete` : 'Not started'}
                    </div>
                    {!earned && (
                      <div className="b-prog-bar">
                        <div className="b-prog-fill" style={{ width: `${progress}%` }}></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

