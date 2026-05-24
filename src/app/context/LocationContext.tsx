// src/contexts/LocationContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface Location {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

interface LocationContextType {
  currentLocation: Location | null;
  setLocation: (location: Location) => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem('weather_location');
    if (saved) {
      try {
        setCurrentLocation(JSON.parse(saved));
      } catch (e) {
        // Set default if nothing saved
        setCurrentLocation({
          name: 'New York, NY',
          lat: 40.7128,
          lon: -74.0060,
          country: 'US',
          state: 'NY'
        });
      }
    } else {
      // Default location
      setCurrentLocation({
        name: 'New York, NY',
        lat: 40.7128,
        lon: -74.0060,
        country: 'US',
        state: 'NY'
      });
    }
  }, []);

  // Save to localStorage when changes
  useEffect(() => {
    if (currentLocation) {
      localStorage.setItem('weather_location', JSON.stringify(currentLocation));
    }
  }, [currentLocation]);

  const setLocation = useCallback((location: Location) => {
    setIsLoading(true);
    setCurrentLocation(location);
    setTimeout(() => setIsLoading(false), 500); // Simulate loading
  }, []);

  return (
    <LocationContext.Provider value={{
      currentLocation,
      setLocation,
      isLoading
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}