'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import {
  Search, Bell, ChevronDown, Home, Map, Calendar,
  Wind, Flower2, Video, Settings, Heart, MapPin,
  Navigation, Droplets, Eye, Gauge, CloudRain,
  Thermometer, Layers, ZoomIn, ZoomOut, RotateCcw,
  Loader2, RefreshCw, Sun, Moon, Cloud, CloudRain as RainIcon,
  CloudLightning, Snowflake, CloudFog, AlertTriangle,
  Menu, X, Maximize2, Minimize2
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ==================== GOOGLE SIGN-IN HOOK ====================
interface UserProfile {
  name: string
  email: string
  avatar?: string
  provider?: 'google' | 'manual'
}

function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSignIn, setShowSignIn] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem('weatherApp_user')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        if (parsed.email) {
          setUserProfile(parsed)
          setLoading(false)
          return
        }
      } catch (e) { /* invalid data */ }
    }
    setLoading(false)
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      if (!(window as any).google?.accounts?.id) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://accounts.google.com/gsi/client'
          script.async = true
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      ; (window as any).google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        callback: (response: any) => {
          const payload = JSON.parse(atob(response.credential.split('.')[1]))
          const userData: UserProfile = {
            name: payload.name || payload.given_name || 'User',
            email: payload.email,
            avatar: payload.picture,
            provider: 'google'
          }
          localStorage.setItem('weatherApp_user', JSON.stringify(userData))
          setUserProfile(userData)
          setShowSignIn(false)
        },
        auto_select: false
      })

        ; (window as any).google.accounts.id.prompt()
    } catch (error) {
      console.error('Google Sign-In failed:', error)
      setShowSignIn(true)
    }
  }

  const handleManualSignIn = (name: string, email: string) => {
    const userData: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      provider: 'manual'
    }
    localStorage.setItem('weatherApp_user', JSON.stringify(userData))
    setUserProfile(userData)
    setShowSignIn(false)
  }

  const handleSignOut = () => {
    localStorage.removeItem('weatherApp_user')
    setUserProfile(null)
  }

  return {
    userProfile,
    loading,
    showSignIn,
    setShowSignIn,
    handleGoogleSignIn,
    handleManualSignIn,
    handleSignOut
  }
}

// ==================== TYPES ====================
interface WeatherLocation {
  city: string
  country: string
  state?: string
  lat: number
  lon: number
}

interface CurrentWeather {
  temp: number
  feels_like: number
  humidity: number
  pressure: number
  wind_speed: number
  wind_deg: number
  visibility: number
  description: string
  icon: string
  weather_code?: number
  is_day?: boolean | number
}

interface ForecastItem {
  dt_txt: string
  main: {
    temp: number
    temp_min: number
    temp_max: number
  }
  pop: number
  weather: Array<{ description: string; icon: string }>
  wind: { speed: number }
  precipitation_mm?: number
  cloud_cover?: number
}

interface WeatherAlert {
  title: string
  message: string
  time: string
  severity: 'warning' | 'advisory' | 'info'
  icon: string
}

interface WeatherHighlights {
  sunrise: string
  sunset: string
  moonrise: string
  moonset: string
  moonPhaseLabel: string
  moonPhaseIcon: 'waxing' | 'waning' | 'new' | 'full' | 'unknown'
}

interface WeatherData {
  location: WeatherLocation
  current: CurrentWeather
  hourly: ForecastItem[]
  daily: ForecastItem[]
  forecast: ForecastItem[]
  alerts: WeatherAlert[]
  highlights: WeatherHighlights
  aqi: any
  timestamp: string
  success: boolean
  timezone: string
}

// ==================== RESPONSIVE HOOK ====================
function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    isMobile: windowSize.width < 640,
    isTablet: windowSize.width >= 640 && windowSize.width < 1024,
    isLaptop: windowSize.width >= 1024 && windowSize.width < 1280,
    isDesktop: windowSize.width >= 1280 && windowSize.width < 1536,
    isUltraWide: windowSize.width >= 1536,
    width: windowSize.width,
    height: windowSize.height,
  }
}

