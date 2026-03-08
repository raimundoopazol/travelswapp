'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setMessage('Error: ' + error.message)
    setLoading(false)
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('✅ Revisa tu email — te enviamos un link para entrar')
    }
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0D1B2A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0D1B2A' }}>Travel<span style={{ color: '#FFD000' }}>Swapp</span></div>
          <div style={{ color: '#7A8599', marginTop: 6 }}>Intercambia divisas con viajeros</div>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading}
          style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <img src="https://www.google.com/favicon.ico" width={18} height={18} />
          Continuar con Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ color: '#7A8599', fontSize: 13 }}>o con email</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>

        <form onSubmit={handleEmailLogin}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com" required
            style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' }} />
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: '#FFD000', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 900, fontSize: 15, cursor: 'pointer', color: '#0D1B2A' }}>
            {loading ? 'Enviando...' : 'Enviar link de acceso'}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#F0FDF4', borderRadius: 10, color: '#15803D', fontSize: 14, textAlign: 'center' }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 12, color: '#7A8599', textAlign: 'center' }}>
          Al continuar aceptas nuestros términos de uso.<br/>TravelSwapp no procesa ni almacena dinero.
        </div>
      </div>
    </main>
  )
}