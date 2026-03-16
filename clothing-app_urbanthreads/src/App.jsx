import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Modal from './components/Modal'
import ToastContainer from './components/Toast'
import { useToast } from './components/useToast'
import { INITIAL_CART } from './data/cart'
import { registerCustomer } from './api/gameball'

import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfirmationPage from './pages/ConfirmationPage'
import ProfilePage from './pages/ProfilePage'

function AppInner() {
  const [user, setUser] = useState(null)
  const [customerId, setCustomerId] = useState(null)
  const [cart, setCart] = useState(INITIAL_CART)
  const [points, setPoints] = useState(0)
  const [redemptionApplied, setRedemptionApplied] = useState(0)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')

  const { toasts, toast } = useToast()

  const openAuth = (tab = 'login') => { setAuthTab(tab); setIsAuthModalOpen(true) }

  const afterLogin = (u) => {
    setUser(u)
    setIsAuthModalOpen(false)
    toast(`Signed in as ${u.firstName || u.email}`, 'success')
  }

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('') // not validated — demo only

  // Sign-up form state
  const [signUpFirstName, setSignUpFirstName] = useState('')
  const [signUpLastName, setSignUpLastName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPhone, setSignUpPhone] = useState('')
  const [signUpPass, setSignUpPass] = useState('') // not validated — demo only
  const [signUpReferral, setSignUpReferral] = useState('')

  const doLogin = async () => {
    if (!loginEmail) { toast('Please enter your email', 'error'); return }
    const restoredId = `ut_${loginEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    const u = { firstName: 'Returning', lastName: 'Customer', email: loginEmail, customerId: restoredId }
    setCustomerId(restoredId)
    afterLogin(u)
  }

  const doSignUp = async () => {
    if (!signUpFirstName || !signUpEmail) { toast('Please fill required fields', 'error'); return }

    // derive a stable id from email so the same user always maps to the same gameball customer
    const generatedId = `ut_${signUpEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`

    toast('Creating your account...', 'info')

    const res = await registerCustomer({
      customerId: generatedId,
      email: signUpEmail,
      mobile: signUpPhone,
      customerAttributes: {
        displayName: `${signUpFirstName} ${signUpLastName}`,
        firstName: signUpFirstName,
        lastName: signUpLastName,
        email: signUpEmail,
        mobile: signUpPhone,
        joinDate: new Date().toISOString().substring(0, 10),
        source: 'urban_threads_web'
      },
      referrerCode: signUpReferral || undefined,
      guest: false
    })

    const u = {
      firstName: signUpFirstName,
      lastName: signUpLastName,
      email: signUpEmail,
      phone: signUpPhone,
      customerId: generatedId
    }

    setCustomerId(generatedId)
    afterLogin(u)

    if (res?.gameballId) {
      toast(`Welcome ${signUpFirstName}! Your rewards account is ready 🎉`, 'success')
    } else {
      toast(`Welcome ${signUpFirstName}! Account created.`, 'success')
    }
  }

  const pagesProps = {
    user, setUser,
    customerId, setCustomerId,
    cart, setCart,
    points, setPoints,
    redemptionApplied, setRedemptionApplied,
    toast,
    openAuth
  }

  return (
    <>
      <Navbar
        user={user}
        cartCount={cart.reduce((n, i) => n + i.qty, 0)}
        onOpenAuth={() => openAuth('login')}
      />
      <Routes>
        <Route path="/" element={<HomePage {...pagesProps} />} />
        <Route path="/shop" element={<ShopPage {...pagesProps} />} />
        <Route path="/product/:id" element={<ProductPage {...pagesProps} />} />
        <Route path="/checkout" element={<CheckoutPage {...pagesProps} />} />
        <Route path="/confirmation" element={<ConfirmationPage {...pagesProps} />} />
        <Route path="/profile" element={<ProfilePage {...pagesProps} />} />
      </Routes>

      <ToastContainer toasts={toasts} />

      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)}>
        <div className="modal-header">
          <div className="modal-title">Welcome Back</div>
          <button className="modal-close" onClick={() => setIsAuthModalOpen(false)}>×</button>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${authTab==='login'?'active':''}`} onClick={() => setAuthTab('login')}>Sign In</button>
          <button className={`auth-tab ${authTab==='signup'?'active':''}`} onClick={() => setAuthTab('signup')}>Create Account</button>
        </div>
        {authTab === 'login' ? (
          <div className="auth-pane active">
            <div className="form-group"><label>Email</label><input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="your@email.com"/></div>
            <div className="form-group"><label>Password</label><input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••"/></div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={doLogin}>Sign In</button>
            <div className="divider-or">or</div>
            <button className="btn btn-outline" style={{width:'100%',justifyContent:'center'}} onClick={() => setAuthTab('signup')}>Create an Account</button>
          </div>
        ) : (
          <div className="auth-pane active">
            <div className="form-grid">
              <div className="form-group"><label>First Name</label><input type="text" value={signUpFirstName} onChange={e => setSignUpFirstName(e.target.value)} placeholder="First"/></div>
              <div className="form-group"><label>Last Name</label><input type="text" value={signUpLastName} onChange={e => setSignUpLastName(e.target.value)} placeholder="Last"/></div>
              <div className="form-group full"><label>Email</label><input type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} placeholder="you@example.com"/></div>
              <div className="form-group full"><label>Phone</label><input type="text" value={signUpPhone} onChange={e => setSignUpPhone(e.target.value)} placeholder="+1..."/></div>
              <div className="form-group full"><label>Password</label><input type="password" value={signUpPass} onChange={e => setSignUpPass(e.target.value)} placeholder="••••••"/></div>
              <div className="form-group full"><label>Referral Code (optional)</label><input type="text" value={signUpReferral} onChange={e => setSignUpReferral(e.target.value)} placeholder="e.g. FRIEND2024"/></div>
            </div>
            <button className="btn btn-terra" style={{width:'100%',justifyContent:'center'}} onClick={doSignUp}>Create Account & Start Earning</button>
            <p style={{fontSize:'.75rem',color:'var(--text2)',textAlign:'center',marginTop:12}}>By signing up you agree to our Terms. Earn points on every purchase.</p>
          </div>
        )}
      </Modal>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
