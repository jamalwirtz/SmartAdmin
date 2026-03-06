import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { toast.error('Enter username and password'); return }
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch {
      toast.error('Invalid credentials')
    } finally { setLoading(false) }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0 }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-grid" />

      {/* Floating orbs */}
      <motion.div
        style={{ position:'absolute', width:300, height:300, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(41,82,163,0.15), transparent)',
          top:'15%', left:'10%', pointerEvents:'none' }}
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ position:'absolute', width:200, height:200, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(245,158,11,0.1), transparent)',
          bottom:'20%', right:'15%', pointerEvents:'none' }}
        animate={{ y: [0, 25, 0], x: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div className="login-logo" variants={itemVariants} initial="hidden" animate="show">
          <motion.div
            className="login-logo-icon"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
          >
            📅
          </motion.div>
          <div className="login-logo-title">SSTG</div>
          <div className="login-logo-sub">Smart School Timetable Generator</div>
        </motion.div>

        <motion.form onSubmit={handle} variants={containerVariants} initial="hidden" animate="show">
          <motion.div className="form-group" variants={itemVariants}>
            <label className="form-label">Username</label>
            <input
              className="form-input"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="admin"
              autoFocus
              autoComplete="username"
            />
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.4)', padding:0 }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </motion.div>

          <motion.button
            variants={itemVariants}
            className="btn btn-accent"
            style={{ width:'100%', justifyContent:'center', marginTop: 8, padding:'11px 16px', fontSize:14 }}
            disabled={loading}
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn size={16} />
            {loading ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </motion.form>

        <motion.p
          className="login-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Demo: <strong>admin</strong> / <strong>admin123</strong>
        </motion.p>
      </motion.div>
    </div>
  )
}
