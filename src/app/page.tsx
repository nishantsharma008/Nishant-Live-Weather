'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import {
  // Original imports
  Search, Bell, ChevronDown, Home, Map, Calendar,
  Wind, Flower2, Video, Settings, Heart, MapPin,
  Navigation, Droplets, Eye, Gauge, CloudRain,
  Thermometer, Layers, ZoomIn, ZoomOut, RotateCcw,
  Loader2, RefreshCw, Sun, Moon, Cloud,
  CloudLightning, Snowflake, CloudFog, AlertTriangle,
  Menu, X, Maximize2, Minimize2,
  // 👇 NEW - Welcome Page Icons
  Zap, Globe, Check, ArrowRight, Activity, Target, Database
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

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
    isMediumMobile: windowSize.width >= 412 && windowSize.width < 640,
    width: windowSize.width,
    height: windowSize.height,
  }
}
// ==================== PERFORMANCE OPTIMIZATION HOOK ====================
function usePerformanceMode() {
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      // Check if mobile device
      const isMobile = window.innerWidth < 768;
      setIsMobileDevice(isMobile);

      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 2;

      // Check memory (if available)
      const memory = (navigator as any)?.deviceMemory || 4;

      // Check user preference for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Enable low performance mode if:
      // - Mobile device OR
      // - Less than 4 CPU cores OR  
      // - Less than 4GB RAM OR
      // - User prefers reduced motion
      if (isMobile || cores < 4 || memory < 4 || prefersReducedMotion) {
        setIsLowPerformance(true);
        console.log('🚀 Performance Mode: LOW - Animations disabled');
      } else {
        console.log('🚀 Performance Mode: HIGH - Full effects enabled');
      }
    };

    checkPerformance();
    window.addEventListener('resize', checkPerformance);
    return () => window.removeEventListener('resize', checkPerformance);
  }, []);

  return { isLowPerformance, isMobileDevice };
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

  // PARTLY CLOUDY DAY (02d)
  if (type === '02d') {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 via-orange-300/20 to-transparent rounded-full scale-150" />
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl animate-float-slow">
          <defs>
            <linearGradient id="partlyCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          <g style={{ animation: 'sunPulse 3s ease-in-out infinite' }}>
            <circle cx="45" cy="40" r="18" fill="#FBBF24" style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.7))' }}>
              <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
            </circle>

            <g style={{ animation: 'sunRotate 20s linear infinite', transformOrigin: '45px 40px' }}>
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const rad = angle * Math.PI / 180
                return (
                  <line key={i}
                    x1={45 + Math.cos(rad) * 22} y1={40 + Math.sin(rad) * 22}
                    x2={45 + Math.cos(rad) * 28} y2={40 + Math.sin(rad) * 28}
                    stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                )
              })}
            </g>
          </g>

          <g style={{ animation: 'cloudFloat 4s ease-in-out infinite' }}>
            <ellipse cx="70" cy="75" rx="22" ry="14" fill="url(#partlyCloudGrad)" opacity="0.95" />
            <ellipse cx="58" cy="78" rx="17" ry="10" fill="#F8FAFC" opacity="0.92" />
            <circle cx="80" cy="72" r="12" fill="#FFFFFF" opacity="0.98" />
          </g>
        </svg>
      </div>
    )
  }

  // CLOUDY ICONS (03d, 03n, 04d, 04n)
  if (['03d', '03n', '04d', '04n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
          <g style={{ animation: 'cloudFloat 4s ease-in-out infinite' }}>
            <ellipse cx="60" cy="65" rx="28" ry="18" fill="#E2E8F0" opacity="0.9" />
            <ellipse cx="50" cy="68" rx="22" ry="13" fill="#CBD5E1" opacity="0.85" />
            <circle cx="70" cy="62" r="16" fill="#F1F5F9" opacity="0.95" />
            <circle cx="45" cy="64" r="13" fill="#FFFFFF" opacity="0.98" />
          </g>
        </svg>
      </div>
    )
  }

  // RAIN ICONS (09d, 09n, 10d, 10n)
  if (['09d', '09n', '10d', '10n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="rainCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>

          <g>
            <ellipse cx="60" cy="35" rx="28" ry="16" fill="url(#rainCloudGrad)" />
            <ellipse cx="78" cy="32" rx="18" ry="12" fill="#374151" />
            <ellipse cx="44" cy="38" rx="22" ry="14" fill="#1F2937" />
          </g>

          {[35, 55, 85].map((x, i) => (
            <line key={i} x1={x} y1="58" x2={x - 8} y2="88"
              stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" opacity="0.85">
              <animate attributeName="y1" values="58;88;58" dur={`${0.8 + i * 0.2}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="y2" values="88;118;88" dur={`${0.8 + i * 0.2}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;0.4;0.85" dur={`${0.8 + i * 0.2}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </line>
          ))}
        </svg>
      </div>
    )
  }

  // THUNDERSTORM ICON (11d, 11n)
  if (['11d', '11n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
          <g>
            <ellipse cx="60" cy="32" rx="28" ry="16" fill="#1F2937" />
            <ellipse cx="78" cy="28" rx="18" ry="12" fill="#111827" />
            <ellipse cx="44" cy="36" rx="22" ry="14" fill="#030712" />
          </g>

          <path d="M66 48 L52 72 L60 72 L54 100 L76 68 L66 68 Z" fill="#FBBF24"
            style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.9))' }}>
            <animate attributeName="opacity" values="1;0.3;1;0.5;1" dur="2s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>
    )
  }

  // SNOW ICON (13d, 13n)
  if (['13d', '13n'].includes(type)) {
    return (
      <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
          <g>
            <ellipse cx="60" cy="35" rx="28" ry="16" fill="#E2E8F0" />
            <ellipse cx="78" cy="32" rx="18" ry="12" fill="#CBD5E1" />
            <ellipse cx="44" cy="38" rx="22" ry="14" fill="#94A3B8" />
          </g>

          {[38, 60, 82].map((x, i) => (
            <circle key={i} cx={x} cy="78" r="6" fill="#BFDBFE"
              style={{ filter: 'drop-shadow(0 3px 5px rgba(186, 230, 253, 0.6))' }}>
              <animate attributeName="cy" values="68;94;68" dur={`${2.5 + i * 0.4}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur={`${2.5 + i * 0.4}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" />
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
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {[35, 50, 65, 80, 95].map((y, i) => (
            <line key={i} x1="15" y1={y} x2="105" y2={y}
              stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" opacity={0.2 + (i * 0.12)}>
              <animate attributeName="x1" values="15;25;15" dur={`${6 + i * 1.2}s`} repeatCount="indefinite" />
              <animate attributeName="x2" values="105;115;105" dur={`${6 + i * 1.2}s`} repeatCount="indefinite" />
            </line>
          ))}
        </svg>
      </div>
    )
  }

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

AnimatedMoonPhaseIcon.displayName = 'AnimatedMoonPhaseIcon'

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
              <div><h3 className="text-sm md:text-base lg:text-xl font-bold text-white drop-shadow"> Interactive World Map</h3><p className="text-[8px] md:text-[10px] lg:text-xs text-gray-400 flex items-center gap-1"><Navigation className="w-2.5 h-2.5 md:w-3 md:h-3" />{location?.city ? `${location.city}, ${location.country}` : 'Global View'}</p></div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-semibold animate-pulse border border-green-400/40 shadow-md shadow-green-500/20"><span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full animate-pulse" />LIVE TRACKING</div>
            </div>
          </div>
          <div className="relative flex-1 w-full min-h-[250px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] aspect-video max-h-[50vh] lg:max-h-none rounded-xl md:rounded-2xl overflow-hidden border border-white/20 z-0 bg-gradient-to-br from-green-900/30 to-blue-800/20 flex items-center justify-center">
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

          {/* HEADER */}
          {/* HEADER - SINGLE ROW */}
          <div className="flex items-center justify-between gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap flex-shrink-0">

            {/* LEFT: Title + Location */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm md:text-lg lg:text-xl font-bold text-white drop-shadow truncate">Interactive World Map</h3>
                <p className="text-[8px] md:text-xs text-gray-400 truncate">
                  <Navigation className="w-2.5 h-2.5 inline mr-1" />
                  {location?.city ? `${location.city}, ${location.country}` : 'Global View'}
                </p>
              </div>
            </div>

            {/* RIGHT: Both Buttons in Same Row */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* 🟢 LIVE TRACKING Badge */}
              <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-semibold animate-pulse border border-green-400/40 shadow-md shadow-green-500/20 whitespace-nowrap">
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full animate-pulse" />
                LIVE TRACKING
              </div>

              {/* 🔵 Locate Me Button */}
              <button
                onClick={() => {
                  if (leafletMap && location?.lat && location?.lon) {
                    leafletMap.flyTo([location.lat, location.lon], 14, { duration: 2 })
                  }
                }}
                className="
    relative flex items-center justify-center gap-1 
    bg-gradient-to-r from-blue-500 to-cyan-400 
    hover:from-blue-400 hover:to-cyan-300
    text-white rounded-full font-semibold 
    border border-blue-300/40 
    shadow-md shadow-blue-500/20
    backdrop-blur-sm
    active:scale-95
    flex-shrink-0 
    
    px-[7px] py-[2px]
    h-[24px]
    text-[9px]
    w-[86px]
    leading-none
    
    sm:w-[96px] sm:h-[26px] sm:text-[10px]
    md:w-[104px] md:h-[28px] md:text-xs
  "
              >
                <Navigation className="w-[11px] h-[11px] sm:w-3 sm:h-3" />
                <span className="font-semibold whitespace-nowrap">Locate Me</span>
              </button>

            </div>
          </div>

          {/* LAYER BUTTONS */}
          <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 overflow-x-auto overflow-y-hidden pb-1 md:pb-2 flex-shrink-0 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
            <span className="text-[10px] md:text-xs font-semibold text-gray-300 whitespace-nowrap mr-1 flex items-center gap-1">
              <Layers className="w-2.5 h-2.5 md:w-3 md:h-3" />
              :
            </span>
            {['Temperature', 'Precipitation', 'Wind Speed'].map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`flex items-center gap-1 md:gap-1.5 px-3 md:px-3 lg:px-4 py-1.5 md:py-1.5 lg:py-2 rounded-lg font-medium text-[10px] md:text-xs whitespace-nowrap transition-all duration-300 border active:scale-95 snap-start flex-shrink-0 ${activeLayer === layer
                  ? 'bg-gradient-to-r from-orange-500/95 to-red-500/95 text-white shadow-lg backdrop-blur-sm border-orange-300/50 font-bold'
                  : 'bg-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.15] border-white/15 hover:scale-105'
                  }`}
              >
                {layer === 'Temperature' && <Thermometer className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                {layer === 'Precipitation' && <Droplets className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                {layer === 'Wind Speed' && <Wind className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                {layer}
              </button>
            ))}
          </div>

          {/* MAP CONTAINER WITH ALL OVERLAYS */}
          <div className="relative w-full flex-1 min-h-[250px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] aspect-video max-h-[50vh] lg:max-h-none rounded-xl md:rounded-2xl overflow-hidden border border-white/20 z-0">
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              zoomControl={false}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', minHeight: '250px' }}
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

            {/* COORDINATES DISPLAY */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/85 backdrop-blur-md rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[11px] md:text-xs text-white font-mono font-semibold z-[1000] border border-white/25 shadow-lg whitespace-nowrap">
              Lat: {(location?.lat || 30.7811).toFixed(4)} | Lon: {(location?.lon || 76.6168).toFixed(4)}
            </div>

            {/* ZOOM CONTROLS */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1.5 sm:gap-2 z-[1000]">
              <button onClick={handleZoomIn} disabled={!leafletMap} className={`w-9 h-9 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-10 lg:h-10 rounded-lg shadow-lg border-2 flex items-center justify-center transition-all ${leafletMap ? 'bg-white/95 hover:bg-blue-50 cursor-pointer hover:scale-110 active:scale-95 border-gray-200' : 'bg-gray-200 cursor-not-allowed opacity-60'}`} title="Zoom In (+)" aria-label="Zoom in">
                <ZoomIn className={`w-4 h-4 sm:w-4 sm:h-4 md:w-4 md:h-4 ${leafletMap ? 'text-gray-700 hover:text-blue-600' : 'text-gray-400'}`} />
              </button>

              <button onClick={handleZoomOut} disabled={!leafletMap} className={`w-9 h-9 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-10 lg:h-10 rounded-lg shadow-lg border-2 flex items-center justify-center transition-all ${leafletMap ? 'bg-white/95 hover:bg-blue-50 cursor-pointer hover:scale-110 active:scale-95 border-gray-200' : 'bg-gray-200 cursor-not-allowed opacity-60'}`} title="Zoom Out (-)" aria-label="Zoom out">
                <ZoomOut className={`w-4 h-4 sm:w-4 sm:h-4 md:w-4 md:h-4 ${leafletMap ? 'text-gray-700 hover:text-blue-600' : 'text-gray-400'}`} />
              </button>

              <div className="h-px w-7 sm:w-8 bg-gray-300 mx-auto my-1" />

              <button onClick={handleResetView} disabled={!leafletMap} className={`w-9 h-9 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-10 lg:h-10 rounded-lg shadow-lg border-2 flex items-center justify-center transition-all ${leafletMap ? 'bg-white/95 hover:bg-green-50 cursor-pointer hover:scale-110 active:scale-95 border-gray-200' : 'bg-gray-200 cursor-not-allowed opacity-60'}`} title="Reset to Location" aria-label="Reset view">
                <RotateCcw className={`w-4 h-4 sm:w-4 sm:h-4 md:w-4 md:h-4 ${leafletMap ? 'text-gray-700 hover:text-green-600' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* ✅✅✅ WHITE LEGEND CARD - ANCHORED TO BOTTOM-LEFT CORNER ✅✅✅ */}
            <div className="absolute bottom-3 left-2 sm:bottom-4 sm:left-3 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-gray-300 z-[1000] w-[160px] sm:w-[185px] p-2.5 sm:p-3">
              <h5 className="font-bold text-[11px] sm:text-sm text-purple-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 pb-1.5 border-b border-gray-200">
                <span className="text-sm">🌡️</span>
                {activeLayer}
              </h5>
              <div className="space-y-1.5">
                {activeLayer === 'Temperature' && [
                  { color: '#ef4444', label: 'Hot ≥36°' },
                  { color: '#f97316', label: 'Warm 33-35°' },
                  { color: '#eab308', label: 'Mild 30-32°' },
                  { color: '#22c55e', label: 'Cool <30°' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] sm:text-[10px]">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-800 font-medium">{item.label}</span>
                  </div>
                ))}

                {activeLayer === 'Precipitation' && [
                  { color: '#3b82f6', label: 'Heavy >70%' },
                  { color: '#60a5fa', label: 'Moderate 40-70%' },
                  { color: '#93c5fd', label: 'Light 10-40%' },
                  { color: '#dbeafe', label: 'Dry <10%' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] sm:text-[10px]">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-800 font-medium">{item.label}</span>
                  </div>
                ))}

                {activeLayer === 'Wind Speed' && [
                  { color: '#ef4444', label: 'Strong >25 km/h' },
                  { color: '#f97316', label: 'Moderate 15-25' },
                  { color: '#eab308', label: 'Light 5-15 km/h' },
                  { color: '#22c55e', label: 'Calm <5 km/h' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] sm:text-[10px]">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-800 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FOOTER STATS - Only 3 Cards */}
          <div className="mt-2 md:mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            <div className="bg-white/[0.06] rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all min-w-0">
              <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 truncate font-medium">Zoom Level</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-white">{zoom}x</p>
            </div>

            <div className="bg-white/[0.06] rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all min-w-0">
              <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 truncate font-medium">Active Markers</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-white">{1 + nearbyPoints.length}</p>
            </div>

            <div className="bg-white/[0.06] rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all min-w-0">
              <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 truncate font-medium">Layer</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-white truncate">{activeLayer.split(' ')[0]}</p>
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
function WeatherDashboardContent() {

  // ============================================
  // 🎬 WELCOME PAGE INTEGRATION
  // ============================================
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeProgress, setWelcomeProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'loading' | 'ready' | 'transitioning'>('loading');
  const [showContent, setShowContent] = useState(false);

  // ✅ NEW: Get search params to check for skipWelcome
  const searchParams = useSearchParams();

  // ✅ NEW: Skip welcome if coming from another page
  useEffect(() => {
    const shouldSkip = searchParams.get('skipWelcome');
    if (shouldSkip === 'true') {
      setShowWelcome(false);
    }
  }, [searchParams]);

  // ============================================
  // 📱 RESPONSIVE HOOK FOR WELCOME PAGE
  // ============================================

  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileView = screenSize.width < 768;
  const isTabletView = screenSize.width >= 768 && screenSize.width < 1024;
  const isDesktopView = screenSize.width >= 1024;


  useEffect(() => {
    if (!showWelcome) return;

    // Phase 1: Show content after short delay
    const contentTimer = setTimeout(() => setShowContent(true), 300);

    // Phase 2: Progress animation ✅ SLOW VERSION
    const timer = setInterval(() => {
      setWelcomeProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setCurrentPhase('ready');

          // Phase 3: Start exit after brief pause
          setTimeout(() => {
            setCurrentPhase('transitioning');
            setIsExiting(true);

            // Complete hide after fade-out
            setTimeout(() => setShowWelcome(false), 1200);
          }, 800);

          return 100;
        }

        // ✅✅✅ REDUCED SPEED ✅✅✅
        const increment = Math.random() * 1.8 + 0.7;  // ← CHANGED: Was 4 + 1.5
        return Math.min(prev + increment, 100);
      });
    }, 280); // ← CHANGED: Was 180

    return () => {
      clearInterval(timer);
      clearTimeout(contentTimer);
    };
  }, [showWelcome]);

  // ============================================
  // END WELCOME PAGE INTEGRATION
  // ============================================
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
  // ============================================
  // 🎬 SHOW WELCOME OVERLAY OR MAIN DASHBOARD
  // ============================================
  // ============================================
  // 🎬 ULTRA PREMIUM WELCOME PAGE - FINAL VERSION
  // ============================================

  // ============================================
  // 🎬 WELCOME PAGE - ERROR-FREE MINIMAL VERSION  
  // ============================================

  // ============================================
  // 🎬 SHOW WELCOME OVERLAY OR MAIN DASHBOARD
  // ============================================

  if (showWelcome) {
    if (isDesktopView) {
      // ============================================
      // ✅ DESKTOP VIEW - FULL ANIMATIONS
      // ============================================
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          transition: 'all 1s ease-in-out',
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(1.02)' : 'scale(1)',
          filter: isExiting ? 'blur(8px)' : 'blur(0)',
        }}>
          <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }

          /* Desktop Icon Animations */
          @keyframes desktopSunRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes desktopCloudFloat {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-4px) translateX(3px); }
          }
          
          @keyframes desktopSunPulse {
            0%, 100% { 
              transform: scale(1);
              filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.6));
            }
            50% { 
              transform: scale(1.08);
              filter: drop-shadow(0 0 18px rgba(251, 191, 36, 0.9));
            }
          }
          
          @keyframes desktopRayPulse {
            0%, 100% { opacity: 0.65; stroke-width: 2.5; }
            50% { opacity: 1; stroke-width: 3.5; }
          }

          @keyframes desktopShimmerSweep {
            0% { transform: translateX(-150%) skewX(-12deg); }
            100% { transform: translateX(250%) skewX(-12deg); }
          }

          @keyframes desktopGlowRing {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.12); opacity: 0.85; }
          }
        `}</style>

          <div style={{
            width: '100%',
            height: '100%',
            background: '#000000',
            position: 'relative',
            overflow: 'hidden',
          }}>

            {/* Background */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at center, #0a1628 0%, #000000 100%)',
              }} />

              <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '120%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
                filter: 'blur(80px)',
              }} />

              <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '120%',
                height: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
                filter: 'blur(70px)',
              }} />
            </div>

            {/* Content */}
            <div style={{
              position: 'relative',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              minHeight: '100vh',
              padding: '8vh 3rem 4rem',
              opacity: showContent ? 1 : 0,
              transform: showContent ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out',
            }}>

              {/* Logo Container - CENTERED */}
              <div style={{
                textAlign: 'center',
                marginBottom: welcomeProgress >= 100 ? '1.5rem' : '2.5rem',
                transition: 'all 0.8s ease',
                transform: welcomeProgress >= 100 ? 'scale(0.95)' : 'scale(1)',
                opacity: welcomeProgress >= 100 ? 0.9 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}>

                {/* Icon Card - CENTERED WITH ANIMATIONS */}
                <div style={{
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                }}>
                  <div style={{
                    position: 'relative',
                    width: '160px',
                    height: '160px',
                  }}>

                    {/* Outer Glow Ring */}
                    <div style={{
                      position: 'absolute',
                      inset: '-10px',
                      borderRadius: '42px',
                      background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
                      animation: 'desktopGlowRing 3s ease-in-out infinite',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }} />

                    {/* Glass Card */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                      zIndex: 1,
                    }}>

                      {/* ✅ FULLY ANIMATED SVG ICON - DESKTOP */}
                      <svg viewBox="0 0 100 100" style={{
                        width: '100%',
                        height: '100%',
                        animation: 'desktopIconBreath 4s ease-in-out infinite',
                        transformOrigin: 'center',
                      }}>
                        <defs>
                          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFE066">
                              <animate attributeName="stop-color" values="#FFE066;#FFF176;#FFE066" dur="3s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stopColor="#FBBF24">
                              <animate attributeName="stop-color" values="#FBBF24;#FBC02D;#FBBF24" dur="3s" repeatCount="indefinite" />
                            </stop>
                          </linearGradient>

                          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#E8F0FE" />
                          </linearGradient>

                          <filter id="desktopSunGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>

                          <filter id="desktopCloudShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.25" />
                          </filter>
                        </defs>

                        {/* ✅ CLOUD GROUP - FLOATING ANIMATION */}
                        <g style={{
                          animation: 'desktopCloudFloat 4s ease-in-out infinite',
                          filter: 'url(#desktopCloudShadow)',
                        }}>
                          <ellipse cx="52" cy="62" rx="26" ry="14" fill="url(#cloudGrad)" opacity="0.95">
                            <animate attributeName="opacity" values="0.92;1;0.92" dur="4s" repeatCount="indefinite" />
                          </ellipse>
                          <circle cx="32" cy="64" r="10" fill="white" opacity="0.92" />
                          <circle cx="72" cy="63" r="9" fill="white" opacity="0.88" />
                          <circle cx="52" cy="53" r="11" fill="white" opacity="0.9" />
                          <ellipse cx="48" cy="57" rx="14" ry="6" fill="white" opacity="0.28" />
                        </g>

                        {/* ✅ SUN GROUP - ROTATION + PULSE + RAYS */}
                        <g style={{
                          animation: 'desktopSunRotate 20s linear infinite',
                          transformOrigin: '52px 48px',
                        }}>
                          <circle cx="52" cy="48" r="20" fill="url(#sunGrad)" filter="url(#desktopSunGlow)">
                            <animate attributeName="r" values="20;21.5;20" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0.93;1" dur="2s" repeatCount="indefinite" />
                          </circle>

                          {/* Sun Rays - Animated */}
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                            const rad = angle * Math.PI / 180;
                            return (
                              <line
                                key={i}
                                x1={52 + Math.cos(rad) * 24}
                                y1={48 + Math.sin(rad) * 24}
                                x2={52 + Math.cos(rad) * 33}
                                y2={48 + Math.sin(rad) * 33}
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                opacity="0.82"
                              >
                                <animate
                                  attributeName="opacity"
                                  values="0.5;1;0.5"
                                  dur={`${2 + i * 0.2}s`}
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="strokeWidth"
                                  values="2;3.5;2"
                                  dur={`${1.5 + i * 0.15}s`}
                                  repeatCount="indefinite"
                                />
                              </line>
                            );
                          })}

                          {/* Inner Bright Spot */}
                          <circle cx="49" cy="45" r="8" fill="#FFFFFF" opacity="0.45">
                            <animate attributeName="opacity" values="0.3;0.55;0.3" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="r" values="7;9;7" dur="2.5s" repeatCount="indefinite" />
                          </circle>

                          <circle cx="54" cy="51" r="4" fill="#FEFCE8" opacity="0.3">
                            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
                          </circle>
                        </g>
                      </svg>

                      {/* Shimmer Effect */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                        borderRadius: '32px',
                        animation: 'shimmer 3s infinite',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }} />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 style={{
                  fontSize: welcomeProgress >= 100 ? '3.5rem' : '4.5rem',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3em',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ color: 'white' }}>Weather</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #FB923C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'gradientMove 5s ease infinite',
                  }}>Live</span>
                </h1>

                {/* Subtitle */}
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 300,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: '#94A3B8',
                  marginBottom: '1rem',
                }}>
                  Real-time Weather Dashboard
                </p>

                {/* Tagline */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <Zap size={14} color="#3B82F6" style={{ animation: 'pulse 2s infinite' }} />
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#60A5FA',
                    letterSpacing: '0.05em'
                  }}>
                    AI-Powered • Global Coverage • Live Updates
                  </span>
                  <Globe size={14} color="#3B82F6" style={{ animation: 'pulse 2s infinite 1s' }} />
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                maxWidth: '500px',
                marginTop: welcomeProgress >= 100 ? '1.5rem' : '2rem',
                opacity: welcomeProgress >= 100 ? 0 : 1,
                maxHeight: welcomeProgress >= 100 ? '0' : '200px',
                overflow: 'hidden',
                transition: 'all 0.8s ease',
              }}>
                <div style={{
                  position: 'relative',
                  height: '18px',
                  background: 'rgba(15,23,42,0.6)',
                  borderRadius: '9999px',
                  border: '1px solid rgba(148,163,184,0.12)',
                  overflow: 'hidden',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${welcomeProgress}%`,
                    background: 'linear-gradient(90deg, #22C55E 0%, #06B6D4 50%, #8B5CF6 100%)',
                    borderRadius: '9999px',
                    boxShadow: '0 0 20px rgba(34,197,94,0.4)',
                    transition: 'width 0.5s ease',
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'shimmer 2s infinite',
                    }} />
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: `calc(${welcomeProgress}% - 6px)`,
                    transform: 'translateY(-50%)',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 0 20px 5px white',
                    transition: 'left 0.5s ease',
                  }} />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {welcomeProgress < 100 ? (
                      <>
                        <Loader2 size={18} color="#06B6D4" style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                          {welcomeProgress < 30 ? 'Initializing...' :
                            welcomeProgress < 60 ? 'Loading Data...' :
                              welcomeProgress < 90 ? 'Preparing...' : 'Almost Ready...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check size={16} color="#22C55E" strokeWidth={3} />
                        <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: '0.95rem' }}>
                          System Ready!
                        </span>
                      </>
                    )}
                  </div>

                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: welcomeProgress >= 100 ? '#4ADE80' : '#06B6D4'
                  }}>
                    {Math.round(welcomeProgress)}%
                  </span>
                </div>
              </div>

              {/* Feature Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.25rem',
                width: '100%',
                maxWidth: '520px',
                marginTop: welcomeProgress >= 100 ? '1.5rem' : '1rem',
                opacity: welcomeProgress >= 100 ? 1 : 0,
                transform: welcomeProgress >= 100 ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.8s ease 0.3s',
              }}>
                {[
                  { Icon: Globe, title: 'Global Data', desc: 'Worldwide coverage', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
                  { Icon: Activity, title: 'Real-time', desc: 'Live updates every minute', color: '#FB923C', bg: 'rgba(251,146,60,0.15)' },
                  { Icon: Target, title: 'Precise', desc: 'AI-powered accuracy', color: '#A78BFA', bg: 'rgba(167,122,250,0.15)' },
                ].map((feature, i) => (
                  <div key={i} style={{
                    background: 'rgba(15,23,42,0.5)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: '16px',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    transition: 'all 0.4s ease',
                    animation: `slideUp 0.6s ease ${0.2 + i * 0.15}s both`,
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)';
                    }}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      margin: '0 auto 0.875rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: feature.bg,
                      color: feature.color,
                    }}>
                      <feature.Icon size={26} strokeWidth={1.5} />
                    </div>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>{feature.title}</p>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#64748B'
                    }}>{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Bottom Hint */}
              {welcomeProgress >= 100 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '2rem',
                  color: '#64748B',
                  fontSize: '0.875rem',
                  animation: 'fadeInOut 2s infinite',
                }}>
                  <ArrowRight size={14} style={{ animation: 'pulse 1.5s infinite' }} />
                  <span>Entering Dashboard...</span>
                </div>
              )}
            </div>

            {/* Vignette */}
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
            }} />
          </div>
        </div>
      );

    } else {
      // ============================================
      // ✅ MOBILE VIEW - FULL ANIMATIONS (FIXED!)
      // ============================================

      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          transition: 'all 1s ease-in-out',
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'scale(1.03)' : 'scale(1)',
        }}>
          <style>{`
          /* Mobile-Specific Animation Keyframes */
          @keyframes mobileSunRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes mobileCloudFloat {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-3px) translateX(2px); }
          }
          
          @keyframes mobileSunPulse {
            0%, 100% { 
              transform: scale(1);
              filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
            }
            50% { 
              transform: scale(1.08);
              filter: drop-shadow(0 0 14px rgba(251, 191, 36, 0.9));
            }
          }
          
          @keyframes mobileRayPulse {
            0%, 100% { opacity: 0.6; stroke-width: 2; }
            50% { opacity: 1; stroke-width: 3; }
          }
          
          @keyframes mobileIconBreath {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.04); }
          }
          
          @keyframes mobileShimmerSweep {
            0% { transform: translateX(-150%) skewX(-12deg); }
            100% { transform: translateX(250%) skewX(-12deg); }
          }
          
          @keyframes mobileGlowRing {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 0.9; }
          }

          @keyframes gradientMove {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes fadeInOut {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }

          @keyframes mobileAurora {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, 20px) rotate(2deg); }
            66% { transform: translate(-20px, -15px) rotate(-1deg); }
          }

          @keyframes mobileOrbFloat {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-40px, 30px); }
          }
        `}</style>

          <div style={{
            width: '100%',
            height: '100%',
            background: '#000000',
            position: 'relative',
            overflow: 'hidden',
          }}>

            {/* Mobile Background */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at center, #0c1929 0%, #000000 100%)',
              }} />

              <div style={{
                position: 'absolute',
                top: '-15%',
                left: '-15%',
                width: '130%',
                height: '55%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
                filter: 'blur(60px)',
                animation: 'mobileAurora 8s ease-in-out infinite',
              }} />

              <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '-10%',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
                filter: 'blur(50px)',
                animation: 'mobileOrbFloat 12s ease-in-out infinite',
              }} />
            </div>

            {/* Mobile Content */}
            <div style={{
              position: 'relative',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              padding: '2rem 1.5rem',
              opacity: showContent ? 1 : 0,
              transform: showContent ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease-out',
            }}>

              {/* ============================================ */}
              {/* ✅✅✅ MOBILE ICON - FULL ANIMATIONS (SAME AS DESKTOP!) ✅✅✅ */}
              {/* ============================================ */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  position: 'relative',
                  width: '140px',
                  height: '140px',
                }}>

                  {/* Outer Glow Ring - Animated */}
                  <div style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '36px',
                    background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
                    animation: 'mobileGlowRing 3s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />

                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    zIndex: 1,
                  }}>

                    {/* ✅ FULLY ANIMATED SVG ICON (IDENTICAL TO DESKTOP!) */}
                    <svg viewBox="0 0 100 100" style={{
                      width: '100%',
                      height: '100%',
                      animation: 'mobileIconBreath 4s ease-in-out infinite',
                      transformOrigin: 'center',
                    }}>
                      <defs>
                        {/* Sun Gradient with Color Animation */}
                        <linearGradient id="mSunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FFE066">
                            <animate attributeName="stop-color" values="#FFE066;#FFF176;#FFE066" dur="3s" repeatCount="indefinite" />
                          </stop>
                          <stop offset="100%" stopColor="#FBBF24">
                            <animate attributeName="stop-color" values="#FBBF24;#FBC02D;#FBBF24" dur="3s" repeatCount="indefinite" />
                          </stop>
                        </linearGradient>

                        {/* Cloud Gradient */}
                        <linearGradient id="mCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="100%" stopColor="#E8F0FE" />
                        </linearGradient>

                        {/* Sun Glow Filter */}
                        <filter id="mSunGlow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>

                        {/* Cloud Shadow for Depth */}
                        <filter id="mCloudShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
                        </filter>
                      </defs>

                      {/* ✅ CLOUD GROUP - FLOATING ANIMATION (Same as Desktop!) */}
                      <g style={{
                        animation: 'mobileCloudFloat 4s ease-in-out infinite',
                        filter: 'url(#mCloudShadow)',
                      }}>
                        {/* Main Cloud Body */}
                        <ellipse cx="52" cy="62" rx="26" ry="14" fill="url(#mCloudGrad)" opacity="0.95">
                          <animate attributeName="opacity" values="0.9;1;0.9" dur="4s" repeatCount="indefinite" />
                        </ellipse>

                        {/* Cloud Puffs */}
                        <circle cx="32" cy="64" r="10" fill="white" opacity="0.92" />
                        <circle cx="72" cy="63" r="9" fill="white" opacity="0.88" />
                        <circle cx="52" cy="53" r="11" fill="white" opacity="0.9" />

                        {/* Cloud Highlight */}
                        <ellipse cx="48" cy="57" rx="14" ry="6" fill="white" opacity="0.28" />
                      </g>

                      {/* ✅ SUN GROUP - ROTATION + PULSE + RAYS (Same as Desktop!) */}
                      <g style={{
                        animation: 'mobileSunRotate 20s linear infinite',
                        transformOrigin: '52px 48px',
                      }}>
                        {/* Main Sun Circle with Glow */}
                        <circle cx="52" cy="48" r="20" fill="url(#mSunGrad)" filter="url(#mSunGlow)">
                          {/* Pulsing Size Animation */}
                          <animate attributeName="r" values="20;21.5;20" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;0.92;1" dur="2s" repeatCount="indefinite" />
                        </circle>

                        {/* ✅ SUN RAYS - INDIVIDUALLY ANIMATED (Same as Desktop!) */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                          const rad = angle * Math.PI / 180;
                          return (
                            <line
                              key={i}
                              x1={52 + Math.cos(rad) * 24}
                              y1={48 + Math.sin(rad) * 24}
                              x2={52 + Math.cos(rad) * 33}
                              y2={48 + Math.sin(rad) * 33}
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              opacity="0.85"
                            >
                              {/* Individual Ray Opacity Pulse */}
                              <animate
                                attributeName="opacity"
                                values="0.5;1;0.5"
                                dur={`${2 + i * 0.2}s`}
                                repeatCount="indefinite"
                              />
                              {/* Individual Ray Width Pulse */}
                              <animate
                                attributeName="strokeWidth"
                                values="2;3.5;2"
                                dur={`${1.5 + i * 0.15}s`}
                                repeatCount="indefinite"
                              />
                            </line>
                          );
                        })}

                        {/* Inner Bright Spot (Sun Center Glow) */}
                        <circle cx="49" cy="45" r="8" fill="#FFFFFF" opacity="0.45">
                          <animate
                            attributeName="opacity"
                            values="0.3;0.55;0.3"
                            dur="3s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="r"
                            values="7;9;7"
                            dur="2.5s"
                            repeatCount="indefinite"
                          />
                        </circle>

                        {/* Secondary Inner Glow */}
                        <circle cx="54" cy="51" r="4" fill="#FEFCE8" opacity="0.3">
                          <animate
                            attributeName="opacity"
                            values="0.2;0.4;0.2"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    </svg>

                    {/* Shimmer Effect Overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                      borderRadius: '28px',
                      animation: 'mobileShimmerSweep 3s infinite',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }} />
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* MOBILE TITLE SECTION                       */}
              {/* ============================================ */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25em',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ color: 'white' }}>Weather</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #FB923C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'gradientMove 5s ease infinite',
                  }}>Live</span>
                </h1>

                <p style={{
                  fontSize: '0.8rem',
                  fontWeight: 300,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#94A3B8',
                  marginBottom: '0.75rem',
                }}>
                  Real-time Weather Dashboard
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <Zap size={11} color="#3B82F6" style={{ animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#60A5FA' }}>
                    AI-Powered • Live Updates
                  </span>
                  <Globe size={11} color="#3B82F6" style={{ animation: 'pulse 2s infinite 1s' }} />
                </div>
              </div>

              {/* ============================================ */}
              {/* MOBILE PROGRESS BAR                        */}
              {/* ============================================ */}
              <div style={{
                width: '100%',
                maxWidth: '320px',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  height: '14px',
                  background: 'rgba(15,23,42,0.6)',
                  borderRadius: '9999px',
                  border: '1px solid rgba(148,163,184,0.1)',
                  overflow: 'hidden',
                  marginBottom: '0.625rem',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${welcomeProgress}%`,
                    background: 'linear-gradient(90deg, #22C55E 0%, #06B6D4 50%, #8B5CF6 100%)',
                    borderRadius: '9999px',
                    boxShadow: '0 0 15px rgba(34,197,94,0.4)',
                    transition: 'width 0.4s ease',
                    position: 'relative',
                  }}>
                    {/* Progress shimmer effect */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'mobileShimmerSweep 2s infinite',
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 0.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {welcomeProgress < 100 ? (
                      <>
                        <Loader2 size={15} color="#06B6D4" style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
                          {welcomeProgress < 33 ? 'Loading...' :
                            welcomeProgress < 66 ? 'Preparing...' : 'Almost ready...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check size={13} color="#22C55E" strokeWidth={3} />
                        <span style={{ color: '#4ADE80', fontSize: '0.85rem', fontWeight: 700 }}>Ready!</span>
                      </>
                    )}
                  </div>

                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: welcomeProgress >= 100 ? '#4ADE80' : '#06B6D4'
                  }}>
                    {Math.round(welcomeProgress)}%
                  </span>
                </div>
              </div>

              {/* ============================================ */}
              {/* MOBILE FEATURE CARDS                       */}
              {/* ============================================ */}
              <div style={{
                width: '100%',
                maxWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                opacity: welcomeProgress >= 100 ? 1 : 0,
                transform: welcomeProgress >= 100 ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.7s ease 0.2s',
              }}>
                {[
                  { Icon: Globe, label: 'Global Data', sub: 'Worldwide coverage', iconBg: 'rgba(96,165,250,0.15)', iconColor: '#60A5FA' },
                  { Icon: Activity, label: 'Real-time', sub: 'Live updates', iconBg: 'rgba(251,146,60,0.15)', iconColor: '#FB923C' },
                  { Icon: Target, label: 'Precise', sub: 'AI accuracy', iconBg: 'rgba(167,122,250,0.15)', iconColor: '#A78BFA' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    background: 'rgba(15,23,42,0.5)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(148,163,184,0.08)',
                    borderRadius: '12px',
                    padding: '0.875rem 1rem',
                    transition: 'all 0.35s ease',
                    animation: `slideUp 0.5s ease ${0.3 + i * 0.1}s both`,
                  }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: item.iconBg,
                      color: item.iconColor,
                      flexShrink: 0,
                    }}>
                      <item.Icon size={19} strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>{item.label}</p>
                      <p style={{ fontSize: '0.7rem', color: '#64748B' }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Hint */}
              {welcomeProgress >= 100 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1.5rem',
                  color: '#64748B',
                  fontSize: '0.8rem',
                  animation: 'fadeInOut 2s infinite',
                }}>
                  <ArrowRight size={13} style={{ animation: 'pulse 1.5s infinite' }} />
                  <span>Entering Dashboard...</span>
                </div>
              )}
            </div>

            {/* Vignette */}
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.85) 100%)',
            }} />
          </div>
        </div>
      );
    }
  }

  // ===== MAIN DASHBOARD STARTS HERE =====
  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* ============================================ */}
      {/* 🎩✨ MAGIC UI BACKGROUND - YELLOW & BLACK     */}
      {/* ============================================ */}
      {/* ============================================ */}
      {/* 🎩✨ MAGIC UI BACKGROUND - HYDRATION SAFE   */}
      {/* ============================================ */}
      {/* ============================================ */}
      {/* 🌙 NIGHT SKY LAKE BACKGROUND - GLASS MORPHISM */}
      {/* ============================================ */}
      {/* ============================================ */}
      {/* 🌙 DOPER.PNG BACKGROUND - CINEMATIC EDITION */}
      {/* ============================================ */}
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
  bg-black/40 backdrop-blur-2xl
  border-r border-white/10
  shadow-2xl shadow-black/50
  ${responsive.isMobile && !isMobileSidebarOpen ? '' : 'flex-shrink-0'}
