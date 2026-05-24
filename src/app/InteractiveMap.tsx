'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw,
  Loader2, Thermometer, Droplets, Wind, Layers, Maximize2
} from 'lucide-react'

interface InteractiveMapProps {
  lat: number
  lon: number
  locationName: string
  temp: number
  unit: 'C' | 'F'
}

export default function InteractiveMap({ lat, lon, locationName, temp, unit }: InteractiveMapProps) {
  // State hooks
  const [mapLoaded, setMapLoaded] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(8)
  const [activeLayer, setActiveLayer] = useState<'temperature' | 'precipitation' | 'wind'>('temperature')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isZooming, setIsZooming] = useState(false)
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    
    let L: any

    const initMap = async () => {
      try {
        L = await import('leaflet')
        
        // Fix default marker icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Initialize map with ZOOM LIMITS
        const map = L.map(mapRef.current, {
          center: [lat, lon],
          zoom: 8,
          minZoom: 2,      // ✅ Prevent zooming out too far
          maxZoom: 18,     // ✅ Prevent zooming in too far
          zoomControl: false,
          attributionControl: false,
          // Smooth interactions
          zoomAnimation: true,
          markerZoomAnimation: true,
          fadeAnimation: true,
        })

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // Custom blue marker icon
        const blueIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="position:relative;width:30px;height:42px;">
              <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 13.5 25.5 14.1 26.1a1.5 1.5 0 002.8 0C17.5 40.5 30 26.25 30 15 30 6.716 23.284 0 15 0z" fill="#3B82F6"/>
                <circle cx="15" cy="15" r="6" fill="white"/>
              </svg>
              <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:20px;height:6px;background:rgba(59,130,246,0.3);border-radius:50%;"></div>
            </div>
          `,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
          popupAnchor: [0, -42]
        })

        // Add marker
        const marker = L.marker([lat, lon], { icon: blueIcon }).addTo(map)
        
        // Popup content
        const popupContent = `
          <div style="font-family:system-ui,-apple-system,sans-serif;padding:8px;min-width:150px;">
            <div style="font-weight:bold;font-size:14px;color:#1f2937;margin-bottom:4px;">${locationName}</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;">
              <span>🌡️</span><span><strong>${temp}°${unit}</strong></span>
            </div>
          </div>
        `
        marker.bindPopup(popupContent).openPopup()

        // Store instances
        mapInstanceRef.current = map
        markerRef.current = marker

        // Listen to zoom events
        map.on('zoomend', () => {
          const newZoom = map.getZoom()
          setZoomLevel(newZoom)
          console.log(`🗺️ Map zoomed to level: ${newZoom}`)
        })
        
        // Log when map moves
        map.on('moveend', () => {
          const center = map.getCenter()
          console.log(`📍 Map center: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`)
        })

        setMapLoaded(true)
        console.log('✅ Map initialized successfully!')

      } catch (error) {
        console.error('❌ Failed to load map:', error)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update location when props change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      // Smooth fly to new location
      mapInstanceRef.current.flyTo([lat, lon], 8, {
        duration: 1.5, // 1.5 second animation
        easeLinearity: 0.25
      })
      
      // Update marker position
      setTimeout(() => {
        markerRef.current.setLatLng([lat, lon])
        
        // Update popup content
        const popupContent = `
          <div style="font-family:system-ui,-apple-system,sans-serif;padding:8px;min-width:150px;">
            <div style="font-weight:bold;font-size:14px;color:#1f2937;margin-bottom:4px;">${locationName}</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;">
              <span>🌡️</span><span><strong>${temp}°${unit}</strong></span>
            </div>
          </div>
        `
        markerRef.current.setPopupContent(popupContent).openPopup()
      }, 100)
    }
  }, [lat, lon, locationName, temp, unit])

  // ==================== ✅✅✅ ENHANCED BUTTON HANDLERS ✅✅✅ ====================
  
  /**
   * 🔍 ZOOM IN - Zoom in by 1 level with animation
   */
  const handleZoomIn = () => {
    if (!mapInstanceRef.current || !mapLoaded) {
      console.log('⚠️ Map not ready for zoom in')
      return
    }
    
    const currentZoom = mapInstanceRef.current.getZoom()
    const maxZoom = mapInstanceRef.current.options.maxZoom || 18
    
    // Check if we can zoom in more
    if (currentZoom >= maxZoom) {
      console.log(`⚠️ Already at maximum zoom (${maxZoom})`)
      return
    }
    
    setIsZooming(true)
    
    // Zoom in smoothly
    mapInstanceRef.current.setZoom(currentZoom + 1, {
      animate: true,
      duration: 0.3 // 300ms smooth animation
    })
    
    console.log(`🔍+ Zoom IN: ${currentZoom} → ${currentZoom + 1}`)
    
    setTimeout(() => setIsZooming(false), 300)
  }

  /**
   * 🔍 ZOOM OUT - Zoom out by 1 level with animation
   */
  const handleZoomOut = () => {
    if (!mapInstanceRef.current || !mapLoaded) {
      console.log('⚠️ Map not ready for zoom out')
      return
    }
    
    const currentZoom = mapInstanceRef.current.getZoom()
    const minZoom = mapInstanceRef.current.options.minZoom || 2
    
    // Check if we can zoom out more
    if (currentZoom <= minZoom) {
      console.log(`⚠️ Already at minimum zoom (${minZoom})`)
      return
    }
    
    setIsZooming(true)
    
    // Zoom out smoothly
    mapInstanceRef.current.setZoom(currentZoom - 1, {
      animate: true,
      duration: 0.3 // 300ms smooth animation
    })
    
    console.log(`🔍- Zoom OUT: ${currentZoom} → ${currentZoom - 1}`)
    
    setTimeout(() => setIsZooming(false), 300)
  }

  /**
   * 🔄 RESET VIEW - Fly back to searched location with beautiful animation
   */
  const handleResetView = () => {
    if (!mapInstanceRef.current || !mapLoaded) {
      console.log('⚠️ Map not ready for reset')
      return
    }
    
    console.log(`🔄 Resetting view to: ${locationName} (${lat}, ${lon})`)
    
    // Beautiful fly-to animation back to original location
    mapInstanceRef.current.flyTo([lat, lon], 8, {
      duration: 1.5,           // 1.5 seconds smooth flight
      easeLinearity: 0.25,     // Smooth easing curve
      noMoveStart: false
    })
    
    // Update marker after flight
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup() // Re-open popup at destination
      }
    }, 1500)
  }

  /**
   * 📍 LOCATE ME - Get user's current GPS location
   */
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    
    console.log('🎯 Getting your location...')
    
    navigator.geolocation.getCurrentPosition(
      // Success callback
      (pos) => {
        const userLat = pos.coords.latitude
        const userLon = pos.coords.longitude
        
        console.log(`✅ Location found: ${userLat}, ${userLon}`)
        
        if (mapInstanceRef.current && markerRef.current) {
          // Fly to user's location with higher zoom
          mapInstanceRef.current.flyTo([userLat, userLon], 14, {
            duration: 2,
            easeLinearity: 0.25
          })
          
          // Move marker to user's location
          markerRef.current.setLatLng([userLat, userLon])
          
          // Update popup
          const userPopup = `
            <div style="font-family:system-ui,sans-serif;padding:8px;">
              <div style="font-weight:bold;color:#059669;">📍 Your Location</div>
              <div style="font-size:12px;color:#6b7280;">
                Lat: ${userLat.toFixed(4)}<br/>
                Lon: ${userLon.toFixed(4)}
              </div>
            </div>
          `
          markerRef.current.setPopupContent(userPopup).openPopup()
        }
      },
      // Error callback
      (err) => {
        console.error('❌ Geolocation error:', err.message)
        alert(`Could not get location: ${err.message}`)
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 10000,     // 10 second timeout
        maximumAge: 0       // Don't use cached position
      }
    )
  }

  return (
    <div className={`group relative flex flex-col h-full min-h-[500px] ${isFullscreen ? 'fixed inset-0 z-50 bg-black/95 backdrop-blur-xl p-4' : ''}`}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-3xl blur-xl opacity-[0.4]" />
      
      {/* Main Container */}
      <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
        
        {/* HEADER SECTION */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/30">
          {/* Left: Title & Location */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">Interactive World Map</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1"><Navigation className="w-3 h-3" />{locationName}</p>
            </div>
          </div>

          {/* Right: Live Badge & Locate Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-xs font-semibold">LIVE TRACKING</span>
            </div>
            
            <button 
              onClick={handleLocateMe}
              className="flex items-center gap-2 bg-white/10 hover:bg-blue-500/30 hover:border-blue-500/50 px-3 py-1.5 rounded-lg transition-all border border-white/10 hover:scale-105 active:scale-95"
              title="Get your current GPS location"
            >
              <Navigation className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
              <span className="text-sm text-gray-200">Locate Me</span>
            </button>

            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all hover:scale-110 active:scale-95"
              title="Toggle fullscreen mode"
            >
              <Maximize2 className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* LAYER CONTROLS */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-black/20">
          <Layers className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400 mr-2">Layers:</span>
          
          <button 
            onClick={() => setActiveLayer('temperature')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeLayer === 'temperature' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:scale-105'
            }`}
          >
            <Thermometer className="w-4 h-4" />Temperature
          </button>
          
          <button 
            onClick={() => setActiveLayer('precipitation')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeLayer === 'precipitation' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:scale-105'
            }`}
          >
            <Droplets className="w-4 h-4" />Precipitation
          </button>
          
          <button 
            onClick={() => setActiveLayer('wind')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeLayer === 'wind' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:scale-105'
            }`}
          >
            <Wind className="w-4 h-4" />Wind Speed
          </button>
        </div>

        {/* MAP CONTAINER */}
        <div className="relative flex-1 min-h-[350px]">
          {/* Map Element */}
          <div ref={mapRef} className="absolute inset-0 w-full h-full z-0 rounded-b-3xl" />

          {!mapLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80">
              <Loader2 className="w-12 h-12 text-green-400 animate-spin mb-3" />
              <p className="text-sm text-gray-300 font-medium">Loading Map...</p>
            </div>
          )}

          {/* Coordinate Overlay */}
          <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-lg">
            <span className="text-xs font-mono text-white">
              Lat: <strong>{lat.toFixed(4)}</strong> | Lon: <strong>{lon.toFixed(4)}</strong>
            </span>
          </div>

          {/* ✅✅✅ ENHANCED ZOOM CONTROLS WITH VISUAL FEEDBACK ✅✅✅ */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
            {/* Zoom In Button */}
            <button 
              onClick={handleZoomIn}
              disabled={!mapLoaded || isZooming}
              className={`
                w-11 h-11 rounded-xl shadow-xl flex items-center justify-center transition-all duration-200
                ${mapLoaded && !isZooming 
                  ? 'bg-white hover:bg-blue-50 hover:scale-110 active:scale-95 cursor-pointer' 
                  : 'bg-gray-200 cursor-not-allowed opacity-60'
                }
                border-2 ${zoomLevel >= 18 ? 'border-red-300' : 'border-gray-200'}
              `}
              title="Zoom In (+)"
            >
              <ZoomIn className={`w-6 h-6 ${zoomLevel >= 18 ? 'text-red-400' : 'text-gray-700 hover:text-blue-600'}`} />
            </button>

            {/* Zoom Level Indicator */}
            <div className="bg-white/95 px-2 py-1 rounded-lg text-center shadow-md border border-gray-200">
              <span className="text-xs font-bold text-gray-700">{zoomLevel}x</span>
            </div>

            {/* Zoom Out Button */}
            <button 
              onClick={handleZoomOut}
              disabled={!mapLoaded || isZooming}
              className={`
                w-11 h-11 rounded-xl shadow-xl flex items-center justify-center transition-all duration-200
                ${mapLoaded && !isZooming 
                  ? 'bg-white hover:bg-blue-50 hover:scale-110 active:scale-95 cursor-pointer' 
                  : 'bg-gray-200 cursor-not-allowed opacity-60'
                }
                border-2 ${zoomLevel <= 2 ? 'border-red-300' : 'border-gray-200'}
              `}
              title="Zoom Out (-)"
            >
              <ZoomOut className={`w-6 h-6 ${zoomLevel <= 2 ? 'text-red-400' : 'text-gray-700 hover:text-blue-600'}`} />
            </button>

            {/* Divider */}
            <div className="h-px w-8 bg-gray-300 mx-auto my-1" />

            {/* Reset View Button */}
            <button 
              onClick={handleResetView}
              disabled={!mapLoaded}
              className={`
                w-11 h-11 rounded-xl shadow-xl flex items-center justify-center transition-all duration-200
                ${mapLoaded 
                  ? 'bg-white hover:bg-green-50 hover:scale-110 active:scale-95 cursor-pointer' 
                  : 'bg-gray-200 cursor-not-allowed opacity-60'
                }
                border-2 border-gray-200 hover:border-green-300
              `}
              title="Reset to searched location"
            >
              <RotateCcw className="w-6 h-6 text-gray-700 hover:text-green-600" />
            </button>
          </div>

          {/* TEMPERATURE LEGEND */}
          {activeLayer === 'temperature' && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-gray-200 min-w-[160px] animate-fade-in">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                <Thermometer className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-gray-800">Temperature</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span><span className="text-xs text-gray-700"><strong>Hot</strong> ≥36°</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></span><span className="text-xs text-gray-700"><strong>Warm</strong> 33-35°</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></span><span className="text-xs text-gray-700"><strong>Mild</strong> 30-32°</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span><span className="text-xs text-gray-700"><strong>Cool</strong> &lt;30°</span></div>
              </div>
            </div>
          )}

          {/* PRECIPITATION LEGEND */}
          {activeLayer === 'precipitation' && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-gray-200 min-w-[160px] animate-fade-in">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-gray-800">Precipitation</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-900"></span><span className="text-xs text-gray-700"><strong>Heavy</strong> &gt;50mm</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600"></span><span className="text-xs text-gray-700"><strong>Moderate</strong> 20-50mm</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400"></span><span className="text-xs text-gray-700"><strong>Light</strong> 1-20mm</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-200"></span><span className="text-xs text-gray-700"><strong>None</strong> 0mm</span></div>
              </div>
            </div>
          )}

          {/* WIND LEGEND */}
          {activeLayer === 'wind' && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-gray-200 min-w-[160px] animate-fade-in">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                <Wind className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-bold text-gray-800">Wind Speed</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-600"></span><span className="text-xs text-gray-700"><strong>Strong</strong> &gt;60km/h</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500"></span><span className="text-xs text-gray-700"><strong>Moderate</strong> 30-60km/h</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span><span className="text-xs text-gray-700"><strong>Light</strong> 10-30km/h</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-300"></span><span className="text-xs text-gray-700"><strong>Calm</strong> &lt;10km/h</span></div>
              </div>
            </div>
          )}

          {/* LEAFLET ATTRIBUTION */}
          <div className="absolute bottom-1 right-2 z-10 text-[10px] text-gray-600 bg-white/80 px-2 py-0.5 rounded">
            🍃 <strong>Leaflet</strong> | © <strong>OpenStreetMap</strong> contributors
          </div>
        </div>

        {/* FOOTER STATS */}
        <div className="grid grid-cols-3 gap-px bg-white/10 border-t border-white/10">
          <div className="bg-slate-900/90 px-4 py-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Zoom Level</p>
            <p className="text-lg font-bold text-white">{zoomLevel}x</p>
          </div>
          <div className="bg-slate-900/90 px-4 py-3 text-center border-l border-r border-white/10">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Active Markers</p>
            <p className="text-lg font-bold text-white">1</p>
          </div>
          <div className="bg-slate-900/90 px-4 py-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Layer</p>
            <p className="text-lg font-bold capitalize text-white">{activeLayer}</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Close Button */}
      {isFullscreen && (
        <button 
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-[100] bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
        >
          ✕ Exit Fullscreen
        </button>
      )}
    </div>
  )
}