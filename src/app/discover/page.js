'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CURRENCY_GROUPS, getFlag, formatAmount } from '@/lib/currencies'
import { useRouter } from 'next/navigation'

export default function Discover() {
  const [user, setUser] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterHave, setFilterHave] = useState('')
  const [filterWant, setFilterWant] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchListings()
    }
    init()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select(`*, users(name, nationality, rating, swaps_completed, verified)`)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (filterHave) query = query.eq('currency_have', filterHave)
    if (filterWant) query = query.eq('currency_want', filterWant)

    const { data, error } = await query
    if (!error) setListings(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchListings() }, [filterHave, filterWant])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#F4F6F9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0D1B2A', padding: '20px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ color: '#FFD000', fontWeight: 900, fontSize: 22 }}>TravelSwapp</div>
            <div style={{ color: '#9BB0C9', fontSize: 12 }}>Hola, {user?.email?.split('@')[0]} 👋</div>
          </div>
          <button onClick={handleLogout}
            style={{ background: '#1A3A5C', border: 'none', color: '#9BB0C9', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
            Salir
          </button>
        </div>

        {/* Safety banner */}
        <div style={{ background: '#1A3A5C', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span>🛡️</span>
          <span style={{ color: '#FFF3B0', fontSize: 12, fontWeight: 600 }}>Siempre reúnete en lugares públicos</span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filterHave} onChange={e => setFilterHave(e.target.value)}
            style={{ background: '#1A3A5C', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 12px', fontSize: 13, flex: 1 }}>
            <option value="">Tiene: Cualquiera</option>
            {CURRENCY_GROUPS.map(group => (
              <optgroup key={group.region} label={group.region}>
                {group.currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </optgroup>
            ))}
          </select>
          <select value={filterWant} onChange={e => setFilterWant(e.target.value)}
            style={{ background: '#1A3A5C', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 12px', fontSize: 13, flex: 1 }}>
            <option value="">Quiere: Cualquiera</option>
            {CURRENCY_GROUPS.map(group => (
              <optgroup key={group.region} label={group.region}>
                {group.currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Listings */}
      <div style={{ padding: '12px 16px', paddingBottom: 80 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#7A8599' }}>Cargando...</div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌍</div>
            <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 6 }}>No hay listings aún</div>
            <div style={{ color: '#7A8599', fontSize: 14 }}>¡Sé el primero en publicar uno!</div>
          </div>
        ) : (
          listings.map(l => (
            <div key={l.id} style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0D1B2A' }}>{l.users?.name || 'Viajero'}</div>
                  <div style={{ color: '#7A8599', fontSize: 12 }}>{l.users?.nationality || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#FFD000', fontWeight: 700 }}>{'★'.repeat(Math.round(l.users?.rating || 0))}</div>
                  <div style={{ color: '#7A8599', fontSize: 11 }}>{l.users?.swaps_completed || 0} swaps</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F4F6F9', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>{getFlag(l.currency_have)}</div>
                  <div style={{ fontWeight: 800 }}>{formatAmount(l.amount, l.currency_have)} {l.currency_have}</div>
                  <div style={{ color: '#7A8599', fontSize: 11 }}>Ofrece</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>⇄</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>{getFlag(l.currency_want)}</div>
                  <div style={{ fontWeight: 800 }}>{formatAmount(l.amount * l.rate, l.currency_want)} {l.currency_want}</div>
                  <div style={{ color: '#7A8599', fontSize: 11 }}>Quiere</div>
                </div>
              </div>
              <div style={{ color: '#7A8599', fontSize: 12, marginBottom: 10 }}>
                📍 {l.location || 'Ubicación no especificada'} · Tasa: {l.rate}
                {l.available_until && (
                  <span style={{
                    marginLeft: 8,
                    color: new Date(l.available_until) < new Date() ? '#EF4444' : '#16A34A',
                    fontWeight: 700
                  }}>
                    · {new Date(l.available_until) < new Date()
                      ? '⛔ Expirado'
                      : `⏰ Hasta ${new Date(l.available_until).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    }
                  </span>
                )}
              </div>
              <button onClick={() => router.push(`/chat/${l.user_id}`)} style={{ width: '100%', background: '#FFD000', border: 'none', borderRadius: 10, padding: '9px 0', fontWeight: 800, color: '#0D1B2A', fontSize: 14, cursor: 'pointer' }}>
                💬 Iniciar Chat
              </button>
            </div>
          ))
        )}
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
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7A8599' }}>{n.label}</span>
          </button>
        ))}
      </div>
    </main>
  )
}