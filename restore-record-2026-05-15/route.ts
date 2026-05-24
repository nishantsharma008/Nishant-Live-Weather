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
}

// ==================== TIME FORMATTER (FIXED!) ====================
/**
 * Converts ISO timestamp to properly formatted 12-hour time
 * Example: "2024-01-15T14:00:00" → "2:00 PM"
 */
function formatTimeTo12Hour(isoString: string): string {
  try {
    const date = new Date(isoString)
    
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM'
    
    // Convert to 12-hour format (0 becomes 12)
    hours = hours % 12
    hours = hours ? hours : 12
    
    return `${hours}:${minutes} ${ampm}`
  } catch (error) {
    console.warn('⚠️ Time formatting error:', error)
    return 'Invalid Time'
  }
}

// ==================== DATE FORMATTER ====================
/**
 * Formats ISO date to readable day name + date
 * Example: "2024-01-15" → "Mon, Jan 15"
 */
function formatDateToReadable(isoString: string): string {
  try {
    const date = new Date(isoString)
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }
    return date.toLocaleDateString('en-US', options)
  } catch (error) {
    console.warn('⚠️ Date formatting error:', error)
    return 'Unknown Date'
  }
}

// ==================== WEATHER CODE MAPPER ====================
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

// ==================== REVERSE GEOCODING (to verify state) ====================
async function reverseGeocode(lat: number, lon: number): Promise<{ state?: string; country: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherDashboard/1.0 (educational purpose)'
      }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const address = data.address || {}
    
    const state = address.state 
      || address.province 
      || address.state_district
      || address.county 
      || address.region
      || address.admin
      || ''
    
    console.log(`🔄 Reverse geocoding returned state: "${state}"`)
    
    return {
      state: state,
      country: address.country || ''
    }
  } catch (error) {
    console.error('⚠️ Reverse geocoding error:', error)
    return null
  }
}

