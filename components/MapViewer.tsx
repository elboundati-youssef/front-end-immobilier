"use client"

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

export default function MapViewer({ center, address }: { center: [number, number], address: string }) {
  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
  url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&gl=MA&hl=fr"
  attribution="&copy; Google Maps"
/>
      <Marker position={center} icon={defaultIcon}>
        <Popup className="font-semibold">{address}</Popup>
      </Marker>
    </MapContainer>
  )
}