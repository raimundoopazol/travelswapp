'use client'

import { useLoadScript } from '@react-google-maps/api'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'

const libraries = ['places']

export default function LocationInput({ value, onChange }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
    libraries,
  })

  if (!isLoaded) return (
    <input
      value={value}
      onChange={e => onChange({ name: e.target.value, lat: null, lng: null })}
      placeholder="Cargando..."
      style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 15, boxSizing: 'border-box' }}
    />
  )

  return <PlacesInput value={value} onChange={onChange} />
}

function PlacesInput({ value, onChange }) {
  const {
    ready, value: inputVal, suggestions: { status, data },
    setValue, clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 })

  const handleSelect = async (description) => {
    setValue(description, false)
    clearSuggestions()
    try {
      const results = await getGeocode({ address: description })
      const { lat, lng } = await getLatLng(results[0])
      onChange({ name: description, lat, lng })
    } catch {
      onChange({ name: description, lat: null, lng: null })
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={inputVal || value}
        onChange={e => { setValue(e.target.value); onChange({ name: e.target.value, lat: null, lng: null }) }}
        disabled={!ready}
        placeholder="ej: Aeropuerto de Santiago, Hostel Central..."
        style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 15, boxSizing: 'border-box' }}
      />
      {status === 'OK' && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', marginTop: 4 }}>
          {data.map(({ place_id, description, structured_formatting }) => (
            <div key={place_id} onClick={() => handleSelect(description)}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F4F6F9', fontSize: 14 }}
              onMouseEnter={e => e.currentTarget.style.background = '#F4F6F9'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              <div style={{ fontWeight: 600, color: '#0D1B2A' }}>📍 {structured_formatting.main_text}</div>
              <div style={{ color: '#7A8599', fontSize: 12 }}>{structured_formatting.secondary_text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}