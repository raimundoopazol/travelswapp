'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [status, setStatus] = useState('Conectando...')

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('listings').select('*')
      if (error) {
        setStatus('❌ Error: ' + error.message)
      } else {
        setStatus('✅ Supabase conectado correctamente')
      }
    }
    testConnection()
  }, [])

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 24, fontWeight: 'bold' }}>
      {status}
    </main>
  )
}