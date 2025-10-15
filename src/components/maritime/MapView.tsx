import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface MapViewProps {
  currentPosition: [number, number] | null;
  destination: [number, number] | null;
  onMapReady?: (map: mapboxgl.Map) => void;
}

const MapView: React.FC<MapViewProps> = ({ currentPosition, destination, onMapReady }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const currentMarker = useRef<mapboxgl.Marker | null>(null);
  const destMarker = useRef<mapboxgl.Marker | null>(null);
  const routeLine = useRef<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const initializeMap = () => {
    if (!mapContainer.current || !apiKey) return;

    mapboxgl.accessToken = apiKey;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: currentPosition || [39.0, 21.5], // Default to Red Sea
      zoom: 8,
      pitch: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      setIsMapInitialized(true);
      if (onMapReady && map.current) {
        onMapReady(map.current);
      }
    });
  };

  useEffect(() => {
    if (isMapInitialized && currentPosition && map.current) {
      if (currentMarker.current) {
        currentMarker.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-accent rounded-full border-2 border-background shadow-glow-accent';
      
      currentMarker.current = new mapboxgl.Marker(el)
        .setLngLat([currentPosition[0], currentPosition[1]])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>⚓ موقعك الحالي</strong>'))
        .addTo(map.current);

      map.current.flyTo({
        center: [currentPosition[0], currentPosition[1]],
        zoom: 10,
        duration: 2000
      });
    }
  }, [currentPosition, isMapInitialized]);

  useEffect(() => {
    if (isMapInitialized && destination && map.current) {
      if (destMarker.current) {
        destMarker.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-destructive rounded-full border-2 border-background shadow-glow';
      
      destMarker.current = new mapboxgl.Marker(el)
        .setLngLat([destination[0], destination[1]])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>🎯 الوجهة</strong>'))
        .addTo(map.current);
    }
  }, [destination, isMapInitialized]);

  useEffect(() => {
    if (isMapInitialized && currentPosition && destination && map.current) {
      if (routeLine.current) {
        map.current.removeLayer(routeLine.current);
        map.current.removeSource(routeLine.current);
      }

      const lineId = 'route-line-' + Date.now();
      routeLine.current = lineId;

      map.current.addSource(lineId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [currentPosition[0], currentPosition[1]],
              [destination[0], destination[1]]
            ]
          }
        }
      });

      map.current.addLayer({
        id: lineId,
        type: 'line',
        source: lineId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'hsl(var(--primary))',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([currentPosition[0], currentPosition[1]]);
      bounds.extend([destination[0], destination[1]]);
      
      map.current.fitBounds(bounds, { padding: 100, duration: 2000 });
    }
  }, [currentPosition, destination, isMapInitialized]);

  return (
    <div className="relative w-full h-full">
      {!isMapInitialized && (
        <Card className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 m-4 bg-card/95 backdrop-blur">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-2xl font-bold text-foreground">🧭 نظام الخرائط الملاحية</h2>
            <p className="text-muted-foreground">
              للبدء، أدخل مفتاح Mapbox API الخاص بك
            </p>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="أدخل Mapbox Access Token"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-center"
              />
              <Button onClick={initializeMap} className="w-full" disabled={!apiKey}>
                تفعيل الخريطة
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              احصل على مفتاح مجاني من{' '}
              <a 
                href="https://account.mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
        </Card>
      )}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default MapView;
