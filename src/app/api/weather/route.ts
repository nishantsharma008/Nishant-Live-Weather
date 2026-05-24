import { NextRequest, NextResponse } from 'next/server'

// ==================== TYPES ====================
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
  pop?: number
  weather_code?: number
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

type Highlights = {
  sunrise: string
  sunset: string
  moonrise: string
  moonset: string
  moonPhaseLabel: string
  moonPhaseIcon: 'waxing' | 'waning' | 'new' | 'full' | 'unknown'
}

// ==================== TIME FORMATTERS ====================
function getWeatherDescription(code: number, isDay: boolean = true): { desc: string; icon: string } {
  const weatherCodes: Record<number, { desc: string; icon: string }> = {
    0: { desc: 'Clear sky', icon: '01' },
    1: { desc: 'Mainly clear', icon: '02' },
    2: { desc: 'Partly cloudy', icon: '03' },
    3: { desc: 'Overcast', icon: '04' },
    45: { desc: 'Foggy', icon: '50' },
    48: { desc: 'Depositing rime fog', icon: '50' },
    51: { desc: 'Light drizzle', icon: '09' },
    53: { desc: 'Moderate drizzle', icon: '09' },
    55: { desc: 'Dense drizzle', icon: '09' },
    61: { desc: 'Slight rain', icon: '10' },
    63: { desc: 'Moderate rain', icon: '10' },
    65: { desc: 'Heavy rain', icon: '10' },
    71: { desc: 'Slight snow', icon: '13' },
    73: { desc: 'Moderate snow', icon: '13' },
    75: { desc: 'Heavy snow', icon: '13' },
    80: { desc: 'Slight showers', icon: '09' },
    81: { desc: 'Moderate showers', icon: '09' },
    82: { desc: 'Violent showers', icon: '09' },
    95: { desc: 'Thunderstorm', icon: '11' },
    96: { desc: 'Thunderstorm with hail', icon: '11' },
    99: { desc: 'Severe thunderstorm with hail', icon: '11' }
  }

  const weatherInfo = weatherCodes[code] || { desc: 'Unknown', icon: '01' }
  return { desc: weatherInfo.desc, icon: `${weatherInfo.icon}${isDay ? 'd' : 'n'}` }
}

function toFirstValue(arrOrValue: unknown): unknown {
  if (Array.isArray(arrOrValue)) return arrOrValue[0]
  return arrOrValue
}

// ==================== GEOCODING ====================
async function reverseGeocode(lat: number, lon: number): Promise<{ state?: string; country: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WeatherDashboard/1.0' }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const address = data.address || {}
    
    return {
      state: address.state || address.province || '',
      country: address.country || ''
    }
  } catch (error) {
    return null
  }
}

async function getCoordinates(city: string): Promise<{ lat: number; lon: number; name: string; state?: string; country: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WeatherDashboard/1.0' }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (!data || data.length === 0) return null
    
    const lat = parseFloat(data[0].lat)
    const lon = parseFloat(data[0].lon)
    const reverseResult = await reverseGeocode(lat, lon)
    const address = data[0].address || {}
    
    return {
      lat,
      lon,
      name: data[0].display_name.split(',')[0],
      state: reverseResult?.state || address.state || '',
      country: reverseResult?.country || address.country || ''
    }
  } catch (error) {
    return null
  }
}

