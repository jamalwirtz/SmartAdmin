import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { LogIn, Eye, EyeOff, Shield } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState(null)

  const handle = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { toast.error('Enter username and password'); return }
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch {
      toast.error('Invalid username or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg" />
      <div className="login-grid" />

      {/* Floating ambient orbs */}
      {[
        { w:350,h:350,top:'5%',left:'5%',c:'rgba(41,82,163,0.18)',dur:9,dx:25,dy:-20 },
        { w:250,h:250,bottom:'10%',right:'8%',c:'rgba(245,158,11,0.12)',dur:7,dx:-18,dy:22,delay:1.5 },
        { w:180,h:180,top:'40%',right:'20%',c:'rgba(13,148,136,0.14)',dur:11,dx:15,dy:-30,delay:3 },
      ].map((o,i) => (
        <motion.div key={i}
          style={{ position:'absolute',width:o.w,height:o.h,borderRadius:'50%',
            background:`radial-gradient(circle,${o.c},transparent)`,
            top:o.top,bottom:o.bottom,left:o.left,right:o.right,pointerEvents:'none' }}
          animate={{ y:[0,o.dy,0], x:[0,o.dx,0] }}
          transition={{ duration:o.dur,repeat:Infinity,ease:'easeInOut',delay:o.delay||0 }}
        />
      ))}

      <div className="login-layout">
        {/* ── Left: hero image panel ── */}
        <motion.div
          className="login-hero-panel"
          initial={{ opacity:0, x:-60 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.7, ease:[0.4,0,0.2,1] }}
        >
          {/* Logo image fills the left panel */}
          <motion.img
            src="/logo.png"
            alt="Smart Admin — SSTG"
            className="login-hero-img"
            initial={{ scale:0.92, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            transition={{ duration:0.8, delay:0.15, ease:[0.34,1.56,0.64,1] }}
          />

          {/* Overlay badge */}
          <motion.div
            className="login-hero-badge"
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.5 }}
          >
            <div className="login-hero-badge-inner">
              <Shield size={14} color="var(--amber)" />
              <span>Enterprise School Management</span>
            </div>
          </motion.div>

          {/* Feature pills */}
          <div className="login-hero-pills">
            {['Drag & Drop','Real-Time','PDF Export','Zero Conflicts'].map((f,i) => (
              <motion.div
                key={f}
                className="login-pill"
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay: 0.6 + i*0.1, ease:[0.34,1.56,0.64,1] }}
              >
                {f}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Right: auth card ── */}
        <motion.div
          className="login-card"
          initial={{ opacity:0, x:60, scale:0.96 }}
          animate={{ opacity:1, x:0, scale:1 }}
          transition={{ duration:0.6, delay:0.1, ease:[0.4,0,0.2,1] }}
        >
          {/* Card logo mark */}
          <motion.div
            className="login-card-logo"
            initial={{ opacity:0, y:-12 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.3 }}
          >
            <img src="/logo.png" alt="SSTG" className="login-card-logo-img" />
            <div>
              <div className="login-card-title">Smart Admin</div>
              <div className="login-card-sub">Timetable Generator</div>
            </div>
          </motion.div>

          <div className="login-divider" />

          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.4 }}
          >
            <h2 className="login-heading">Welcome back</h2>
            <p className="login-subheading">Sign in to manage your school schedule</p>
          </motion.div>

          <form onSubmit={handle} style={{ marginTop:28 }}>
            {/* Username */}
            <motion.div
              className="form-group"
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay:0.45 }}
            >
              <label className="form-label login-label">Username</label>
              <div className={`login-input-wrap${focused==='username'?' focused':''}`}>
                <input
                  className="login-input"
                  value={form.username}
                  onChange={e => setForm(f=>({...f,username:e.target.value}))}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused(null)}
                  placeholder="admin"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              className="form-group"
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay:0.5 }}
            >
              <label className="form-label login-label">Password</label>
              <div className={`login-input-wrap${focused==='password'?' focused':''}`}>
                <input
                  className="login-input"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f=>({...f,password:e.target.value}))}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight:42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v=>!v)}
                  className="login-eye"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              className="btn btn-accent login-submit"
              disabled={loading}
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.55 }}
              whileHover={{ scale:1.02, boxShadow:'0 8px 24px rgba(245,158,11,0.4)' }}
              whileTap={{ scale:0.97 }}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    style={{display:'flex',alignItems:'center',gap:8}}>
                    <div className="login-spinner"/>Signing in…
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    style={{display:'flex',alignItems:'center',gap:8}}>
                    <LogIn size={16}/> Sign In
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <motion.div
            className="login-demo"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.7 }}
          >
            <span className="login-demo-label">Demo credentials:</span>
            <code className="login-demo-code">admin</code>
            <span style={{color:'rgba(255,255,255,0.2)'}}>/</span>
            <code className="login-demo-code">admin123</code>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
