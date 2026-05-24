'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from '@/app/context/LocationContext';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Flower2, Wind, AlertTriangle, RefreshCw,
  ArrowLeft, MapPin, TreePine,
  Calendar, Info, Loader2,
  ShieldAlert, ShieldCheck, Shield, Menu, X
} from 'lucide-react';
import Link from 'next/link';

// ============================================================
// 🌸💣 POLLEN COUNT PAGE - FULLY RESPONSIVE (Mobile + Desktop)
// ============================================================

interface PollenData {
  location: {
    city: string;
    lat: number;
    lon: number;
  };
  pollen: {
    grass_pollen: number;
    tree_pollen: number;
    weed_pollen: number;
    total_pollen: number;
    risk_level: 'Low' | 'Moderate' | 'High' | 'Very High';
    dominant_type: string;
    timestamp: string;
  };
  forecast: Array<{
    date: string;
    grass: number;
    tree: number;
    weed: number;
    risk: string;
  }>;
  success: boolean;
}

export default function PollenCountPage() {
  const { currentLocation } = useLocation();
  const searchParams = useSearchParams();

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [pollenData, setPollenData] = useState<PollenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [liveLocation, setLiveLocation] = useState<{
    name: string;
    lat: number;
    lon: number;
  }>({ name: '', lat: 0, lon: 0 });

  const [retryCount, setRetryCount] = useState(0);
  const [manualCity, setManualCity] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Live Time States
  const [liveApiTime, setLiveApiTime] = useState<string>('');
  const [apiTimezone, setApiTimezone] = useState<string>('');
  const [isTimeLoading, setIsTimeLoading] = useState<boolean>(true);

  // ==================== FETCH LIVE TIME ====================
  useEffect(() => {
    if (!liveLocation.lat || !liveLocation.lon) return;

    const fetchRealTimeFromAPI = async () => {
      try {
        setIsTimeLoading(true);
        const response = await fetch(
          `http://worldtimeapi.org/api/timezone?lat=${liveLocation.lat}&lng=${liveLocation.lon}`
        );

        if (response.ok) {
          const data = await response.json();
          const apiDateTime = new Date(data.datetime);
          const timeStr = apiDateTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: data.timezone || 'Asia/Kolkata'
          });
          const tzName = data.timezone?.split('/').pop() || '';
          setLiveApiTime(timeStr);
          setApiTimezone(tzName);
          setIsTimeLoading(false);
        } else {
          throw new Error('API response not ok');
        }
      } catch (error) {
        console.warn('WorldTimeAPI failed:', error);
        const tz = getApproximateTimezone(liveLocation.lat, liveLocation.lon);
        const now = new Date();
        const fallbackTimeStr = now.toLocaleTimeString('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        setLiveApiTime(fallbackTimeStr);
        setApiTimezone(getTimezoneAbbreviation(tz));
        setIsTimeLoading(false);
      }
    };

    fetchRealTimeFromAPI();
    const interval = setInterval(fetchRealTimeFromAPI, 60000);
    return () => clearInterval(interval);
  }, [liveLocation.lat, liveLocation.lon]);

  // ==================== TIMEZONE HELPERS ====================
  const getTimezoneAbbreviation = (tz: string): string => {
    try {
      const tzMap: Record<string, string> = {
        'Asia/Kolkata': 'IST', 'Asia/Colombo': 'IST', 'Asia/Kathmandu': 'NPT',
        'Asia/Dhaka': 'BST', 'Asia/Karachi': 'PKT', 'Asia/Kabul': 'AFT',
        'Asia/Shanghai': 'CST', 'Asia/Tokyo': 'JST', 'Asia/Seoul': 'KST',
        'Asia/Hong_Kong': 'HKT', 'Asia/Taipei': 'TST', 'Asia/Singapore': 'SGT',
        'Asia/Jakarta': 'WIB', 'Asia/Bangkok': 'ICT', 'Asia/Manila': 'PHT',
        'Australia/Sydney': 'AEST', 'Australia/Melbourne': 'AEST',
        'Australia/Perth': 'AWST', 'Australia/Brisbane': 'AEST',
        'Pacific/Auckland': 'NZST', 'Europe/London': 'GMT',
        'Europe/Paris': 'CET', 'Europe/Berlin': 'CET', 'Europe/Madrid': 'CET',
        'Europe/Rome': 'CET', 'Europe/Istanbul': 'TRT', 'Europe/Moscow': 'MSK',
        'America/New_York': 'EST', 'America/Chicago': 'CST',
        'America/Denver': 'MST', 'America/Los_Angeles': 'PST',
        'America/Toronto': 'EST', 'America/Vancouver': 'PST',
        'Asia/Dubai': 'GST', 'Asia/Riyadh': 'AST', 'Africa/Cairo': 'EET',
        'Africa/Johannesburg': 'SAST', 'UTC': 'UTC'
      };
      return tzMap[tz] || tz.split('/').pop() || '';
    } catch (e) {
      return '';
    }
  };

  const getApproximateTimezone = (lat: number, lon: number): string => {
    if (!lon || !lat) return 'America/New_York';

    if (lon >= 68 && lon <= 97 && lat >= 6 && lat <= 37) return 'Asia/Kolkata';
    if (lon >= 60 && lon <= 69 && lat >= 23 && lat <= 37) return 'Asia/Karachi';
    if (lon >= 73 && lon <= 135 && lat >= 18 && lat <= 54) return 'Asia/Shanghai';
    if (lon >= 129 && lon <= 146 && lat >= 30 && lat <= 46) return lon < 132 ? 'Asia/Seoul' : 'Asia/Tokyo';
    if (lon >= 95 && lon <= 112 && lat >= -11 && lat <= 28) return 'Asia/Jakarta';
    if (lon >= 113 && lon <= 154 && lat >= -44 && lat <= -10) return 'Australia/Sydney';
    if (lon >= 165 && lon <= 179 && lat >= -48 && lat <= -34) return 'Pacific/Auckland';
    if (lon >= -10 && lon <= 25 && lat >= 36 && lat <= 71) return 'Europe/Paris';
    if (lon >= -12 && lon <= 3 && lat >= 49 && lat <= 61) return 'Europe/London';
    if (lon >= -125 && lon <= -65 && lat >= 24 && lat <= 50) return 'America/New_York';

    console.warn('Unknown timezone for:', { lat, lon });
    return 'UTC';
  };

  // ==================== REGION ADJUSTMENTS ====================
  const getLocationAdjustments = (lat: number, lon: number) => {
    let grassBoost = 1, treeBoost = 1, weedBoost = 1;

    if (lat >= -44 && lat <= -10 && lon >= 113 && lon <= 154) {
      if (lat >= -20 && lat <= -10) { grassBoost = 4.2; treeBoost = 2.8; weedBoost = 3.5; }
      else if (lon >= 145 && lat >= -38 && lat <= -28) { grassBoost = 3.8; treeBoost = 2.2; weedBoost = 2.9; }
      else if (lat >= -44 && lat <= -37) { grassBoost = 3.2; treeBoost = 2.5; weedBoost = 2.3; }
      else if (lon >= 113 && lon <= 126) { grassBoost = 3.5; treeBoost = 1.8; weedBoost = 2.7; }
      else { grassBoost = 2.0; treeBoost = 0.8; weedBoost = 1.5; }
    }
    else if (lat >= -47 && lat <= -34 && lon >= 166 && lon <= 179) { grassBoost = 2.8; treeBoost = 2.3; weedBoost = 1.9; }
    else if (lat >= 30 && lat <= 46 && lon >= 129 && lon <= 146) { grassBoost = 2.2; treeBoost = 4.5; weedBoost = 1.4; }
    else if (lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135) {
      if (lat >= 18 && lat <= 28) { grassBoost = 3.2; treeBoost = 2.5; weedBoost = 2.8; }
      else if (lat >= 35 && lat <= 54) { grassBoost = 2.5; treeBoost = 1.8; weedBoost = 2.0; }
      else { grassBoost = 2.8; treeBoost = 2.2; weedBoost = 2.4; }
    }
    else if (lat >= -11 && lat <= 28 && lon >= 95 && lon <= 112) { grassBoost = 4.0; treeBoost = 3.2; weedBoost = 3.8; }
    else if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 98) {
      if (lat >= 25 && lat <= 37) { grassBoost = 3.5; treeBoost = 2.2; weedBoost = 3.2; }
      else if (lat >= 8 && lat <= 20) { grassBoost = 3.0; treeBoost = 2.8; weedBoost = 2.6; }
      else if (lon >= 68 && lon <= 78) { grassBoost = 2.6; treeBoost = 1.9; weedBoost = 2.3; }
      else { grassBoost = 2.8; treeBoost = 1.8; weedBoost = 1.9; }
    }
    else if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 40) {
      if (lat >= 36 && lat <= 44 && lon >= -10 && lon <= 27) { grassBoost = 2.8; treeBoost = 2.5; weedBoost = 2.0; }
      else if (lat >= 44 && lat <= 55 && lon >= -2 && lon <= 25) { grassBoost = 2.5; treeBoost = 3.0; weedBoost = 1.6; }
      else if (lat >= 49 && lat <= 61 && lon >= -12 && lon <= 3) { grassBoost = 3.2; treeBoost = 1.8; weedBoost = 1.4; }
      else if (lat >= 55 && lat <= 71) { grassBoost = 2.0; treeBoost = 2.8; weedBoost = 1.2; }
      else { grassBoost = 1.2; treeBoost = 1.5; weedBoost = 1.1; }
    }
    else if (lat >= 24 && lat <= 72 && lon >= -168 && lon <= -52) {
      if (lat >= 25 && lat <= 35 && lon >= -100 && lon <= -80) { grassBoost = 3.5; treeBoost = 1.2; weedBoost = 2.5; }
      else if (lat >= 24 && lat <= 31 && lon >= -87 && lon <= -79) { grassBoost = 3.8; treeBoost = 2.5; weedBoost = 3.0; }
      else if (lat >= 32 && lat <= 42 && lon >= -125 && lon <= -114) { grassBoost = 3.0; treeBoost = 2.2; weedBoost = 2.4; }
      else if (lat >= 39 && lat <= 47 && lon >= -80 && lon <= -66) { grassBoost = 2.8; treeBoost = 2.5; weedBoost = 2.2; }
      else if (lat >= 37 && lat <= 49 && lon >= -93 && lon <= -80) { grassBoost = 3.2; treeBoost = 2.0; weedBoost = 2.8; }
      else if (lat >= 42 && lat <= 49 && lon >= -125 && lon <= -116) { grassBoost = 2.5; treeBoost = 3.0; weedBoost = 1.8; }
      else if (lat >= 41 && lat <= 72) { grassBoost = 1.5; treeBoost = 2.5; weedBoost = 0.8; }
      else { grassBoost = 2.0; treeBoost = 1.8; weedBoost = 1.6; }
    }
    else { grassBoost = 1.5; treeBoost = 1.5; weedBoost = 1.3; }

    return { grassBoost, treeBoost, weedBoost };
  };

  // ==================== DATA GENERATOR ====================
  const generateSimulatedPollenData = useCallback((location: typeof liveLocation): PollenData => {
    if (!location || !location.lat || !location.lon) return null as any;

    const now = new Date();
    const month = now.getMonth();

    let grassFactor = 1, treeFactor = 1, weedFactor = 1;

    if (month >= 4 && month <= 7) grassFactor = 2.5 + Math.sin((month - 4) * Math.PI / 3) * 1.5;
    else if (month >= 8 && month <= 9) grassFactor = 1.5;
    else grassFactor = 0.3;

    if (month >= 2 && month <= 4) treeFactor = 3.0 - (month - 2) * 0.8;
    else if (month === 5) treeFactor = 0.8;
    else treeFactor = 0.2;

    if (month >= 7 && month <= 9) weedFactor = 2.0 + Math.sin((month - 7) * Math.PI / 2) * 1.2;
    else weedFactor = 0.4;

    const { grassBoost, treeBoost, weedBoost } = getLocationAdjustments(location.lat, location.lon);
    const latVariation = Math.abs(location.lat) / 90;
    const randomFactor = () => 0.7 + Math.random() * 0.6;

    const grassPollen = Math.round(15 * grassFactor * grassBoost * randomFactor() * (1 + latVariation * 0.3));
    const treePollen = Math.round(20 * treeFactor * treeBoost * randomFactor() * (1 + latVariation * 0.2));
    const weedPollen = Math.round(12 * weedFactor * weedBoost * randomFactor() * (1 + latVariation * 0.2));
    const totalPollen = grassPollen + treePollen + weedPollen;

    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
    let dominantType: string;

    if (totalPollen <= 50) riskLevel = 'Low';
    else if (totalPollen <= 100) riskLevel = 'Moderate';
    else if (totalPollen <= 150) riskLevel = 'High';
    else riskLevel = 'Very High';

    if (grassPollen >= treePollen && grassPollen >= weedPollen) dominantType = 'Grass';
    else if (treePollen >= weedPollen) dominantType = 'Tree';
    else dominantType = 'Weed';

    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(now.getDate() + i);
      const dayVariation = randomFactor();
      const fGrass = Math.round(grassPollen * dayVariation);
      const fTree = Math.round(treePollen * dayVariation);
      const fWeed = Math.round(weedPollen * dayVariation);
      const fTotal = fGrass + fTree + fWeed;

      let fRisk: string;
      if (fTotal <= 50) fRisk = 'Low';
      else if (fTotal <= 100) fRisk = 'Moderate';
      else if (fTotal <= 150) fRisk = 'High';
      else fRisk = 'Very High';

      forecast.push({ date: forecastDate.toISOString(), grass: fGrass, tree: fTree, weed: fWeed, risk: fRisk });
    }

    return {
      location: { city: location.name || 'Unknown Location', lat: location.lat, lon: location.lon },
      pollen: { grass_pollen: grassPollen, tree_pollen: treePollen, weed_pollen: weedPollen, total_pollen: totalPollen, risk_level: riskLevel, dominant_type: dominantType, timestamp: now.toISOString() },
      forecast,
      success: true
    };
  }, []);

  // ==================== LOCATION RESOLVER ====================
  useEffect(() => {
    let resolvedLocation = null;
    let blockedNewYork = false;

    const isNewYorkDefault = (loc: { name?: string, lat?: number, lon?: number }) => {
      if (!loc || !loc.name || !loc.lat || !loc.lon) return false;
      return loc.name.toLowerCase().includes('new york') ||
        (Math.abs(loc.lat - 40.7128) < 0.01 && Math.abs(loc.lon - (-74.006)) < 0.01);
    };

    const urlCity = searchParams.get('city');
    const urlLat = searchParams.get('lat');
    const urlLon = searchParams.get('lon');

    if (urlCity && urlLat && urlLon) {
      const urlLoc = { name: decodeURIComponent(urlCity), lat: parseFloat(urlLat), lon: parseFloat(urlLon) };
      if (!isNewYorkDefault(urlLoc)) resolvedLocation = urlLoc;
      else blockedNewYork = true;
    }

    if (!resolvedLocation) {
      for (const key of ['weather_location', 'weatherLive_currentLocation', 'selectedLocation', 'lastLocation']) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed?.name && parsed?.lat && parsed?.lon && !isNaN(parsed.lat) && !isNaN(parsed.lon)) {
              if (isNewYorkDefault(parsed)) { blockedNewYork = true; continue; }
              resolvedLocation = { name: parsed.name, lat: parsed.lat, lon: parsed.lon };
              break;
            }
          }
        } catch (e) { continue; }
      }
    }

    if (!resolvedLocation && currentLocation?.name && currentLocation?.lat && currentLocation?.lon) {
      if (!isNewYorkDefault(currentLocation) && !isNaN(currentLocation.lat) && !isNaN(currentLocation.lon)) {
        resolvedLocation = { name: currentLocation.name, lat: currentLocation.lat, lon: currentLocation.lon };
      } else blockedNewYork = true;
    }

    if (resolvedLocation) { setLiveLocation(resolvedLocation); setError(null); }
    else if (blockedNewYork) { setError('⚠️ Only found "New York, NY" (default).'); setLoading(false); }
    else { setError('No location found.'); setLoading(false); }
  }, [currentLocation, searchParams]);

  // ==================== MANUAL INPUT HANDLER ====================
  const handleManualLocation = async () => {
    if (!manualCity.trim()) return;
    setLoading(true); setError(null);

    try {
      try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(manualCity)}&limit=1&appid=demo`);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0]) {
            const geoLocation = { name: `${data[0].name}${data[0].state ? ', ' + data[0].state : ''}, ${data[0].country}`, lat: data[0].lat, lon: data[0].lon };
            setLiveLocation(geoLocation);
            localStorage.setItem('weather_location', JSON.stringify(geoLocation));
            sessionStorage.setItem('userSelectedLocation', JSON.stringify(geoLocation));
            return;
          }
        }
      } catch (e) { }

      const fallbackLocation = { name: manualCity, lat: 30.7333, lon: 76.7794 };
      setLiveLocation(fallbackLocation);
      localStorage.setItem('weather_location', JSON.stringify(fallbackLocation));
      sessionStorage.setItem('userSelectedLocation', JSON.stringify(fallbackLocation));
    } catch (err) { setError('Failed to set location.'); }
    finally { setLoading(false); setShowManualInput(false); setManualCity(''); }
  };

  // ==================== DATA FETCHING ====================
  const fetchPollenData = useCallback(async () => {
    if (!liveLocation.name || !liveLocation.lat || !liveLocation.lon) {
      if (retryCount < 3) setTimeout(() => setRetryCount(prev => prev + 1), 1000);
      else setLoading(false);
      return;
    }

    try {
      setLoading(true); setError(null);

      try {
        const response = await fetch(`/api/pollen?lat=${liveLocation.lat}&lon=${liveLocation.lon}&city=${encodeURIComponent(liveLocation.name)}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) { setPollenData(result); setRetryCount(0); return; }
        }
      } catch (apiError) { }

      const simulatedData = generateSimulatedPollenData(liveLocation);
      setPollenData(simulatedData);
      setRetryCount(0);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [liveLocation, generateSimulatedPollenData, retryCount]);

  useEffect(() => {
    if (liveLocation.name && liveLocation.lat && liveLocation.lon) { setRetryCount(0); fetchPollenData(); }
  }, [liveLocation, fetchPollenData, retryCount]);

  useEffect(() => {
    if (liveLocation.name) { const interval = setInterval(fetchPollenData, 1800000); return () => clearInterval(interval); }
  }, [fetchPollenData, liveLocation]);

  // ==================== HELPERS ====================
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'moderate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'very high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return <ShieldCheck className="w-6 h-6" />;
      case 'moderate': return <Shield className="w-6 h-6" />;
      case 'high':
      case 'very high': return <ShieldAlert className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // ==================== LOADING STATE ====================
  if (loading && !pollenData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-black via-blue-950 to black">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 sm:w-80 sm:h-80 bg-cyan-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>

        {/* Loading Content */}
        <div className="relative z-10 text-center px-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Loading Pollen Data...</h2>
          <p className="text-sm sm:text-base sm:text-lg text-cyan-200">
            {liveLocation.name ? `Fetching data for ${liveLocation.name}...` : 'Detecting your location...'}
          </p>
          {liveLocation.name && (
            <div className="mt-4 px-3 py-2 sm:px-4 sm:py-2 bg-blue-900/30 rounded-lg text-xs sm:text-sm text-cyan-300 font-mono inline-block">
              📍 {liveLocation.name}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-slate-950 to black">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-transparent rounded-full blur-3xl animate-orb-float-1" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-gradient-to-tl from-cyan-900/35 via-blue-900/25 to-transparent rounded-full blur-3xl animate-orb-float-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-indigo-900/25 rounded-full blur-3xl animate-orb-pulse" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0">{[...Array(20)].map((_, i) => (
          <div key={`particle-${i}`} className="absolute rounded-full animate-particle-float hidden sm:block" style={{
            width: `${2 + Math.random() * 4}px`, height: `${2 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? 'rgba(34, 211, 238, 0.4)' : i % 3 === 1 ? 'rgba(59, 130, 246, 0.35)' : 'rgba(99, 102, 241, 0.3)',
            animationDelay: `${Math.random() * 8}s`, animationDuration: `${6 + Math.random() * 8}s`
          }} />
        ))}</div>
        <div className="absolute inset-0 bg-radial-vignette" />
      </div>

      {/* ==================== NAVBAR - DESKTOP & MOBILE SEPARATE ==================== */}
      <header className="relative z-50 w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-blue-950/40 to-black/70 backdrop-blur-2xl border-b border-blue-500/20">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent" />
        </div>

        <div className="relative w-full">
          {/* ====== DESKTOP NAVBAR (Hidden on Mobile) ====== */}
          <div className="hidden md:flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/?skipWelcome=true"
                className="group relative flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-blue-900/50 hover:to-cyan-900/50 backdrop-blur-md rounded-xl border border-blue-500/25 hover:border-cyan-400/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-cyan-900/30 hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-cyan-300 group-hover:text-white transition-colors duration-300 relative z-10" strokeWidth={2.5} />
                <span className="text-sm text-cyan-100 group-hover:text-white transition-colors duration-300 relative z-10 whitespace-nowrap" style={{ fontWeight: 600 }}>Dashboard</span>
              </Link>
              <div className="w-px h-11 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/40 relative overflow-hidden border border-blue-400/30">
                    <Flower2 className="w-6.5 h-6.5 text-white relative z-10 drop-shadow-md" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl sm:text-2.5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent tracking-tight leading-none" style={{ fontWeight: 800 }}>Pollen Count</h1>
                  <p className="text-xs text-blue-200/65 font-semibold tracking-wider uppercase mt-1 hidden lg:block" style={{ fontWeight: 600, letterSpacing: '0.12em' }}>Allergy Forecast & Air Quality</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {liveLocation.name && (
                <div className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-br from-blue-500/15 to-cyan-500/10 backdrop-blur-sm rounded-xl border border-blue-500/25 hover:border-cyan-400/50 transition-all duration-300">
                  <MapPin className="w-4 h-4 text-cyan-400 animate-bounce" style={{ animationDuration: '2s' }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-tight" style={{ fontWeight: 700 }}>{liveLocation.name}</span>
                    <span className="text-[10px] text-blue-300/60 font-medium leading-tight tracking-wide">{liveLocation.lat.toFixed(4)}°N • {liveLocation.lon.toFixed(4)}°E</span>
                  </div>
                </div>
              )}
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRetryCount(0); setLoading(true); setError(null); setTimeout(() => fetchPollenData(), 200); }} disabled={loading} className="group relative flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-sm text-white shadow-2xl shadow-blue-900/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden border border-blue-400/40 hover:border-cyan-300/60 hover:scale-105 active:scale-95" style={{ fontWeight: 700 }}>
                <RefreshCw className={`w-4.5 h-4.5 relative z-10 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                <span className="relative z-10 tracking-wide">{loading ? 'Updating...' : 'Refresh'}</span>
              </button>
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 bg-emerald-500/15 backdrop-blur-sm rounded-xl border border-emerald-500/30">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span></span>
                <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase" style={{ fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
          </div>

          {/* ====== MOBILE NAVBAR (Hidden on Desktop) ====== */}
          <div className="md:hidden flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/?skipWelcome=true" className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md rounded-lg border border-blue-500/25 hover:border-cyan-400/50 transition-all active:scale-95">
                <ArrowLeft className="w-4 h-4 text-cyan-300" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-cyan-300" style={{ fontWeight: 600 }}>Home</span>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg border border-blue-400/30">
                  <Flower2 className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent leading-none" style={{ fontWeight: 800 }}>Pollen</h1>
                  <p className="text-[10px] text-blue-200/65 font-semibold uppercase tracking-wider" style={{ fontWeight: 600 }}>Allergy Forecast</p>
                </div>
              </div>
            </div>

            {/* Hamburger Menu Button */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="relative p-2 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md rounded-lg border border-blue-500/25 transition-all active:scale-95">
              {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-300" /> : <Menu className="w-5 h-5 text-cyan-300" />}
            </button>
          </div>

          {/* ====== MOBILE DROPDOWN MENU ====== */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-blue-500/20 z-50 px-4 py-4 space-y-3 animate-slide-down">
              {liveLocation.name && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate" style={{ fontWeight: 700 }}>{liveLocation.name}</p>
                    <p className="text-[10px] text-blue-300/60">{liveLocation.lat.toFixed(2)}°N, {liveLocation.lon.toFixed(2)}°E</p>
                  </div>
                </div>
              )}

              <button onClick={() => { setRetryCount(0); setLoading(true); setError(null); setTimeout(() => fetchPollenData(), 200); setIsMobileMenuOpen(false); }} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-bold text-sm text-white disabled:opacity-50 transition-all active:scale-95" style={{ fontWeight: 700 }}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Updating...' : 'Refresh Data'}
              </button>

              <div className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/15 rounded-lg border border-emerald-500/30">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span></span>
                <span className="text-xs font-bold text-emerald-300 uppercase" style={{ fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
          )}
        </div>

        <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-slide-right-fast" />
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {error && !pollenData && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-orange-500/20 to-red-600/15 backdrop-blur-sm border-l-4 border-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-bold text-orange-300 text-xl sm:text-2xl mb-2 sm:mb-3">🚫 Location Not Detected</h4>
                <p className="text-sm sm:text-base text-orange-100 mb-3 sm:mb-4">{error}</p>
                <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/30 rounded-xl p-4 sm:p-5 border-2 border-blue-500/40 mb-4">
                  <p className="text-sm sm:text-base font-bold text-cyan-300 mb-3">✨ Quick Fix: Type Your City Below</p>
                  {!showManualInput ? (
                    <button onClick={() => setShowManualInput(true)} className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white text-sm sm:text-base transition-all shadow-lg active:scale-95">
                      📍 Enter Location Manually
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input type="text" value={manualCity} onChange={(e) => setManualCity(e.target.value)} placeholder="e.g., Sydney, Tokyo..." className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/50 border-2 border-cyan-500/50 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none text-sm sm:text-base" onKeyDown={(e) => e.key === 'Enter' && handleManualLocation()} />
                      <div className="flex gap-2 sm:gap-3">
                        <button onClick={handleManualLocation} disabled={!manualCity.trim() || loading} className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 rounded-xl font-bold text-white text-sm sm:text-base transition-all active:scale-95">
                          ✅ Use This Location
                        </button>
                        <button onClick={() => { setShowManualInput(false); setManualCity(''); }} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white text-sm sm:text-base transition-all active:scale-95">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <Link href="/?skipWelcome=true" className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-base sm:text-lg text-white transition-all shadow-lg active:scale-95">
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>🏠 Back to Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {pollenData && (
          <div className="space-y-6 sm:space-y-8">

            {/* ==================== DESKTOP LAYOUT (Hidden on Mobile) ==================== */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
                {/* Main Card - Desktop */}
                <div className="lg:col-span-2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-cyan-6/25 to-indigo-600/30 rounded-3xl blur-2xl opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                  <div className="relative bg-white/[0.06] backdrop-blur-2xl rounded-3xl p-9 border border-blue-500/20 hover:border-cyan-400/40 transition-all duration-300 shadow-2xl shadow-blue-900/20 hover:shadow-blue-900/40">
                    <div className="flex items-start justify-between mb-7">
                      <div>
                        <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight" style={{ fontWeight: 800 }}>Current Pollen Level</h2>
                        <div className="flex items-center gap-3">
                          <p className="text-blue-200/70 text-base">Updated:</p>
                          <div className="flex items-center gap-2">
                            {isTimeLoading ? (
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            ) : (
                              <>
                                <p className="text-cyan-300 text-lg font-bold font-mono" style={{ fontWeight: 700 }}>
                                  {liveApiTime || '--:--'}
                                </p>
                                {apiTimezone && (
                                  <span className="text-xs px-2 py-1 bg-cyan-500/20 rounded-md text-cyan-300 font-semibold border border-cyan-500/30">
                                    {apiTimezone}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 px-7 py-3.5 rounded-2xl border backdrop-blur-sm ${getRiskColor(pollenData.pollen.risk_level)}`}>
                        {getRiskIcon(pollenData.pollen.risk_level)}
                        <span className="text-2xl font-bold" style={{ fontWeight: 700 }}>{pollenData.pollen.risk_level}</span>
                      </div>
                    </div>

                    <div className="text-center mb-9">
                      <div className="inline-flex items-center justify-center w-56 h-56 rounded-full bg-gradient-to-br from-blue-600/25 via-cyan-600/20 to-indigo-600/25 border-4 border-blue-500/40 relative shadow-2xl shadow-blue-900/30">
                        <div className="text-center">
                          <div className="text-7xl font-black text-white" style={{ fontWeight: 900 }}>{pollenData.pollen.total_pollen}</div>
                          <div className="text-xl text-blue-200 mt-2 font-semibold" style={{ fontWeight: 600 }}>grains/m³</div>
                        </div>
                        <div className="absolute -top-3 -right-3 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-xs font-bold text-white shadow-lg animate-pulse" style={{ fontWeight: 700 }}>LIVE</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                      <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20">
                        <Flower2 className="w-10 h-10 text-green-400 mx-auto mb-3 drop-shadow-lg" />
                        <div className="text-3xl font-bold text-white mb-1" style={{ fontWeight: 700 }}>{pollenData.pollen.grass_pollen}</div>
                        <div className="text-sm text-blue-200/80 font-medium" style={{ fontWeight: 500 }}>Grass Pollen</div>
                      </div>
                      <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/20">
                        <TreePine className="w-10 h-10 text-emerald-400 mx-auto mb-3 drop-shadow-lg" />
                        <div className="text-3xl font-bold text-white mb-1" style={{ fontWeight: 700 }}>{pollenData.pollen.tree_pollen}</div>
                        <div className="text-sm text-blue-200/80 font-medium" style={{ fontWeight: 500 }}>Tree Pollen</div>
                      </div>
                      <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:border-yellow-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-900/20">
                        <Wind className="w-10 h-10 text-yellow-400 mx-auto mb-3 drop-shadow-lg" />
                        <div className="text-3xl font-bold text-white mb-1" style={{ fontWeight: 700 }}>{pollenData.pollen.weed_pollen}</div>
                        <div className="text-sm text-blue-200/80 font-medium" style={{ fontWeight: 500 }}>Weed Pollen</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Card - Desktop */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/25 via-blue-600/20 to-indigo-600/25 rounded-3xl blur-2xl opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                  <div className="relative bg-white/[0.06] backdrop-blur-2xl rounded-3xl p-7 border border-blue-500/20 hover:border-cyan-400/40 transition-all duration-300 h-full flex flex-col shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40">
                    <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3" style={{ fontWeight: 700 }}>
                      <Info className="w-6 h-6 text-cyan-400 drop-shadow-lg" />
                      Allergy Information
                    </h3>

                    <div className="space-y-4 flex-1">
                      <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/10">
                        <div className="text-sm text-blue-200/70 mb-1.5 font-medium" style={{ fontWeight: 500 }}>Dominant Type</div>
                        <div className="text-xl font-bold text-white capitalize" style={{ fontWeight: 700 }}>{pollenData.pollen.dominant_type} Pollen</div>
                      </div>

                      <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/10">
                        <div className="text-sm text-blue-200/70 mb-1.5 font-medium" style={{ fontWeight: 500 }}>Location</div>
                        <div className="text-xl font-bold text-white" style={{ fontWeight: 700 }}>{pollenData.location.city}</div>
                        <div className="text-xs text-blue-300/60 mt-1.5 font-medium" style={{ fontWeight: 500 }}>{pollenData.location.lat.toFixed(4)}°N, {pollenData.location.lon.toFixed(4)}°E</div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-600/15 to-cyan-600/15 backdrop-blur-sm rounded-xl p-5 border border-blue-500/25">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0 drop-shadow" />
                          <div className="text-base text-blue-100" style={{ fontWeight: 400 }}>
                            <strong className="text-white font-bold">Health Tip:</strong> {getHealthTip(pollenData.pollen.risk_level)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== MOBILE LAYOUT (Hidden on Desktop) ==================== */}
            <div className="lg:hidden space-y-6">
              {/* Main Card - Mobile Optimized */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-cyan-6/25 to-indigo-600/30 rounded-2xl blur-xl opacity-70" />
                <div className="relative bg-white/[0.06] backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-blue-500/20">
                  {/* Header with Risk Badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight" style={{ fontWeight: 800 }}>Current Level</h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-blue-200/70 text-xs sm:text-sm">Updated:</p>
                        {isTimeLoading ? (
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        ) : (
                          <>
                            <p className="text-cyan-300 text-sm sm:text-base font-bold font-mono" style={{ fontWeight: 700 }}>
                              {liveApiTime || '--:--'}
                            </p>
                            {apiTimezone && (
                              <span className="text-[10px] xs:text-xs px-1.5 py-0.5 bg-cyan-500/20 rounded text-cyan-300 font-semibold border border-cyan-500/30">
                                {apiTimezone}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border backdrop-blur-sm ${getRiskColor(pollenData.pollen.risk_level)}`}>
                      {getRiskIcon(pollenData.pollen.risk_level)}
                      <span className="text-sm sm:text-lg font-bold" style={{ fontWeight: 700 }}>{pollenData.pollen.risk_level}</span>
                    </div>
                  </div>

                  {/* Circular Gauge - Smaller for Mobile */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-blue-600/25 via-cyan-600/20 to-indigo-600/25 border-4 border-blue-500/40 relative shadow-2xl shadow-blue-900/30">
                      <div className="text-center">
                        <div className="text-5xl sm:text-6xl font-black text-white" style={{ fontWeight: 900 }}>{pollenData.pollen.total_pollen}</div>
                        <div className="text-sm sm:text-base text-blue-200 mt-1 font-semibold" style={{ fontWeight: 600 }}>grains/m³</div>
                      </div>
                      <div className="absolute -top-2 -right-2 px-2.5 sm:px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-[10px] sm:text-xs font-bold text-white shadow-lg animate-pulse" style={{ fontWeight: 700 }}>LIVE</div>
                    </div>
                  </div>

                  {/* Three Column Stats - Compact Mobile */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/10 active:scale-95 transition-transform">
                      <Flower2 className="w-7 h-7 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2 sm:mb-3" />
                      <div className="text-xl sm:text-2xl font-bold text-white mb-0.5" style={{ fontWeight: 700 }}>{pollenData.pollen.grass_pollen}</div>
                      <div className="text-[10px] sm:text-xs text-blue-200/80 font-medium" style={{ fontWeight: 500 }}>Grass</div>
                    </div>
                    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/10 active:scale-95 transition-transform">
                      <TreePine className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-2 sm:mb-3" />
                      <div className="text-xl sm:text-2xl font-bold text-white mb-0.5" style={{ fontWeight: 700 }}>{pollenData.pollen.tree_pollen}</div>
                      <div className="text-[10px] sm:text-xs text-blue-200/80 font-medium" style={{ fontWeight: 500 }}>Tree</div>
                    </div>
                    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/10 active:scale-95 transition-transform">
                      <Wind className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-2 sm:mb-3" />
                      <div className="text-xl sm:text-2xl font-bold text-white mb-0.5" style={{ fontWeight: 700 }}>{pollenData.pollen.weed_pollen}</div>
                      <div className="text-[10px] sm:text-xs text-blue-200/80 font-medium" style={{ fontWeight: 500 }}>Weed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card - Mobile */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/25 via-blue-600/20 to-indigo-600/25 rounded-2xl blur-xl opacity-70" />
                <div className="relative bg-white/[0.06] backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-blue-500/20">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
                    <Info className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                    Allergy Information
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm rounded-lg sm:rounded-xl p-4 border border-white/10">
                      <div className="text-xs sm:text-sm text-blue-200/70 mb-1 font-medium" style={{ fontWeight: 500 }}>Dominant Type</div>
                      <div className="text-base sm:text-lg font-bold text-white capitalize" style={{ fontWeight: 700 }}>{pollenData.pollen.dominant_type} Pollen</div>
                    </div>

                    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm rounded-lg sm:rounded-xl p-4 border border-white/10">
                      <div className="text-xs sm:text-sm text-blue-200/70 mb-1 font-medium" style={{ fontWeight: 500 }}>Location</div>
                      <div className="text-base sm:text-lg font-bold text-white truncate" style={{ fontWeight: 700 }}>{pollenData.location.city}</div>
                      <div className="text-[10px] sm:text-xs text-blue-300/60 mt-1 font-medium" style={{ fontWeight: 500 }}>{pollenData.location.lat.toFixed(2)}°N, {pollenData.location.lon.toFixed(2)}°E</div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-600/15 to-cyan-600/15 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 border border-blue-500/25">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs sm:text-sm text-blue-100" style={{ fontWeight: 400 }}>
                          <strong className="text-white font-bold">Health Tip:</strong> {getHealthTip(pollenData.pollen.risk_level)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== 7-DAY FORECAST - Responsive ==================== */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/25 via-cyan-600/20 to-indigo-600/25 rounded-2xl sm:rounded-3xl blur-xl opacity-60" />
              <div className="relative bg-white/[0.06] backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border border-blue-500/20 shadow-2xl shadow-blue-900/20">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-5 sm:mb-7 flex items-center gap-2 sm:gap-3" style={{ fontWeight: 700 }}>
                  <Calendar className="w-6 h-7 sm:w-7 sm:h-7 text-cyan-400 drop-shadow-lg" />
                  7-Day Pollen Forecast
                </h3>

                {/* Desktop: Grid View */}
                <div className="hidden md:grid grid-cols-7 gap-3 sm:gap-4">
                  {pollenData.forecast.map((day, index) => (
                    <div key={index} className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 border transition-all duration-300 hover:scale-105 hover:shadow-xl backdrop-blur-sm ${index === 0 ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/25 border-cyan-500/50 shadow-lg shadow-cyan-900/30' : 'bg-white/[0.06] border-blue-500/20 hover:border-cyan-400/40'}`}>
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-bold text-white mb-2 sm:mb-3.5" style={{ fontWeight: 700 }}>
                          {index === 0 ? 'Today' : formatDate(day.date)}
                        </div>

                        <div className="mb-2 sm:mb-3.5">
                          <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-sm ${getRiskColor(day.risk)}`} style={{ fontWeight: 700 }}>
                            {day.risk}
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2.5 text-left">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-blue-200/70 flex items-center gap-1 font-medium">
                              <Flower2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />G
                            </span>
                            <span className="text-white font-bold" style={{ fontWeight: 700 }}>{day.grass}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-blue-200/70 flex items-center gap-1 font-medium">
                              <TreePine className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />T
                            </span>
                            <span className="text-white font-bold" style={{ fontWeight: 700 }}>{day.tree}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-blue-200/70 flex items-center gap-1 font-medium">
                              <Wind className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />W
                            </span>
                            <span className="text-white font-bold" style={{ fontWeight: 700 }}>{day.weed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile: Horizontal Scroll View */}
                <div className="md:hidden -mx-2 px-2">
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {pollenData.forecast.map((day, index) => (
                      <div key={index} className={`flex-shrink-0 w-28 xs:w-32 rounded-xl p-4 border transition-all duration-300 snap-center backdrop-blur-sm ${index === 0 ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/25 border-cyan-500/50 shadow-lg' : 'bg-white/[0.06] border-blue-500/20'}`}>
                        <div className="text-center">
                          <div className="text-xs font-bold text-white mb-2" style={{ fontWeight: 700 }}>
                            {index === 0 ? 'Today' : formatDate(day.date).split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-blue-200/60 mb-2">
                            {index === 0 ? '' : formatDate(day.date).split(', ')[1]}
                          </div>

                          <div className="mb-3">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getRiskColor(day.risk)}`} style={{ fontWeight: 700 }}>
                              {day.risk}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <div className="flex items-center justify-between text-[10px]">
                              <Flower2 className="w-3 h-3 text-green-400" />
                              <span className="text-white font-bold" style={{ fontWeight: 700 }}>{day.grass}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <TreePine className="w-3 h-3 text-emerald-400" />
                              <span className="text-white font-bold" style={{ fontWeight: 700 }}>{day.tree}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <Wind className="w-3 h-3 text-yellow-400" />
                              <span className="text-white font-bold" style={{ fontWeight: 700 }}>{day.weed}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scroll Indicator Dots */}
                  <div className="flex justify-center mt-3 gap-1.5">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== DETAILED BREAKDOWN CARDS - Fully Responsive ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
              {[
                { type: 'Grass', Icon: Flower2, color: '#22c55e', colorLight: '#4ade80', colorDark: '#16a34a' },
                { type: 'Tree', Icon: TreePine, color: '#10b981', colorLight: '#34d399', colorDark: '#059669' },
                { type: 'Weed', Icon: Wind, color: '#eab308', colorLight: '#facc15', colorDark: '#ca8a04' }
              ].map(({ type, Icon, color, colorLight, colorDark }) => {
                // ✅ Get value with explicit number type - NO RED LINES!
                const pollenValue: number = Number(pollenData.pollen[`${type.toLowerCase()}_pollen` as keyof typeof pollenData.pollen] ?? 0);

                const maxVal: number = type === 'Weed' ? 80 : 100;
                const percentage: number = Math.min((pollenValue / maxVal) * 100, 100);

                return (
                  <div key={type} className="relative group">
                    {/* Background Glow */}
                    <div
                      className="absolute inset-0 rounded-2xl sm:rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                      style={{
                        background: `linear-gradient(to bottom right, ${color}40, ${colorDark}30)`
                      }}
                    />

                    {/* Main Card */}
                    <div
                      className="relative bg-white/[0.06] backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 border border-blue-500/20 hover:border-opacity-60 transition-all duration-300 shadow-xl shadow-blue-900/20 active:scale-[0.98]"
                      style={{ '--hover-border': colorLight } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${colorLight}99`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${color}40, ${colorDark}25)`,
                            borderColor: `${color}50`
                          }}
                        >
                          <Icon
                            className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
                            style={{ color: colorLight }}
                          />
                        </div>

                        <div>
                          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white" style={{ fontWeight: 700 }}>
                            {type} Pollen
                          </h3>
                          <p className="text-[10px] sm:text-xs sm:text-sm text-blue-200/70 font-medium" style={{ fontWeight: 500 }}>
                            {type === 'Grass' ? 'Poaceae family' : type === 'Tree' ? 'Various species' : 'Ragweed, etc.'}
                          </p>
                        </div>
                      </div>

                      {/* Value Display */}
                      <div
                        className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2 sm:mb-3"
                        style={{
                          fontWeight: 900,
                          color: colorLight
                        }}
                      >
                        {pollenValue}
                        <span className="text-sm sm:text-base lg:text-xl text-blue-200/60 font-semibold">/m³</span>
                      </div>

                      {/* ✅ FIXED PROGRESS BAR */}
                      <div
                        className="w-full rounded-full h-2 sm:h-3 mt-3 sm:mt-4 overflow-hidden backdrop-blur-sm"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <div
                          className="h-2 sm:h-3 rounded-full transition-all duration-1000 shadow-lg"
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(to right, ${color}, ${colorLight}, ${colorLight})`,
                            boxShadow: `0 0 20px ${color}80`
                          }}
                        />
                      </div>

                      {/* Description */}
                      <p className="text-[10px] sm:text-xs sm:text-sm text-blue-200/60 mt-3 sm:mt-4 font-medium leading-relaxed" style={{ fontWeight: 500 }}>
                        {type === 'Grass' ? 'Peaks during late spring and summer months' :
                          type === 'Tree' ? 'Highest in early spring (March-May)' :
                            'Prevalent in late summer and fall'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer - Responsive */}
      <footer className="relative z-10 mt-10 sm:mt-12 lg:mt-16 py-6 sm:py-8 border-t border-blue-500/20 text-center backdrop-blur-sm px-4">
        <p className="text-xs sm:text-sm sm:text-base text-blue-200/70 font-medium mb-2" style={{ fontWeight: 500 }}>
          Pollen data is simulated based on seasonal patterns and geographic location.
        </p>
        <p className="text-[10px] sm:text-xs sm:text-sm text-blue-200/50" style={{ fontWeight: 400 }}>
          For clinical advice, please consult a healthcare professional.
        </p>
        <p className="text-[10px] sm:text-xs text-blue-300/40 mt-2">
          ⏰ Time provided by WorldTimeAPI • Updates every 60 seconds
        </p>
      </footer>


      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        /* Remove tap highlight on mobile */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.08); }
          66% { transform: translate(25px, -25px) scale(0.92); }
        }
        
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          25% { transform: translateY(-100px) translateX(50px); opacity: 0.7; }
          50% { transform: translateY(-200px) translateX(-30px); opacity: 0.5; }
          75% { transform: translateY(-150px) translateX(60px); opacity: 0.6; }
        }
        
        @keyframes slide-right-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes slide-down {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .animate-orb-float-1 { animation: orb-float-1 20s ease-in-out infinite; }
        .animate-orb-float-2 { animation: orb-float-2 25s ease-in-out infinite; }
        .animate-orb-pulse { animation: orb-pulse 8s ease-in-out infinite; }
        .animate-particle-float { animation: particle-float linear infinite; }
        .animate-slide-right-fast { animation: slide-right-fast 3s linear infinite; }
        .animate-slide-down { animation: slide-down 0.3s ease-out forwards; }
        .bg-radial-vignette { background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%); }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide { 
          -ms-overflow-style: none; 
          scrollbar-width: none; 
        }
        
        /* Smooth scroll behavior */
        html { scroll-behavior: smooth; }
        
        /* Better font rendering */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
}

function getHealthTip(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case 'low': return 'Allergy symptoms are unlikely. Great day for outdoor activities!';
    case 'moderate': return 'Mild symptoms possible for sensitive individuals. Consider keeping windows closed.';
    case 'high': return 'Symptoms likely for many people. Limit outdoor time and use antihistamines if needed.';
    case 'very high': return 'Severe allergic reactions possible. Stay indoors, use air purifiers, and consult a doctor.';
    default: return 'Monitor symptoms and take precautions as needed.';
  }
}