// ==================== GEOCODING (Nominatim - FREE) ====================
async function getCoordinates(city: string): Promise<{ lat: number; lon: number; name: string; state?: string; country: string } | null> {
  try {
    // First try with India context, then general search
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&countrycodes=in&format=json&limit=1`
    
    console.log(`🔍 Geocoding URL: ${url}`)
    
    let response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherDashboard/1.0 (educational purpose)'
      }
    })
    
    if (!response.ok) {
      console.error(`❌ Geocoding failed: HTTP ${response.status}`)
      return null
    }
    
    let data = await response.json()
    console.log('✅ Geocoding response:', data)
    
    // If no results for India, try global search
    if (!data || data.length === 0) {
      console.log('⚠️ No India results, trying global search for:', city)
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
      response = await fetch(url, {
        headers: {
          'User-Agent': 'WeatherDashboard/1.0 (educational purpose)'
        }
      })
      data = await response.json()
      console.log('✅ Global geocoding response:', data)
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ No results found for:', city)
      return null
    }
    
    const lat = parseFloat(data[0].lat)
    const lon = parseFloat(data[0].lon)
    
    // Try reverse geocoding to verify/correct the state
    const reverseResult = await reverseGeocode(lat, lon)
    
    // Extract state from forward geocoding first
    const address = data[0].address || {}
    let state = address.state 
      || address.province 
      || address.state_district
      || address.county 
      || address.region
      || address.admin
      || ''
    
    // Use reverse geocoding state if it's more complete
    if (reverseResult?.state && (!state || state.length === 0)) {
      state = reverseResult.state
      console.log(`📍 Using reverse geocoding state: "${state}"`)
    } else if (reverseResult?.state && reverseResult.state !== state) {
      console.log(`⚠️ Forward geocoding: "${state}", Reverse geocoding: "${reverseResult.state}"`)
    }
    
    return {
      lat: lat,
      lon: lon,
      name: data[0].display_name.split(',')[0],
      state: state,
      country: reverseResult?.country || address.country || ''
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error)
    return null
  }
}

// ==================== MAIN API HANDLER ====================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityParam = searchParams.get('city')
    
    console.log(`\n🌤️ ===== NEW REQUEST =====`)
    console.log(`📍 City Parameter: "${cityParam}"`)
    
    if (!cityParam || cityParam.trim() === '') {
      console.log('❌ Missing city parameter')
      return NextResponse.json(
        { success: false, error: 'City parameter is required' },
        { status: 400 }
      )
    }
    
    // Parse coordinates if provided directly (e.g., "23.0225,72.5714")
    const parts = cityParam.split(',').map(s => s.trim())
    let lat: number
    let lon: number
    let cityName: string
    let stateName: string = ''
    let countryName: string
    
    // Check if it's coordinates (two numbers)
    if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
      lat = parseFloat(parts[0])
      lon = parseFloat(parts[1])
      cityName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      countryName = ''
      
      console.log(`📍 Using coordinates directly: ${lat}, ${lon}`)
      
      // Try reverse geocoding to get city name (optional, won't fail if it doesn't work)
      try {
        const geoResult = await getCoordinates(`${lat},${lon}`)
        if (geoResult && geoResult.name !== 'Location') {
          cityName = geoResult.name
          stateName = geoResult.state || ''
          countryName = geoResult.country
          console.log(`✅ Reverse geocoded to: ${cityName}, ${stateName}, ${countryName}`)
        }
      } catch (geoError) {
        console.log('⚠️ Reverse geocoding failed, using coordinates as city name')
        // Don't fail - just use coordinates as the name
      }
    } else {
      // It's a city name - geocode it
      console.log(`🔍 Geocoding city: ${cityParam}`)
      const geoResult = await getCoordinates(cityParam)
      
      if (!geoResult) {
        console.log(`❌ City not found: ${cityParam}`)
        return NextResponse.json(
          { success: false, error: `City "${cityParam}" not found. Please check spelling.` },
          { status: 404 }
        )
      }
      
      lat = geoResult.lat
      lon = geoResult.lon
      cityName = geoResult.name
      stateName = geoResult.state || ''
      countryName = geoResult.country
      
      console.log(`✅ Found coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`)
    }
    
    // Fetch from Open-Meteo (FREE API - NO KEY NEEDED!)
    console.log(`⚡ Fetching from Open-Meteo...`)
    
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,temperature_2m_max,temperature_2m_min,apparent_temperature,relativehumidity_2m,surface_pressure,precipitation_probability,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`
    
    console.log(`🌐 Open-Meteo URL length: ${openMeteoUrl.length}`)
    
    const response = await fetch(openMeteoUrl)
    
    if (!response.ok) {
      console.error(`❌ Open-Meteo failed: HTTP ${response.status}`)
      throw new Error(`Weather API failed: HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ Open-Meteo response received!')
    console.log('📊 Data keys:', Object.keys(data))
    
    // Validate we have data
    if (!data.current_weather || !data.hourly || !data.daily) {
      console.error('❌ Invalid data structure from Open-Meteo')
      throw new Error('Invalid weather data received from API')
    }
    
    const currentTime = data.current_weather.time
    const currentHourIndex = data.hourly.time?.findIndex((time: string) => time.startsWith(currentTime.slice(0, 13)))
    const currentHourSafeIndex = currentHourIndex >= 0 ? currentHourIndex : 0

    const currentCode = data.current_weather.weathercode
    const currentIsDay = data.current_weather.is_day === 1 || data.hourly.is_day?.[currentHourSafeIndex] === 1
    const currentWeatherInfo = getWeatherDescription(currentCode, currentIsDay)
    
    const currentWeather: CurrentWeather = {
      temp: Math.round(data.current_weather.temperature) || 0,
      feels_like: Math.round(data.hourly.apparent_temperature?.[currentHourSafeIndex] ?? data.current_weather.temperature) || 0,
      humidity: Math.round(data.hourly.relativehumidity_2m?.[currentHourSafeIndex] ?? 0),
      pressure: Math.round(data.hourly.surface_pressure?.[currentHourSafeIndex] ?? 1013),
      wind_speed: Math.round(data.current_weather.windspeed || 0),
      wind_deg: data.current_weather.winddirection ?? 0,
      visibility: 10,
      description: currentWeatherInfo.desc,
      icon: currentWeatherInfo.icon
    }
    
    // ==================== TRANSFORM HOURLY FORECAST (FIXED!) ====================
    const hourlyForecast: ForecastItem[] = []
    const hourCount = Math.min(24, data.hourly.time?.length || 0)
    
    for (let i = 0; i < hourCount; i++) {
      try {
        const timeStr = data.hourly.time[i] || new Date().toISOString()
        const weatherCode = data.hourly.weather_code?.[i] || 0
        const isDay = data.hourly.is_day?.[i] === 1
        const weatherInfo = getWeatherDescription(weatherCode, isDay)
        
        hourlyForecast.push({
          dt_txt: formatTimeTo12Hour(timeStr), // ✅ FIXED: Proper 12-hour format!
          main: {
            temp: Math.round(data.hourly.temperature_2m[i]) || 20,
            temp_min: Math.round(data.hourly.temperature_2m_min?.[i]) || 15,
            temp_max: Math.round(data.hourly.temperature_2m_max?.[i]) || 25
          },
          pop: Math.round(data.hourly.precipitation_probability?.[i] || 0),
          weather: [{ 
            description: weatherInfo.desc, 
            icon: weatherInfo.icon 
          }],
          wind: { speed: Math.round(data.hourly.wind_speed_10m?.[i] || 0) }
        })
      } catch (err) {
        console.warn(`⚠️ Error processing hour ${i}:`, err)
      }
    }
    
    // ==================== TRANSFORM DAILY FORECAST (FIXED!) ====================
    const dailyForecast: ForecastItem[] = []
    const dayCount = Math.min(7, data.daily.time?.length || 0)
    
    for (let i = 0; i < dayCount; i++) {
      try {
        const dateStr = data.daily.time[i] || new Date().toISOString()
        const dayCode = data.daily.weather_code[i] || 0
        const dayInfo = getWeatherDescription(dayCode)
        
        dailyForecast.push({
          dt_txt: formatDateToReadable(dateStr), // ✅ FIXED: Readable date format!
          main: {
            temp: Math.round(((data.daily.temperature_2m_max[i] || 25) + (data.daily.temperature_2m_min[i] || 15)) / 2),
            temp_min: Math.round(data.daily.temperature_2m_min[i] || 15),
            temp_max: Math.round(data.daily.temperature_2m_max[i] || 25)
          },
          pop: Math.round((data.daily.precipitation_sum[i] || 0) * 20),
          weather: [{ description: dayInfo.desc, icon: dayInfo.icon }],
          wind: { speed: Math.round(data.daily.wind_speed_10m_max[i] || 0) }
        })
      } catch (err) {
        console.warn(`⚠️ Error processing day ${i}:`, err)
      }
    }
    
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
      forecast: [...hourlyForecast, ...dailyForecast],
      aqi: null,
      timestamp: new Date().toISOString(),
      success: true
    }
    
    console.log(`✅ Successfully processed data for ${cityName}!`)
    console.log(`🌡️ Temperature: ${currentWeather.temp}°C`)
    console.log(`💨 Hourly items: ${hourlyForecast.length}`)
    console.log(`📅 Daily items: ${dailyForecast.length}`)
    
    // Log sample of formatted times for verification
    if (hourlyForecast.length > 0) {
      console.log(`⏰ Sample hourly times:`, hourlyForecast.slice(0, 5).map(h => h.dt_txt))
    }
    
    return NextResponse.json(weatherData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('❌❌❌ FATAL ERROR IN API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Server error occurred',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}