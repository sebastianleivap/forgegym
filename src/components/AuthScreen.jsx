import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function AuthScreen({ onAuth }) {
  const [tab, setTab]         = useState('login')
  const [role, setRole]       = useState('student')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [gymName, setGymName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setError(''); setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setLoading(false); setError(err.message); return }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    setLoading(false)
    onAuth(data.user, profile)
  }

  const handleRegister = async () => {
    if (!name.trim()) { setError('Por favor ingresa tu nombre completo.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setError(''); setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) { setLoading(false); setError(err.message); return }
    await supabase.from('profiles').insert({
      id: data.user.id, name, email, role,
      gym_name: role === 'admin' ? gymName : null
    })
    setLoading(false)
    setSuccess('¡Cuenta creada! Ya puedes iniciar sesión.')
    setTab('login')
  }

  const roles = [
    { id: 'admin',   icon: '🏢', label: 'Gimnasio / Admin' },
    { id: 'trainer', icon: '🏋️', label: 'Entrenador' },
    { id: 'student', icon: '🎯', label: 'Alumno' },
  ]

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">Forge<span>Gym</span></div>
        <p style={{ color: 'var(--ink2)', fontSize: 14, marginBottom: 28 }}>
          Plataforma de gestión para gimnasios en Chile
        </p>
        <div className="auth-tabs">
          {['login', 'register'].map(t => (
            <button key={t} className={`auth-tab ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setError(''); setSuccess('') }}>
              {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        {error   && <div className="alert alert-err">⚠️ {error}</div>}
        {success && <div className="alert alert-ok">✓ {success}</div>}

        {tab === 'register' && (
          <>
            <div style={{ marginBottom: 18 }}>
              <label>Tipo de cuenta</label>
              <div className="role-pill-row">
                {roles.map(r => (
                  <div key={r.id} className={`role-pill ${r.id} ${role === r.id ? 'active' : ''}`}
                    onClick={() => setRole(r.id)}>
                    <div className="role-pill-icon">{r.icon}</div>
                    <div className="role-pill-label">{r.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="fg">
              <label>Nombre completo</label>
              <input placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} />
            </div>
            {role === 'admin' && (
              <div className="fg">
                <label>Nombre del gimnasio</label>
                <input placeholder="Ej: CrossFit Concepción" value={gymName} onChange={e => setGymName(e.target.value)} />
              </div>
            )}
          </>
        )}

        <div className="fg">
          <label>Email</label>
          <input type="email" placeholder="correo@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="fg" style={{ marginBottom: 24 }}>
          <label>Contraseña</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegister())} />
        </div>

        <button className="btn btn-p btn-full" onClick={tab === 'login' ? handleLogin : handleRegister} disabled={loading}>
          {loading ? 'Cargando...' : tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--ink2)' }}>
          {tab === 'login'
            ? <>¿No tienes cuenta? <span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setTab('register')}>Regístrate gratis</span></>
            : <>¿Ya tienes cuenta? <span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }} onClick={() => setTab('login')}>Inicia sesión</span></>
          }
        </p>
      </div>
    </div>
  )
}
