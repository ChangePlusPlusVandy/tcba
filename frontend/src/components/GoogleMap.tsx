import { useEffect, useRef, useState } from 'react';

interface MapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  website?: string | null;
  logo?: string;
}

interface GoogleMapProps {
  apiKey: string;
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
}

const GoogleMap = ({
  apiKey,
  markers = [],
  center = { lat: 35.5175, lng: -86.5804 }, // Default to Tennessee center
  zoom = 7,
  height = '400px',
  className = '',
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    console.log('GoogleMap component mounted, checking for Google Maps API...');

    if (window.google?.maps) {
      console.log('✓ Google Maps already loaded');
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);

    if (existingScript) {
      console.log('✓ Google Maps script already in DOM, polling for API...');
      // Poll for Google Maps to be available (script might still be loading)
      const pollInterval = setInterval(() => {
        if (window.google?.maps) {
          console.log('✓ Google Maps API now available');
          clearInterval(pollInterval);
          setIsLoaded(true);
        }
      }, 100);

      // Cleanup polling on unmount
      return () => clearInterval(pollInterval);
    }

    console.log('Loading Google Maps API with key:', apiKey.substring(0, 10) + '...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✓ Google Maps API loaded successfully');
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.error('✗ Failed to load Google Maps API');
      setError('Failed to load Google Maps');
    };
    document.head.appendChild(script);

    // Don't cleanup - let the script persist across component remounts
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    console.log('Map initialization effect:', {
      isLoaded,
      hasMapRef: !!mapRef.current,
      hasMapInstance: !!mapInstanceRef.current,
    });

    if (!isLoaded || !mapRef.current) return;

    // Don't recreate map if it already exists
    if (mapInstanceRef.current) {
      console.log('✓ Map instance already exists, skipping recreation');
      return;
    }

    try {
      console.log('Creating Google Maps instance...');
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();
      console.log('✓ Map initialized successfully at center:', center, 'zoom:', zoom);
    } catch (err) {
      setError('Failed to initialize map');
      console.error('✗ Map initialization error:', err);
    }
  }, [isLoaded, center, zoom]);

  // Add markers
  useEffect(() => {
    console.log('Markers effect triggered:', {
      hasMap: !!mapInstanceRef.current,
      isLoaded,
      markersCount: markers.length,
      markers: markers.map(m => ({
        name: m.name,
        hasLogo: !!m.logo,
        lat: m.latitude,
        lng: m.longitude,
      })),
    });

    if (!mapInstanceRef.current || !isLoaded) {
      console.log('Map not ready - skipping marker creation');
      return;
    }

    console.log('✓ Map is ready! Adding', markers.length, 'markers...');

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      if (
        markerData.latitude === null ||
        markerData.longitude === null ||
        markerData.latitude === undefined ||
        markerData.longitude === undefined
      ) {
        return;
      }

      // Create marker with red circle icon
      const marker = new google.maps.Marker({
        position: { lat: markerData.latitude, lng: markerData.longitude },
        map: mapInstanceRef.current,
        title: markerData.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#D54242',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      console.log(
        'Created marker for:',
        markerData.name,
        'at',
        markerData.latitude,
        markerData.longitude
      );

      // Create info window content - only name and website link
      const infoContent = `
        <div style="padding: 12px; max-width: 280px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${markerData.name}</h3>
          ${markerData.website ? `<a href="${markerData.website}" target="_blank" rel="noopener noreferrer" style="color: #D54242; text-decoration: none; font-size: 14px; font-weight: 500;">Visit Website →</a>` : ''}
        </div>
      `;

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // Note: fitBounds disabled to allow manual zoom control
    // If you want auto-fit to show all markers, uncomment this:
    // if (markers.length > 0 && mapInstanceRef.current) {
    //   const bounds = new google.maps.LatLngBounds();
    //   markers.forEach((marker) => {
    //     if (
    //       marker.latitude !== null &&
    //       marker.longitude !== null &&
    //       marker.latitude !== undefined &&
    //       marker.longitude !== undefined
    //     ) {
    //       bounds.extend({ lat: marker.latitude, lng: marker.longitude });
    //     }
    //   });
    //   mapInstanceRef.current.fitBounds(bounds);
    //
    //   // Ensure we don't zoom in too much if there's only one marker
    //   const listener = google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
    //     const currentZoom = mapInstanceRef.current?.getZoom();
    //     if (currentZoom && currentZoom > 15) {
    //       mapInstanceRef.current?.setZoom(15);
    //     }
    //   });
    // }
  }, [isLoaded, markers]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className='text-red-600'>{error}</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} className={`rounded-lg ${className}`} style={{ height, width: '100%' }} />
  );
};

export default GoogleMap;