`}>
        <div className="h-full flex flex-col relative">

          {/* Right Border - Enhanced Glass Effect */}
          <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />

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
          {/* Navigation */}
          <nav className="flex-1 px-2 md:px-3 space-y-0.5 md:space-y-1 mt-2 md:mt-4 overflow-y-auto scrollbar-thin relative z-10 min-h-0">
            {[
              { icon: Home, label: 'Home', active: true },
              { icon: Map, label: 'Live Map' },
              { icon: Calendar, label: 'Forecast' },
              { icon: Wind, label: 'Air Quality' },
              {
                icon: Flower2,
                label: 'Pollen Count',
                isLink: true,
                href: `/poll?city=${encodeURIComponent(location?.city || '')}&lat=${location?.lat || ''}&lon=${location?.lon || ''}`
              },
              {
                icon: Video,
                label: 'News & Videos',
                isLink: true,
                href: 'https://weather.com/en-IN/weather/today/l/INXX0096:1:IN?Goto=Redirected'
              },
              { icon: Heart, label: 'Favorites' }
            ].map((item) => {
              if (item.isLink) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all duration-200 group text-gray-300 hover:bg-white/[0.08] hover:text-white hover:backdrop-blur-sm hover:translate-x-1 border border-transparent hover:border-white/10 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10"
                    onClick={() => responsive.isMobile && setIsMobileSidebarOpen(false)}
                  >
                    <item.icon className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110 flex-shrink-0" />
                    <span className="font-medium text-sm md:text-base truncate">{item.label}</span>
                  </a>
                )
              }

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (responsive.isMobile) {
                      setIsMobileSidebarOpen(false)
                    }

                    if (item.label === 'Air Quality') {
                      setTimeout(() => {
                        const airQualityElement = document.getElementById('air-quality-section')
                        if (airQualityElement) {
                          airQualityElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          })
                        }
                      }, responsive.isMobile ? 300 : 0)
                    }
                    else if (item.label === 'Live Map') {
                      setTimeout(() => {
                        const mapElement = document.getElementById('live-map-section')
                        if (mapElement) {
                          mapElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          })
                        }
                      }, responsive.isMobile ? 300 : 0)
                    }
                    else if (item.label === 'Forecast') {
                      setTimeout(() => {
                        const forecastElement = document.getElementById('forecast-section')
                        if (forecastElement) {
                          forecastElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          })
                        }
                      }, responsive.isMobile ? 300 : 0)
                    }
                    else if (item.label === 'Favorites') {
                      setTimeout(() => {
                        const highlightsElement = document.getElementById('highlights-section')
                        if (highlightsElement) {
                          highlightsElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          })
                        }
                      }, responsive.isMobile ? 300 : 0)
                    }
                    else {
                      if (responsive.isMobile) setIsMobileSidebarOpen(false)
                    }
                  }}
                  className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all duration-200 group cursor-pointer ${item.active ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/30 backdrop-blur-md border border-blue-400/40' : 'text-gray-300 hover:bg-white/[0.08] hover:text-white hover:backdrop-blur-sm hover:translate-x-1 border border-transparent hover:border-white/10 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-cyan-500/5'}`}
                >
                  <item.icon className={`w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110 flex-shrink-0 ${item.active ? 'text-white' : ''}`} />
                  <span className="font-medium text-sm md:text-base truncate">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Location Info Box - Enhanced Glass */}
          {/* Location Info Box - Enhanced Glass */}
          <div className="mx-2 md:mx-3 mb-2 md:mb-3 mt-auto p-3 md:p-4 bg-white/[0.05] backdrop-blur-2xl rounded-xl border border-white/10 hover:bg-white/[0.08] hover:border-blue-400/20 transition-all relative z-10 flex-shrink-0 shadow-lg shadow-black/30">
            <div className="flex items-start gap-2 mb-2 md:mb-3">
              <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-visible">
                <p className="text-[10px] md:text-xs text-gray-400">Current Location</p>

                {/* ✅ FIXED: Full Location Display - Responsive for Both Screens */}
                <p
                  className="text-xs md:text-sm font-semibold text-white break-words leading-tight"
                  title={`${location?.city || 'Rayat-Bahra University'}${location?.state && location?.state !== location?.city ? ', ' + location.state : ''}${location?.country ? ', ' + location.country : ''}`}
                >
                  <span className="block sm:inline">
                    {location?.city || 'Rayat-Bahra University'}
                    {location?.state && location?.state !== location?.city && (
                      <span className="hidden sm:inline">, {location.state}</span>
                    )}
                    {location?.country && (
                      <span className={location?.state === location?.city ? 'inline' : 'hidden sm:inline'}>, {location.country}</span>
                    )}
                  </span>
                  {/* Mobile: Show state/country on new line if needed */}
                  {location?.state && location?.state !== location?.city && (
                    <span className="sm:hidden block text-[10px] font-normal text-gray-300">
                      {location.state}{location?.country ? `, ${location.country}` : ''}
                    </span>
                  )}
                </p>

                <p className="text-[9px] md:text-xs text-gray-500 mt-1">
                  Lat {(location?.lat || 30.7811).toFixed(4)}, Lon {(location?.lon || 76.6168).toFixed(4)}
                </p>
              </div>
            </div>

            <button
              onClick={() => refreshWeather()}
              disabled={loading}
              className="w-full py-1.5 md:py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 disabled:bg-green-500/10 text-green-300 rounded-lg text-xs md:text-sm font-medium transition-all border border-green-500/30 hover:border-green-400/40 flex items-center justify-center gap-2 active:scale-95 backdrop-blur-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Updating...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header - ✅ FIXED: Single Row Layout for ALL Screen Sizes Including 412px-729px */}
        {/* Header - ✅ TRULY RESPONSIVE: Compact Mobile → Large Desktop */}
        <header className="relative bg-black/50 backdrop-blur-2xl px-1.5 sm:px-3 md:px-6 lg:px-8 xl:px-8 py-1.5 sm:py-2 md:py-3 lg:py-4 flex items-center justify-between flex-shrink-0 border-b border-white/10 overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ minHeight: '48px', maxHeight: '64px', WebkitOverflowScrolling: 'touch' }}>

          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-cyan-900/20 opacity-60 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Main Container */}
          <div className="w-full relative z-10 flex flex-row items-center justify-between gap-1 sm:gap-1.5 md:gap-4 flex-nowrap min-w-0">

            {/* ========================================== */}
            {/* 🍔 HAMBURGER - Compact on Small Mobile     */}
            {/* ========================================== */}
            {responsive.isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="flex-shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/30 to-blue-800/40 border border-blue-400/40 backdrop-blur-md hover:from-blue-500/40 hover:to-blue-700/50 hover:border-blue-300/60 transition-all duration-300 shadow-lg hover:scale-105 active:scale-95"
                style={{ width: '34px', height: '34px', minWidth: '34px', minHeight: '34px' }}
                aria-label="Toggle menu"
              >
                <div className="flex flex-col gap-[2.5px] w-4 relative justify-center items-center">
                  <span className={`h-[1.5px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full block transition-all duration-300 ease-in-out w-full ${isMobileSidebarOpen ? 'rotate-[45deg] translate-y-[4px] from-white to-gray-200' : ''}`} />
                  <span className={`h-[1.5px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full block transition-all duration-300 ease-in-out w-full ${isMobileSidebarOpen ? 'opacity-0 scale-x-0' : ''}`} />
                  <span className={`h-[1.5px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full block transition-all duration-300 ease-in-out w-full ${isMobileSidebarOpen ? '-rotate-[45deg] -translate-y-[4px] from-white to-gray-200' : ''}`} />
                </div>
              </button>
            )}

            {/* ========================================== */}
            {/* 🔍 SEARCH BAR - Ultra Compact for Mobile  */}
            {/* ========================================== */}
            <form
              className="flex-1 relative group mx-0.5 sm:mx-1 md:mx-2 min-w-0"
              onSubmit={(e) => { e.preventDefault(); void refreshWeather() }}
              style={{ maxWidth: '100%', minWidth: '60px' }}
            >
              <div className="absolute left-1.5 sm:left-2 md:left-3 top-1/2 -translate-y-1/2 z-20">
                <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
              </div>

              <input
                type="text"
                placeholder={responsive.isMobile ? "🔍" : "🔍 Search location..."}
                value={city}
                onChange={(e) => changeCity(e.target.value)}
                className="w-full pl-6 sm:pl-8 md:pl-10 lg:pl-11 pr-2 sm:pr-3 md:pr-4 lg:pr-6 py-1 sm:py-1.5 md:py-2 lg:py-2.5 bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/[0.12] focus:border-blue-400/40 transition-all text-[11px] sm:text-xs md:text-base lg:text-lg text-white placeholder-gray-400 font-medium shadow-inner"
                style={{ minHeight: '32px', height: 'auto' }}
              />
            </form>

            {/* ========================================== */}
            {/* 🔘 BUTTONS - Super Compact for 350-729px    */}
            {/* ========================================== */}
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2.5 lg:gap-3 justify-end flex-shrink-0">

              {/* 📍 LIVE LOCATION - Icon Only on Tiny Screens */}
              <button
                onClick={fetchByGeolocation}
                className="flex items-center gap-0.5 sm:gap-1 md:gap-2 px-1.5 sm:px-2 md:px-4 lg:px-5 py-1 sm:py-1.5 md:py-2.5 bg-gradient-to-r from-blue-500/90 to-cyan-500/80 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg sm:rounded-lg md:rounded-xl font-semibold text-[9px] sm:text-xs md:text-sm lg:text-base border border-blue-400/30 shadow-md hover:shadow-blue-500/30 active:scale-95 transition-all relative overflow-hidden group backdrop-blur-sm whitespace-nowrap"
                style={{ minHeight: '32px', height: 'auto' }}
                title="Get Live Location"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 relative z-10 group-hover:animate-pulse flex-shrink-0" />
                <span className="relative z-10 font-bold hidden xs:inline sm:inline">Live Location</span>
                <span className="relative z-10 xs:hidden sm:hidden" title="Live Location"> Live </span>
              </button>

              {/* 🌡️ TEMPERATURE TOGGLE - Ultra Compact */}
              <div
                className="flex items-center bg-white/[0.12] backdrop-blur-xl rounded-lg sm:rounded-lg md:rounded-xl p-[1.5px] sm:p-[2px] md:p-1 border border-white/15 shadow-inner flex-shrink-0"
                style={{ minHeight: '32px', height: 'auto' }}
              >
                <button
                  onClick={() => setUnit('C')}
                  className={`px-1 sm:px-1.5 md:px-3 lg:px-3.5 py-0.5 sm:py-1 md:py-1.5 rounded-md font-bold text-[9px] sm:text-xs md:text-sm lg:text-base transition-all ${unit === 'C' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-105' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '28px' }}
                >
                  °C
                </button>

                <button
                  onClick={() => setUnit('F')}
                  className={`px-1 sm:px-1.5 md:px-3 lg:px-3.5 py-0.5 sm:py-1 md:py-1.5 rounded-md font-bold text-[9px] sm:text-xs md:text-sm lg:text-base transition-all ${unit === 'F' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-105' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '28px' }}
                >
                  °F
                </button>
              </div>

              {/* Divider (Hidden on mobile & tablet) */}
              <div className="hidden xl:block w-[1px] h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

              {/* 🟢 LIVE BUTTON - Hidden on Very Small Screens (<475px) */}
              <a
                href="https://www.weather.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="green-next-btn group relative inline-flex items-center gap-0.5 sm:gap-1 md:gap-2 px-1.5 sm:px-2 md:px-5 lg:px-6 py-1 sm:py-1.5 md:py-2.5 overflow-hidden rounded-lg sm:rounded-lg md:rounded-xl font-bold text-[9px] sm:text-xs md:text-sm lg:text-base text-white transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer flex-shrink-0 whitespace-nowrap no-underline hidden xs:flex sm:flex"
                style={{ minHeight: '32px', height: 'auto' }}
                title="View Live Weather Data"
              >
                <div className="green-btn-shimmer absolute inset-0 opacity-30"></div>
                <div className="green-btn-glow absolute -inset-[2px] rounded-lg md:rounded-xl"></div>

                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" style={{ animationDuration: '1.5s' }}></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5 bg-white shadow-lg shadow-green-300/50"></span>
                </span>

                <span className="relative z-10 font-bold tracking-wide drop-shadow-md hidden sm:inline">Live</span>
                <span className="relative z-10 sm:hidden"> Live </span>

                <div className="green-btn-sparkle absolute top-0 left-[-100%] h-full w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
              </a>

            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6 xl:p-8 scrollbar-thin">
          {error && (
            <div className="mb-3 md:mb-4 bg-red-500/20 border-l-4 border-red-500/50 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-start md:items-center gap-2 md:gap-3 backdrop-blur-xl">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-500/30 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl flex-shrink-0">⚠️</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-red-300 text-sm md:text-base">Error Loading Data</h4>
                <p className="text-xs md:text-sm text-red-200">{error}</p>
                <button onClick={() => refreshWeather()} className="mt-2 px-3 md:px-4 py-1 md:py-1.5 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-white font-medium transition-all active:scale-95 text-xs md:text-sm">Try Again</button>
              </div>
            </div>
          )}
          {/* ⚡ Inline Refresh Indicator */}
          {loading && !error && (
            <div className="mb-3 md:mb-4 bg-gradient-to-r from-green-500/15 to-emerald-500/10 border-l-4 border-green-500/50 rounded-xl p-3 md:p-4 flex items-center gap-3 backdrop-blur-sm animate-pulse">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500/25 rounded-lg flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-green-300 animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-green-300 text-sm md:text-base">Refreshing Weather Data...</h4>
                <p className="text-xs md:text-sm text-green-200/70 mt-0.5">Getting latest information for <span className="font-semibold">{city || 'your location'}</span></p>
              </div>
            </div>
          )}

          <div className="w-full space-y-3 md:space-y-4 lg:space-y-6">

            {/* Weather Card + Map Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 lg:gap-6 items-stretch">

              {/* Main Weather Card - Enhanced Glass */}
              <div className="group relative flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-purple-600/30 rounded-2xl md:rounded-3xl blur-xl md:blur-2xl opacity-[0.6] group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-blue-600/20 via-blue-700/15 to-indigo-800/20 backdrop-blur-2xl md:backdrop-blur-3xl rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 text-white overflow-hidden border border-white/20 hover:border-blue-400/40 transition-all duration-300 flex-1 flex flex-col shadow-2xl shadow-black/40">

                  {/* Background Effects - Enhanced */}
                  <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 bg-blue-400/20 rounded-full blur-2xl md:blur-3xl animate-float-slow" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 md:w-32 md:h-32 lg:w-48 lg:h-48 bg-yellow-300/15 rounded-full blur-xl md:blur-2xl animate-float-medium" />

                  {/* Glass Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />

                  <div className="relative z-10 flex-1 flex flex-col">

                    {/* Location & Time */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 md:mb-4 lg:mb-6 gap-1.5 md:gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                          <h2 className="text-base md:text-lg lg:text-2xl font-bold drop-shadow-lg truncate">{location?.city || 'Rayat-Bahra University'}</h2>
                        </div>
                        <p className="text-[10px] md:text-xs lg:text-sm text-blue-200/80">{currentDate} | {currentTime}</p>
                        <div className="inline-flex items-center gap-1 bg-green-500/90 backdrop-blur-md px-1.5 md:px-2 py-[2px] md:py-[3px] rounded-full text-[8px] md:text-[10px] font-semibold self-start animate-pulse border border-green-400/40 shadow-md shadow-green-500/20 mt-1">
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

                    {/* Stats Grid - Enhanced Glass */}
                    <div className="mt-auto grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4 bg-white/[0.08] backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-6 border border-white/10 shadow-inner">
                      {[
                        { icon: Droplets, value: `${humidity}%`, label: 'Humidity' },
                        { icon: Wind, value: `${windSpeed} km/h`, label: 'Wind' },
                        { icon: Gauge, value: pressure, label: 'Pressure' },
                        { icon: Eye, value: `${visibility} km`, label: 'Visibility' }
                      ].map((stat, i) => (
                        <div key={i} className="text-center hover:bg-white/[0.1] rounded-lg md:rounded-xl p-1.5 md:p-2 transition-colors backdrop-blur-sm">
                          <stat.icon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mx-auto mb-1 md:mb-2 text-blue-200" />
                          <p className="text-base md:text-xl lg:text-2xl font-bold">{stat.value}</p>
                          <p className="text-[9px] md:text-[10px] lg:text-xs text-blue-200/70">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Map - Fully Responsive */}
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
                      <div key={i} className={`flex flex-col items-center justify-center p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl transition-all min-w-[75px] md:min-w-[90px] lg:min-w-[110px] xl:min-w-[120px] hover:scale-105 hover:-translate-y-1 border cursor-pointer backdrop-blur-md ${i === 0 ? 'bg-gradient-to-br from-blue-500/60 to-cyan-500/60 text-white shadow-lg shadow-blue-500/30 border-blue-400/30' : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/90 border border-white/10'}`}
                        style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
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
              <div id="forecast-section" className="lg:col-span-2 group relative flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-2xl md:rounded-3xl blur-xl opacity=[0.4]" />
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
                        <div key={i} className={`flex items-center justify-between p-2 md:p-3 lg:p-4 rounded-lg xl:rounded-xl transition-all hover:bg-white/[0.06] hover:scale-[1.01] border backdrop-blur-sm ${d.today ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30' : 'border-white/10'}`}>

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
                {/* ✅ BEFORE (Broken): */}
                <div className="group relative flex-shrink-0">

                  {/* ✅ AFTER (Fixed): */}
                  <div id="air-quality-section" className="group relative flex-shrink-0"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl md:rounded-3xl blur-xl opacity-[0.4]" />
                  <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 md:p-4 lg:p-5 border border-white/15 hover:border-white/25 transition-all">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Wind className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                        <h3 className="text-sm md:text-base font-bold text-white drop-shadow">Air Quality</h3>
                      </div>
                      <button className="text-[10px] md:text-xs text-blue-300 hover:text-blue-200 hover:underline font-medium">Details →</button>
                    </div>

                    {/* ✅ FIXED: AQI Circle - Perfectly Centered Text */}
                    <div className="flex justify-center mb-2 md:mb-3">
                      <div className="relative w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40">
                        <svg
                          className="w-full h-full"
                          viewBox="0 0 120 120"
                          style={{ overflow: 'visible' }}
                        >
                          {/* Definitions */}
                          <defs>
                            {/* Gradient */}
                            <linearGradient id="aqiGradPerfect" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                              <stop offset="35%" stopColor="#fbbf24" stopOpacity="1" />
                              <stop offset="70%" stopColor="#f97316" stopOpacity="1" />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
                            </linearGradient>

                            {/* Glow Filter */}
                            <filter id="aqiGlowPerfect" x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                              <feFlood floodColor="#10b981" floodOpacity="0.3" result="color" />
                              <feComposite in="color" in2="blur" operator="in" result="shadow" />
                              <feOffset dx="0" dy="0" in="shadow" result="shadow" />
                              <feMerge>
                                <feMergeNode in="shadow" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {/* Background Track Circle (Gray) */}
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeWidth="10"
                            strokeLinecap="round"
                          />

                          {/* Progress Circle - Correctly Positioned */}
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="url(#aqiGradPerfect)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray="253.33 301.59"
                            strokeDashoffset="0"
                            transform="rotate(-90 60 60)"
                            filter="url(#aqiGlowPerfect)"
                            style={{
                              filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))',
                              transition: 'stroke-dasharray 1s ease-in-out'
                            }}
                          >
                            <animate
                              attributeName="stroke-dasharray"
                              from="0 301.59"
                              to="253.33 301.59"
                              dur="1.5s"
                              fill="freeze"
                              calcMode="spline"
                              keySplines="0.42 0 0.58 1"
                            />

                            <animate
                              attributeName="stroke-width"
                              values="10;11;10"
                              dur="3s"
                              repeatCount="indefinite"
                            />
                          </circle>

                          {/* ✅✅✅ PERFECTLY CENTERED TEXT - Fixed Positioning */}
                          <text
                            x="60"
                            y="58"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="select-none"
                            style={{
                              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                            }}
                          >
                            {/* AQI Number - Large & Bold */}
                            <tspan
                              x="60"
                              dy="0"
                              className="text-4xl md:text-5xl lg:text-6xl font-black fill-white"
                              style={{
                                fontSize: '36px',
                                fontWeight: '900',
                                letterSpacing: '-0.02em',
                                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))'
                              }}
                            >
                              42
                              <animate
                                attributeName="opacity"
                                values="0;1"
                                dur="0.5s"
                                fill="freeze"
                              />
                            </tspan>

                            {/* Status Label - Below Number */}
                            <tspan
                              x="60"
                              dy="22"
                              className="text-xs md:text-sm font-bold fill-green-400"
                              style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                letterSpacing: '0.02em',
                                filter: 'drop-shadow(0 1px 3px rgba(16, 185, 129, 0.4))'
                              }}
                            >
                              Good
                              <animate
                                attributeName="opacity"
                                values="0;1"
                                dur="0.8s"
                                begin="0.3s"
                                fill="freeze"
                              />
                            </tspan>
                          </text>
                        </svg>
                      </div>
                    </div>

                    {/* AQI Stats Grid */}
                    <div className="grid grid-cols-2 gap-1 md:gap-1.5">
                      {[
                        { name: 'PM2.5', value: 18, status: 'Good', color: 'green' },
                        { name: 'PM10', value: 32, status: 'Good', color: 'green' },
                        { name: 'O₃', value: 41, status: 'Good', color: 'green' },
                        { name: 'NO₂', value: 15, status: 'Good', color: 'green' }
                      ].map((p, i) => (
                        <div key={i} className="bg-white/[0.06] rounded-lg p-1.5 md:p-2 text-center hover:bg-white/[0.1] transition-all border border-white/10 min-w-0 backdrop-blur-sm group">
                          <p className="text-[9px] md:text-[10px] text-gray-400 mb-0.5 truncate">{p.name}</p>
                          <p className={`text-sm md:text-base lg:text-lg font-bold ${p.color === 'green' ? 'text-green-400' :
                            p.color === 'yellow' ? 'text-yellow-400' :
                              p.color === 'orange' ? 'text-orange-400' : 'text-red-400'
                            } group-hover:scale-105 transition-transform`}>
                            {p.value}
                          </p>
                          <p className={`text-[8px] md:text-[10px] font-semibold ${p.color === 'green' ? 'text-green-400/80' :
                            p.color === 'yellow' ? 'text-yellow-400/80' :
                              p.color === 'orange' ? 'text-orange-400/80' : 'text-red-400/80'
                            }`}>
                            {p.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Today's Highlights */}
                <div id="highlights-section" className="group relative flex-1 flex flex-col">
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
                          <div key={i} className="flex items-center justify-between py-1.5 md:py-2 hover:bg-white/[0.06] rounded-lg px-1 md:px-2 -mx-1 md:-mx-2 transition-colors border-b border-white/5 last:border-0 backdrop-blur-sm">
                            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 min-w-0 flex-1">
                              <item.Icon size="sm" />
                              <span className="text-[10px] md:text-xs lg:text-sm font-medium text-white/90 truncate">{item.label}</span>
                            </div>
                            <span className="text-[10px] md:text-xs lg:text-sm font-semibold text-white drop-shadow ml-2 flex-shrink-0">{item.value}</span>
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

              <div id="weather-alerts-card" className="group relative h-full flex flex-col flex-1">
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
                          <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/10 rounded-xl md:rounded-2xl p-3 md:p-4 border border-emerald-400/15 hover:border-emerald-400/25 transition-all h-full flex items-center backdrop-blur-sm">
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
                        <div key={i} className={`${asGradient(a.severity)} rounded-xl md:rounded-2xl p-3 md:p-4 border transition-all backdrop-blur-sm`}>
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl md:rounded-3xl blur-xl opacity-[0.4]" />
                <div className="relative bg-gradient-to-br from-blue-600/20 to-cyan-600/15 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-5 lg:p-6 border border-white/15 hover:border-white/25 transition-all min-h-[250px] md:min-h-[290px] flex-1 h-full">

                  <div className="flex items-center justify-between h-full">

                    {/* Details List - Responsive spacing */}
                    <div className="flex-1 space-y-2 md:space-y-4 pr-0 md:pr-4">
                      <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-white/10">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                          <Wind className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-xs text-gray-300">Wind Gust</p>
                          <p className="text-lg md:text-xl font-bold text-white">
                            {Math.round((weatherData?.hourly?.[0]?.wind?.speed ?? weatherData?.current?.wind_speed ?? 0))}
                            <span className="text-xs md:text-sm font-normal ml-1">km/h</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-white/10">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                          <Droplets className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-xs text-gray-300">Precipitation</p>
                          <p className="text-lg md:text-xl font-bold text-white">
                            {((weatherData?.hourly?.[0]?.precipitation_mm ?? 0) as number).toFixed(1)}
                            <span className="text-xs md:text-sm font-normal ml-1">mm</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-white/10">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                          <CloudRain className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-xs text-gray-300">Chance of Rain</p>
                          <p className="text-lg md:text-xl font-bold text-white">
                            {Math.round(weatherData?.hourly?.[0]?.pop ?? 0)}
                            <span className="text-xs md:text-sm font-normal ml-1">%</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                          <Cloud className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-xs text-gray-300">Cloud Cover</p>
                          <p className="text-lg md:text-xl font-bold text-white">
                            {Math.round(weatherData?.hourly?.[0]?.cloud_cover ?? 0)}
                            <span className="text-xs md:text-sm font-normal ml-1">%</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Weather Icon - Hidden on mobile, visible on larger screens */}
                    <div className="hidden lg:block ml-4 flex-shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 relative">
                        <AnimatedWeatherIcon type={getWeatherIcon(iconCode)} size="md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Responsive padding and text sizes */}
            <footer className="relative z-20 py-8 mt-6 text-center" style={{ background: 'transparent' }}>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <CloudRain className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                  <span className="font-bold text-white text-sm tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Weather Live </span>
                </div>

                <div className="w-56 mx-auto h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(96,165,250,0.4), transparent)' }} />

                <p className="text-xs text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex items-center justify-center gap-2">
                  © Nishant Sharma. All Rights Reserved {new Date().getFullYear()}
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                </p>
              </div>

            </footer>
          </div>
        </main>
      </div>

      {/* ============================================ */}
      {/* ✅ ULTRA-ENHANCED ANIMATION KEYFRAMES         */}
      {/* ============================================ */}
      <style jsx global>{`
        /* ============================================ */
        /* ✅ ENHANCED CINEMATIC ANIMATIONS             */
        /* ============================================ */

        @keyframes cinematic-zoom-enhanced { 
          0%, 100% { transform: scale(1) translateY(0) rotate(0deg); filter: brightness(1) contrast(1) saturate(1); } 
          25% { transform: scale(1.06) translateY(-1.5%) rotate(0.3deg); filter: brightness(1.08) contrast(1.06) saturate(1.04); } 
          50% { transform: scale(1.1) translateY(-0.8%) rotate(-0.2deg); filter: brightness(1.06) contrast(1.04) saturate(1.02); } 
          75% { transform: scale(1.07) translateY(-1.2%) rotate(0.15deg); filter: brightness(1.09) contrast(1.07) saturate(1.05); } 
        }
        
        .animate-cinematic-zoom-enhanced { animation: cinematic-zoom-enhanced 35s ease-in-out infinite; }

        /* Gradient Shift Animation */
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.7; }
        }

        .animate-gradient-shift { animation: gradient-shift 8s ease-in-out infinite; }

        @keyframes clouds-drift-enhanced { 
          0% { transform: translateX(0) scale(1); } 
          100% { transform: translateX(-50%) scale(1.1); } 
        }
        
        .animate-clouds-drift-enhanced { animation: clouds-drift-enhanced 150s linear infinite; }

        /* Nebula Float Animations */
        @keyframes nebula-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(30px, -20px) scale(1.08); opacity: 0.75; }
          66% { transform: translate(-20px, 15px) scale(0.95); opacity: 0.65; }
        }

        .animate-nebula-float-1 { animation: nebula-float-1 25s ease-in-out infinite; }

        @keyframes nebula-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
          50% { transform: translate(-40px, 25px) scale(1.12); opacity: 0.7; }
        }

        .animate-nebula-float-2 { animation: nebula-float-2 30s ease-in-out infinite; }

        @keyframes nebula-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(35px, -18px) scale(1.06); opacity: 0.68; }
        }

        .animate-nebula-float-3 { animation: nebula-float-3 28s ease-in-out infinite; }

        @keyframes float-slow { 
          0%, 100% { transform: translate(0, 0) scale(1); } 
          50% { transform: translate(45px, -45px) scale(1.06); } 
        }
        
        .animate-float-slow { animation: float-slow 11s ease-in-out infinite; }

        @keyframes float-slow-delayed { 
          0%, 100% { transform: translate(0, 0) scale(1); } 
          50% { transform: translate(-38px, 42px) scale(1.05); } 
        }
        
        .animate-float-slow-delayed { animation: float-slow-delayed 13s ease-in-out infinite; }

        @keyframes float-medium { 
          0%, 100% { transform: translate(0, 0); } 
          50% { transform: translate(-35px, 35px) scale(1.04); } 
        }
        
        .animate-float-medium { animation: float-medium 8s ease-in-out infinite; }

        @keyframes float-medium-delayed { 
          0%, 100% { transform: translate(0, 0); } 
          50% { transform: translate(40px, -28px) scale(1.03); } 
        }
        
        .animate-float-medium-delayed { animation: float-medium-delayed 10s ease-in-out infinite; }

        @keyframes pulse-subtle { 
          0%, 100% { box-shadow: 0 0 0 0 rgb(245 158 11 / 0.35); } 
          50% { box-shadow: 0 0 0 12px rgb(245 158 11 / 0); } 
        }
        
        .animate-pulse-subtle { animation: pulse-subtle 3.5s ease-in-out infinite; }

        @keyframes shimmer { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(100%); } 
        }
        
        .animate-shimmer { animation: shimmer 3.5s ease-in-out infinite; }

        /* Pulsing Ring Effects for Glow Orbs */
        @keyframes pulse-ring {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.2;
          }
          50% { 
            transform: scale(1.15);
            opacity: 0.4;
          }
        }

        .animate-pulse-ring { animation: pulse-ring 4s ease-in-out infinite; }

        @keyframes pulse-ring-delayed {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.15;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.35;
          }
        }

        .animate-pulse-ring-delayed { animation: pulse-ring-delayed 5s ease-in-out infinite 1s; }

        @keyframes energy-ring {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            opacity: 0.1;
          }
          50% { 
            transform: scale(1.3) rotate(180deg);
            opacity: 0.25;
          }
        }

        .animate-energy-ring { animation: energy-ring 6s ease-in-out infinite; }

        /* Enhanced Glow Animation */
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.12;
            transform: scale(1);
            filter: blur(110px);
          }
          50% { 
            opacity: 0.22;
            transform: scale(1.15);
            filter: blur(130px);
          }
        }
        
        .animate-pulse-glow { animation: pulse-glow 9s ease-in-out infinite; }

        /* Twinkle Animations for Particles - Enhanced */
        @keyframes twinkle-1 {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        
        .animate-twinkle-1 { animation: twinkle-1 3.5s ease-in-out infinite; }

        @keyframes twinkle-2 {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.4); }
        }
        
        .animate-twinkle-2 { animation: twinkle-2 4.5s ease-in-out infinite 1s; }

        @keyframes twinkle-3 {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        .animate-twinkle-3 { animation: twinkle-3 5.5s ease-in-out infinite 2s; }

        /* Aurora Borealis Effect - Enhanced */
        @keyframes aurora-enhanced {
          0% { transform: translateX(-100%) skewY(-6deg); }
          33% { transform: translateX(-33%) skewY(-4deg); }
          66% { transform: translateX(33%) skewY(-8deg); }
          100% { transform: translateX(100%) skewY(-6deg); }
        }
        
        .animate-aurora-enhanced { animation: aurora-enhanced 22s ease-in-out infinite; }

        @keyframes aurora-secondary {
          0% { transform: translateX(-80%) skewY(-3deg); opacity: 0.12; }
          50% { transform: translateX(20%) skewY(-5deg); opacity: 0.22; }
          100% { transform: translateX(120%) skewY(-3deg); opacity: 0.12; }
        }
        
        .animate-aurora-secondary { animation: aurora-secondary 28s ease-in-out infinite 3s; }

        /* Particle Drift - Enhanced */
        @keyframes particles-drift {
          0% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-15px) translateX(10px); }
          50% { transform: translateY(-25px) translateX(-5px); }
          75% { transform: translateY(-12px) translateX(15px); }
          100% { transform: translateY(0) translateX(0); }
        }
        
        .animate-particles-drift { animation: particles-drift 18s linear infinite; }

        /* Noise Texture Shift */
        @keyframes noise-shift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2%, 2%); }
          50% { transform: translate(2%, -1%); }
          75% { transform: translate(-1%, -2%); }
        }

        .animate-noise-shift { animation: noise-shift 12s linear infinite; }

        /* Glass Reflection Animation */
        @keyframes glass-reflection {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }

        .animate-glass-reflection { animation: glass-reflection 7s ease-in-out infinite; }

        /* Vignette Pulse */
        @keyframes vignette-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.45; }
        }

        .animate-vignette-pulse { animation: vignette-pulse 10s ease-in-out infinite; }

        /* Cinematic Light Beams */
        @keyframes light-beam-1 {
          0%, 100% { opacity: 0.03; transform: translateX(0); }
          50% { opacity: 0.08; transform: translateX(20px); }
        }

        .animate-light-beam-1 { animation: light-beam-1 15s ease-in-out infinite; }

        @keyframes light-beam-2 {
          0%, 100% { opacity: 0.02; transform: translateX(0); }
          50% { opacity: 0.06; transform: translateX(-15px); }
        }

        .animate-light-beam-2 { animation: light-beam-2 18s ease-in-out infinite 2s; }

        @keyframes light-beam-3 {
          0%, 100% { opacity: 0.025; transform: translateX(0); }
          50% { opacity: 0.07; transform: translateX(25px); }
        }

        .animate-light-beam-3 { animation: light-beam-3 20s ease-in-out infinite 4s; }

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

        /* Extra small breakpoint for legend visibility */
        @media (max-width: 474px) {
          .xs\\:hidden {
            display: none !important;
          }
          
          .xs\\:block {
            display: block !important;
          }
          
          .xs\\:inline {
            display: inline !important;
          }
          
          .xs\\:hidden {
            display: none !important;
          }
        }

        @media (min-width: 475px) {
          .xs\\:block {
            display: block !important;
          }
          
          .xs\\:hidden {
            display: none !important;
          }
          
          .xs\\:inline {
            display: inline !important;
          }
        }

        /* Medium Mobile Breakpoint (412px - 639px) - Critical for Header Fix */
        @media (min-width: 412px) and (max-width: 639px) {
          header {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }

          header input {
            font-size: 0.75rem;
            padding-left: 2rem;
            padding-right: 0.5rem;
          }

          header button {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
        }

        /* Tablet and above */
        @media (min-width: 640px) {
          header {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
  /* ============================================ */
/* 🎬 ULTRA PREMIUM WELCOME PAGE - STYLES       */
/* ============================================ */

/* MAIN CONTAINER */
.welcome-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.welcome-overlay.exiting {
  opacity: 0;
  transform: scale(1.05);
  filter: blur(10px);
}

.welcome-container {
  width: 100%;
  height: 100%;
  background: #000000;
  position: relative;
  overflow: hidden;
}

/* ============================================ */
/* BACKGROUND LAYERS                           */
/* ============================================ */

.bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-gradient-base {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, #0f172a 0%, #000000 70%);
}

/* Aurora Effect */
.aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.aurora-1 {
  width: 900px;
  height: 900px;
  top: -25%;
  left: -15%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 60%);
  animation: auroraFloat1 25s ease-in-out infinite;
}

.aurora-2 {
  width: 700px;
  height: 700px;
  bottom: -20%;
  right: -10%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, transparent 55%);
  animation: auroraFloat2 30s ease-in-out infinite 5s;
}

.aurora-3 {
  width: 600px;
  height: 600px;
  top: 35%;
  right: 25%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 50%);
  animation: auroraFloat3 22s ease-in-out infinite 10s;
}

/* Floating Orbs */
.floating-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.orb-1 {
  width: 400px;
  height: 400px;
  top: 10%;
  left: 60%;
  background: rgba(251, 146, 60, 0.2);
  animation: orbFloat1 20s ease-in-out infinite;
}

.orb-2 {
  width: 350px;
  height: 350px;
  bottom: 20%;
  left: 10%;
  background: rgba(236, 72, 153, 0.15);
  animation: orbFloat2 25s ease-in-out infinite 3s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 40%;
  background: rgba(34, 211, 238, 0.12);
  animation: orbFloat3 18s ease-in-out infinite 7s;
}

.orb-4 {
  width: 250px;
  height: 250px;
  top: 70%;
  right: 20%;
  background: rgba(168, 85, 247, 0.18);
  animation: orbFloat4 22s ease-in-out infinite 12s;
}

/* ============================================ */
/* PARTICLE SYSTEM                             */
/* ============================================ */

.particle-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.star {
  background: white;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
  animation: starTwinkle 3s ease-in-out infinite;
}

.bright-star {
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, #ffffff 0%, #93c5fd 50%, transparent 100%);
  box-shadow: 0 0 10px rgba(147, 197, 253, 0.8), 0 0 20px rgba(147, 197, 253, 0.4);
  animation: brightStarPulse 4s ease-in-out infinite;
}

.dust {
  width: 2px;
  height: 2px;
  background: rgba(148, 163, 184, 0.4);
  animation: dustFloat 15s linear infinite;
}

/* ============================================ */
/* SHOOTING STARS                              */
/* ============================================ */

.shooting-stars-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.shooting-star {
  position: absolute;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.9), #fff);
  border-radius: 2px;
  filter: blur(0.5px);
}

.star-1 {
  top: 12%;
  left: -10%;
  width: 180px;
  transform: rotate(-25deg);
  animation: shootingStarAnim 7s linear infinite;
  box-shadow: 0 0 12px 3px rgba(255, 255, 255, 0.5);
}

.star-2 {
  top: 28%;
  left: -12%;
  width: 140px;
  height: 1.5px;
  transform: rotate(-32deg);
  background: linear-gradient(to right, transparent, rgba(147, 197, 253, 0.8), #93c5fd);
  animation: shootingStarAnim 11s linear infinite 4s;
  box-shadow: 0 0 10px 2px rgba(147, 197, 253, 0.4);
}

.star-3 {
  top: 55%;
  left: -8%;
  width: 120px;
  transform: rotate(-20deg);
  background: linear-gradient(to right, transparent, rgba(251, 191, 36, 0.7), #fbbf24);
  animation: shootingStarAnim 9s linear infinite 7s;
  box-shadow: 0 0 8px 2px rgba(251, 191, 36, 0.4);
}

/* ============================================ */
/* FLOATING WEATHER ICONS                      */
/* ============================================ */

.floating-icons-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.15;
}

.floating-icon {
  position: absolute;
  color: rgba(148, 163, 184, 0.6);
  filter: blur(0.5px);
}

.icon-sun {
  top: 8%;
  left: 15%;
  animation: floatIcon1 12s ease-in-out infinite;
  color: rgba(251, 191, 36, 0.5);
}

.icon-cloud {
  top: 65%;
  left: 8%;
  animation: floatIcon2 15s ease-in-out infinite 2s;
  color: rgba(148, 163, 184, 0.4);
}

.icon-rain {
  top: 18%;
  right: 12%;
  animation: floatIcon3 13s ease-in-out infinite 4s;
  color: rgba(96, 165, 250, 0.45);
}

.icon-bolt {
  bottom: 25%;
  right: 18%;
  animation: floatIcon4 10s ease-in-out infinite 1s;
  color: rgba(251, 146, 60, 0.5);
}

.icon-snowflake {
  bottom: 12%;
  left: 25%;
  animation: floatIcon5 14s ease-in-out infinite 6s;
  color: rgba(186, 230, 253, 0.4);
}

.icon-wind {
  top: 42%;
  right: 6%;
  animation: floatIcon6 11s ease-in-out infinite 3s;
  color: rgba(134, 239, 172, 0.4);
}

/* ============================================ */
/* CENTRAL GLOW                                */
/* ============================================ */

.central-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%);
  filter: blur(60px);
  animation: centralGlowPulse 8s ease-in-out infinite;
  transition: all 1s ease;
  pointer-events: none;
}

.central-glow.glow-exit {
  transform: translate(-50%, -50%) scale(1.5);
  opacity: 0;
}

/* ============================================ */
/* MAIN CONTENT                                */
/* ============================================ */

.main-content {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  min-height: 100vh;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateY(30px);
}

.main-content.content-visible {
  opacity: 1;
  transform: translateY(0);
}

.main-content.content-exit {
  transform: scale(1.08) translateY(-20px);
  opacity: 0;
}

/* ============================================ */
/* LOGO SECTION                                */
/* ============================================ */

.logo-section {
  margin-bottom: 2rem;
}

.logo-container {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-ring {
  position: absolute;
  inset: -12px;
  border-radius: 32px;
  background: conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.6), transparent, rgba(139, 92, 246, 0.6), transparent);
  animation: ringRotate 6s linear infinite;
  filter: blur(15px);
  opacity: 0.7;
}

.logo-aura {
  position: absolute;
  inset: -20px;
  border-radius: 40px;
  background: radial-gradient(circle, rgba(251, 146, 60, 0.35) 0%, transparent 70%);
  animation: auraPulse 4s ease-in-out infinite;
  filter: blur(25px);
}

.logo-outer-glow {
  position: absolute;
  inset: -8px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.4) 0%, rgba(239, 68, 68, 0.3) 50%, rgba(168, 85, 247, 0.35) 100%);
  filter: blur(20px);
  animation: outerGlowPulse 5s ease-in-out infinite;
}

.logo-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, 
    rgba(251, 146, 60, 0.95) 0%, 
    rgba(245, 158, 11, 0.92) 25%,
    rgba(239, 68, 68, 0.88) 50%,
    rgba(168, 85, 247, 0.9) 75%,
    rgba(139, 92, 246, 0.88) 100%
  );
  box-shadow: 
    0 0 50px rgba(251, 146, 60, 0.4),
    0 0 100px rgba(239, 68, 68, 0.2),
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.5s ease, box-shadow 0.5s ease;
  cursor: pointer;
  overflow: hidden;
}

.logo-card:hover {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 
    0 0 60px rgba(251, 146, 60, 0.6),
    0 0 120px rgba(239, 68, 68, 0.3),
    0 30px 60px -12px rgba(0, 0, 0, 0.6);
}

.logo-inner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  color: white;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
  animation: iconPulse 3s ease-in-out infinite;
}

.logo-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 45%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.15) 55%,
    transparent 100%
  );
  animation: shimmerMove 4s ease-in-out infinite;
  border-radius: 28px;
}

.corner-accent {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  filter: blur(4px);
  z-index: 3;
}

.corner-accent.top-left {
  top: 10px;
  left: 10px;
}

.corner-accent.bottom-right {
  bottom: 10px;
  right: 10px;
}

/* ============================================ */
/* TITLE SECTION                               */
/* ============================================ */

.title-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.main-title {
  font-size: clamp(2.8rem, 8vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.title-text {
  color: white;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.title-highlight {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #c084fc 60%, #f472b6 80%, #fb923c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 30px rgba(96, 165, 250, 0.5));
  animation: gradientShift 5s ease-in-out infinite;
  background-size: 200% 200%;
}

.subtitle {
  font-size: clamp(1rem, 2.5vw, 1.35rem);
  font-weight: 300;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.tagline-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tagline-icon {
  color: #3b82f6;
  animation: tagIconPulse 2s ease-in-out infinite;
}

.tagline-text {
  font-size: clamp(0.8rem, 1.5vw, 0.95rem);
  font-weight: 500;
  letter-spacing: 0.05em;
  color: #60a5fa;
  opacity: 0.8;
}

/* ============================================ */
/* PROGRESS SECTION                            */
/* ============================================ */

.progress-section {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.progress-bar-wrapper {
  position: relative;
  padding: 4px 0;
}

.progress-bar-track {
  position: relative;
  height: 18px;
  background: rgba(15, 23, 42, 0.7);
  border-radius: 9999px;
  overflow: visible;
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
}

.progress-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, 
    #22c55e 0%, 
    #06b6d4 25%, 
    #3b82f6 50%, 
    #8b5cf6 75%, 
    #a855f7 100%
  );
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 0 25px rgba(34, 197, 94, 0.5),
    0 0 50px rgba(6, 182, 212, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  overflow: hidden;
}

.progress-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  animation: progressGlowMove 3s ease-in-out infinite;
}

.progress-shimmer-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmerSlide 2.5s ease-in-out infinite;
}

.progress-tip {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 0 20px 5px rgba(255, 255, 255, 0.9),
    0 0 40px 10px rgba(255, 255, 255, 0.4);
  z-index: 10;
}

.tip-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: white;
  animation: tipPulseAnim 1.5s ease-in-out infinite;
}

/* Status Row */
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-spinner {
  color: #06b6d4;
  animation: spin 1s linear infinite;
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.8));
}

.status-text {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  letter-spacing: 0.02em;
}

.success-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
  animation: successBadgePop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.success-text-animate {
  color: #4ade80 !important;
  text-shadow: 0 0 15px rgba(74, 222, 128, 0.7);
  animation: successTextFadeIn 0.5s ease-out;
}

.percentage-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.percentage-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: #06b6d4;
  text-shadow: 0 0 15px rgba(6, 182, 212, 0.7);
  transition: all 0.4s ease;
}

.percentage-number.percentage-complete {
  color: #4ade80;
  text-shadow: 0 0 15px rgba(74, 222, 128, 0.8);
  transform: scale(1.1);
}

.percentage-symbol {
  font-size: 1rem;
  font-weight: 700;
  color: #06b6d4;
}

/* Phase Indicators */
.phase-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding-top: 0.5rem;
}

.phase-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.8);
  border: 2px solid rgba(71, 85, 105, 0.4);
  color: #64748b;
  transition: all 0.5s ease;
}

.phase-dot.phase-active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.6);
  color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

.phase-dot.phase-done {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.6);
  color: #22c55e;
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
}

.phase-line {
  width: 50px;
  height: 2px;
  background: rgba(71, 85, 105, 0.3);
  transition: all 0.5s ease;
}

.phase-line.line-active {
  background: linear-gradient(90deg, #3b82f6, #22c55e);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

/* ============================================ */
/* FEATURES SECTION                            */
/* ============================================ */

.features-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  width: 100%;
  max-width: 520px;
  margin-top: 2.5rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.features-section.features-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.feature-card {
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1.25rem;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  animation: featureReveal 0.6s ease-out both;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.25s; }
.feature-card:nth-child(3) { animation-delay: 0.4s; }

.feature-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.7);
  box-shadow: 
    0 20px 40px -15px rgba(0, 0, 0, 0.5),
    0 0 30px -10px rgba(59, 130, 246, 0.15);
}

.feature-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  transition: transform 0.4s ease;
}

.feature-card:hover .feature-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
}

.feature-blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(96, 165, 250, 0.15));
  color: #60a5fa;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
}

.feature-orange {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.25), rgba(251, 191, 36, 0.15));
  color: #fb923c;
  box-shadow: 0 0 20px rgba(251, 146, 60, 0.2);
}

.feature-purple {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(168, 85, 247, 0.15));
  color: #a78bfa;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
}

.feature-title {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.375rem;
}

.feature-desc {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 400;
}

/* Bottom Hint */
.bottom-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  animation: hintPulse 2s ease-in-out infinite;
}

.hint-arrow {
  animation: arrowBounce 1.5s ease-in-out infinite;
}

/* ============================================ */
/* OVERLAYS                                    */
/* ============================================ */

.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 25%, rgba(0, 0, 0, 0.8) 100%);
}

.noise-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.02;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
}

/* ============================================ */
/* KEYFRAME ANIMATIONS                         */
/* ============================================ */

/* Floating icons */
@keyframes floatIcon1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(30px, -40px) rotate(15deg); }
}

@keyframes floatIcon2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-40px, 30px) rotate(-10deg); }
}

@keyframes floatIcon3 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(25px, 35px) rotate(10deg); }
}

@keyframes floatIcon4 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-30px, -25px) rotate(-15deg); }
}

@keyframes floatIcon5 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(35px, 20px) rotate(8deg); }
}

@keyframes floatIcon6 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-25px, -35px) rotate(-12deg); }
}

/* Central glow */
@keyframes centralGlowPulse {
  0%, 100% { 
    transform: translate(-50%, -50%) scale(1); 
    opacity: 0.6; 
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.15); 
    opacity: 0.9; 
  }
}

/* Logo effects */
@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes auraPulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.6; }
}

@keyframes outerGlowPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3)); }
  50% { transform: scale(1.08); filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.4)); }
}

@keyframes shimmerMove {
  0% { transform: translateX(-150%) skewX(-15deg); }
  100% { transform: translateX(250%) skewX(-15deg); }
}

/* Title gradient shift */
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes tagIconPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* Progress bar effects */
@keyframes progressGlowMove {
  0%, 100% { opacity: 0.3; transform: translateX(-100%); }
  50% { opacity: 0.7; transform: translateX(100%); }
}

@keyframes shimmerSlide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

@keyframes tipPulseAnim {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(2); opacity: 0; }
}

/* Success animations */
@keyframes successBadgePop {
  0% { transform: scale(0) rotate(-180deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes successTextFadeIn {
  0% { opacity: 0; transform: translateX(-10px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* Feature reveal */
@keyframes featureReveal {
  0% { 
    opacity: 0; 
    transform: translateY(25px) scale(0.9); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

/* Hint animations */
@keyframes hintPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes arrowBounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(8px); }
}
 @keyframes auroraFlow1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.4; }
  33% { transform: translate(40px, 30px) rotate(3deg); opacity: 0.6; }
  66% { transform: translate(-30px, -20px) rotate(-2deg); opacity: 0.5; }
}

@keyframes auroraFlow2 {
  0%, 100% { transform: translate(0, 0); opacity: 0.35; }
  50% { transform: translate(-50px, 40px); opacity: 0.55; }
}

@keyframes softOrbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(60px, -45px) scale(1.1); }
}

@keyframes softOrbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, 35px) scale(1.08); }
}

@keyframes dustDrift {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-120vh) translateX(40px); opacity: 0; }
}

@keyframes iconBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

@keyframes shimmerSweep {
  0% { transform: translateX(-150%) skewX(-12deg); }
  100% { transform: translateX(250%) skewX(-12deg); }
}

@keyframes gradientFlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes iconGlow {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.12); }
}

@keyframes progressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

@keyframes successPop {
  0% { transform: scale(0) rotate(-180deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes featureSlideUp {
  0% { opacity: 0; transform: translateY(20px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes hintFade {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes arrowMove {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(7px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes mobileAurora {
  0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
  33% { transform: translateX(30px) translateY(20px) rotate(2deg); }
  66% { transform: translateX(-20px) translateY(-15px) rotate(-1deg); }
}

@keyframes mobileOrbFloat {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-40px, 30px); }
}
 @keyframes softGlowPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 0.9; }
}

@keyframes gentleRayPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

@keyframes subtleShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
  /* ============================================ */
/* ✅ MOBILE ANIMATION KEYFRAMES               */
/* ============================================ */

@keyframes iconBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes sunRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes cloudFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes shimmerSweep {
  0% { transform: translateX(-150%) skewX(-12deg); }
  100% { transform: translateX(250%) skewX(-12deg); }
}

@keyframes mobileAurora {
  0%, 100% { transform: translate(0, 0); opacity: 0.4; }
  33% { transform: translate(30px, 20px); opacity: 0.6; }
  66% { transform: translate(-20px, -15px); opacity: 0.5; }
}

@keyframes mobileOrbFloat {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-40px, 30px); }
}

@keyframes gradientMove {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
      `}</style>
    </div>
  );
}

// ==================== WRAPPER COMPONENT WITH SUSPENSE ====================
export default function WeatherDashboard() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem' }} size={48} />
          <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading Weather Dashboard...</p>
        </div>
      </div>
    }>
      <WeatherDashboardContent />
    </Suspense>
  );
}