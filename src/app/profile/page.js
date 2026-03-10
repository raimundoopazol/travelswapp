'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getFlag, formatAmount } from '@/lib/currencies'
import { useRouter } from 'next/navigation'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [swaps, setSwaps] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', nationality: '' })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      const { data: profileData } = await supabase
        .from('users').select('*').eq('id', session.user.id).single()
      if (profileData) {
        setProfile(profileData)
        setForm({ name: profileData.name || '', nationality: profileData.nationality || '' })
      }

      const { data: listingsData } = await supabase
        .from('listings').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      if (listingsData) setListings(listingsData)

      const { data: swapsData } = await supabase
        .from('swaps').select('*')
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order('completed_at', { ascending: false })
      if (swapsData) setSwaps(swapsData)
    }
    init()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('users').update({
      name: form.name,
      nationality: form.nationality,
    }).eq('id', user.id)
    setProfile(p => ({ ...p, ...form }))
    setEditing(false)
    setSaving(false)
  }

  const toggleListing = async (id, active) => {
    await supabase.from('listings').update({ active: !active }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, active: !active } : l))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#F4F6F9', fontFamily: 'system-ui, sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #0D1B2A 0%, #1A3A5C 100%)', padding: '40px 20px 28px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 26, margin: '0 auto 12px' }}>
          {profile?.name?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{profile?.name || 'Tu perfil'}</div>
        <div style={{ color: '#9BB0C9', fontSize: 14, marginTop: 4 }}>{profile?.nationality || ''}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 16 }}>
          {[
            { label: 'Rating', val: profile?.rating ? `${profile.rating} ★` : '—' },
            { label: 'Swaps', val: profile?.swaps_completed || 0 },
            { label: 'Listings', val: listings.length },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#FFD000', fontWeight: 900, fontSize: 20 }}>{s.val}</div>
              <div style={{ color: '#9BB0C9', fontSize: 11 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Edit profile */}
        {editing ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 12 }}>Editar perfil</div>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Tu nombre"
              style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 15, marginBottom: 10, boxSizing: 'border-box' }} />
            <input value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))}
              placeholder="Tu nacionalidad (ej: 🇨🇱 Chileno)"
              style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, background: '#FFD000', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 800, cursor: 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(false)}
                style={{ flex: 1, background: '#F4F6F9', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, color: '#7A8599', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            style={{ width: '100%', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#0D1B2A', marginBottom: 12 }}>
            ✏️ Editar perfil
          </button>
        )}

        {/* My listings */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: '#0D1B2A' }}>Mis listings</div>
            <button onClick={() => router.push('/listing/new')}
              style={{ background: '#FFD000', border: 'none', borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + Nuevo
            </button>
          </div>
          {listings.length === 0 ? (
            <div style={{ color: '#7A8599', fontSize: 14, textAlign: 'center', padding: '12px 0' }}>No tienes listings aún</div>
          ) : (
            listings.map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F4F6F9' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {getFlag(l.currency_have)}{l.currency_have} → {getFlag(l.currency_want)}{l.currency_want}
                  </div>
                  <div style={{ color: '#7A8599', fontSize: 12 }}>
                    {formatAmount(l.amount, l.currency_have)} {l.currency_have} · {l.location}
                  </div>
                </div>
                <button onClick={() => toggleListing(l.id, l.active)}
                  style={{ background: l.active ? '#DCFCE7' : '#F4F6F9', border: 'none', borderRadius: 20, padding: '4px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer', color: l.active ? '#15803D' : '#7A8599' }}>
                  {l.active ? '✅ Activo' : '⏸ Pausado'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Swap history */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 12 }}>Historial de swaps</div>
          {swaps.length === 0 ? (
            <div style={{ color: '#7A8599', fontSize: 14, textAlign: 'center', padding: '12px 0' }}>No tienes swaps aún</div>
          ) : (
            swaps.map(s => (
              <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid #F4F6F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {getFlag(s.currency_have)}{formatAmount(s.amount, s.currency_have)} {s.currency_have} ↔ {getFlag(s.currency_want)}{s.currency_want}
                  </div>
                  <div style={{ color: '#FFD000', fontSize: 13 }}>
                    {'★'.repeat(s.user1_id === user?.id ? (s.rating_user2 || 0) : (s.rating_user1 || 0))}
                  </div>
                </div>
                <div style={{ color: '#7A8599', fontSize: 12, marginTop: 2 }}>
                  {new Date(s.completed_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={handleLogout}
          style={{ width: '100%', background: '#FEE2E2', border: 'none', borderRadius: 14, padding: '12px 0', fontWeight: 700, color: '#EF4444', fontSize: 15, cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', borderTop: '1px solid #E5E7EB', display: 'flex', padding: '8px 0 12px' }}>
        {[
          { label: 'Discover', icon: '🔍', path: '/discover' },
          { label: 'Publicar', icon: '➕', path: '/listing/new' },
          { label: 'Perfil', icon: '👤', path: '/profile' },
        ].map(n => (
          <button key={n.path} onClick={() => router.push(n.path)}
            style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: n.path === '/profile' ? '#0D1B2A' : '#7A8599' }}>{n.label}</span>
            {n.path === '/profile' && <div style={{ width: 20, height: 3, background: '#FFD000', borderRadius: 2 }} />}
          </button>
        ))}
      </div>
    </main>
  )
}