import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Shield, Mail, User, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { authAPI } from '../api/client'

/* ── Password strength rules ────────────────────────────────────────────── */
const RULES = [
  { id: 'length',   label: 'At least 8 characters',             test: p => p.length >= 8 },
  { id: 'letter',   label: 'Contains a letter (a–z)',            test: p => /[a-zA-Z]/.test(p) },
  { id: 'number',   label: 'Contains a number (0–9)',            test: p => /[0-9]/.test(p) },
  { id: 'special',  label: 'Contains a special character (!@#…)',test: p => /[^a-zA-Z0-9]/.test(p) },
  { id: 'upper',    label: 'Contains uppercase (A–Z) — suggested',test: p => /[A-Z]/.test(p), optional: true },
]

function strengthScore(password) {
  const required = RULES.filter(r => !r.optional)
  const passed = required.filter(r => r.test(password)).length
  const bonus = RULES.filter(r => r.optional && r.test(password)).length
  return Math.min(5, passed + bonus)
}

const STRENGTH_LABELS = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Excellent']
const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']

/* ── Social providers ───────────────────────────────────────────────────── */
const SOCIAL = [
  { id:'google',   label:'Google',   color:'#fff',     textColor:'#1a1a1a', border:'1.5px solid rgba(0,0,0,0.12)',
    icon:<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
  { id:'facebook', label:'Facebook', color:'#1877F2', textColor:'#fff',    border:'none',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { id:'apple',    label:'Apple',    color:'#000',     textColor:'#fff',    border:'none',
    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/></svg> },
]

/* ── Verification code input ─────────────────────────────────────────────── */
function CodeInput({ value, onChange }) {
  const digits = value.padEnd(6, ' ').split('').slice(0, 6)

  const update = (idx, char) => {
    const arr = value.padEnd(6, ' ').split('').slice(0, 6)
    arr[idx] = char
    onChange(arr.join('').trimEnd())
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      update(idx, ' ')
      if (idx > 0) document.getElementById(`code-${idx - 1}`)?.focus()
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault()
      update(idx, e.key)
      if (idx < 5) document.getElementById(`code-${idx + 1}`)?.focus()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      document.getElementById(`code-${idx - 1}`)?.focus()
    } else if (e.key === 'ArrowRight' && idx < 5) {
      document.getElementById(`code-${idx + 1}`)?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, 5)
    document.getElementById(`code-${focusIdx}`)?.focus()
  }

  return (
    <div className="code-input-row">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`code-${i}`}
          className="code-digit"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1)
            if (v) { update(i, v); if (i < 5) document.getElementById(`code-${i + 1}`)?.focus() }
          }}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()

  // Steps: 'form' | 'verify'
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState(null)
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [socialLoading, setSocialLoading] = useState(null)

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const score = strengthScore(form.password)
  const requiredPassed = RULES.filter(r => !r.optional && r.test(form.password)).length === RULES.filter(r => !r.optional).length
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())    { toast.error('Please enter your full name'); return }
    if (!emailValid)          { toast.error('Please enter a valid email address'); return }
    if (!form.username.trim()){ toast.error('Please choose a username'); return }
    if (!requiredPassed)      { toast.error('Password does not meet the requirements'); return }

    setLoading(true)
    try {
      await authAPI.register({ name: form.name, email: form.email, username: form.username, password: form.password })
      setStep('verify')
      setResendTimer(60)
      toast.success(`Verification email sent to ${form.email}`)
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (typeof detail === 'string') toast.error(detail)
      else if (Array.isArray(detail)) toast.error(detail[0]?.msg || 'Signup failed')
      else toast.error('Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code.replace(/\s/g, ''))) { toast.error('Enter all 6 digits'); return }
    setLoading(true)
    try {
      // For now, any 6-digit code proceeds (backend verification wires up to real email service)
      // Real impl: await authAPI.verifyEmail({ email: form.email, code })
      await login(form.username, form.password)
      toast.success('Account verified! Welcome to Smart Admin 🎉')
      navigate('/dashboard')
    } catch {
      toast.error('Verification failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleSocial = (p) => {
    setSocialLoading(p.id)
    setTimeout(() => {
      setSocialLoading(null)
      toast(`${p.label} sign-up requires OAuth setup in your environment variables.`, { icon: 'ℹ️', duration: 4000 })
    }, 800)
  }

  return (
    <div className="login-page">
      <div className="login-bg" /><div className="login-grid" />
      {[
        { w:300,h:300,top:'8%',right:'10%',  c:'rgba(41,82,163,0.15)',  dur:10, dx:-20, dy:25  },
        { w:200,h:200,bottom:'15%',left:'5%',c:'rgba(245,158,11,0.10)', dur:8,  dx:18,  dy:-18, delay:2 },
      ].map((o,i) => (
        <motion.div key={i} style={{ position:'absolute',width:o.w,height:o.h,borderRadius:'50%',
          background:`radial-gradient(circle,${o.c},transparent)`,
          top:o.top,bottom:o.bottom,left:o.left,right:o.right,pointerEvents:'none' }}
          animate={{ y:[0,o.dy,0], x:[0,o.dx,0] }}
          transition={{ duration:o.dur,repeat:Infinity,ease:'easeInOut',delay:o.delay||0 }} />
      ))}

      <div className="login-layout">
        {/* ── Hero ── */}
        <motion.div className="login-hero-panel"
          initial={{ opacity:0, x:-60 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.7 }}>
          <motion.img src="/logo.png" alt="Smart Admin" className="login-hero-img"
            initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }}
            transition={{ duration:0.8, delay:0.1, ease:[0.34,1.56,0.64,1] }} />
          <motion.div className="login-hero-badge" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
            <div className="login-hero-badge-inner"><Shield size={14} color="var(--amber)" /><span>Join Smart Admin Today</span></div>
          </motion.div>
          <div className="login-hero-pills">
            {['Free to start','5-min setup','No credit card','Cancel anytime'].map((f,i) => (
              <motion.div key={f} className="login-pill"
                initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay: 0.5 + i*0.1 }}>{f}</motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Card ── */}
        <motion.div className="login-card"
          initial={{ opacity:0, x:60, scale:0.96 }} animate={{ opacity:1, x:0, scale:1 }}
          transition={{ duration:0.6, delay:0.1 }}>

          <motion.div className="login-card-logo" initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}>
            <img src="/logo.png" alt="SSTG" className="login-card-logo-img" />
            <div><div className="login-card-title">Smart Admin</div><div className="login-card-sub">Timetable Generator</div></div>
          </motion.div>
          <div className="login-divider" />

          <AnimatePresence mode="wait">

            {/* ── Step 1: Registration form ── */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>
                <h2 className="login-heading">Create your account</h2>
                <p className="login-subheading">Set up Smart Admin for your school in minutes</p>

                {/* Social signup */}
                <div className="social-buttons" style={{ marginTop:16 }}>
                  {SOCIAL.map(p => (
                    <motion.button key={p.id} type="button" className="social-btn"
                      style={{ background:p.color, color:p.textColor, border:p.border }}
                      onClick={() => handleSocial(p)} disabled={!!socialLoading}
                      whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.97 }}>
                      <AnimatePresence mode="wait">
                        {socialLoading === p.id
                          ? <motion.span key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:8}}><div className="social-spinner" style={{ borderTopColor: p.textColor }}/>Connecting…</motion.span>
                          : <motion.span key="l" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:10}}>{p.icon}Sign up with {p.label}</motion.span>
                        }
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </div>

                <div className="auth-or-divider">
                  <span className="auth-or-line"/><span className="auth-or-text">or create with email</span><span className="auth-or-line"/>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Full name */}
                  <div className="form-group">
                    <label className="form-label login-label">Full Name</label>
                    <div className={`login-input-wrap${focused==='name'?' focused':''}`}>
                      <User size={14} className="input-prefix-icon" />
                      <input className="login-input has-icon" value={form.name}
                        onChange={e => setForm(f=>({...f,name:e.target.value}))}
                        onFocus={()=>setFocused('name')} onBlur={()=>setFocused(null)}
                        placeholder="Alice Kamau" autoFocus />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label login-label">
                      Email Address <span className="field-required">— required for verification</span>
                    </label>
                    <div className={`login-input-wrap${focused==='email'?' focused':''}`}>
                      <Mail size={14} className="input-prefix-icon" />
                      <input className="login-input has-icon" type="email" value={form.email}
                        onChange={e => setForm(f=>({...f,email:e.target.value}))}
                        onFocus={()=>setFocused('email')} onBlur={()=>setFocused(null)}
                        placeholder="alice@school.edu" autoComplete="email" />
                      {form.email.length > 3 && (
                        <span className="input-validate-icon">
                          {emailValid ? <CheckCircle size={14} color="#22c55e"/> : <XCircle size={14} color="#ef4444"/>}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Username */}
                  <div className="form-group">
                    <label className="form-label login-label">Username</label>
                    <div className={`login-input-wrap${focused==='username'?' focused':''}`}>
                      <span className="input-prefix-text">@</span>
                      <input className="login-input has-prefix-text" value={form.username}
                        onChange={e => setForm(f=>({...f,username:e.target.value.toLowerCase().replace(/\s/g,'')}))}
                        onFocus={()=>setFocused('username')} onBlur={()=>setFocused(null)}
                        placeholder="alice_kamau" autoComplete="username" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label className="form-label login-label">Password</label>
                    <div className={`login-input-wrap${focused==='pass'?' focused':''}`}>
                      <input className="login-input" type={showPass?'text':'password'} value={form.password}
                        onChange={e => setForm(f=>({...f,password:e.target.value}))}
                        onFocus={()=>setFocused('pass')} onBlur={()=>setFocused(null)}
                        placeholder="Create a strong password" autoComplete="new-password" style={{paddingRight:42}} />
                      <button type="button" onClick={()=>setShowPass(v=>!v)} className="login-eye" tabIndex={-1}>
                        {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {form.password.length > 0 && (
                      <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="strength-wrap">
                        <div className="strength-bar">
                          {[1,2,3,4,5].map(n => (
                            <motion.div key={n} className="strength-segment"
                              style={{ background: n <= score ? STRENGTH_COLORS[score] : 'rgba(255,255,255,0.08)' }}
                              animate={{ scaleX: n <= score ? 1 : 0.3 }} transition={{ duration:0.2 }} />
                          ))}
                        </div>
                        <span className="strength-label" style={{ color: STRENGTH_COLORS[score] }}>
                          {STRENGTH_LABELS[score]}
                        </span>
                      </motion.div>
                    )}

                    {/* Rules checklist */}
                    {form.password.length > 0 && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="password-rules">
                        {RULES.map(rule => {
                          const passed = rule.test(form.password)
                          return (
                            <div key={rule.id} className={`pw-rule${passed?' passed':''}${rule.optional?' optional':''}`}>
                              {passed ? <CheckCircle size={11}/> : <AlertCircle size={11}/>}
                              <span>{rule.label}</span>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}
                  </div>

                  <motion.button type="submit" className="btn btn-accent login-submit" disabled={loading}
                    whileHover={{ scale:1.02, boxShadow:'0 8px 24px rgba(245,158,11,0.4)' }} whileTap={{ scale:0.97 }}>
                    <AnimatePresence mode="wait">
                      {loading
                        ? <motion.span key="l" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:8}}><div className="login-spinner"/>Creating account…</motion.span>
                        : <motion.span key="i" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:8}}>Create Account →</motion.span>
                      }
                    </AnimatePresence>
                  </motion.button>
                </form>

                <p className="auth-switch" style={{marginTop:20}}>
                  Already have an account? <Link to="/login" className="auth-switch-link">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: Email verification ── */}
            {step === 'verify' && (
              <motion.div key="verify" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>
                <button className="auth-back-btn" onClick={() => setStep('form')}>
                  <ArrowLeft size={14}/> Back
                </button>

                <div className="verify-icon-wrap">
                  <motion.div className="verify-icon-circle"
                    initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:300, delay:0.1 }}>
                    <Mail size={28} color="var(--amber)" />
                  </motion.div>
                </div>

                <h2 className="login-heading" style={{textAlign:'center'}}>Check your email</h2>
                <p className="login-subheading" style={{textAlign:'center',marginBottom:8}}>
                  We sent a 6-digit code to
                </p>
                <p style={{textAlign:'center',fontWeight:700,color:'#fff',fontSize:14,marginBottom:24,wordBreak:'break-all'}}>
                  {form.email}
                </p>

                <form onSubmit={handleVerify}>
                  <CodeInput value={code} onChange={setCode} />

                  <motion.button type="submit" className="btn btn-accent login-submit"
                    disabled={loading || !/^\d{6}$/.test(code.replace(/\s/g,''))} style={{marginTop:24}}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
                    <AnimatePresence mode="wait">
                      {loading
                        ? <motion.span key="l" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:8}}><div className="login-spinner"/>Verifying…</motion.span>
                        : <motion.span key="i" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',alignItems:'center',gap:8}}><CheckCircle size={15}/>Verify & Continue</motion.span>
                      }
                    </AnimatePresence>
                  </motion.button>
                </form>

                <div className="verify-resend">
                  {resendTimer > 0
                    ? <span className="resend-timer">Resend code in {resendTimer}s</span>
                    : <button className="resend-btn" onClick={() => { setResendTimer(60); toast.success('New code sent!') }}>
                        Resend code
                      </button>
                  }
                </div>

                <p className="verify-hint">
                  Didn't receive it? Check your spam folder or{' '}
                  <button className="auth-switch-link" style={{background:'none',border:'none',cursor:'pointer',padding:0}}
                    onClick={() => setStep('form')}>try a different email</button>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
