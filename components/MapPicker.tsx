"use client"

import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Correction des icônes Leaflet dans Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: any }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
    },
  })
  return position === null ? null : (
    <Marker position={position} icon={defaultIcon}></Marker>
  )
}

export default function MapPicker({ mapCenter, markerPosition, setMarkerPosition }: any) {
  return (
    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={markerPosition} setPosition={setMarkerPosition} />
    </MapContainer>
  )
}