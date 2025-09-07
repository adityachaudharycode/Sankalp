import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function EnhancedMapView({ 
  center = [22.5726, 88.3639], 
  zoom = 6, 
  markers = [], 
  povertyData = [],
  schemeData = [],
  showLegend = true, 
  onMapClick, 
  showCurrentLocation = false,
  activeLayer = 'issues'
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerGroupsRef = useRef({})
  const [selectedRegion, setSelectedRegion] = useState(null)

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
    }

    // Clear existing layer groups
    Object.values(layerGroupsRef.current).forEach(layer => {
      if (mapInstanceRef.current.hasLayer(layer)) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })
    layerGroupsRef.current = {}

    // Create layer groups
    const issuesLayer = L.layerGroup()
    const povertyLayer = L.layerGroup()
    const schemesLayer = L.layerGroup()

    // Add issues markers
    if (activeLayer === 'issues' || activeLayer === 'all') {
      markers.forEach((m) => {
        const color = m.status === 'solved' ? '#16a34a' : 
                     m.severity === 'high' ? '#dc2626' : 
                     m.severity === 'medium' ? '#f59e0b' : '#3b82f6'
        
        const marker = L.circleMarker([m.lat, m.lng], {
          radius: 8,
          color,
          fillColor: color,
          fillOpacity: 0.8,
        }).addTo(issuesLayer)

        if (m.title) {
          marker.bindPopup(`
            <div class="p-2">
              <h4 class="font-semibold">${m.title}</h4>
              <p class="text-sm text-gray-600">${m.description || ''}</p>
              <p class="text-xs text-gray-500">Severity: ${m.severity}</p>
            </div>
          `)
        }
      })
    }

    // Add poverty data visualization
    if (activeLayer === 'poverty' || activeLayer === 'all') {
      povertyData.forEach((region) => {
        const povertyRate = region.povertyRate || 0
        const radius = Math.max(10, povertyRate * 2)
        const color = povertyRate > 20 ? '#dc2626' : 
                     povertyRate > 15 ? '#f59e0b' : 
                     povertyRate > 10 ? '#eab308' : '#16a34a'

        const circle = L.circle([region.coordinates.lat, region.coordinates.lng], {
          radius: radius * 1000, // Convert to meters
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          weight: 2
        }).addTo(povertyLayer)

        circle.bindPopup(`
          <div class="p-3 min-w-64">
            <h4 class="font-semibold text-lg">${region.region}</h4>
            <div class="mt-2 space-y-1">
              <p><span class="font-medium">Poverty Rate:</span> ${povertyRate}%</p>
              <p><span class="font-medium">Population:</span> ${(region.population / 1000000).toFixed(1)}M</p>
              <p><span class="font-medium">Below Poverty Line:</span> ${(region.belowPovertyLine / 1000000).toFixed(1)}M</p>
              <p><span class="font-medium">Unemployment:</span> ${region.unemploymentRate}%</p>
              <p><span class="font-medium">Literacy Rate:</span> ${region.literacyRate}%</p>
            </div>
          </div>
        `)

        circle.on('click', () => {
          setSelectedRegion(region)
        })
      })
    }

    // Add scheme implementation markers
    if (activeLayer === 'schemes' || activeLayer === 'all') {
      schemeData.forEach((scheme) => {
        if (scheme.implementedRegions) {
          scheme.implementedRegions.forEach((regionName) => {
            const regionData = povertyData.find(p => p.region === regionName)
            if (regionData) {
              const effectiveness = scheme.effectiveness || Math.random() * 100
              const color = effectiveness > 80 ? '#16a34a' : 
                           effectiveness > 60 ? '#eab308' : 
                           effectiveness > 40 ? '#f59e0b' : '#dc2626'

              const marker = L.marker([regionData.coordinates.lat, regionData.coordinates.lng], {
                icon: L.divIcon({
                  className: 'custom-scheme-marker',
                  html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })
              }).addTo(schemesLayer)

              marker.bindPopup(`
                <div class="p-3 min-w-64">
                  <h4 class="font-semibold">${scheme.name}</h4>
                  <p class="text-sm text-gray-600 mt-1">${scheme.description}</p>
                  <div class="mt-2 space-y-1">
                    <p><span class="font-medium">Type:</span> ${scheme.type}</p>
                    <p><span class="font-medium">Budget:</span> ₹${(scheme.budget / 10000000).toFixed(0)} Cr</p>
                    <p><span class="font-medium">Beneficiaries:</span> ${(scheme.beneficiaries / 1000000).toFixed(1)}M</p>
                    <p><span class="font-medium">Effectiveness:</span> ${effectiveness.toFixed(1)}%</p>
                    <p><span class="font-medium">Region:</span> ${regionName}</p>
                  </div>
                </div>
              `)
            }
          })
        }
      })
    }

    // Add appropriate layer to map
    layerGroupsRef.current = { issuesLayer, povertyLayer, schemesLayer }
    
    if (activeLayer === 'issues') {
      issuesLayer.addTo(mapInstanceRef.current)
    } else if (activeLayer === 'poverty') {
      povertyLayer.addTo(mapInstanceRef.current)
    } else if (activeLayer === 'schemes') {
      schemesLayer.addTo(mapInstanceRef.current)
    } else if (activeLayer === 'all') {
      povertyLayer.addTo(mapInstanceRef.current)
      schemesLayer.addTo(mapInstanceRef.current)
      issuesLayer.addTo(mapInstanceRef.current)
    }

    return () => {
      Object.values(layerGroupsRef.current).forEach(layer => {
        if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(layer)) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })
    }
  }, [center, zoom, markers, povertyData, schemeData, activeLayer, onMapClick])

  return (
    <div className="space-y-4">
      {showLegend && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-semibold mb-3">Map Legend</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {(activeLayer === 'issues' || activeLayer === 'all') && (
              <div>
                <h5 className="font-medium mb-2">Issues</h5>
                <div className="space-y-1">
                  <Legend color="#dc2626" label="High Priority" />
                  <Legend color="#f59e0b" label="Medium Priority" />
                  <Legend color="#3b82f6" label="Low Priority" />
                  <Legend color="#16a34a" label="Solved" />
                </div>
              </div>
            )}
            {(activeLayer === 'poverty' || activeLayer === 'all') && (
              <div>
                <h5 className="font-medium mb-2">Poverty Rates</h5>
                <div className="space-y-1">
                  <Legend color="#dc2626" label=">20% (Critical)" />
                  <Legend color="#f59e0b" label="15-20% (High)" />
                  <Legend color="#eab308" label="10-15% (Medium)" />
                  <Legend color="#16a34a" label="<10% (Low)" />
                </div>
              </div>
            )}
            {(activeLayer === 'schemes' || activeLayer === 'all') && (
              <div>
                <h5 className="font-medium mb-2">Scheme Effectiveness</h5>
                <div className="space-y-1">
                  <Legend color="#16a34a" label=">80% (Excellent)" />
                  <Legend color="#eab308" label="60-80% (Good)" />
                  <Legend color="#f59e0b" label="40-60% (Fair)" />
                  <Legend color="#dc2626" label="<40% (Poor)" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="h-96 w-full rounded-lg overflow-hidden border shadow" />
      
      {selectedRegion && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-semibold text-lg mb-2">Region Details: {selectedRegion.region}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Poverty Rate</p>
              <p className="text-xl font-bold text-red-600">{selectedRegion.povertyRate}%</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Population</p>
              <p className="text-xl font-bold">{(selectedRegion.population / 1000000).toFixed(1)}M</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Unemployment</p>
              <p className="text-xl font-bold text-orange-600">{selectedRegion.unemploymentRate}%</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Literacy Rate</p>
              <p className="text-xl font-bold text-green-600">{selectedRegion.literacyRate}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}
