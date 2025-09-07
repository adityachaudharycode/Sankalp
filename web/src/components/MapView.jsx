import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({ center = [22.5726, 88.3639], zoom = 12, markers = [], showLegend = true, onMapClick, showCurrentLocation = false }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const currentLocationMarkerRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current)

      // Add click handler if provided
      if (onMapClick) {
        mapInstanceRef.current.on('click', (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng)
        })
      }
    } else {
      mapInstanceRef.current.setView(center, zoom)
    }

    // Clear existing markers layer group
    const layerGroup = L.layerGroup().addTo(mapInstanceRef.current)

    // Add regular markers
    markers.forEach((m) => {
      const color = m.status === 'solved' ? '#16a34a' : m.severity === 'high' ? '#dc2626' : m.severity === 'medium' ? '#f59e0b' : '#3b82f6'
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.8,
      }).addTo(layerGroup)

      if (m.title) {
        marker.bindPopup(m.title)
      }
    })

    // Add current location marker if enabled
    if (showCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords

          // Remove existing current location marker
          if (currentLocationMarkerRef.current) {
            mapInstanceRef.current.removeLayer(currentLocationMarkerRef.current)
          }

          // Create custom icon for current location
          const currentLocationIcon = L.divIcon({
            className: 'current-location-marker',
            html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })

          currentLocationMarkerRef.current = L.marker([latitude, longitude], {
            icon: currentLocationIcon
          }).addTo(mapInstanceRef.current)
          .bindPopup('📍 Your Current Location')
        },
        (error) => {
          console.warn('Could not get current location:', error)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(layerGroup)
      }
    }
  }, [center[0], center[1], zoom, markers, onMapClick, showCurrentLocation])

  return (
    <div className="space-y-2">
      {showLegend && (
        <div className="flex items-center gap-3 text-sm">
          <Legend color="#dc2626" label="High" />
          <Legend color="#f59e0b" label="Medium" />
          <Legend color="#3b82f6" label="Low" />
          <Legend color="#16a34a" label="Solved" />
        </div>
      )}
      <div ref={mapRef} className="h-96 w-full rounded overflow-hidden border" />
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}

