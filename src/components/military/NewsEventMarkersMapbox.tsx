import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface NewsEvent {
  title: string;
  description: string;
  date: string;
  lat: number;
  lon: number;
  severity: 'high' | 'medium' | 'low';
  type: string;
}

interface NewsEventMarkersMapboxProps {
  events: NewsEvent[];
  map: mapboxgl.Map | null;
}

export const NewsEventMarkersMapbox = ({ events, map }: NewsEventMarkersMapboxProps) => {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // إزالة العلامات القديمة
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // إضافة العلامات الجديدة
    events.forEach((event) => {
      const severityColor = 
        event.severity === 'high' ? '#dc2626' : 
        event.severity === 'medium' ? '#f59e0b' : 
        '#10b981';

      const el = document.createElement('div');
      el.className = 'news-event-marker';
      el.innerHTML = `
        <div style="
          background-color: ${severityColor};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div dir="rtl" style="text-align: right; min-width: 200px;">
            <div style="display: flex; align-items: start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
              <h3 style="font-weight: bold; font-size: 15px; margin: 0;">${event.title}</h3>
              <span style="
                font-size: 11px; 
                padding: 2px 8px; 
                border-radius: 4px;
                white-space: nowrap;
                background-color: ${severityColor}22;
                color: ${severityColor};
                font-weight: 600;
              ">
                ${event.severity === 'high' ? 'عالي' : event.severity === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
            </div>
            <p style="font-size: 13px; color: #666; margin-bottom: 8px;">${event.description}</p>
            <div style="font-size: 12px; color: #888;">
              <div style="margin-bottom: 4px;">📅 ${new Date(event.date).toLocaleDateString('ar-SA')}</div>
              <div style="margin-bottom: 4px;">📍 ${event.lat.toFixed(4)}, ${event.lon.toFixed(4)}</div>
              <div style="
                margin-top: 8px; 
                padding: 6px 8px; 
                background-color: #f3f4f6; 
                border-radius: 4px;
                font-weight: 500;
              ">
                ${event.type}
              </div>
            </div>
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([event.lon, event.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [events, map]);

  return null;
};
