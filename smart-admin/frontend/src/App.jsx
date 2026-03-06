import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { useGlobalWS } from './hooks/useWebSocket'
import toast from 'react-hot-toast'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Teachers from './pages/Teachers'
import Subjects from './pages/Subjects'
import Classes from './pages/Classes'
import Timetable from './pages/Timetable'
import TeacherView from './pages/TeacherView'

import { LayoutDashboard, Users, BookOpen, School, CalendarDays, UserCheck, LogOut } from 'lucide-react'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      {label}
    </NavLink>
  )
}

function GlobalWSListener() {
  useGlobalWS((msg) => {
    if (msg.event === 'draft_generated') toast.success(`${msg.drafts?.length || 0} new draft(s) generated`, { icon: '⚡' })
    else if (msg.event === 'draft_activated') toast.success(`"${msg.name}" is now active`, { icon: '✅' })
    else if (msg.event === 'draft_deleted') toast(`Draft deleted`, { icon: '🗑️' })
  })
  return null
}

function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'AD'
  return (
    <motion.aside className="sidebar" initial={{ x: -240 }} animate={{ x: 0 }} transition={{ duration: 0.35, ease: [0.4,0,0.2,1] }}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-inner">
          <div className="sidebar-logo">📅</div>
          <div><div className="sidebar-title">SSTG</div><div className="sidebar-subtitle">Timetable Generator</div></div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Overview</div>
        <NavItem to="/dashboard"    icon={<LayoutDashboard size={16} />} label="Dashboard" />
        <div className="nav-section-label">Setup</div>
        <NavItem to="/teachers"     icon={<Users size={16} />}     label="Teachers" />
        <NavItem to="/subjects"     icon={<BookOpen size={16} />}  label="Subjects" />
        <NavItem to="/classes"      icon={<School size={16} />}    label="Classes" />
        <div className="nav-section-label">Scheduling</div>
        <NavItem to="/timetable"    icon={<CalendarDays size={16} />} label="Timetable" />
        <NavItem to="/teacher-view" icon={<UserCheck size={16} />}   label="Teacher View" />
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div><div className="sidebar-username">{user?.username}</div><div className="sidebar-role">Administrator</div></div>
        </div>
        <button className="sidebar-logout" onClick={() => { logout(); navigate('/login') }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </motion.aside>
  )
}

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)' }}><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <GlobalWSListener />
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--navy-950)' }}><div className="spinner" style={{ borderTopColor:'var(--amber)' }} /></div>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/*" element={
        <ProtectedLayout>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/dashboard"    element={<motion.div key="dash"  {...pageVariants}><Dashboard /></motion.div>} />
              <Route path="/teachers"     element={<motion.div key="teach" {...pageVariants}><Teachers /></motion.div>} />
              <Route path="/subjects"     element={<motion.div key="subj"  {...pageVariants}><Subjects /></motion.div>} />
              <Route path="/classes"      element={<motion.div key="class" {...pageVariants}><Classes /></motion.div>} />
              <Route path="/timetable"    element={<motion.div key="tt"    {...pageVariants}><Timetable /></motion.div>} />
              <Route path="/teacher-view" element={<motion.div key="tv"    {...pageVariants}><TeacherView /></motion.div>} />
              <Route path="*"             element={<Navigate to="/dashboard" />} />
            </Routes>
          </AnimatePresence>
        </ProtectedLayout>
      } />
    </Routes>
  )
}
