import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/client'
import toast from 'react-hot-toast'
import { UserPlus, Eye, EyeOff, Shield, Check, X, AtSign, User, Mail, Lock } from 'lucide-react'

/* ── Password strength ───────────────────────────────────────────────────── */
const RULES = [
  { label: 'At least 8 characters',   test: p => p.length >= 8,              optional: false },
  { label: 'Contains a letter',        test: p => /[a-zA-Z]/.test(p),         optional: false },
  { label: 'Contains a number',        test: p => /\d/.test(p),               optional: false },
  { label: 'Contains a special char',  test: p => /[^a-zA-Z0-9]/.test(p),    optional: false },
  { label: 'Contains uppercase letter',test: p => /[A-Z]/.test(p),           optional: true  },
]

const STRENGTH_LABELS = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Excellent']
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#0d9488']

function strengthScore(p) {
  if (!p) return 0
  let s = 0
  if (p.length >= 8)          s++
  if (/[a-z]/.test(p))        s++
  if (/[A-Z]/.test(p))        s++
  if (/\d/.test(p))            s++
  if (/[^a-zA-Z0-9]/.test(p)) s++
  return s
}

const SOCIAL = [
  {
    id: 'google', label: 'Sign up with Google',
    color: '#fff', textColor: '#1a1a1a', border: '1.5px solid rgba(0,0,0,0.12)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: 'facebook', label: 'Sign up with Facebook',
    color: '#1877F2', textColor: '#fff', border: 'none',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'apple', label: 'Sign up with Apple',
    color: '#000', textColor: '#fff', border: 'none',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
      </svg>
    ),
  },
]

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState(null)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)
  const [showRules, setShowRules] = useState(false)

  const score = strengthScore(form.password)
  const requiredPassed = RULES.filter(r => !r.optional).every(r => r.test(form.password))
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())     { toast.error('Please enter your full name'); return }
    if (!emailValid)           { toast.error('Please enter a valid email address'); return }
    if (!form.username.trim()) { toast.error('Please choose a username'); return }
    if (!requiredPassed)       { toast.error('Password does not meet all requirements'); return }

    setLoading(true)
    try {
      // Register — backend returns access_token immediately
      const res = await authAPI.register({
        name: form.name,
        email: form.email,
        username: form.username.toLowerCase(),
        password: form.password,
      })

      // Store the token and fetch the user object
      localStorage.setItem('sstg_token', res.data.access_token)
      // Trigger AuthContext to load the user from the token
      const meRes = await authAPI.me()
      // Use login to set context state properly
      await login(form.username.toLowerCase(), form.password)

      toast.success('Account created! Welcome to Smart Admin 🎉', { duration: 3500 })
      navigate('/dashboard')
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (typeof detail === 'string') toast.error(detail)
      else if (Array.isArray(detail)) toast.error(detail[0]?.msg || 'Signup failed')
      else toast.error('Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleSocial = (p) => {
    setSocialLoading(p.id)
    setTimeout(() => {
      setSocialLoading(null)
      toast(`${p.label} requires OAuth setup in your environment variables.`, { icon: 'ℹ️', duration: 4000 })
    }, 800)
  }

  return (
    <div className="login-page">
      <div className="login-bg" /><div className="login-grid" />
      {[
        { w:350,h:350,top:'5%',  left:'5%',   c:'rgba(41,82,163,0.18)',  dur:9,  dx:25, dy:-20 },
        { w:250,h:250,bottom:'10%',right:'8%',c:'rgba(245,158,11,0.12)', dur:7,  dx:-18,dy:22,  delay:1.5 },
        { w:180,h:180,top:'40%',right:'20%',  c:'rgba(13,148,136,0.14)', dur:11, dx:15, dy:-30, delay:3 },
      ].map((o,i) => (
        <motion.div key={i} style={{
          position:'absolute',width:o.w,height:o.h,borderRadius:'50%',
          background:`radial-gradient(circle,${o.c},transparent)`,
          top:o.top,bottom:o.bottom,left:o.left,right:o.right,pointerEvents:'none'
        }}
          animate={{y:[0,o.dy,0],x:[0,o.dx,0]}}
          transition={{duration:o.dur,repeat:Infinity,ease:'easeInOut',delay:o.delay||0}}/>
      ))}

      <div className="login-layout">
        {/* ── Hero ── */}
        <motion.div className="login-hero-panel"
          initial={{opacity:0,x:-60}} animate={{opacity:1,x:0}}
          transition={{duration:0.7,ease:[0.4,0,0.2,1]}}>
          <motion.img src="/logo.png" alt="Smart Admin" className="login-hero-img"
            initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}}
            transition={{duration:0.8,delay:0.15,ease:[0.34,1.56,0.64,1]}}/>
          <motion.div className="login-hero-badge"
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}>
            <div className="login-hero-badge-inner"><Shield size={14} color="var(--amber)"/><span>Join Smart Admin Today</span></div>
          </motion.div>
          <div className="login-hero-pills">
            {['Free to start','No credit card','Instant setup','Cancel anytime'].map((f,i) => (
              <motion.div key={f} className="login-pill"
                initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
                transition={{delay:0.5+i*0.1,ease:[0.34,1.56,0.64,1]}}>{f}</motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Card ── */}
        <motion.div className="login-card"
          initial={{opacity:0,x:60,scale:0.96}} animate={{opacity:1,x:0,scale:1}}
          transition={{duration:0.6,delay:0.1,ease:[0.4,0,0.2,1]}}>

          <motion.div className="login-card-logo"
            initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{delay:0.25}}>
            <img src="/logo.png" alt="SSTG" className="login-card-logo-img"/>
            <div><div className="login-card-title">Smart Admin</div><div className="login-card-sub">Timetable Generator</div></div>
          </motion.div>
          <div className="login-divider"/>

          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}>
            <h2 className="login-heading">Create your account</h2>
            <p className="login-subheading">Set up Smart Admin for your school in minutes</p>
          </motion.div>

          {/* Social */}
          <motion.div className="social-buttons"
            initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.35}}>
            {SOCIAL.map(p => (
              <motion.button key={p.id} type="button" className="social-btn"
                style={{background:p.color,color:p.textColor,border:p.border}}
                onClick={() => handleSocial(p)} disabled={!!socialLoading || loading}
                whileHover={{scale:1.02,y:-1}} whileTap={{scale:0.97}}>
                <AnimatePresence mode="wait">
                  {socialLoading===p.id
                    ? <motion.span key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="social-spinner" style={{borderTopColor:p.textColor}}/>Connecting…
                      </motion.span>
                    : <motion.span key="l" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:10}}>
                        {p.icon}{p.label}
                      </motion.span>
                  }
                </AnimatePresence>
              </motion.button>
            ))}
          </motion.div>

          <motion.div className="auth-or-divider" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.42}}>
            <span className="auth-or-line"/><span className="auth-or-text">or sign up with email</span><span className="auth-or-line"/>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Full name */}
            <motion.div className="form-group" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.44}}>
              <label className="form-label login-label">Full Name</label>
              <div className={`login-input-wrap${focused==='name'?' focused':''}`}>
                <User size={14} className="input-prefix-icon"/>
                <input className="login-input has-icon" value={form.name}
                  onChange={e => setForm(f=>({...f,name:e.target.value}))}
                  onFocus={()=>setFocused('name')} onBlur={()=>setFocused(null)}
                  placeholder="Your full name" autoComplete="name"/>
              </div>
            </motion.div>

            {/* Email */}
            <motion.div className="form-group" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.47}}>
              <label className="form-label login-label">
                Email <span className="field-required">*</span>
                {form.email && (
                  <span className={`input-validate-icon${emailValid?' valid':' invalid'}`}>
                    {emailValid ? <Check size={11}/> : <X size={11}/>}
                  </span>
                )}
              </label>
              <div className={`login-input-wrap${focused==='email'?' focused':''}`}>
                <Mail size={14} className="input-prefix-icon"/>
                <input className="login-input has-icon" type="email" value={form.email}
                  onChange={e => setForm(f=>({...f,email:e.target.value}))}
                  onFocus={()=>setFocused('email')} onBlur={()=>setFocused(null)}
                  placeholder="you@school.edu" autoComplete="email"/>
              </div>
            </motion.div>

            {/* Username */}
            <motion.div className="form-group" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.5}}>
              <label className="form-label login-label">Username <span className="field-required">*</span></label>
              <div className={`login-input-wrap${focused==='username'?' focused':''}`}>
                <AtSign size={14} className="input-prefix-icon"/>
                <input className="login-input has-icon" value={form.username}
                  onChange={e => setForm(f=>({...f,username:e.target.value.toLowerCase().replace(/\s/g,'')}))}
                  onFocus={()=>setFocused('username')} onBlur={()=>setFocused(null)}
                  placeholder="yourschool" autoComplete="username" spellCheck={false}/>
              </div>
            </motion.div>

            {/* Password */}
            <motion.div className="form-group" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.53}}>
              <label className="form-label login-label">Password <span className="field-required">*</span></label>
              <div className={`login-input-wrap${focused==='password'?' focused':''}`}>
                <Lock size={14} className="input-prefix-icon"/>
                <input className="login-input has-icon" type={showPass?'text':'password'} value={form.password}
                  onChange={e => setForm(f=>({...f,password:e.target.value}))}
                  onFocus={()=>{ setFocused('password'); setShowRules(true) }}
                  onBlur={()=>setFocused(null)}
                  placeholder="Create a strong password" autoComplete="new-password"
                  style={{paddingRight:42}}/>
                <button type="button" className="login-eye" onClick={()=>setShowPass(v=>!v)} tabIndex={-1}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && (
                <div className="strength-wrap">
                  <div className="strength-bar">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`strength-segment${score>=n?' filled':''}`}
                        style={{background: score>=n ? STRENGTH_COLORS[score] : undefined}}/>
                    ))}
                  </div>
                  <span className="strength-label" style={{color:STRENGTH_COLORS[score]}}>
                    {STRENGTH_LABELS[score]}
                  </span>
                </div>
              )}

              {/* Rules */}
              <AnimatePresence>
                {showRules && (
                  <motion.div className="password-rules"
                    initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
                    exit={{opacity:0,height:0}} transition={{duration:0.2}}>
                    {RULES.map(rule => (
                      <div key={rule.label} className={`pw-rule${rule.test(form.password)?' passed':''}${rule.optional?' optional':''}`}>
                        {rule.test(form.password) ? <Check size={10}/> : <X size={10}/>}
                        {rule.label}{rule.optional?' (suggested)':''}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.button type="submit" className="btn btn-accent login-submit"
              disabled={loading}
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.57}}
              whileHover={{scale:1.02,boxShadow:'0 8px 24px rgba(245,158,11,0.4)'}}
              whileTap={{scale:0.97}}>
              <AnimatePresence mode="wait">
                {loading
                  ? <motion.span key="l" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="login-spinner"/>Creating account…
                    </motion.span>
                  : <motion.span key="i" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:8}}>
                      <UserPlus size={16}/>Create Account
                    </motion.span>
                }
              </AnimatePresence>
            </motion.button>
          </form>

          <motion.p className="auth-switch"
            initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.62}}>
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