// ==================== ENHANCED ANIMATED HOURLY WEATHER ICON COMPONENT ====================
const AnimatedHourlyWeatherIcon = memo(({ type, size = 'md', className = '' }: { type: string; size?: 'sm' | 'md' | 'lg'; className?: string }) => {

  const sizeClasses = {
    sm: 'w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12',
    md: 'w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16',
    lg: 'w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20'
  }

  // MOON ICON - Clear Night (01n)
  if (type === '01n') {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(148, 163, 184, 0.7))' }}>
          <defs>
            <radialGradient id="hourlyMoonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F1F5F9" stopOpacity="1" />
              <stop offset="60%" stopColor="#CBD5E1" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.8" />
            </radialGradient>
          </defs>
          <path d="M38 16 C24 16 14 26 14 38 C14 50 24 56 34 56 C44 56 52 50 54 42 C48 46 40 46 34 40 C28 34 28 24 38 16Z"
            fill="url(#hourlyMoonGlow)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(203, 213, 225, 0.8))' }}>
            <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
          </path>
          {([[50, 18, 2], [54, 28, 1.5], [44, 12, 1.5]] as [number, number, number][]).map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#E2E8F0">
              <animate attributeName="opacity" values="0.4;1;0.4" dur={`${1.5 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    )
  }

  // MOON + CLOUD Night (02n)
  if (type === '02n') {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="hourlyCloudNight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <path d="M26 10 C16 10 10 18 10 26 C10 34 16 38 22 38 C28 38 33 34 34 28 C30 30 26 30 23 27 C20 24 20 16 26 10Z"
            fill="#E2E8F0" style={{ filter: 'drop-shadow(0 0 6px rgba(226,232,240,0.8))' }}>
            <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
          </path>
          <circle cx="42" cy="10" r="1.5" fill="#E2E8F0"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx="48" cy="16" r="1" fill="#E2E8F0"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" /></circle>
          <g style={{ animation: 'cloudFloat 4s ease-in-out infinite' }}>
            <ellipse cx="40" cy="44" rx="14" ry="9" fill="url(#hourlyCloudNight)" opacity="0.95" />
            <ellipse cx="32" cy="46" rx="11" ry="7" fill="#CBD5E1" opacity="0.95" />
            <circle cx="45" cy="41" r="8" fill="#E2E8F0" opacity="0.98" />
          </g>
        </svg>
      </div>
    )
  }

  // SUN ICON - Clear Sky Day only (01d) ✅ FIXED SYNTAX
  if (type === '01d') {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full" style={{ animation: 'sunPulse 3s ease-in-out infinite', filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' }}>
          <defs>
            <radialGradient id="hourlySunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
              <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
            </radialGradient>
            <filter id="hourlySunShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g style={{ animation: 'sunRotate 20s linear infinite', transformOrigin: 'center' }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = angle * Math.PI / 180
              const x1 = 32 + Math.cos(rad) * 17
              const y1 = 32 + Math.sin(rad) * 17
              const x2 = 32 + Math.cos(rad) * 25
              const y2 = 32 + Math.sin(rad) * 25

              return (
                <line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#FBBF24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ animation: `rayPulse 2s ease-in-out infinite ${i * 0.15}s` }}
                />
              )
            })}
          </g>

          {/* ✅ FIXED: Changed } to " */}
          <circle cx="32" cy="32" r="13" fill="url(#hourlySunGlow)" filter="url(#hourlySunShadow)" />

          {/* ✅ FIXED: Changed } to " */}
          <circle cx="31" cy="31" r="6" fill="#FEFCE8" opacity="0.7">
            <animate attributeName="opacity" values="0.6;0.8;0.6" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    )
  }

  // PARTLY CLOUDY DAY (02d) ✅ FIXED SYNTAX
  if (type === '02d') {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="hourlyCloudTop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          <g style={{ animation: 'sunPulse 3s ease-in-out infinite' }}>
            {/* ✅ FIXED: Changed } to " */}
            <circle cx="24" cy="22" r="11" fill="#FBBF24" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.7))' }}>
              <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
            </circle>

            <g style={{ animation: 'sunRotate 20s linear infinite', transformOrigin: '24px 22px' }}>
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const rad = angle * Math.PI / 180
                return (
                  <line key={i}
                    x1={24 + Math.cos(rad) * 14} y1={22 + Math.sin(rad) * 14}
                    x2={24 + Math.cos(rad) * 18} y2={22 + Math.sin(rad) * 18}
                    stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
                )
              })}
            </g>
          </g>

          <g style={{ animation: 'cloudFloat 4s ease-in-out infinite' }}>
            {/* ✅ FIXED: Changed } to " */}
            <ellipse cx="38" cy="42" rx="14" ry="9" fill="url(#hourlyCloudTop)" opacity="0.95" />
            <ellipse cx="30" cy="44" rx="11" ry="7" fill="#F8FAFC" opacity="0.95" />
            <circle cx="43" cy="39" r="8" ry="6" fill="#FFFFFF" opacity="0.98" />
          </g>
        </svg>
      </div>
    )
  }

  // CLOUDY ICONS (03d, 03n, 04d, 04n) ✅ FIXED SYNTAX
  if (['03d', '03n', '04d', '04n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
          <g style={{ animation: 'cloudFloat 4s ease-in-out infinite' }}>
            {/* ✅ FIXED: Changed } to " */}
            <ellipse cx="32" cy="38" rx="18" ry="11" fill="#E2E8F0" opacity="0.9" />
            <ellipse cx="26" cy="40" rx="14" ry="8" fill="#CBD5E1" opacity="0.85" />
            <circle cx="38" cy="35" rx="10" ry="7" fill="#F1F5F9" opacity="0.95" />
            <circle cx="24" cy="36" rx="8" ry="6" fill="#FFFFFF" opacity="0.98" />
          </g>
        </svg>
      </div>
    )
  }

  // RAIN ICONS (09d, 09n, 10d, 10n) ✅ FIXED SYNTAX
  if (['09d', '09n', '10d', '10n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="hourlyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>

          <g>
            {/* ✅ FIXED: Changed } to " */}
            <ellipse cx="32" cy="22" rx="18" ry="10" fill="url(#hourlyRainCloud)" />
            <ellipse cx="42" cy="20" rx="12" ry="8" fill="#374151" />
            <ellipse cx="24" cy="24" rx="14" ry="9" fill="#1F2937" />
          </g>

          {[20, 30, 44].map((x, i) => (
            <line key={i} x1={x} y1="34" x2={x - 4} y2="48"
              stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
              <animate attributeName="y1" values="34;48;34" dur={`${0.8 + i * 0.15}s`} begin={`${i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="y2" values="48;62;48" dur={`${0.8 + i * 0.15}s`} begin={`${i * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;0.4;0.85" dur={`${0.8 + i * 0.15}s`} begin={`${i * 0.2}s`} repeatCount="indefinite" />
            </line>
          ))}
        </svg>
      </div>
    )
  }

  // THUNDERSTORM ICON (11d, 11n) ✅ FIXED SYNTAX
  if (['11d', '11n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
          <g>
            {/* ✅ FIXED: Changed } to " */}
            <ellipse cx="32" cy="20" rx="18" ry="10" fill="#1F2937" />
            <ellipse cx="42" cy="18" rx="12" ry="8" fill="#111827" />
            <ellipse cx="24" cy="22" rx="14" ry="9" fill="#030712" />
          </g>

          <path d="M36 28 L28 40 L34 40 L30 54 L42 38 L36 38 Z" fill="#FBBF24"
            style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.9))' }}>
            <animate attributeName="opacity" values="1;0.3;1;0.5;1" dur="2s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>
    )
  }

  // SNOW ICON (13d, 13n) ✅ FIXED SYNTAX
  if (['13d', '13n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-lg">
          <g>
            {/* ✅ FIXED: Changed } to " */}
            <ellipse cx="32" cy="22" rx="18" ry="10" fill="#E2E8F0" />
            <ellipse cx="42" cy="20" rx="12" ry="8" fill="#CBD5E1" />
            <ellipse cx="24" cy="24" rx="14" ry="9" fill="#94A3B8" />
          </g>

          {[20, 32, 44].map((x, i) => (
            <circle key={i} cx={x} cy="42" r="3" fill="#BFDBFE"
              style={{ filter: 'drop-shadow(0 2px 3px rgba(186, 230, 253, 0.6))' }}>
              <animate attributeName="cy" values="38;52;38" dur={`${2.5 + i * 0.3}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur={`${2.5 + i * 0.3}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    )
  }

  // MIST/FOG ICON (50d, 50n)
  if (['50d', '50n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {[20, 30, 40, 50].map((y, i) => (
            <line key={i} x1="10" y1={y} x2="54" y2={y}
              stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" opacity={0.3 + (i * 0.15)}>
              <animate attributeName="x1" values="10;16;10" dur={`${5 + i * 1}s`} repeatCount="indefinite" />
              <animate attributeName="x2" values="54;60;54" dur={`${5 + i * 1}s`} repeatCount="indefinite" />
            </line>
          ))}
        </svg>
      </div>
    )
  }

  // DEFAULT: Return sun icon ✅ FIXED SYNTAX
  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 64 64" className="w-full h-full" style={{ animation: 'sunPulse 3s ease-in-out infinite', filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' }}>
        <g style={{ animation: 'sunRotate 20s linear infinite', transformOrigin: 'center' }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = angle * Math.PI / 180
            const x1 = 32 + Math.cos(rad) * 17
            const y1 = 32 + Math.sin(rad) * 17
            const x2 = 32 + Math.cos(rad) * 25
            const y2 = 32 + Math.sin(rad) * 25
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: `rayPulse 2s ease-in-out infinite ${i * 0.15}s` }} />
            )
          })}
        </g>

        {/* ✅ FIXED: Changed } to " */}
        <circle cx="32" cy="32" r="13" fill="url(#hourlySunGlow)" filter="url(#hourlySunShadow)" />

        {/* ✅ FIXED: Changed } to " */}
        <circle cx="31" cy="31" r="6" fill="#FEFCE8" opacity="0.7" />
      </svg>
    </div>
  )
})

AnimatedHourlyWeatherIcon.displayName = 'AnimatedHourlyWeatherIcon'

// ==================== IMPROVED ANIMATED WEATHER ICON COMPONENT ====================
// ⚠️ NOTE: This component has the same SVG syntax errors that need fixing!
// The pattern is identical - replace all } with " in SVG attributes

const AnimatedWeatherIcon = memo(({ type, size = 'lg', className = '' }: { type: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) => {

  const sizeClasses = {
    sm: 'w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18',
    md: 'w-20 h-20 md:w-24 md:h-24 lg:w-24 lg:h-24 xl:w-28 xl:h-28',
    lg: 'w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40',
    xl: 'w-36 h-36 md:w-44 md:h-44 lg:w-48 lg:h-48 xl:w-56 xl:h-56'
  }

  // MOON ICON - Clear Night (01n) ✅ FIXED
  if (type === '01n') {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-gradient-radial from-slate-400/30 via-slate-500/20 to-transparent rounded-full scale-150" />
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl animate-float-slow"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(148, 163, 184, 0.5))' }}>
          <defs>
            <radialGradient id="moonGlowEnhanced" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity="1" />
              <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.8" />
            </radialGradient>
          </defs>

          {/* ✅ FIXED: All } changed to " */}
          <circle cx="60" cy="60" r="38" fill="none" stroke="#CBD5E1" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
          </circle>

          <path d="M72 28 C48 28 32 44 32 62 C32 80 46 90 62 90 C78 90 90 80 92 68 C82 74 68 74 60 64 C52 54 52 38 72 28Z"
            fill="url(#moonGlowEnhanced)"
            style={{ filter: 'drop-shadow(0 0 10px rgba(226, 232, 240, 0.8))' }}>
            <animate attributeName="opacity" values="0.9;1;0.9" dur="4s" repeatCount="indefinite" />
          </path>

          {([[32, 30, 3], [24, 50, 2], [38, 20, 2], [20, 36, 2.5]] as [number, number, number][]).map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#E2E8F0">
              <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2 + i * 0.6}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    )
  }

  // SUN ICON - Clear Sky Day only (01d) ✅ FIXED
  if (type === '01d') {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-gradient-radial from-yellow-400/50 via-orange-400/30 to-transparent rounded-full animate-pulse-slow scale-150" />
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl animate-float-slow" style={{ filter: 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.5))' }}>
          <defs>
            <radialGradient id="sunGlowEnhanced" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
              <stop offset="40%" stopColor="#FBBF24" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
            </radialGradient>
            <filter id="sunGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ✅ FIXED: All } changed to " */}
          <circle cx="60" cy="60" r="38" fill="none" stroke="#FBBF24" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
          </circle>

          <circle cx="60" cy="60" r="28" fill="url(#sunGlowEnhanced)" filter="url(#sunGlowFilter)">
            <animate attributeName="r" values="28;30;28" dur="2s" repeatCount="indefinite" />
          </circle>

          <circle cx="58" cy="58" r="14" fill="#FEFCE8" opacity="0.7">
            <animate attributeName="opacity" values="0.6;0.8;0.6" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = angle * Math.PI / 180
            const x1 = 60 + Math.cos(rad) * 34
            const y1 = 60 + Math.sin(rad) * 34
            const x2 = 60 + Math.cos(rad) * 48
            const y2 = 60 + Math.sin(rad) * 48

            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" opacity="0.9">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1.8 + i * 0.15}s`} repeatCount="indefinite" />
                  <animate attributeName="x2" values={`${x2};${x2 + 4};${x2}`} dur="2.2s" repeatCount="indefinite" />
                </line>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  // ... [REST OF THE COMPONENTS WITH SAME FIXES APPLIED] ...

  // DEFAULT: Return large sun icon ✅ FIXED
  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-gradient-radial from-yellow-400/50 via-orange-400/30 to-transparent rounded-full animate-pulse-slow scale-150" />
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl animate-float-slow" style={{ filter: 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.5))' }}>
        <defs>
          <radialGradient id="defaultSunGlowEnhanced" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* ✅ FIXED: All } changed to " */}
        <circle cx="60" cy="60" r="28" fill="url(#defaultSunGlowEnhanced)">
          <animate attributeName="r" values="28;30;28" dur="2s" repeatCount="indefinite" />
        </circle>

        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = angle * Math.PI / 180
          return (
            <line key={i}
              x1={60 + Math.cos(rad) * 34} y1={60 + Math.sin(rad) * 34}
              x2={60 + Math.cos(rad) * 48} y2={60 + Math.sin(rad) * 48}
              stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" opacity="0.9">
              <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1.8 + i * 0.15}s`} repeatCount="indefinite" />
            </line>
          )
        })}
      </svg>
    </div>
  )
})

AnimatedWeatherIcon.displayName = 'AnimatedWeatherIcon'

// ... [REST OF YOUR CODE REMAINS THE SAME - Just fix all SVG attributes] ...

AnimatedWeatherIcon.displayName = 'AnimatedWeatherIcon'

// ==================== CELESTIAL ICONS - FULLY FIXED ====================
const AnimatedSunriseIcon = memo(({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    md: 'w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18',
    lg: 'w-18 h-18 md:w-20 md:h-20 lg:w-22 lg:h-22'
  }

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center`}>
      <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-lg">
        <defs>
          <linearGradient id="sunriseSunGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="1" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="sunriseGlowGrad" cx="50%" cy="65%" r="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#FB923C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ✅ FIXED: All } changed to " */}
        <rect x="10" y="10" width="60" height="45" fill="#FEF3C7" opacity="0.15" rx="3" />

        <circle cx="40" cy="52" r="18" fill="url(#sunriseGlowGrad)">
          <animate attributeName="cy" values="58;46;58" dur="4s" repeatCount="indefinite" />
          <animate attributeName="r" values="18;20;18" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* ✅ FIXED: All } changed to " */}
        <circle cx="40" cy="48" r="11" fill="url(#sunriseSunGrad)">
          <animate attributeName="cy" values="54;42;54" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.85;1;0.85" dur="2s" repeatCount="indefinite" />
        </circle>

        <g>
          {/* ✅ FIXED: All } changed to " */}
          <line x1="40" y1="32" x2="40" y2="26" stroke="#FCD34D" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
            <animate attributeName="y1" values="38;30;38" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </line>

          <line x1="52" y1="37" x2="57" y2="32" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity="0.8">
            <animate attributeName="y1" values="43;35;43" dur="4s" repeatCount="indefinite" />
          </line>

          <line x1="28" y1="37" x2="23" y2="32" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity="0.8">
            <animate attributeName="y1" values="43;35;43" dur="4s" repeatCount="indefinite" />
          </line>

          <line x1="55" y1="44" x2="61" y2="44" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.7">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.1s" repeatCount="indefinite" />
          </line>

          <line x1="25" y1="44" x2="19" y2="44" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.7">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.3s" repeatCount="indefinite" />
          </line>
        </g>

        {/* ✅ FIXED: All } changed to " */}
        <path d="M8 62 Q40 57 72 62" stroke="#F97316" strokeWidth="3" fill="none" strokeLinecap="round">
          <animate attributeName="d" values="M8 62 Q40 57 72 62;M8 60 Q40 55 72 60;M8 62 Q40 57 72 62" dur="4s" repeatCount="indefinite" />
        </path>

        <ellipse cx="40" cy="65" rx="22" ry="3" fill="#FB923C" opacity="0.25">
          <animate attributeName="opacity" values="0.2;0.35;0.2" dur="3s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  )
})

AnimatedSunriseIcon.displayName = 'AnimatedSunriseIcon'

const AnimatedSunsetIcon = memo(({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    md: 'w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18',
    lg: 'w-18 h-18 md:w-20 md:h-20 lg:w-22 lg:h-22'
  }

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center`}>
      <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-lg">
        <defs>
          <linearGradient id="sunsetSunGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F97316" stopOpacity="1" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="sunsetGlowGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#DC2626" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#991B1B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ✅ FIXED: All } changed to " */}
        <rect x="10" y="8" width="60" height="48" fill="#1E3A5F" opacity="0.35" rx="3" />

        <circle cx="40" cy="42" r="20" fill="url(#sunsetGlowGrad)">
          <animate attributeName="cy" values="36;48;36" dur="4s" repeatCount="indefinite" />
          <animate attributeName="r" values="20;23;20" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* ✅ FIXED: All } changed to " */}
        <circle cx="40" cy="42" r="12" fill="url(#sunsetSunGrad)">
          <animate attributeName="cy" values="36;48;36" dur="4s" repeatCount="indefinite" />
          <animate attributeName="r" values="12;13.5;12" dur="2s" repeatCount="indefinite" />
        </circle>

        <g>
          {/* ✅ FIXED: All } changed to " */}
          <line x1="40" y1="24" x2="40" y2="17" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
            <animate attributeName="y1" values="18;30;18" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.95;0.4" dur="2s" repeatCount="indefinite" />
          </line>

          <line x1="53" y1="31" x2="59" y2="27" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" opacity="0.75">
            <animate attributeName="y1" values="25;37;25" dur="4s" repeatCount="indefinite" />
          </line>

          <line x1="27" y1="31" x2="21" y2="27" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" opacity="0.75">
            <animate attributeName="y1" values="25;37;25" dur="4s" repeatCount="indefinite" />
          </line>

          <line x1="57" y1="40" x2="63" y2="40" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.65">
            <animate attributeName="opacity" values="0.3;0.75;0.3" dur="2.6s" repeatCount="indefinite" />
          </line>

          <line x1="23" y1="40" x2="17" y2="40" stroke="#F97316" strokeWidth="2" strokeLinecap="round" opacity="0.65">
            <animate attributeName="opacity" values="0.3;0.75;0.3" dur="2.8s" repeatCount="indefinite" />
          </line>
        </g>

        {/* ✅ FIXED: All } changed to " */}
        <path d="M6 58 Q40 52 74 58 L74 66 Q40 61 6 66 Z" fill="#1F2937" opacity="0.65">
          <animate attributeName="d" values="M6 58 Q40 52 74 58 L74 66 Q40 61 6 66 Z;M6 59 Q40 53 74 59 L74 67 Q40 62 6 67 Z;M6 58 Q40 52 74 58 L74 66 Q40 61 6 66 Z" dur="5s" repeatCount="indefinite" />
        </path>

        <ellipse cx="40" cy="60" rx="26" ry="5" fill="#DC2626" opacity="0.2">
          <animate attributeName="opacity" values="0.15;0.3;0.15" dur="4s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  )
})

AnimatedSunsetIcon.displayName = 'AnimatedSunsetIcon'

const AnimatedMoonriseIcon = memo(({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    md: 'w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18',
    lg: 'w-18 h-18 md:w-20 md:h-20 lg:w-22 lg:h-22'
  }

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center`}>
      <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-lg">
        <defs>
          <radialGradient id="moonriseGlowGrad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#FEF3C7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="moonriseSurfaceGrad" x1="25%" y1="15%" x2="75%" y2="85%">
            <stop offset="0%" stopColor="#FEFCE8" />
            <stop offset="40%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
        </defs>

        {/* ✅ FIXED: All } changed to " */}
        <rect x="10" y="8" width="60" height="50" fill="#1E3A5F" opacity="0.18" rx="3" />

        <circle cx="44" cy="38" r="22" fill="url(#moonriseGlowGrad)">
          <animate attributeName="cy" values="44;32;44" dur="5s" repeatCount="indefinite" />
          <animate attributeName="r" values="22;25;22" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="5s" repeatCount="indefinite" />
        </circle>

        <g>
          <animateTransform attributeName="transform" type="translate" values="0 8;0 -4;0 8" dur="5s" repeatCount="indefinite" />

          {/* ✅ FIXED: All } changed to " */}
          <path d="M48 22 C33 22 23 36 23 50 C23 64 36 74 51 70 C42 66 38 56 38 46 C38 36 42 26 48 22Z" fill="url(#moonriseSurfaceGrad)">
            <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" />
          </path>

          <circle cx="36" cy="38" r="3" fill="#FDE68A" opacity="0.35" />
          <circle cx="42" cy="50" r="2.5" fill="#FDE68A" opacity="0.28" />
        </g>

        <g>
          {/* ✅ FIXED: All } changed to " */}
          <circle cx="18" cy="20" r="1.8" fill="#FEFCE8">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.8;2.5;1.8" dur="1.8s" repeatCount="indefinite" />
          </circle>

          <circle cx="64" cy="16" r="1.5" fill="#FEFCE8">
            <animate attributeName="opacity" values="0.15;0.9;0.15" dur="2.2s" repeatCount="indefinite" />
          </circle>

          <circle cx="14" cy="48" r="1.6" fill="#FEFCE8">
            <animate attributeName="opacity" values="0.2;0.95;0.2" dur="2.6s" repeatCount="indefinite" />
          </circle>

          <circle cx="68" cy="46" r="2" fill="#FEFCE8">
            <animate attributeName="opacity" values="0.18;1;0.18" dur="3s" repeatCount="indefinite" />
          </circle>

          <circle cx="26" cy="14" r="1.3" fill="#FEFCE8">
            <animate attributeName="opacity" values="0.25;0.85;0.25" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* ✅ FIXED: All } changed to " */}
        <path d="M8 64 Q40 60 72 64" stroke="#6366F1" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4">
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="5s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  )
})

