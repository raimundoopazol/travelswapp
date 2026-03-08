'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CURRENCY_GROUPS, getFlag, formatAmount } from '@/lib/currencies'
import RateHelper from '@/app/components/RateHelper'
import LocationInput from '@/app/components/LocationInput'
import { useRouter } from 'next/navigation'

export default function NewListing() {
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ currency_have: 'USD', currency_want: 'EUR', amount: '', rate: '', location: '', lat: null, lng: null })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!form.amount || !form.rate || !form.location) {
      setMessage('⚠️ Completa todos los campos')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('listings').insert({
      user_id: user.id,
      currency_have: form.currency_have,
      currency_want: form.currency_want,
      amount: parseFloat(form.amount),
      rate: parseFloat(form.rate),
      location: form.location,
      lat: form.lat,
      lng: form.lng,
      active: true,
    })
    if (error) {
      setMessage('❌ Error: ' + error.message)
    } else {
      router.push('/discover')
    }
    setLoading(false)
  }

  const CurrencySelect = ({ value, onChange }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 15 }}>
      {CURRENCY_GROUPS.map(group => (
        <optgroup key={group.region} label={group.region}>
          {group.currencies.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )

  return (
    <main style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: '#F4F6F9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0D1B2A', padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#FFD000', fontSize: 22, cursor: 'pointer' }}>←</button>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Publicar Listing</div>
      </div>

      <div style={{ padding: 16, paddingBottom: 40 }}>
        {/* Currency Have */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 8 }}>Tengo</div>
          <CurrencySelect value={form.currency_have} onChange={v => setForm(p => ({ ...p, currency_have: v }))} />
        </div>

        {/* Currency Want */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 8 }}>Quiero</div>
          <CurrencySelect value={form.currency_want} onChange={v => setForm(p => ({ ...p, currency_want: v }))} />
        </div>

        {/* Amount */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 8 }}>
            Cantidad ({getFlag(form.currency_have)} {form.currency_have})
          </div>
          <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            placeholder="ej: 200"
            style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 15, boxSizing: 'border-box' }} />
        </div>

        {/* Rate */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 8 }}>
            Tu tasa (1 {getFlag(form.currency_have)} {form.currency_have} = ? {getFlag(form.currency_want)} {form.currency_want})
          </div>
          <input type="number" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))}
            placeholder="ej: 0.92"
            style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 15, boxSizing: 'border-box' }} />
          <RateHelper
            from={form.currency_have}
            to={form.currency_want}
            onSelectRate={(r) => setForm(p => ({ ...p, rate: r }))}
          />
          {form.amount && form.rate && (
            <div style={{ marginTop: 10, background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#7A8599' }}>Recibirías aprox.</span>
              <span style={{ fontWeight: 900, fontSize: 16, color: '#15803D' }}>
                {getFlag(form.currency_want)} {formatAmount(parseFloat(form.amount) * parseFloat(form.rate), form.currency_want)} {form.currency_want}
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, color: '#0D1B2A', marginBottom: 8 }}>Ubicación</div>
          <LocationInput
            value={form.location}
            onChange={({ name, lat, lng }) => setForm(p => ({ ...p, location: name, lat, lng }))}
          />
        </div>

        {message && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: '#FEF9C3', borderRadius: 10, color: '#854D0E', fontSize: 14 }}>
            {message}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', background: '#FFD000', border: 'none', borderRadius: 14, padding: '14px 0', fontWeight: 900, fontSize: 16, cursor: 'pointer', color: '#0D1B2A' }}>
          {loading ? 'Publicando...' : '📣 Publicar Listing'}
        </button>
      </div>
    </main>
  )
}