// ==================== MAIN API HANDLER ====================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityParam = searchParams.get('city')

    console.log(`\n🌤️ ===== NEW REQUEST =====`)
    console.log(`📍 City: "${cityParam}"`)

    if (!cityParam || cityParam.trim() === '') {
      return NextResponse.json({ success: false, error: 'City parameter is required' }, { status: 400 })
    }

    // Parse coordinates or city name
    const parts = cityParam.split(',').map(s => s.trim())
    let lat: number
    let lon: number
    let cityName: string
    let stateName: string = ''
    let countryName: string = ''

    // Check if coordinates
    if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
      lat = parseFloat(parts[0])
      lon = parseFloat(parts[1])
      cityName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      
      try {
        const geoResult = await getCoordinates(`${lat},${lon}`)
        if (geoResult && geoResult.name !== 'Location') {
          cityName = geoResult.name
          stateName = geoResult.state || ''
          countryName = geoResult.country
        }
      } catch (e) {
        console.log('Reverse geocoding failed')
      }
    } else {
      const geoResult = await getCoordinates(cityParam)

      if (!geoResult) {
        return NextResponse.json(
          { success: false, error: `City "${cityParam}" not found` },
          { status: 404 }
        )
      }

      lat = geoResult.lat
      lon = geoResult.lon
      cityName = geoResult.name
      stateName = geoResult.state || ''
      countryName = geoResult.country
    }

    console.log(`📍 Final location: ${cityName} (${lat}, ${lon})`)

    // Fetch weather from Open-Meteo
    console.log(`⚡ Fetching weather...`)
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,temperature_2m_max,temperature_2m_min,apparent_temperature,relativehumidity_2m,surface_pressure,precipitation_probability,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset&timezone=auto`

    const response = await fetch(weatherUrl)

    if (!response.ok) {
      throw new Error(`Weather API failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Weather data received')

    if (!data.current_weather || !data.hourly || !data.daily) {
      throw new Error('Invalid weather data')
    }

    const currentTime = data.current_weather.time
    const currentHourIndex = data.hourly.time?.findIndex((time: string) => time.startsWith(currentTime.slice(0, 13))) ?? 0
    const safeIndex = Math.max(0, currentHourIndex)

    const currentCode = data.current_weather.weathercode
    const currentIsDay = data.current_weather.is_day === 1
    const timeZone = data.timezone || 'UTC'
    const currentWeatherInfo = getWeatherDescription(currentCode, currentIsDay)

    // Current weather
    const currentWeather: CurrentWeather = {
      temp: Math.round(data.current_weather.temperature) || 0,
      feels_like: Math.round(data.hourly.apparent_temperature?.[safeIndex] ?? data.current_weather.temperature) || 0,
      humidity: Math.round(data.hourly.relativehumidity_2m?.[safeIndex] ?? 0),
      pressure: Math.round(data.hourly.surface_pressure?.[safeIndex] ?? 1013),
      wind_speed: Math.round(data.current_weather.windspeed || 0),
      wind_deg: data.current_weather.winddirection ?? 0,
      visibility: 10,
      description: currentWeatherInfo.desc,
      icon: currentWeatherInfo.icon,
      pop: Math.round(data.hourly.precipitation_probability?.[safeIndex] ?? 0),
      weather_code: currentCode
    }

    // Alerts
    const alerts: WeatherAlert[] = []
    const currentPrecip = currentWeather.pop || 0

    if ([95, 96, 99].includes(currentCode)) {
      alerts.push({
        title: 'Thunderstorm Warning',
        message: 'Thunderstorms likely. Stay indoors.',
        time: currentTime,
        severity: 'warning',
        icon: '⚡'
      })
    }

    if (currentPrecip >= 70) {
      alerts.push({
        title: 'Heavy Rain Alert',
        message: `Precipitation: ${currentPrecip}%`,
        time: currentTime,
        severity: 'advisory',
        icon: '🌧️'
      })
    }

    if (alerts.length === 0) {
      alerts.push({
        title: 'No Active Alerts',
        message: 'All clear!',
        time: currentTime,
        severity: 'info',
        icon: '✅'
      })
    }

    // Hourly forecast
    const hourlyForecast: ForecastItem[] = []
    const totalHourly = data.hourly.time?.length || 0
    const startIndex = Math.min(safeIndex, Math.max(0, totalHourly - 24))
    const hourCount = Math.min(24, totalHourly - startIndex)

    for (let offset = 0; offset < hourCount; offset++) {
      const i = startIndex + offset
      const timeStr = data.hourly.time[i] || new Date().toISOString()
      const weatherCode = data.hourly.weather_code?.[i] || 0
      const isDay = data.hourly.is_day?.[i] === 1
      const weatherInfo = getWeatherDescription(weatherCode, isDay)

      hourlyForecast.push({
        dt_txt: timeStr,
        main: {
          temp: Math.round(data.hourly.temperature_2m[i]) || 20,
          temp_min: Math.round(data.hourly.temperature_2m_min?.[i]) || 15,
          temp_max: Math.round(data.hourly.temperature_2m_max?.[i]) || 25
        },
        pop: Math.round(data.hourly.precipitation_probability?.[i] || 0),
        precipitation_mm: Math.round((data.hourly.precipitation?.[i] ?? 0) * 10) / 10,
        cloud_cover: Math.round(data.hourly.cloud_cover?.[i] ?? 0),
        weather: [{ description: weatherInfo.desc, icon: weatherInfo.icon }],
        wind: { speed: Math.round(data.hourly.wind_speed_10m?.[i] ?? 0) }
      })
    }

    // Daily forecast
    const dailyForecast: ForecastItem[] = []
    const dayCount = Math.min(7, data.daily.time?.length || 0)

    for (let i = 0; i < dayCount; i++) {
      const dateStr = data.daily.time[i] || new Date().toISOString()
      const dayCode = data.daily.weather_code[i] || 0
      const dayInfo = getWeatherDescription(dayCode)

      dailyForecast.push({
        dt_txt: dateStr,
        main: {
          temp: Math.round(((data.daily.temperature_2m_max[i] || 25) + (data.daily.temperature_2m_min[i] || 15)) / 2),
          temp_min: Math.round(data.daily.temperature_2m_min[i] || 15),
          temp_max: Math.round(data.daily.temperature_2m_max[i] || 25)
        },
        pop: Math.round((data.daily.precipitation_sum[i] || 0) * 20),
        weather: [{ description: dayInfo.desc, icon: dayInfo.icon }],
        wind: { speed: Math.round(data.daily.wind_speed_10m_max[i] || 0) }
      })
    }

    // ==================== ✅✅✅ BULLETPROOF HIGHLIGHTS ✅✅✅ ====================
    const highlights: Highlights = (() => {
      const dailyAny = data.daily as unknown as Record<string, unknown>
      
      // Get raw values from API
      const sunriseRaw = String(toFirstValue(dailyAny.sunrise) ?? '')
      const sunsetRaw = String(toFirstValue(dailyAny.sunset) ?? '')
      
      console.log('\n🔍 DEBUG HIGHLIGHTS:')
      console.log('- Raw sunrise:', JSON.stringify(sunriseRaw))
      console.log('- Raw sunset:', JSON.stringify(sunsetRaw))
      console.log('- Timezone:', timeZone)
      console.log('- Lat/Lon:', lat, '/', lon)
      
      /**
       * ✅✅✅ ULTRA-SAFE TIME PARSER ✅✅✅
       * Handles ALL possible formats from Open-Meteo:
       * 1. "HH:MM" (already local time)
       * 2. "YYYY-MM-DDTHH:MM" (ISO without timezone - treat as local)
       * 3. "YYYY-MM-DDTHH:MM+HH:MM" (ISO with timezone offset)
       */
      const parseTo12HourFormat = (rawTime: string): string => {
        if (!rawTime || rawTime === 'null' || rawTime === 'undefined') {
          console.log('  ⚠️ Empty input')
          return '--'
        }
        
        const trimmed = rawTime.trim()
        
        // Case 1: Simple "HH:MM" format (e.g., "06:27", "18:45")
        const simpleMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
        if (simpleMatch) {
          const h = parseInt(simpleMatch[1], 10)
          const m = simpleMatch[2]
          
          if (h >= 0 && h <= 23) {
            const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
            const ampm = h >= 12 ? 'PM' : 'AM'
            const result = `${hour12}:${m} ${ampm}`
            console.log(`  ✅ Parsed HH:MM: "${trimmed}" → "${result}"`)
            return result
          }
        }
        
        // Case 2: ISO format with T separator (e.g., "2024-05-17T06:27")
        if (trimmed.includes('T')) {
          try {
            const dateObj = new Date(trimmed)
            
            if (!isNaN(dateObj.getTime())) {
              // Extract just the time portion safely
              const hours = dateObj.getHours()
              const minutes = dateObj.getMinutes()
              
              const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
              const ampm = hours >= 12 ? 'PM' : 'AM'
              const result = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
              
              console.log(`  ✅ Parsed ISO: "${trimmed}" → "${result}" (raw hours=${hours})`)
              return result
            }
          } catch (e) {
            console.warn(`  ⚠️ Failed to parse ISO:`, e)
          }
          
          // Fallback: extract time portion after T
          const timePart = trimmed.split('T')[1]?.slice(0, 5)
          if (timePart) {
            const fallbackMatch = timePart.match(/^(\d{1,2}):(\d{2})$/)
            if (fallbackMatch) {
              const h = parseInt(fallbackMatch[1], 10)
              const m = fallbackMatch[2]
              const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
              const ampm = h >= 12 ? 'PM' : 'AM'
              const result = `${hour12}:${m} ${ampm}`
              console.log(`  ✅ Fallback parse: "${trimmed}" → "${result}"`)
              return result
            }
          }
        }
        
        console.warn(`  ⚠️ Could not parse: "${trimmed}"`)
        return '--'
      }
      
      // Parse sunrise and sunset
      const sunriseLocal = parseTo12HourFormat(sunriseRaw)
      const sunsetLocal = parseTo12HourFormat(sunsetRaw)
      
      // Simple but reasonably accurate moon phase calculation
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const day = now.getDate()
      
      // Calculate moon phase using simplified algorithm
      let c = 0
      let e = 0
      let jd = 0
      let b = 0
      
      if (month < 3) {
        c = year - 1
        e = month + 12
      } else {
        c = year
        e = month
      }
      
      jd = Math.floor(365.25 * (c + 4716)) + Math.floor(30.6001 * (e + 1)) + day - 1524.5
      b = ((jd - 2451550.1) / 29.530588853) % 1
      
      // Determine phase
      let moonLabel: string
      let moonIcon: Highlights['moonPhaseIcon']
      
      if (b < 0.03 || b > 0.97) {
        moonLabel = 'New Moon'
        moonIcon = 'new'
      } else if (b < 0.22) {
        moonLabel = 'Waxing Crescent'
        moonIcon = 'waxing'
      } else if (b < 0.28) {
        moonLabel = 'First Quarter'
        moonIcon = 'waxing'
      } else if (b <0.47) {
        moonLabel = 'Waxing Gibbous'
        moonIcon = 'waxing'
      } else if (b < 0.53) {
        moonLabel = 'Full Moon'
        moonIcon = 'full'
      } else if (b < 0.72) {
        moonLabel = 'Waning Gibbous'
        moonIcon = 'waning'
      } else if (b < 0.78) {
        moonLabel = 'Last Quarter'
        moonIcon = 'waning'
      } else {
        moonLabel = 'Waning Crescent'
        moonIcon = 'waning'
      }
      
      // Approximate moonrise/moonset based on phase
      // Full moon rises ~sunset, sets ~sunrise
      // New moon rises ~sunrise, sets ~sunset
      const phaseOffset = b * 24 // 0-24 hours offset based on phase
      
      // Parse current sunrise/sunset to numbers for moon calc
      const parseTimeToNumber = (timeStr: string): number => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
        if (!match) return 12
        
        let h = parseInt(match[1], 10)
        const m = parseInt(match[2], 10) / 60
        const period = match[3]?.toUpperCase()
        
        if (period === 'PM' && h !== 12) h += 12
        if (period === 'AM' && h === 12) h = 0
        
        return h + m
      }
      
      // Get approximate sunrise/sunset in decimal hours
      const sunriseNum = 6.0 + (lat > 0 ? 0 : 0) // Approximate
      const sunsetNum = 18.0 + (lat > 0 ? 2 : -2) // Approximate, varies by season/latitude
      
      // Moon rises roughly between 6AM-6PM depending on phase
      const moonriseBase = sunriseNum + phaseOffset
      const moonriseHour = ((moonriseBase % 24) + 24) % 24
      const moonsetHour = ((moonriseHour + 12) % 24)
      
      const formatDecimalHour = (hours: number): string => {
        const h = Math.floor(hours)
        const min = Math.floor((hours % 1) * 60)
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
        const ampm = h >= 12 ? 'PM' : 'AM'
        return `${hour12}:${min.toString().padStart(2, '0')} ${ampm}`
      }
      
      console.log('\n📊 FINAL HIGHLIGHTS:')
      console.log(`☀️ Sunrise: ${sunriseLocal}`)
      console.log(`🌇 Sunset: ${sunsetLocal}`)
      console.log(`🌙 Moon: ${moonLabel}`)
      console.log(`🌙 Moonrise: ${formatDecimalHour(moonriseHour)}`)
      console.log(`🌙 Moonset: ${formatDecimalHour(moonsetHour)}`)
      
      return {
        sunrise: sunriseLocal,
        sunset: sunsetLocal,
        moonrise: formatDecimalHour(moonriseHour),
        moonset: formatDecimalHour(moonsetHour),
        moonPhaseLabel: moonLabel,
        moonPhaseIcon: moonIcon
      }
    })()

    // Build final response
    const weatherData = {
      location: {
        city: cityName || 'Unknown',
        state: stateName || '',
        country: countryName || '',
        lat: lat || 0,
        lon: lon || 0
      },
      current: currentWeather,
      hourly: hourlyForecast,
      daily: dailyForecast,
      forecast: [...hourlyForecast, ...dailyForecast],
      alerts,
      highlights,
      timezone: timeZone,
      aqi: null,
      timestamp: new Date().toISOString(),
      success: true
    }

    console.log(`\n✅ SUCCESS! Data ready for ${cityName}\n`)

    return NextResponse.json(weatherData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ FATAL ERROR:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}