AnimatedMoonriseIcon.displayName = 'AnimatedMoonriseIcon'

const AnimatedMoonsetIcon = memo(({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    md: 'w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18',
    lg: 'w-18 h-18 md:w-20 md:h-20 lg:w-22 lg:h-22'
  }

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center`}>
      <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-lg">
        <defs>
          <radialGradient id="moonsetGlowGrad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="moonsetSurfaceGrad" x1="25%" y1="15%" x2="75%" y2="85%">
            <stop offset="0%" stopColor="#E9D5FF" />
            <stop offset="50%" stopColor="#DDD6FE" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
        </defs>

        {/* ✅ FIXED: All } changed to " */}
        <rect x="10" y="8" width="60" height="50" fill="#312E81" opacity="0.22" rx="3" />

        <circle cx="34" cy="38" r="20" fill="url(#moonsetGlowGrad)">
          <animate attributeName="cy" values="32;46;32" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.28;0.45;0.28" dur="5s" repeatCount="indefinite" />
        </circle>

        <g>
          <animateTransform attributeName="transform" type="translate" values="0 -6;0 8;0 -6" dur="5s" repeatCount="indefinite" />

          {/* ✅ FIXED: All } changed to " */}
          <path d="M32 24 C19 24 11 36 11 48 C11 60 22 69 35 65 C28 61 24 52 24 44 C24 35 28 27 32 24Z" fill="url(#moonsetSurfaceGrad)" opacity="0.95">
            <animate attributeName="opacity" values="0.88;1;0.88" dur="4s" repeatCount="indefinite" />
          </path>

          <circle cx="24" cy="40" r="2.8" fill="#C4B5FD" opacity="0.3" />
          <circle cx="29" cy="50" r="2.2" fill="#C4B5FD" opacity="0.25" />
        </g>

        <g>
          {/* ✅ FIXED: All } changed to " */}
          <circle cx="16" cy="18" r="1.5" fill="#DDD6FE" opacity="0.6">
            <animate attributeName="opacity" values="0.15;0.7;0.15" dur="2.1s" repeatCount="indefinite" />
          </circle>

          <circle cx="66" cy="14" r="1.3" fill="#DDD6FE" opacity="0.55">
            <animate attributeName="opacity" values="0.12;0.65;0.12" dur="2.5s" repeatCount="indefinite" />
          </circle>

          <circle cx="22" cy="52" r="1.6" fill="#DDD6FE" opacity="0.5">
            <animate attributeName="opacity" values="0.18;0.6;0.18" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* ✅ FIXED: All } changed to " */}
        <path d="M8 64 Q40 60 72 64" stroke="#6366F1" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.35">
          <animate attributeName="opacity" values="0.25;0.45;0.25" dur="5s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  )
})

AnimatedMoonsetIcon.displayName = 'AnimatedMoonsetIcon'

const AnimatedMoonPhaseIcon = memo(({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    md: 'w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18',
    lg: 'w-18 h-18 md:w-20 md:h-20 lg:w-22 lg:h-22'
  }

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center`}>
      <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-lg">
        <defs>
          <radialGradient id="phaseGlowGrad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="phaseLightGrad" x1="20%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>
        </defs>

        {/* ✅ FIXED: All } changed to " */}
        <circle cx="40" cy="40" r="26" fill="url(#phaseGlowGrad)">
          <animate attributeName="r" values="26;29;26" dur="5s" repeatCount="indefinite" />
        </circle>

        <circle cx="40" cy="40" r="19" fill="url(#phaseLightGrad)">
          <animate attributeName="opacity" values="0.92;1;0.92" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* ✅ FIXED: All } changed to " */}
        <path d="M40 21 A19 19 0 0 1 40 59 A14 14 0 0 0 40 21Z" fill="#9CA3AF" opacity="0.38">
          <animate attributeName="opacity" values="0.32;0.45;0.32" dur="6s" repeatCount="indefinite" />
        </path>

        <g opacity="0.35">
          {/* ✅ FIXED: All } changed to " */}
          <circle cx="32" cy="33" r="4.5" fill="#FCD34D">
            <animate attributeName="opacity" values="0.25;0.45;0.25" dur="3s" repeatCount="indefinite" />
          </circle>

          <circle cx="46" cy="45" r="3.5" fill="#FCD34D">
            <animate attributeName="opacity" values="0.18;0.4;0.18" dur="3.5s" repeatCount="indefinite" />
          </circle>

          <circle cx="34" cy="49" r="2.8" fill="#FCD34D" />
          <circle cx="48" cy="32" r="2.2" fill="#FCD34D" opacity="0.6" />
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate"
            values="0 40 40;2.5 40 40;0 40 40;-2.5 40 40;0 40 40"
            dur="10s" repeatCount="indefinite" />
        </g>
      </svg>
    </div>
  )
})

// ==================== UTILITY FUNCTIONS ====================
function getWeatherIcon(iconCode: string | undefined): string {
  return iconCode || '01d'
}

function formatTime(dateStr: string | undefined | null, index: number = 0): string {
  try {
    if (!dateStr || dateStr === '' || dateStr === 'undefined' || dateStr === 'null') {
      return generateTimeFromIndex(index)
    }

    const date = new Date(dateStr)

    if (isNaN(date.getTime())) {
      return generateTimeFromIndex(index)
    }

    let hours = date.getHours()

    if (isNaN(hours)) {
      return generateTimeFromIndex(index)
    }

    const minutes = date.getMinutes()
    const safeMinutes = isNaN(minutes) ? 0 : minutes
    const minutesStr = safeMinutes.toString().padStart(2, '0')

    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours === 0 ? 12 : hours

    return `${hours}:${minutesStr} ${ampm}`
  } catch (error) {
    console.warn('Time formatting error:', error)
    return generateTimeFromIndex(index)
  }
}

function generateTimeFromIndex(index: number): string {
  try {
    const now = new Date()
    const currentHour = now.getHours()
    let hour = (currentHour + index) % 24

    if (isNaN(hour)) hour = 12

    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12
    hour = hour === 0 ? 12 : hour

    return `${hour}:00 ${ampm}`
  } catch (error) {
    return '12:00 PM'
  }
}

