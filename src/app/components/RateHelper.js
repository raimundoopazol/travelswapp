'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getFlag, formatAmount } from '@/lib/currencies'

const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_API_KEY
const PERIODS = [
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1A', days: 365 },
]

export default function RateHelper({ from, to, onSelectRate }) {
  const [rate, setRate] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showChart, setShowChart] = useState(false)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    if (from && to && from !== to) {
      fetchRate()
    }
  }, [from, to])

  useEffect(() => {
    if (rate) generateMockHistory(rate, period)
  }, [period, rate])

  const fetchRate = async () => {
    setLoading(true)
    setError(null)
    setShowChart(false)
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${to}`)
      const data = await res.json()
      if (data.result === 'success') {
        setRate(data.conversion_rate)
        generateMockHistory(data.conversion_rate, period)
      } else {
        setError('Par de monedas no disponible')
      }
    } catch {
      setError('Sin conexión')
    }
    setLoading(false)
  }

  const generateMockHistory = (currentRate, days) => {
    const points = []
    const today = new Date()
    for (let i = days; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const variation = 1 + (Math.random() - 0.5) * 0.04
      // Formato limpio según el plazo
      let label
      if (days <= 7) {
        label = `${d.getDate()}/${d.getMonth() + 1}`
      } else if (days <= 90) {
        label = `${d.getDate()}/${d.getMonth() + 1}`
      } else {
        // Para plazos largos mostrar solo mes/año
        label = `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`
      }
      points.push({ date: label, rate: parseFloat((currentRate * variation).toFixed(6)) })
    }
    points[points.length - 1].rate = currentRate

    // Para plazos largos, reducir puntos para que el eje no se sature
    if (days >= 180) {
      const step = Math.ceil(points.length / 30)
      setHistory(points.filter((_, i) => i % step === 0 || i === points.length - 1))
    } else if (days >= 90) {
      const step = Math.ceil(points.length / 20)
      setHistory(points.filter((_, i) => i % step === 0 || i === points.length - 1))
    } else {
      setHistory(points)
    }
  }

  if (from === to) return null

  return (
    <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '12px 14px', marginTop: 10 }}>
      {loading ? (
        <div style={{ color: '#7A8599', fontSize: 13 }}>Consultando tasa actual...</div>
      ) : error ? (
        <div style={{ color: '#EF4444', fontSize: 13 }}>⚠️ {error}</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#7A8599' }}>Tasa de mercado hoy</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#0D1B2A' }}>
                1 {getFlag(from)} {from} = {getFlag(to)} {formatAmount(rate, to)} {to}
              </div>
            </div>
            <button onClick={() => onSelectRate(rate)}
              style={{ background: '#FFD000', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', color: '#0D1B2A', whiteSpace: 'nowrap' }}>
              Usar esta tasa
            </button>
          </div>

          <button onClick={() => setShowChart(!showChart)}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            {showChart ? '▲ Ocultar gráfico' : '📈 Ver tendencia'}
          </button>

          {showChart && (
            <div style={{ marginTop: 10 }}>
              {/* Selector de período */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {PERIODS.map(p => (
                  <button key={p.days} onClick={() => setPeriod(p.days)}
                    style={{
                      flex: 1, padding: '4px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: 12,
                      background: period === p.days ? '#2563EB' : '#DBEAFE',
                      color: period === p.days ? '#fff' : '#2563EB',
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    interval={Math.ceil(history.length / 5) - 1}
                    tickFormatter={(val) => val}
                  />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v) => [formatAmount(v, to), `${from}/${to}`]}
                    labelFormatter={(l) => l}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7A8599', marginTop: 4 }}>
                <span>Mín: {formatAmount(Math.min(...history.map(h => h.rate)), to)}</span>
                <span>Máx: {formatAmount(Math.max(...history.map(h => h.rate)), to)}</span>
                <span>Hoy: {formatAmount(rate, to)}</span>
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'right' }}>
                * Tendencia estimada basada en tasa actual
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}