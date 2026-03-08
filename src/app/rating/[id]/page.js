'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const TAGS = ['friendly', 'on time', 'fair rate', 'trustworthy', 'safe']

export default function Rating() {
  const [user, setUser] = useState(null)
  const [other, setOther] = useState(null)
  const [swap, setSwap] = useState(null)
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const { id: otherId } = useParams()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      const { data: otherData } = await supabase.from('users').select('*').eq('id', otherId).single()
      if (otherData) setOther(otherData)

      // Fetch most recent swap between the two
      const { data: swapData } = await supabase
        .from('swaps')
        .select('*')
        .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${session.user.id})`)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (swapData) setSwap(swapData)
    }
    init()
  }, [])

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSubmit = async () => {
    if (stars === 0) return
    setLoading(true)

    const isUser1 = swap?.user1_id === user.id
    const ratingField = isUser1 ? 'rating_user1' : 'rating_user2'
    const tagsField = isUser1 ? 'tags_user1' : 'tags_user2'

    if (swap) {
      await supabase.from('swaps').update({
        [ratingField]: stars,
        [tagsField]: tags,
      }).eq('id', swap.id)
    }

    // Update the other user's average rating
    const { data: swaps } = await supabase
      .from('swaps')
      .select('rating_user1, rating_user2, user1_id, user2_id')
      .or(`user1_id.eq.${otherId},user2_id.eq.${otherId}`)

    if (swaps) {
      const ratings = swaps.map(s => s.user1_id === otherId ? s.rating_user1 : s.rating_user2).filter(Boolean)
      if (ratings.length > 0) {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
        await supabase.from('users').update({ rating: parseFloat(avg.toFixed(1)) }).eq('id', otherId)
      }
    }

    setLoading(false)
    setDone(true)
  }

  if (done) return (
    <main style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#F4F6F9', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: '#0D1B2A', marginBottom: 8 }}>¡Swap completado!</div>
        <div style={{ color: '#7A8599', fontSize: 15, marginBottom: 28 }}>Gracias por calificar a {other?.name}. Tu reseña ayuda a la comunidad.</div>
        <button onClick={() => router.push('/discover')}
          style={{ background: '#FFD000', border: 'none', borderRadius: 14, padding: '14px 32px', fontWeight: 900, fontSize: 16, cursor: 'pointer', color: '#0D1B2A' }}>
          Volver a Discover
        </button>
      </div>
    </main>
  )

  return (
    <main style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#F4F6F9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0D1B2A', padding: '20px 16px' }}>
        <div style={{ color: '#FFD000', fontWeight: 900, fontSize: 20 }}>Calificar swap</div>
        <div style={{ color: '#9BB0C9', fontSize: 13 }}>Tu opinión ayuda a otros viajeros</div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Other user */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24, margin: '0 auto 10px' }}>
            {other?.name?.slice(0, 2).toUpperCase() || '??'}
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0D1B2A' }}>{other?.name || 'Viajero'}</div>
          <div style={{ color: '#7A8599', fontSize: 13 }}>{other?.nationality || ''}</div>
        </div>

        {/* Stars */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 14, textAlign: 'center' }}>¿Cómo fue tu experiencia?</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setStars(s)}
                style={{ background: 'none', border: 'none', fontSize: 40, cursor: 'pointer', transform: s <= stars ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s' }}>
                <span style={{ color: s <= stars ? '#FFD000' : '#D1D5DB' }}>★</span>
              </button>
            ))}
          </div>
          {stars > 0 && (
            <div style={{ textAlign: 'center', marginTop: 10, color: '#7A8599', fontSize: 13 }}>
              {['', '😕 Mala experiencia', '😐 Regular', '🙂 Bien', '😊 Muy bien', '🤩 Excelente'][stars]}
            </div>
          )}
        </div>

        {/* Tags */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 12 }}>Agrega etiquetas</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)}
                style={{ padding: '8px 16px', borderRadius: 20,
                  border: `2px solid ${tags.includes(t) ? '#FFD000' : '#E5E7EB'}`,
                  background: tags.includes(t) ? '#FFF3B0' : '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#0D1B2A' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={stars === 0 || loading}
          style={{ width: '100%', background: stars > 0 ? '#FFD000' : '#E5E7EB', border: 'none', borderRadius: 14,
            padding: '14px 0', fontWeight: 900, fontSize: 16, cursor: stars > 0 ? 'pointer' : 'default', color: '#0D1B2A' }}>
          {loading ? 'Guardando...' : '⭐ Enviar calificación'}
        </button>

        <button onClick={() => router.push('/discover')}
          style={{ width: '100%', background: 'none', border: 'none', marginTop: 12, color: '#7A8599', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>
          Saltar por ahora
        </button>
      </div>
    </main>
  )
}