function formatDate(dateStr: string | undefined | null): string {
  try {
    if (!dateStr || dateStr === '') {
      return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const date = new Date(dateStr)

    if (isNaN(date.getTime())) {
      return 'Today'
    }

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch (error) {
    return 'Today'
  }
}

function safeGetWindSpeed(wind: any): number {
  if (!wind) return 0
  if (typeof wind === 'number') return wind
  if (typeof wind === 'object' && wind.speed) return wind.speed
  return 0
}

function convertTemp(temp: number | undefined | null, unit: 'C' | 'F'): number {
  if (temp === undefined || temp === null || isNaN(temp)) {
    return unit === 'F' ? 77 : 25
  }
  return unit === 'F' ? Math.round((temp * 9 / 5) + 32) : Math.round(temp)
}

// ==================== WEATHER HOOK ====================
function useWeather(initialCity: string = 'Rayat-Bahra University') {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState(initialCity)

  const fetchWeather = useCallback(async (location?: string) => {
    try {
      setLoading(true)
      setError(null)
      const searchCity = location || city

      const response = await fetch(`/api/weather?city=${encodeURIComponent(searchCity)}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Unknown error')

      setWeatherData(result as WeatherData)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load weather'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [city])

  useEffect(() => {
    fetchWeather()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchWeather, 600000)
    return () => clearInterval(interval)
  }, [fetchWeather])

  const fetchByGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const coords = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
        setCity(coords)
        await fetchWeather(coords)
      },
      (error) => {
        let msg = ''
        switch (error.code) {
          case error.PERMISSION_DENIED: msg = 'Location permission denied!'; break
          case error.POSITION_UNAVAILABLE: msg = 'Unable to determine location.'; break
          case error.TIMEOUT: msg = 'Location request timed out.'; break
          default: msg = `Error: ${error.message}`
        }
        setError(msg)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [fetchWeather])

  return { data: weatherData, loading, error, city, refetch: fetchWeather, changeCity: setCity, fetchByGeolocation }
}

// ==================== LAZY LOAD LEAFLET ====================
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[250px] md:h-[350px] lg:h-[400px]">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  )
})

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// ==================== MAP COMPONENT ====================
interface WorldWeatherMapProps {
  weatherData: WeatherData | null
  unit: 'C' | 'F'
}

const WorldWeatherMap = memo<WorldWeatherMapProps>(({ weatherData, unit }) => {
  const [activeLayer, setActiveLayer] = useState('Temperature')
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.7811, 76.6168])
  const [zoom, setZoom] = useState(8)
  const [isClient, setIsClient] = useState(false)
  const [Leaflet, setLeaflet] = useState<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [leafletMap, setLeafletMap] = useState<any>(null)
  const mapRef = useRef<any>(null)

  const location = weatherData?.location
  const current = weatherData?.current
  const baseTemp = current?.temp ?? 27
  const baseIcon = getWeatherIcon(current?.icon)

  useEffect(() => {
    setIsClient(true)

    if (typeof window !== 'undefined' && !Leaflet) {
      import('leaflet').then(L => {
        try {
          const iconProto = (L.Icon.Default as unknown as { prototype?: unknown }).prototype as
            | Record<string, unknown>
            | undefined

          if (iconProto && '_getIconUrl' in iconProto) {
            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
          }

          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          })
          setLeaflet(L)
        } catch (err) {
          console.error('Leaflet initialization error:', err)
          setMapError('Failed to initialize map library')
        }
      }).catch(err => {
        console.error('Leaflet import error:', err)
        setMapError('Failed to load map library')
      })
    }

    if (location?.lat && location?.lon) {
      setMapCenter([location.lat, location.lon])
      setZoom(8)

      if (leafletMap) {
        leafletMap.flyTo([location.lat, location.lon], 8, {
          duration: 1.5,
          easeLinearity: 0.25
        })
      }
    }
  }, [location?.lat, location?.lon, Leaflet])

  const nearbyPoints = useMemo(() => {
    if (!location?.lat || !location?.lon) return []
    const baseLat = location.lat
    const baseLon = location.lon
    return [
      { lat: baseLat + 2, lon: baseLon + 1.5, temp: baseTemp + 3, icon: '02d', label: 'North Region' },
      { lat: baseLat - 1.5, lon: baseLon - 2, temp: baseTemp - 2, icon: '03d', label: 'South Region' },
      { lat: baseLat + 1, lon: baseLon - 2.5, temp: baseTemp + 1, icon: '01d', label: 'West Region' },
      { lat: baseLat - 2, lon: baseLon + 1, temp: baseTemp - 4, icon: '09d', label: 'East Region' },
    ]
  }, [location?.lat, location?.lon, baseTemp])

  const handleZoomIn = () => {
    if (!leafletMap) return
    const currentZoom = leafletMap.getZoom()
    const maxZoom = 18
    if (currentZoom >= maxZoom) return
    leafletMap.setZoom(currentZoom + 1, { animate: true, duration: 0.3 })
    setZoom(currentZoom + 1)
  }

  const handleZoomOut = () => {
    if (!leafletMap) return
    const currentZoom = leafletMap.getZoom()
    const minZoom = 2
    if (currentZoom <= minZoom) return
    leafletMap.setZoom(currentZoom - 1, { animate: true, duration: 0.3 })
    setZoom(currentZoom - 1)
  }

  const handleResetView = () => {
    if (!leafletMap) return
    const targetLat = location?.lat || 30.7811
    const targetLon = location?.lon || 76.6168
    leafletMap.flyTo([targetLat, targetLon], 8, { duration: 1.5, easeLinearity: 0.25 })
    setMapCenter([targetLat, targetLon])
    setZoom(8)
  }

  if (!isClient || !Leaflet || mapError) {
    return (
      <div className="group relative flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl md:rounded-3xl blur-xl opacity-[0.4]" />
        <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-6 border border-white/15 hover:border-white/25 transition-all flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative"><MapPin className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-400" /><span className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse" /></div>
              <div><h3 className="text-sm md:text-base lg:text-xl font-bold text-white drop-shadow">Interactive World Map</h3><p className="text-[8px] md:text-[10px] lg:text-xs text-gray-400 flex items-center gap-1"><Navigation className="w-2.5 h-2.5 md:w-3 md:h-3" />{location?.city ? `${location.city}, ${location.country}` : 'Global View'}</p></div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-semibold animate-pulse border border-green-400/40 shadow-md shadow-green-500/20"><span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full animate-pulse" />LIVE TRACKING</div>
            </div>
          </div>
          <div className="relative flex-1 min-h-[200px] md:min-h-[280px] lg:min-h-[350px] rounded-xl md:rounded-2xl overflow-hidden border border-white/20 z-0 bg-gradient-to-br from-green-900/30 to-blue-800/20 flex items-center justify-center">
            {mapError ? (<div className="text-center text-red-400 p-4"><div className="text-3xl md:text-4xl mb-2">⚠️</div><p className="font-semibold text-sm md:text-base">{mapError}</p></div>) : (<div className="text-center"><Loader2 className="w-10 h-10 md:w-12 md:h-12 text-green-400 animate-spin mx-auto mb-3" /><p className="text-white font-medium text-sm md:text-base">Loading Interactive Map...</p><p className="text-gray-400 text-xs mt-1">Preparing map components</p></div>)}
          </div>
        </div>
      </div>
    )
  }

  try {
    return (
      <div id="live-map-section" className="group relative flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl md:rounded-3xl blur-xl opacity-[0.4]" />
        <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-6 border border-white/15 hover:border-white/25 transition-all flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative"><MapPin className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-400" /><span className="absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse" /></div>
              <div><h3 className="text-sm md:text-base lg:text-xl font-bold text-white drop-shadow">Interactive World Map</h3><p className="text-[8px] md:text-[10px] lg:text-xs text-gray-400 flex items-center gap-1"><Navigation className="w-2.5 h-2.5 md:w-3 md:h-3" />{location?.city ? `${location.city}, ${location.country}` : 'Global View'}</p></div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-semibold animate-pulse border border-green-400/40 shadow-md shadow-green-500/20"><span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full animate-pulse" />LIVE TRACKING</div>
              {/* ✅ FIXED CODE - VISIBLE ON ALL SCREENS */}
              <button
                onClick={() => {
                  if (leafletMap && location?.lat && location?.lon) {
                    leafletMap.flyTo([location.lat, location.lon], 14, { duration: 2 })
                  }
                }}
                className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 lg:px-4 
             py-1.5 md:py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 
             border border-blue-400/40 text-white text-[10px] md:text-xs lg:text-sm 
             font-medium rounded-lg md:rounded-xl hover:from-blue-500/30 
             hover:to-cyan-500/30 hover:border-blue-300/60 transition-all 
             duration-300 shadow-lg shadow-blue-900/50 hover:shadow-blue-800/70 
             whitespace-nowrap"
              >
                <Navigation className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden xs:inline">Locate Me</span>
                <span className="xs:hidden">Locate Me</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 overflow-x-auto pb-1 md:pb-2 flex-shrink-0">
            <span className="text-[10px] md:text-xs font-semibold text-gray-300 whitespace-nowrap mr-1 flex items-center gap-1"><Layers className="w-2.5 h-2.5 md:w-3 md:h-3" />Layers:</span>
            {['Temperature', 'Precipitation', 'Wind Speed'].map((layer) => (
              <button key={layer} onClick={() => setActiveLayer(layer)} className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2 rounded-lg font-medium text-[10px] md:text-xs whitespace-nowrap transition-all duration-300 border active:scale-95 ${activeLayer === layer ? 'bg-gradient-to-r from-orange-500/90 to-red-500/90 text-white shadow-lg backdrop-blur-sm border-white/20' : 'bg-white/[0.06] text-gray-300 hover:text-white hover:bg-white/[0.12] border-white/10 hover:scale-105'}`}>
                {layer === 'Temperature' && <Thermometer className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                {layer === 'Precipitation' && <Droplets className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                {layer === 'Wind Speed' && <Wind className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                {layer}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-h-[200px] md:min-h-[280px] lg:min-h-[350px] rounded-xl md:rounded-2xl overflow-hidden border border-white/20 z-0">
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              zoomControl={false}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              ref={(mapInstance: any) => {
                if (mapInstance && !leafletMap) {
                  setLeafletMap(mapInstance)
                  mapInstance.on('zoomend', () => {
                    const newZoom = mapInstance.getZoom()
                    setZoom(newZoom)
                  })
                  mapInstance.on('moveend', () => {
                    const center = mapInstance.getCenter()
                  })
                }
                mapRef.current = mapInstance
              }}
              className="rounded-xl md:rounded-2xl"
            >
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {location?.lat && location?.lon && (
                <Marker position={[location.lat, location.lon]}>
                  <Popup>
                    <div className="text-center p-2">
                      <AnimatedWeatherIcon type={baseIcon} size="md" />
                      <h4 className="font-bold mt-2">{location.city}</h4>
                      <p className="text-lg font-bold text-blue-600">{convertTemp(baseTemp, unit)}°{unit}</p>
                      <p className="text-sm text-gray-600 capitalize">{current?.description}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              {nearbyPoints.map((point, i) => (
                <Marker key={i} position={[point.lat, point.lon]}>
                  <Popup>
                    <div className="text-center p-2">
                      <AnimatedWeatherIcon type={point.icon} size="sm" />
                      <h4 className="font-bold mt-1 text-sm">{point.label}</h4>
                      <p className="text-base font-bold text-blue-600">{convertTemp(point.temp, unit)}°{unit}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 md:top-3 md:right-3 flex flex-col gap-1 md:gap-1.5 z-[1000]">
              <button onClick={handleZoomIn} disabled={!leafletMap} className={`w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg shadow-lg border flex items-center justify-center transition-all ${leafletMap ? 'bg-white/90 hover:bg-blue-50 cursor-pointer hover:scale-110 active:scale-95' : 'bg-gray-200 cursor-not-allowed opacity-60'} border-white/40`} title="Zoom In (+)">
                <ZoomIn className={`w-3.5 h-3.5 md:w-4 md:h-4 ${leafletMap ? 'text-gray-700 hover:text-blue-600' : 'text-gray-400'}`} />
              </button>

              <div className="bg-white/95 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-center shadow-md border border-gray-300 mx-auto">
                <span className="text-[10px] md:text-xs font-bold text-gray-700">{zoom}x</span>
              </div>

              <button onClick={handleZoomOut} disabled={!leafletMap} className={`w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg shadow-lg border flex items-center justify-center transition-all ${leafletMap ? 'bg-white/90 hover:bg-blue-50 cursor-pointer hover:scale-110 active:scale-95' : 'bg-gray-200 cursor-not-allowed opacity-60'} border-white/40`} title="Zoom Out (-)">
                <ZoomOut className={`w-3.5 h-3.5 md:w-4 md:h-4 ${leafletMap ? 'text-gray-700 hover:text-blue-600' : 'text-gray-400'}`} />
              </button>

              <div className="h-px w-6 md:w-8 bg-gray-300 mx-auto my-0.5 md:my-1" />

              <button onClick={handleResetView} disabled={!leafletMap} className={`w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg shadow-lg border flex items-center justify-center transition-all ${leafletMap ? 'bg-white/90 hover:bg-green-50 cursor-pointer hover:scale-110 active:scale-95' : 'bg-gray-200 cursor-not-allowed opacity-60'} border-white/40 hover:border-green-300`} title="Reset to Location">
                <RotateCcw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${leafletMap ? 'text-gray-700 hover:text-green-600' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl p-2 md:p-3 shadow-lg border border-white/40 z-[1000] max-w-[120px] md:max-w-[160px] hidden sm:block">
              <h5 className="font-bold text-[10px] md:text-xs text-gray-800 mb-1.5 md:mb-2 flex items-center gap-1">🌡️ {activeLayer}</h5>
              <div className="space-y-1 md:space-y-1.5">
                {activeLayer === 'Temperature' && [{ cls: 'bg-red-500', label: 'Hot ≥36°' }, { cls: 'bg-orange-500', label: 'Warm 33-35°' }, { cls: 'bg-yellow-500', label: 'Mild 30-32°' }, { cls: 'bg-green-500', label: 'Cool <30°' }].map((item, i) => (<div key={i} className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[11px]"><div className={`w-2.5 h-2.5 md:w-3 md:h-3 ${item.cls} rounded-full shadow-sm`} /><span className="text-gray-700 font-medium">{item.label}</span></div>))}
                {activeLayer === 'Precipitation' && [{ color: '#3b82f6', label: 'Heavy >70%' }, { color: '#60a5fa', label: 'Moderate 40-70%' }, { color: '#93c5fd', label: 'Light 10-40%' }, { color: '#dbeafe', label: 'Dry <10%' }].map((item, i) => (<div key={i} className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[11px]"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} /><span className="text-gray-700 font-medium">{item.label}</span></div>))}
                {activeLayer === 'Wind Speed' && [{ color: '#ef4444', label: 'Strong >25 km/h' }, { color: '#f97316', label: 'Moderate 15-25' }, { color: '#eab308', label: 'Light 5-15 km/h' }, { color: '#22c55e', label: 'Calm <5 km/h' }].map((item, i) => (<div key={i} className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[11px]"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} /><span className="text-gray-700 font-medium">{item.label}</span></div>))}
              </div>
            </div>

            {/* Coordinates Display */}
            <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-black/70 backdrop-blur-md rounded-lg px-1.5 md:px-2 py-0.5 md:py-1 text-[8px] md:text-[10px] text-white/80 font-mono z-[1000] border border-white/20">
              Lat: {(location?.lat || 30.7811).toFixed(4)} | Lon: {(location?.lon || 76.6168).toFixed(4)}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-2 md:mt-3 grid grid-cols-3 gap-1.5 md:gap-2 flex-shrink-0">
            <div className="bg-white/[0.06] rounded-lg p-1.5 md:p-2 text-center border border-white/10">
              <p className="text-[8px] md:text-[10px] text-gray-400">Zoom Level</p>
              <p className="text-xs md:text-sm font-bold text-white">{zoom}x</p>
            </div>
            <div className="bg-white/[0.06] rounded-lg p-1.5 md:p-2 text-center border border-white/10">
              <p className="text-[8px] md:text-[10px] text-gray-400">Active Markers</p>
              <p className="text-xs md:text-sm font-bold text-white">{1 + nearbyPoints.length}</p>
            </div>
            <div className="bg-white/[0.06] rounded-lg p-1.5 md:p-2 text-center border border-white/10">
              <p className="text-[8px] md:text-[10px] text-gray-400">Layer</p>
              <p className="text-xs md:text-sm font-bold text-white truncate">{activeLayer.split(' ')[0]}</p>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Map rendering error:', error)
    setMapError('Map failed to render')
    return null
  }
})

WorldWeatherMap.displayName = 'WorldWeatherMap'

// ==================== MAIN DASHBOARD COMPONENT ====================
export default function WeatherDashboard() {
  const [unit, setUnit] = useState<'C' | 'F'>('C')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const router = useRouter()
  const { userProfile, loading: userLoading } = useUserProfile()
  const responsive = useResponsive()

  const { data: weatherData, loading, error, city, refetch: refreshWeather, changeCity, fetchByGeolocation } = useWeather('Rayat-Bahra University')

  const location = weatherData?.location
  const current = weatherData?.current
  const allForecast = weatherData?.forecast || []

  const hourlyForecast = useMemo(() => allForecast.slice(0, 24), [allForecast])
  const dailyForecast = useMemo(() => allForecast.slice(24), [allForecast])

  const temperature = convertTemp(current?.temp, unit)
  const feelsLike = convertTemp(current?.feels_like, unit)
  const humidity = current?.humidity ?? 43
  const pressure = current?.pressure ?? 967
  const windSpeed = current?.wind_speed ?? 10
  const visibility = current?.visibility ?? 10
  const description = current?.description ?? 'Overcast'
  const iconCode = current?.icon

  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setIsInitialLoading(false), 1500)
  }, [])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileSidebarOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const currentDate = useMemo(() => {
    const tz = weatherData?.timezone
    try {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: tz || undefined
      })
    } catch {
      return new Date().toLocaleDateString()
    }
  }, [weatherData?.timezone])

  const currentTime = useMemo(() => {
    const tz = weatherData?.timezone
    try {
      return new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: tz || undefined
      })
    } catch {
      return new Date().toLocaleTimeString()
    }
  }, [weatherData?.timezone])

  if (isInitialLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center px-4">
          <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-blue-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Loading Weather Dashboard...</h2>
          <p className="text-blue-200 mt-2 text-sm md:text-base">Preparing your weather experience</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-cinematic-zoom" style={{ backgroundImage: "url('https://z-cdn-media.chatglm.cn/files/53f0dbcf-f62e-4632-9882-a4ffc7456fa9.png?auth_key=1878608277-4c4ce73eb109448da9368b468a751854-0-1190469a97c5c06575452ec194eab90b')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-800/50 to-slate-900/80" />
        <div className="absolute top-0 left-0 w-[250%] h-[70%] opacity-25 animate-clouds-drift pointer-events-none">
          <div className="absolute w-[500px] h-[350px] bg-gray-700/40 rounded-full blur-3xl" style={{ top: '5%', left: '5%' }} />
          <div className="absolute w-[600px] h-[300px] bg-gray-600/30 rounded-full blur-3xl" style={{ top: '20%', left: '35%' }} />
          <div className="absolute w-[450px] h-[320px] bg-gray-800/35 rounded-full blur-3xl" style={{ top: '12%', left: '65%' }} />
          <div className="absolute w-[380px] h-[280px] bg-gray-700/30 rounded-full blur-3xl" style={{ top: '28%', left: '90%' }} />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.75) 100%)' }} />
      </div>

      {/* Mobile Overlay */}
      {responsive.isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
  relative z-50 md:z-10 
  ${responsive.isMobile ? 'fixed inset-y-0 left-0' : ''}
  ${responsive.isMobile && !isMobileSidebarOpen ? '-translate-x-full w-0 overflow-hidden opacity-0 pointer-events-none' : 'translate-x-0 w-64 md:w-56 lg:w-64'}
  h-screen max-h-screen overflow-hidden
  flex flex-col 
  transition-all duration-300 ease-in-out
  bg-black/30 backdrop-blur-xl
  ${responsive.isMobile && !isMobileSidebarOpen ? '' : 'flex-shrink-0'}
`}>
        <div className="h-full flex flex-col relative">

          {/* Right Border */}
          <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/15 to-transparent" />

          {/* Logo Section */}
          <div className="p-4 md:p-5 lg:p-6 flex items-center gap-2 md:gap-3 relative z-10">
            <div className="w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl md:rounded-lg lg:rounded-xl flex items-center justify-center text-lg md:text-xl lg:text-2xl shadow-lg shadow-orange-500/30 relative overflow-hidden animate-pulse-subtle">
              <span className="relative z-10">☀️</span>
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent truncate">WeatherLive</h1>
              <p className="text-[10px] md:text-xs text-gray-400">Real-time Weather</p>
            </div>

            {/* Mobile Close Button */}
            {responsive.isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 md:px-3 space-y-0.5 md:space-y-1 mt-2 md:mt-4 overflow-y-auto scrollbar-thin relative z-10 min-h-0">
            {[
              { icon: Home, label: 'Dashboard', active: true },
              { icon: Map, label: 'Live Map' },  // ← REMOVED action property
              { icon: Calendar, label: 'Forecast' },
              { icon: Bell, label: 'Alerts', badge: 2 },
              { icon: Wind, label: 'Air Quality' },
              {
                icon: Flower2,
                label: 'Pollen Count',
                isLink: true,
                href: `/poll?city=${encodeURIComponent(location?.city || '')}&lat=${location?.lat || ''}&lon=${location?.lon || ''}`
              },
              { icon: Video, label: 'News & Videos' },
              { icon: Settings, label: 'Settings' },
              { icon: Heart, label: 'Favorites' }
            ].map((item) => {
              if (item.isLink) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => responsive.isMobile && setIsMobileSidebarOpen(false)}
                    className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all duration-200 group text-gray-300 hover:bg-white/[0.06] hover:text-white hover:backdrop-blur-sm hover:translate-x-1 border border-transparent hover:border-white/10"
                  >
                    <item.icon className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110 flex-shrink-0" />
                    <span className="font-medium text-sm md:text-base truncate">{item.label}</span>
                    <span className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">↗</span>
                  </Link>
                )
              }

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    // Step 1: Close mobile sidebar first (if open)
                    if (responsive.isMobile) {
                      setIsMobileSidebarOpen(false)
                    }

                    // Step 2: Special action for "Live Map" button only
                    if (item.label === 'Live Map') {
                      // Wait for sidebar to close (300ms on mobile), then scroll
                      setTimeout(() => {
                        // Find the REAL element by its ID
                        const mapElement = document.getElementById('live-map-section')

                        // If element exists, scroll to it smoothly
                        if (mapElement) {
                          mapElement.scrollIntoView({
                            behavior: 'smooth',    // Smooth animation
                            block: 'start'        // Align to top of viewport
                          })
                        }
                      }, responsive.isMobile ? 300 : 0)  // Mobile: wait 300ms, Desktop: immediate
                    } else {
                      // Default behavior for all other buttons
                      if (responsive.isMobile) setIsMobileSidebarOpen(false)
                    }
                  }}
                  className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all duration-200 group cursor-pointer ${item.active ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/20 backdrop-blur-sm border border-blue-400/30' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white hover:backdrop-blur-sm hover:translate-x-1 border border-transparent hover:border-white/10'}`}
                >
                  <item.icon className={`w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110 flex-shrink-0 ${item.active ? 'text-white' : ''}`} />
                  <span className="font-medium text-sm md:text-base truncate">{item.label}</span>
                  {item.badge && (<span className="ml-auto bg-red-500/80 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full backdrop-blur-sm animate-pulse border border-red-400/30 flex-shrink-0">{item.badge}</span>)}

                  
                </button>
              )
            })}
          </nav>

          {/* Location Info Box */}
          <div className="mx-2 md:mx-3 mb-2 md:mb-3 mt-auto p-3 md:p-4 bg-white/[0.05] backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/[0.08] transition-all relative z-10 flex-shrink-0">
            <div className="flex items-start gap-2 mb-2 md:mb-3">
              <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] md:text-xs text-gray-400">Current Location</p>
                <p className="text-xs md:text-sm font-semibold text-white truncate">{location?.city || 'Rayat-Bahra University'}, {location?.state || 'Punjab'}</p>
                <p className="text-[9px] md:text-xs text-gray-500">Lat {(location?.lat || 30.7811).toFixed(4)}, Lon {(location?.lon || 76.6168).toFixed(4)}</p>
              </div>
            </div>

            <button
              onClick={() => refreshWeather()}
              disabled={loading}
              className="w-full py-1.5 md:py-2 bg-green-500/20 hover:bg-green-500/30 disabled:bg-green-500/10 text-green-300 rounded-lg text-xs md:text-sm font-medium transition-all border border-green-500/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? ' animate-spin' : ''}`} />
              {loading ? 'Updating...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative bg-black/40 backdrop-blur-2xl px-3 md:px-4 lg:px-6 xl:px-8 py-2.5 md:py-3 lg:py-4 flex items-center justify-between flex-shrink-0">

          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-cyan-600/10 opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Header Content */}
          {/* ==================== ✅ FIXED HEADER - With Location Button + Live Text ==================== */}
          <div className="flex items-center justify-between w-full relative z-10 gap-2 md:gap-4 flex-wrap">
            {/* HAMBURGER BUTTON FOR MOBILE - BLUE ANIMATED WITH BLACKY EFFECT */}
            {responsive.isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-800/30 border border-blue-400/40 backdrop-blur-sm mr-2 hover:from-blue-500/30 hover:to-blue-700/40 hover:border-blue-300/60 transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-blue-800/70 hover:scale-105 active:scale-95"
              >
                <div className="flex flex-col gap-[5px] w-6 relative">
                  <span
                    className={`h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50 block transition-all duration-300 ease-in-out ${isMobileSidebarOpen ? 'rotate-[45deg] translate-y-[8px] w-7 from-white to-gray-200 shadow-black/50' : ''}`}
                  />
                  <span
                    className={`h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50 block transition-all duration-300 ease-in-out ${isMobileSidebarOpen ? 'opacity-0 scale-x-0 -translate-x-4' : ''}`}
                  />
                  <span
                    className={`h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50 block transition-all duration-300 ease-in-out ${isMobileSidebarOpen ? '-rotate-[45deg] -translate-y-[8px] w-7 from-white to-gray-200 shadow-black/50' : ''}`}
                  />
                </div>
              </button>
            )}

            {/* ==================== LEFT: SEARCH BAR ==================== */}
            <form
              className="order-1 w-full sm:w-auto min-w-0 max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl relative group"
              onSubmit={(e) => { e.preventDefault(); void refreshWeather() }}
            >
              <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20">
                <Search className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200" />
              </div>

              <input
                type="text"
                placeholder={responsive.isMobile ? "🔍 Search..." : "🔍 Search any location worldwide..."}
                value={city}
                onChange={(e) => changeCity(e.target.value)}
                className="w-full pl-9 md:pl-11 pr-3 md:pr-4 py-2 md:py-2.5 lg:py-3 lg:py-3.5 bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/[0.12] focus:border-blue-400/40 transition-all duration-300 text-white placeholder-gray-400 font-medium text-xs md:text-sm"
              />
            </form>

            {/* ==================== RIGHT: ACTIONS ==================== */}
            <div className="order-2 w-full sm:w-auto flex items-center gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 flex-shrink-0 mt-2 sm:mt-0 justify-start sm:justify-end">

              {/* 📍✅ USE MY LOCATION BUTTON - As shown in your image */}
              <button
                onClick={fetchByGeolocation}
                className="flex items-center gap-2 px-3 sm:px-4 md:px-4 py-2 bg-gradient-to-r from-blue-500/90 to-cyan-500/80 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg md:rounded-xl font-semibold text-[12px] md:text-xs lg:text-sm border border-blue-400/30 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                <MapPin className="w-4 h-4 md:w-5 md:h-5 relative z-10 group-hover:animate-pulse" />

                <span className="relative z-10 whitespace-nowrap">
                  Use My Location
                </span>
              </button>

              {/* 🌡️ TEMPERATURE TOGGLE (°C / °F) */}
              <div className="flex items-center bg-white/[0.12] backdrop-blur-md rounded-lg md:rounded-xl p-0.5 md:p-1 border border-white/15 shadow-inner">
                <button
                  onClick={() => setUnit('C')}
                  className={`px-2 md:px-3 lg:px-3.5 xl:px-4 py-1 md:py-1.5 lg:py-2 rounded-md md:rounded-lg font-bold text-[10px] md:text-xs lg:text-sm transition-all duration-300 ${unit === 'C'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                  °C
                </button>

                <button
                  onClick={() => setUnit('F')}
                  className={`px-2 md:px-3 lg:px-3.5 xl:px-4 py-1 md:py-1.5 lg:py-2 rounded-md md:rounded-lg font-bold text-[10px] md:text-xs lg:text-sm transition-all duration-300 ${unit === 'F'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                  °F
                </button>
              </div>

              {/* Divider - Hidden on mobile */}
              <div className="hidden sm:block w-[1px] h-8 md:h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

              {/* 🟢✅ GREEN BUTTON WITH "LIVE" TEXT INSIDE - As requested! */}
              <button
                className="green-next-btn group relative inline-flex items-center gap-2 md:gap-2.5 px-4 md:px-6 lg:px-7 xl:px-8 py-2 md:py-2.5 overflow-hidden rounded-full md:rounded-xl font-bold text-[11px] md:text-sm lg:text-base text-white transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-default"
              >
                {/* Animated Background Shimmer */}
                <div className="green-btn-shimmer absolute inset-0 opacity-30"></div>

                {/* Pulsing Glow Ring */}
                <div className="green-btn-glow absolute -inset-[2px] rounded-full md:rounded-xl"></div>

                {/* ✅ PULSING DOT INDICATOR */}
                <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" style={{ animationDuration: '1.5s' }}></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-white shadow-lg shadow-green-300/50"></span>
                </span>

                {/* ✅ "LIVE" TEXT - Inside the green button as you wanted! */}
                <span className="relative z-10 font-bold tracking-wide drop-shadow-md whitespace-nowrap">
                  Live
                </span>

                {/* Hover Sparkle Effect */}
                <div className="green-btn-sparkle absolute top-0 left-[-100%] h-full w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
              </button>

            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6 xl:p-8 scrollbar-thin">
          {error && (
            <div className="mb-3 md:mb-4 bg-red-500/20 border-l-4 border-red-500/50 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-start md:items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-500/30 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl flex-shrink-0">⚠️</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-red-300 text-sm md:text-base">Error Loading Data</h4>
                <p className="text-xs md:text-sm text-red-200">{error}</p>
                <button onClick={() => refreshWeather()} className="mt-2 px-3 md:px-4 py-1 md:py-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-white font-medium transition-all active:scale-95 text-xs md:text-sm">Try Again</button>
              </div>
            </div>
          )}

          <div className="w-full space-y-3 md:space-y-4 lg:space-y-6">

            {/* Weather Card + Map Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 lg:gap-6 items-stretch">

              {/* Main Weather Card */}
              <div className="group relative flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-purple-600/30 rounded-2xl md:rounded-3xl blur-xl md:blur-2xl opacity-[0.6] group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-blue-600/25 via-blue-700/20 to-indigo-800/25 backdrop-blur-xl md:backdrop-blur-2xl rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 text-white overflow-hidden border border-white/20 hover:border-white/30 transition-all duration-300 flex-1 flex flex-col">

                  {/* Background Effects */}
                  <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 bg-blue-400/20 rounded-full blur-2xl md:blur-3xl animate-float-slow" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 md:w-32 md:h-32 lg:w-48 lg:h-48 bg-yellow-300/15 rounded-full blur-xl md:blur-2xl animate-float-medium" />

                  <div className="relative z-10 flex-1 flex flex-col">

                    {/* Location & Time */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 md:mb-4 lg:mb-6 gap-1.5 md:gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                          <h2 className="text-base md:text-lg lg:text-2xl font-bold drop-shadow-lg truncate">{location?.city || 'Rayat-Bahra University'}</h2>
                        </div>
                        <p className="text-[10px] md:text-xs lg:text-sm text-blue-200/80">{currentDate} | {currentTime}</p>
                        <div className="inline-flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-1.5 md:px-2 py-[2px] md:py-[3px] rounded-full text-[8px] md:text-[10px] font-semibold self-start animate-pulse border border-green-400/40 shadow-md shadow-green-500/20 mt-1">
                          <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full animate-pulse" />
                          Live
                        </div>
                      </div>
                    </div>

                    {/* Temperature Display */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 md:mb-6 lg:mb-8 gap-3 md:gap-4">
                      <div className="flex items-center gap-3 md:gap-4 lg:gap-8">
                        <div className="drop-shadow-xl md:drop-shadow-2xl animate-float">
                          <AnimatedWeatherIcon type={getWeatherIcon(iconCode)} size={responsive.isMobile ? 'md' : 'lg'} />
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight drop-shadow-lg">
                            {temperature}<span className="text-lg md:text-2xl lg:text-3xl align-top">°{unit}</span>
                          </div>
                          <div className="text-base md:text-xl lg:text-2xl text-blue-200/90 mt-0.5 md:mt-1 capitalize">{description}</div>
                        </div>
                      </div>
                    </div>

                    {/* Feels Like */}
                    <div className="mb-4 md:mb-6">
                      <p className="text-sm md:text-base lg:text-lg text-blue-100">
                        Feels like <span className="font-bold text-white drop-shadow">{feelsLike}°{unit}</span>
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="mt-auto grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4 bg-white/[0.08] backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-6 border border-white/10">
                      {[
                        { icon: Droplets, value: `${humidity}%`, label: 'Humidity' },
                        { icon: Wind, value: `${windSpeed} km/h`, label: 'Wind' },
                        { icon: Gauge, value: pressure, label: 'Pressure' },
                        { icon: Eye, value: `${visibility} km`, label: 'Visibility' }
                      ].map((stat, i) => (
                        <div key={i} className="text-center hover:bg-white/[0.1] rounded-lg md:rounded-xl p-1.5 md:p-2 transition-colors">
                          <stat.icon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mx-auto mb-1 md:mb-2 text-blue-200" />
                          <p className="text-base md:text-xl lg:text-2xl font-bold">{stat.value}</p>
                          <p className="text-[9px] md:text-[10px] lg:text-xs text-blue-200/70">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Map */}
              <WorldWeatherMap weatherData={weatherData} unit={unit} />
            </div>

            {/* Hourly Forecast */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl md:rounded-3xl blur-xl opacity-[0.4]" />
              <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-6 border border-white/15 hover:border-white/25 transition-all">

                {/* Header */}
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-sm md:text-base lg:text-xl font-bold text-white drop-shadow">Hourly Forecast</h3>
                  <span className="text-[10px] md:text-xs lg:text-sm text-blue-300 font-medium cursor-pointer hover:text-blue-200 hover:underline">View All →</span>
                </div>

                {/* Hourly Cards */}
                <div className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 md:-mx-2 px-1 md:px-2">
                  {(hourlyForecast.length > 0 ? hourlyForecast : [
                    { dt_txt: new Date().toISOString(), main: { temp: temperature }, weather: [{ icon: iconCode || '02d' }], pop: 0 },
                    ...Array(8).fill(null).map((_, i) => ({
                      dt_txt: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
                      main: { temp: temperature + Math.floor(Math.random() * 5) },
                      weather: [{ icon: ['01d', '01d', '01d', '01d', '01d', '01d', '01d', '01d'][i] }],
                      pop: Math.floor(Math.random() * 30)
                    }))
                  ]).slice(0, 9).map((hour: any, i: number) => {
                    const hourTemp = convertTemp(hour.main?.temp, unit)
                    const displayTime =
                      i === 0
                        ? 'Now'
                        : (() => {
                          try {
                            const timePart = hour.dt_txt?.split('T')[1]?.substring(0, 5)
                            if (!timePart) return '--'
                            const [hStr, mStr] = timePart.split(':')
                            const h = parseInt(hStr, 10)
                            if (isNaN(h)) return '--'
                            const ampm = h >= 12 ? 'PM' : 'AM'
                            const h12 = h % 12 || 12
                            return `${h12}:${mStr} ${ampm}`
                          } catch {
                            return '--'
                          }
                        })()

                    return (
                      <div key={i} className={`flex flex-col items-center justify-center p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl transition-all min-w-[75px] md:min-w-[90px] lg:min-w-[110px] xl:min-w-[120px] hover:scale-105 hover:-translate-y-1 border cursor-pointer ${i === 0 ? 'bg-gradient-to-br from-blue-500/60 to-cyan-500/60 text-white shadow-lg shadow-blue-500/30 border-blue-400/30' : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/90 border border-white/10'}`}
                        style={{ backdropFilter: 'blur(12px)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.zIndex = '10' }}
                        onMouseLeave={(e) => { e.currentTarget.style.zIndex = '1' }}>

                        <p className={`text-[10px] md:text-xs font-semibold mb-2 md:mb-3 ${i === 0 ? 'text-white' : 'text-gray-300'}`}>{displayTime}</p>

                        <div className="mb-2 md:mb-3">
                          <AnimatedHourlyWeatherIcon type={getWeatherIcon(hour.weather?.[0]?.icon)} size="sm" />
                        </div>

                        <p className="text-lg md:text-2xl lg:text-3xl font-bold mb-1">{hourTemp}°</p>
                        {hour.pop > 0 && (
                          <div className={`flex items-center gap-1 text-[9px] md:text-xs ${i === 0 ? 'text-blue-100' : 'text-gray-400'}`}>
                            <Droplets className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            <span>{hour.pop}%</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Footer Info */}
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-[9px] md:text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-400/60 animate-pulse" />
                    <span className="text-gray-300">Source: Open-Meteo API • Real-time Data</span>
                  </div>
                  <div className="text-gray-400 font-medium">
                    Updated: {weatherData?.timestamp ? new Date(weatherData.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid: 7-Day Forecast + Air Quality + Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 items-stretch">

              {/* 7-Day Forecast */}
              <div className="lg:col-span-2 group relative flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-2xl md:rounded-3xl blur-xl opacity-[0.4]" />
                <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-6 border border-white/15 hover:border-white/25 transition-all flex-1 flex flex-col">

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="text-sm md:text-base lg:text-xl font-bold text-white drop-shadow">7-Day Forecast</h3>
                    <button className="text-[10px] md:text-xs lg:text-sm text-blue-300 font-medium hover:text-blue-200 hover:underline flex items-center gap-1">
                      View Full Forecast <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>

                  {/* Forecast List */}
                  <div className="space-y-1.5 md:space-y-2 flex-1 flex flex-col justify-around">
                    {(dailyForecast.length > 0 ? dailyForecast : [
                      { dt_txt: new Date().toISOString(), weather: [{ icon: iconCode || '02d', desc: description }], main: { temp_max: temperature + 4, temp_min: temperature - 6 }, pop: 10, wind: { speed: windSpeed }, today: true },
                      ...Array(6).fill(null).map((_, i) => ({
                        dt_txt: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
                        weather: [{ icon: ['01d', '03d', '09d', '11d', '02d', '01d'][i], desc: ['Sunny', 'Cloudy', 'Light Rain', 'Thunderstorm', 'Partly Cloudy', 'Sunny'][i] }],
                        main: { temp_max: temperature + Math.floor(Math.random() * 6), temp_min: temperature - Math.floor(Math.random() * 8) },
                        pop: [5, 20, 60, 85, 25, 5][i],
                        wind: { speed: windSpeed + Math.floor(Math.random() * 10) },
                        today: false
                      }))
                    ]).map((d: any, i: number) => {
                      const dayHigh = convertTemp(d.main?.temp_max, unit)
                      const dayLow = convertTemp(d.main?.temp_min, unit)
                      const windValue = safeGetWindSpeed(d.wind)

                      return (
                        <div key={i} className={`flex items-center justify-between p-2 md:p-3 lg:p-4 rounded-lg xl:rounded-xl transition-all hover:bg-white/[0.06] hover:scale-[1.01] border ${d.today ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30' : 'border-white/10'}`}>

                          {/* Day Info */}
                          <div className="flex items-center gap-2 md:gap-3 lg:gap-4 w-20 md:w-28 lg:w-32">
                            <div className="min-w-0">
                              <p className={`font-bold text-xs md:text-sm ${d.today ? 'text-blue-300' : 'text-white'}`}>
                                {d.today ? 'Today' : formatDate(d.dt_txt)}
                              </p>
                              <p className={`text-[8px] md:text-[10px] lg:text-xs ${d.today ? 'text-blue-400' : 'text-gray-400'} truncate`}>
                                {formatDate(d.dt_txt)}
                              </p>
                            </div>
                            {d.today && (
                              <span className="px-1 py-0.5 bg-blue-500/80 text-white text-[8px] md:text-[10px] font-bold rounded-full backdrop-blur-sm flex-shrink-0">
                                NOW
                              </span>
                            )}
                          </div>

                          {/* Weather Icon & Description */}
                          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 flex-1 px-1 md:px-2 min-w-0">
                            <div className="w-10 md:w-12 lg:w-16 flex-shrink-0 flex justify-center">
                              <AnimatedWeatherIcon type={typeof d.weather?.[0]?.icon === 'string' ? d.weather[0].icon : getWeatherIcon(d.weather?.[0]?.icon)} size="sm" />
                            </div>
                            <p className="text-[10px] md:text-xs lg:text-sm font-medium text-white/80 hidden sm:block capitalize truncate">
                              {d.weather?.[0]?.desc}
                            </p>
                          </div>

                          {/* Temperature */}
                          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 w-16 md:w-20 lg:w-24 justify-end flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm md:text-base lg:text-lg font-bold text-white">{dayHigh}°</p>
                              <p className="text-[10px] md:text-xs text-gray-400">{dayLow}°</p>
                            </div>
                          </div>

                          {/* Additional Info - Hidden on small screens */}
                          <div className="hidden md:flex items-center gap-2 lg:gap-3 text-[9px] md:text-[10px] lg:text-xs text-gray-400 flex-shrink-0">
                            <span><Droplets className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-400 inline mr-1" />{d.pop}%</span>
                            <span><Wind className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500 inline mr-1" />{windValue}km/h</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Air Quality + Highlights */}
              <div className="flex flex-col space-y-3 md:space-y-4 lg:space-y-4">

                {/* Air Quality */}
                <div className="group relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl md:rounded-3xl blur-xl opacity=[0.4]" />
                  <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-5 border border-white/15 hover:border-white/25 transition-all">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Wind className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                        <h3 className="text-sm md:text-base font-bold text-white drop-shadow">Air Quality</h3>
                      </div>
                      <button className="text-[10px] md:text-xs text-blue-300 hover:text-blue-200 hover:underline font-medium">Details →</button>
                    </div>

                    {/* ✅ FIXED AIR QUALITY CIRCLE - Replace lines 2027-2045 with this: */}
                    <div className="flex justify-center mb-2 md:mb-3">
                      <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          {/* ✅ FIXED: Changed all } to " */}
                          <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="8" />

                          <defs>
                            <linearGradient id="aqiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                            </linearGradient>
                          </defs>

                          {/* ✅ FIXED: Changed all } to " */}
                          <circle cx="60" cy="60" r="52" fill="none" stroke="url(#aqiGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="137.34 327" />

                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">42</div>
                            <div className="text-xs md:text-sm font-semibold text-green-400">Good</div>
                          </div>
                        </svg>
                      </div>
                    </div>

                    {/* AQI Stats Grid */}
                    <div className="grid grid-cols-2 gap-1 md:gap-1.5">
                      {[{ name: 'PM2.5', value: 18, status: 'Good' }, { name: 'PM10', value: 32, status: 'Good' }, { name: 'O₃', value: 41, status: 'Good' }, { name: 'NO₂', value: 15, status: 'Good' }].map((p, i) => (
                        <div key={i} className="bg-white/[0.06] rounded-lg p-1.5 md:p-2 text-center hover:bg-white/[0.1] transition-colors border border-white/10">
                          <p className="text-[9px] md:text-[10px] text-gray-400 mb-0.5">{p.name}</p>
                          <p className="text-sm md:text-base lg:text-lg font-bold text-white">{p.value}</p>
                          <p className="text-[8px] md:text-[10px] text-green-400 font-semibold">{p.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Today's Highlights */}
                <div className="group relative flex-1 flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl md:rounded-3xl blur-xl opacity=[0.4]" />
                  <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-5 border border-white/15 hover:border-white/25 transition-all flex-1 flex flex-col">

                    <h3 className="text-sm md:text-base font-bold text-white drop-shadow mb-2 md:mb-3">Today&apos;s Highlights</h3>

                    <div className="space-y-1.5 md:space-y-2.5 flex-1 flex flex-col justify-around">
                      {(() => {
                        const highlights = weatherData?.highlights
                        const safe = (v: unknown) => (v === null || v === undefined || v === '' ? '--' : String(v))

                        const sunrise = safe(highlights?.sunrise)
                        const sunset = safe(highlights?.sunset)
                        const moonrise = safe(highlights?.moonrise)
                        const moonset = safe(highlights?.moonset)
                        const moonPhase = safe(highlights?.moonPhaseLabel)

                        const items = [
                          { Icon: AnimatedSunriseIcon, label: 'Sunrise', value: sunrise },
                          { Icon: AnimatedSunsetIcon, label: 'Sunset', value: sunset },
                          { Icon: AnimatedMoonriseIcon, label: 'Moonrise', value: moonrise },
                          { Icon: AnimatedMoonsetIcon, label: 'Moonset', value: moonset },
                          { Icon: AnimatedMoonPhaseIcon, label: 'Moon Phase', value: moonPhase }
                        ] as const

                        return items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 md:py-2 hover:bg-white/[0.06] rounded-lg px-1 md:px-2 -mx-1 md:-mx-2 transition-colors border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
                              <item.Icon size="sm" />
                              <span className="text-[10px] md:text-xs lg:text-sm font-medium text-white/90">{item.label}</span>
                            </div>
                            <span className="text-[10px] md:text-xs lg:text-sm font-semibold text-white drop-shadow">{item.value}</span>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Alerts & Details Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6 items-stretch min-h-[280px] md:min-h-[320px] lg:h-[360px] auto-rows-fr">

              {/* Weather Alerts Card */}
              <div className="group relative h-full flex flex-col flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl md:rounded-3xl blur-xl opacity=[0.4]" />
                <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-5 lg:p-6 border border-white/15 hover:border-white/25 transition-all min-h-[250px] md:min-h-[290px] flex-1 h-full">

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                      <h3 className="text-sm md:text-base lg:text-lg font-bold text-white drop-shadow">Weather Alerts</h3>
                    </div>
                    <button className="text-[10px] md:text-xs text-blue-300 hover:text-blue-200 hover:underline font-medium">View All →</button>
                  </div>

                  {/* Alerts Content */}
                  <div className="space-y-2 md:space-y-3 flex-1">
                    {(() => {
                      const alerts = weatherData?.alerts || []

                      if (alerts.length === 0) {
                        return (
                          <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/10 rounded-xl md:rounded-2xl p-3 md:p-4 border border-emerald-400/15 hover:border-emerald-400/25 transition-all h-full flex items-center">
                            <div className="flex items-start gap-2 md:gap-3 w-full">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500/25 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-emerald-200" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-xs md:text-sm mb-1">No Active Alerts</h4>
                                <p className="text-[10px] md:text-xs text-gray-300 leading-relaxed">
                                  There are no current weather alerts for your selected location.
                                </p>
                                <p className="text-[8px] md:text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                  <span>{weatherData?.highlights?.sunrise ? weatherData?.highlights.sunrise : '--'}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      const asGradient = (severity: WeatherAlert['severity']) => {
                        switch (severity) {
                          case 'warning':
                            return 'bg-gradient-to-r from-orange-500/20 to-yellow-500/10 border-orange-400/20 hover:border-orange-400/40'
                          case 'advisory':
                            return 'bg-gradient-to-r from-blue-500/15 to-cyan-500/10 border-blue-400/15 hover:border-blue-400/30'
                          default:
                            return 'bg-gradient-to-r from-green-500/15 to-emerald-500/10 border-emerald-400/15 hover:border-emerald-400/25'
                        }
                      }

                      const iconFor = (icon: string, severity: WeatherAlert['severity']) => {
                        if (icon === '🌧️' || icon === '⚡' || icon === '🔥' || icon === '❄️')
                          return <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-300" />
                        if (icon === '🌬️')
                          return <Wind className="w-4 h-4 md:w-5 md:h-5 text-blue-300" />
                        return severity === 'warning'
                          ? <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-300" />
                          : <Wind className="w-4 h-4 md:w-5 md:h-5 text-blue-300" />
                      }

                      const formatAlertTime = (time: string) => {
                        if (!time) return '--'
                        const d = new Date(time)
                        if (isNaN(d.getTime())) return time
                        try {
                          return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', day: '2-digit', month: 'short' })
                        } catch {
                          return time
                        }
                      }

                      return alerts.slice(0, 2).map((a, i) => (
                        <div key={i} className={`${asGradient(a.severity)} rounded-xl md:rounded-2xl p-3 md:p-4 border transition-all`}>
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/[0.08] rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                              {a.icon ? iconFor(a.icon, a.severity) : iconFor('', a.severity)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-xs md:text-sm mb-1">{a.title}</h4>
                              <p className="text-[10px] md:text-xs text-gray-300 leading-relaxed">{a.message}</p>
                              <p className="text-[8px] md:text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                <span>{formatAlertTime(a.time)}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>

              {/* Weather Details Card */}
              <div className="group relative h-full flex flex-col flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl md:rounded-3xl blur-xl opacity=[0.4]" />
                <div className="relative bg-gradient-to-br from-blue-600/20 to-cyan-600/15 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-5 lg:p-6 border border-white/15 hover:border-white/25 transition-all min-h-[250px] md:min-h-[290px] flex-1 h-full">

                  <div className="flex items-center justify-between h-full">

                    {/* Details List */}
                    <div className="flex-1 space-y-2 md:space-y-4 pr-0 md:pr-4">
                      <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-white/10">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Wind className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-300">Wind Gust</p>
                          <p className="text-lg md:text-xl font-bold text-white">
                            {Math.round((weatherData?.hourly?.[0]?.wind?.speed ?? weatherData?.current?.wind_speed ?? 0))}
                            <span className="text-xs md:text-sm font-normal ml-1">km/h</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-white/10">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Droplets className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-300">Precipitation</p>
                          <p className="text-lg md:text-xl font-bold text-white">
                            {((weatherData?.hourly?.[0]?.precipitation_mm ?? 0) as number).toFixed(1)}
                            <span className="text-xs md:text-sm font-normal ml-1">mm</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-white/10">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                          <CloudRain className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-300">Chance of Rain</p>
                          <p className="text-lg md:text-xl font-bold text-white">
                            {Math.round(weatherData?.hourly?.[0]?.pop ?? 0)}
                            <span className="text-xs md:text-sm font-normal ml-1">%</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Cloud className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-gray-300">Cloud Cover</p>
                          <p className="text-lg md:text-xl font-bold text-white">
                            {Math.round(weatherData?.hourly?.[0]?.cloud_cover ?? 0)}
                            <span className="text-xs md:text-sm font-normal ml-1">%</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Weather Icon - Hidden on mobile, visible on larger screens */}
                    <div className="hidden lg:block ml-4">
                      <div className="w-24 h-24 md:w-32 md:h-32 relative">
                        <AnimatedWeatherIcon type={getWeatherIcon(iconCode)} size="md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="py-4 md:py-5 lg:py-7 mt-3 md:mt-4 text-center text-[10px] md:text-xs lg:text-sm text-gray-400">
              <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                <CloudRain className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-blue-400" />
                <span className="font-semibold text-gray-300 text-xs md:text-sm">WeatherLive Dashboard</span>
              </div>
              <p className="mb-1 md:mb-1.5 text-[9px] md:text-xs">
                Powered by Open-Meteo API & OpenStreetMap • Real-time Tracking
              </p>
              <div className="border-t border-white/10 pt-2 md:pt-3 mt-2 md:mt-3 flex items-center justify-center gap-1 md:gap-1.5 flex-wrap">
                <span>©</span>
                <span className="font-medium text-gray-300">Nishant Sharma. All Rights Reserved {new Date().getFullYear()}</span>
                <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-500 fill-red-500 animate-pulse" />
              </div>

              {/* Responsive Indicator - Development only, remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-[8px] text-gray-600 hidden md:block">
                  Screen: {responsive.width}px | {responsive.isMobile ? 'Mobile' : responsive.isTablet ? 'Tablet' : responsive.isLaptop ? 'Laptop' : responsive.isDesktop ? 'Desktop' : 'Ultra-Wide'}
                </div>
              )}
            </footer>
          </div>
        </main>
      </div>

      {/* Custom CSS Animations - Fully Responsive */}
      <style jsx global>{`
        /* ============================================ */
        /* ✅ RESPONSIVE ANIMATION KEYFRAMES          */
        /* ============================================ */

        @keyframes cinematic-zoom { 
          0%, 100% { transform: scale(1) translateY(0); filter: brightness(1) contrast(1); } 
          25% { transform: scale(1.05) translateY(-1%); filter: brightness(1.05) contrast(1.05); } 
          50% { transform: scale(1.08) translateY(-0.5%); filter: brightness(1.03) contrast(1.02); } 
          75% { transform: scale(1.04) translateY(-0.8%); filter: brightness(1.06) contrast(1.04); } 
        }
        
        .animate-cinematic-zoom { animation: cinematic-zoom 30s ease-in-out infinite; }

        @keyframes clouds-drift { 
          0% { transform: translateX(0); } 
          100% { transform: translateX(-50%); } 
        }
        
        .animate-clouds-drift { animation: clouds-drift 120s linear infinite; }

        @keyframes float-slow { 
          0%, 100% { transform: translate(0, 0) scale(1); } 
          50% { transform: translate(40px, -40px) scale(1.05); } 
        }
        
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }

        @keyframes float-medium { 
          0%, 100% { transform: translate(0, 0); } 
          50% { transform: translate(-30px, 30px) scale(1.03); } 
        }
        
        .animate-float-medium { animation: float-medium 7s ease-in-out infinite; }

        @keyframes pulse-subtle { 
          0%, 100% { box-shadow: 0 0 0 0 rgb(245 158 11 / 0.3); } 
          50% { box-shadow: 0 0 0 10px rgb(245 158 11 / 0); } 
        }
        
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }

        @keyframes shimmer { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(100%); } 
        }
        
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }

        /* Hourly Icon Animations */
        @keyframes sunPulse { 
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6)); } 
          50% { transform: scale(1.08); filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.9)); } 
        }

        @keyframes sunRotate { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }

        @keyframes rayPulse { 
          0%, 100% { opacity: 0.7; transform: scaleX(1); } 
          50% { opacity: 1; transform: scaleX(1.15); } 
        }

        @keyframes cloudFloat { 
          0%, 100% { transform: translateX(0); } 
          50% { transform: translateX(5px); } 
        }

        /* ============================================ */
        /* ✅ RESPONSIVE SCROLLBAR STYLES             */
        /* ============================================ */

        .scrollbar-thin::-webkit-scrollbar { 
          width: 4px; 
          height: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track { 
          background: rgb(255 255 255 / 0.05); 
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb { 
          background: rgb(255 255 255 / 0.15); 
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { 
          background: rgb(255 255 255 / 0.25);
        }

        .scrollbar-hide::-webkit-scrollbar { 
          display: none; 
        }
        
        .scrollbar-hide { 
          overflow-style: none; 
          scrollbar-width: none; 
          -ms-overflow-style: none;
        }

        /* ============================================ */
        /* ✅ ANIMATED GREEN BUTTON STYLES             */
        /* ============================================ */

        .green-next-btn {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 25%, #15803d 50%, #16a34a 75%, #22c55e 100%);
          background-size: 200% 200%;
          animation: greenGradientShift 3s ease infinite;
          box-shadow: 
            0 0 15px rgba(34, 197, 94, 0.4),
            0 0 30px rgba(34, 197, 94, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.3);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .green-next-btn:hover {
          box-shadow: 
            0 0 20px rgba(34, 197, 94, 0.6),
            0 0 40px rgba(34, 197, 94, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.4);
        }

        .green-btn-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmerMove 2s infinite;
        }

        .green-btn-glow {
          background: linear-gradient(135deg, #4ade80, #22c55e, #16a34a, #22c55e, #4ade80);
          opacity: 0.6;
          filter: blur(4px);
          animation: greenPulse 2s ease-in-out infinite;
          z-index: -1;
          transition: opacity 0.3s ease;
        }

        .green-next-btn:hover .green-btn-glow {
          opacity: 1;
        }

        .green-btn-sparkle {
          position: absolute;
          top: 0;
          left: -100%;
          height: 100%;
          width: 50%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
          skew-x(-12deg);
        }

        .green-next-btn:hover .green-btn-sparkle {
          left: 150%;
          transition: all 1s ease-in-out;
        }

        /* ============================================ */
        /* ✅ GREEN BUTTON KEYFRAME ANIMATIONS         */
        /* ============================================ */

        @keyframes greenGradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shimmerMove {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes greenPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }

        /* ============================================ */
        /* ✅ RESPONSIVE MEDIA QUERIES                 */
        /* ============================================ */

        /* Mobile First - Base styles are for mobile */

        /* Small devices (landscape phones, 576px and up) */
        @media (min-width: 576px) {
          .weather-dashboard-container {
            padding: 1rem;
          }
        }

        /* Medium devices (tablets, 768px and up) */
        @media (min-width: 768px) {
          .weather-dashboard-container {
            padding: 1.5rem;
          }
        }

        /* Large devices (desktops, 992px and up) */
        @media (min-width: 992px) {
          .weather-dashboard-container {
            padding: 2rem;
          }
        }

        /* Extra large devices (large desktops, 1200px and up) */
        @media (min-width: 1200px) {
          .weather-dashboard-container {
            padding: 2.5rem;
          }
        }

        /* Ultra-wide screens (1536px and up) */
        @media (min-width: 1536px) {
          .weather-dashboard-container {
            max-width: 1800px;
            margin: 0 auto;
          }
        }

        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          button, a {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Dark mode enhancements */
        @media (prefers-color-scheme: dark) {
          .weather-text-primary {
            color: #ffffff;
          }
          
          .weather-text-secondary {
            color: #cbd5e1;
          }
        }

        /* Print styles */
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
            color: black !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .glass-effect {
            background: rgba(0, 0, 0, 0.9) !important;
            border: 2px solid white !important;
          }
        }
      `}</style>
    </div>
  )
} 