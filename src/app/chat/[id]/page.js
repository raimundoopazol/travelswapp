'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getFlag, formatAmount, CURRENCY_GROUPS } from '@/lib/currencies'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

export default function Chat() {
  const [user, setUser] = useState(null)
  const [other, setOther] = useState(null)
  const [listing, setListing] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRate, setShowRate] = useState(false)
  const [marketRate, setMarketRate] = useState(null)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapForm, setSwapForm] = useState({ currency_have: 'USD', currency_want: 'EUR', amount: '' })
  const [swapLoading, setSwapLoading] = useState(false)
  const bottomRef = useRef(null)
  const router = useRouter()
  const { id: otherId } = useParams()
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing')
  const urlListing = listingId ? {
    id: listingId,
    currency_have: searchParams.get('have'),
    currency_want: searchParams.get('want'),
    rate: parseFloat(searchParams.get('rate')),
    amount: parseFloat(searchParams.get('amount')),
  } : null

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      await fetchOther(session.user.id)
      await fetchMessages(session.user.id)
      subscribeToMessages(session.user.id)
      setLoading(false)
    }
    init()
    return () => supabase.channel('messages').unsubscribe()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (listing?.currency_have && listing?.currency_want) {
      fetch(`https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_EXCHANGE_API_KEY}/pair/${listing.currency_have}/${listing.currency_want}`)
        .then(r => r.json())
        .then(d => { if (d.result === 'success') setMarketRate(d.conversion_rate) })
        .catch(() => {})
    }
  }, [listing])

  const fetchOther = async (myId) => {
    const { data } = await supabase.from('users').select('*').eq('id', otherId).single()
    if (data) setOther(data)

    // Buscar listing del otro usuario primero, si no hay buscar el mío
    const { data: theirListing } = await supabase
      .from('listings').select('*').eq('user_id', otherId).eq('active', true).maybeSingle()
    if (theirListing) { setListing(theirListing); return }

    const { data: myListing } = await supabase
      .from('listings').select('*').eq('user_id', myId).eq('active', true).maybeSingle()
    if (myListing) setListing(myListing)
  }

  const fetchMessages = async (myId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const subscribeToMessages = (myId) => {
    supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        if (
          (msg.sender_id === myId && msg.receiver_id === otherId) ||
          (msg.sender_id === otherId && msg.receiver_id === myId)
        ) {
          setMessages(prev => [...prev, msg])
        }
      })
      .subscribe()
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || !user) return
    setInput('')
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherId,
      message_text: msg,
    })
    if (error) console.error('Error enviando mensaje:', error)
  }

  const handleShareLocation = () => {
    if (!navigator.geolocation) { alert('Tu browser no soporta geolocalización'); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        sendMessage(`__LOCATION__${JSON.stringify({ lat: latitude, lng: longitude })}`)
      },
      err => alert('No se pudo obtener tu ubicación: ' + err.message),
      { enableHighAccuracy: true }
    )
  }

  const handleConfirmSwap = async () => {
    if (!swapForm.amount) return
    setSwapLoading(true)
    const { error } = await supabase.from('swaps').insert({
      user1_id: user.id,
      user2_id: otherId,
      currency_have: swapForm.currency_have,
      currency_want: swapForm.currency_want,
      amount: parseFloat(swapForm.amount),
    })
    if (!error) {
      await supabase.rpc('increment_swaps', { user_id: user.id })
      await supabase.rpc('increment_swaps', { user_id: otherId })
      await sendMessage(`✅ ¡Swap confirmado! ${formatAmount(swapForm.amount, swapForm.currency_have)} ${swapForm.currency_have} ↔ ${swapForm.currency_want}`)
      setShowSwapModal(false)
      router.push(`/rating/${otherId}`)
    }
    setSwapLoading(false)
  }

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <main style={{ maxWidth: 430, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F6F9', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>

      {/* Header */}
      <div style={{ background: '#0D1B2A', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#FFD000', fontSize: 22, cursor: 'pointer' }}>←</button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
          {other?.name?.slice(0, 2).toUpperCase() || '??'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 800 }}>{other?.name || 'Viajero'}</div>
          {listing && (
            <div style={{ color: '#9BB0C9', fontSize: 12 }}>
              {getFlag(listing.currency_have)}{listing.currency_have} → {getFlag(listing.currency_want)}{listing.currency_want} · {formatAmount(listing.amount, listing.currency_have)} {listing.currency_have}
            </div>
          )}
        </div>
      </div>

      {/* Safety banner */}
      <div style={{ background: '#FFF3B0', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span>🛡️</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Siempre reúnete en lugares públicos</span>
      </div>

      {/* Quick actions */}
      <div style={{ background: '#fff', padding: '8px 12px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid #E5E7EB' }}>
        <button onClick={() => setShowRate(!showRate)}
          style={{ background: showRate ? '#FFD000' : '#F4F6F9', border: '1.5px solid #FFD000', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#0D1B2A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          💱 Ver tasas
        </button>
        <button onClick={handleShareLocation}
          style={{ background: '#F4F6F9', border: '1.5px solid #FFD000', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#0D1B2A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          📍 Compartir ubicación
        </button>
        <button onClick={() => setShowSwapModal(true)}
          style={{ background: '#F0FDF4', border: '1.5px solid #22C55E', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#15803D', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ✅ Swap realizado
        </button>
      </div>

      {/* Rate panel */}
      {showRate && (
        <div style={{ background: '#EFF6FF', padding: '12px 16px', flexShrink: 0, borderBottom: '1px solid #DBEAFE' }}>
          {listing ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#7A8599' }}>Tasa de mercado hoy</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0D1B2A' }}>
                    1 {getFlag(listing.currency_have)}{listing.currency_have} = {marketRate ? `${getFlag(listing.currency_want)} ${formatAmount(marketRate, listing.currency_want)} ${listing.currency_want}` : '...'}
                  </div>
                </div>
                {marketRate && listing.rate && (
                  <div style={{
                    background: listing.rate >= marketRate ? '#FEF9C3' : '#DCFCE7',
                    borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                    color: listing.rate >= marketRate ? '#854D0E' : '#15803D'
                  }}>
                    {listing.rate >= marketRate ? '⚠️ Sobre mercado' : '✅ Bajo mercado'}
                  </div>
                )}
              </div>
              <div style={{ height: 1, background: '#DBEAFE', margin: '8px 0' }} />
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#7A8599' }}>Tasa propuesta en el listing</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0D1B2A' }}>
                  1 {getFlag(listing.currency_have)}{listing.currency_have} = {getFlag(listing.currency_want)}{formatAmount(listing.rate, listing.currency_want)} {listing.currency_want}
                </div>
                <div style={{ fontSize: 12, color: '#7A8599', marginTop: 2 }}>
                  {formatAmount(listing.amount, listing.currency_have)} {listing.currency_have} → {formatAmount(listing.amount * listing.rate, listing.currency_want)} {listing.currency_want}
                </div>
              </div>
              <button onClick={() => sendMessage(`💱 Tasa propuesta: 1 ${listing.currency_have} = ${formatAmount(listing.rate, listing.currency_want)} ${listing.currency_want} | Mercado: ${marketRate ? formatAmount(marketRate, listing.currency_want) : '...'} ${listing.currency_want}`)}
                style={{ background: '#2563EB', border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Enviar tasas al chat
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#7A8599' }}>Este viajero no tiene un listing activo aún.</div>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#7A8599', padding: 20 }}>Cargando mensajes...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👋</div>
            <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 4 }}>Inicia la conversación</div>
            <div style={{ color: '#7A8599', fontSize: 13 }}>Negocia la tasa y coordina el encuentro</div>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === user?.id
            const isLocation = m.message_text?.startsWith('__LOCATION__')
            let locationData = null
            if (isLocation) {
              try { locationData = JSON.parse(m.message_text.replace('__LOCATION__', '')) } catch {}
            }
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                {isLocation && locationData ? (
                  <div style={{ maxWidth: '75%', background: isMe ? '#FFD000' : '#fff', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <a href={`https://maps.google.com/?q=${locationData.lat},${locationData.lng}`} target="_blank" rel="noreferrer">
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${locationData.lat},${locationData.lng}&zoom=15&size=240x160&markers=color:red%7C${locationData.lat},${locationData.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                        alt="Ubicación"
                        style={{ width: '100%', display: 'block' }}
                      />
                    </a>
                    <div style={{ padding: '6px 12px 8px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0D1B2A' }}>📍 Mi ubicación actual</div>
                      <div style={{ fontSize: 11, color: '#2563EB', marginTop: 2 }}>Toca para abrir en Maps</div>
                      <div style={{ fontSize: 10, color: isMe ? '#7A6500' : '#7A8599', marginTop: 4, textAlign: 'right' }}>{formatTime(m.created_at)}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: '75%', background: isMe ? '#FFD000' : '#fff', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontSize: 14, color: '#0D1B2A' }}>
                    {m.message_text}
                    <div style={{ fontSize: 10, color: isMe ? '#7A6500' : '#7A8599', marginTop: 3, textAlign: 'right' }}>{formatTime(m.created_at)}</div>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', gap: 8, borderTop: '1px solid #E5E7EB', flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe un mensaje..."
          style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '10px 14px', fontSize: 14, outline: 'none' }} />
        <button onClick={() => sendMessage()}
          style={{ background: '#FFD000', border: 'none', borderRadius: '50%', width: 42, height: 42, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>
          ➤
        </button>
      </div>

      {/* Swap Modal */}
      {showSwapModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 24, width: '100%' }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#0D1B2A', marginBottom: 4 }}>✅ Confirmar swap realizado</div>
            <div style={{ color: '#7A8599', fontSize: 14, marginBottom: 20 }}>Cuéntanos qué intercambiaron para guardar el historial</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Yo entregué</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={swapForm.currency_have} onChange={e => setSwapForm(p => ({ ...p, currency_have: e.target.value }))}
                  style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 14 }}>
                  {CURRENCY_GROUPS.map(g => (
                    <optgroup key={g.region} label={g.region}>
                      {g.currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </optgroup>
                  ))}
                </select>
                <input type="number" value={swapForm.amount} onChange={e => setSwapForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="Cantidad"
                  style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 14 }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Yo recibí</div>
              <select value={swapForm.currency_want} onChange={e => setSwapForm(p => ({ ...p, currency_want: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 14 }}>
                {CURRENCY_GROUPS.map(g => (
                  <optgroup key={g.region} label={g.region}>
                    {g.currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <button onClick={handleConfirmSwap} disabled={swapLoading}
              style={{ width: '100%', background: '#22C55E', border: 'none', borderRadius: 14, padding: '14px 0', fontWeight: 900, fontSize: 16, color: '#fff', cursor: 'pointer', marginBottom: 10 }}>
              {swapLoading ? 'Guardando...' : '🎉 Confirmar y calificar'}
            </button>
            <button onClick={() => setShowSwapModal(false)}
              style={{ width: '100%', background: '#F4F6F9', border: 'none', borderRadius: 14, padding: '12px 0', fontWeight: 700, fontSize: 15, color: '#7A8599', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}