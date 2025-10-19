import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { DivIcon, LatLngExpression } from 'leaflet';
import type { Ship } from '@/pages/Maritime';

interface MaritimeShipMarkersProps {
  ships: Ship[];
}

const getShipColor = (type?: number) => {
  if (!type) return '#64748b'; // gray
  
  // Ship type categories
  if (type >= 30 && type <= 39) return '#ef4444'; // Fishing - red
  if (type >= 40 && type <= 49) return '#f59e0b'; // High speed craft - orange
  if (type >= 50 && type <= 59) return '#10b981'; // Pilot vessel - green
  if (type >= 60 && type <= 69) return '#3b82f6'; // Passenger - blue
  if (type >= 70 && type <= 79) return '#8b5cf6'; // Cargo - purple
  if (type >= 80 && type <= 89) return '#ec4899'; // Tanker - pink
  
  return '#64748b'; // Other - gray
};

const getShipTypeName = (type?: number) => {
  if (!type) return 'غير معروف';
  
  if (type >= 30 && type <= 39) return 'سفينة صيد';
  if (type >= 40 && type <= 49) return 'سفينة سريعة';
  if (type >= 50 && type <= 59) return 'سفينة إرشاد';
  if (type >= 60 && type <= 69) return 'سفينة ركاب';
  if (type >= 70 && type <= 79) return 'سفينة شحن';
  if (type >= 80 && type <= 89) return 'ناقلة';
  
  return 'أخرى';
};

const createShipIcon = (ship: Ship) => {
  const color = getShipColor(ship.type);
  const rotation = ship.cog || 0;
  
  return new DivIcon({
    html: `
      <div style="transform: rotate(${rotation}deg); transform-origin: center;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1">
          <path d="M12 2 L4 22 L12 18 L20 22 Z" />
        </svg>
      </div>
    `,
    className: 'ship-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const MaritimeShipMarkers: React.FC<MaritimeShipMarkersProps> = ({ ships }) => {
  return (
    <>
      {ships.map((ship) => (
        <Marker
          key={ship.mmsi}
          position={[ship.lat, ship.lon] as LatLngExpression}
          icon={createShipIcon(ship)}
        >
          <Popup>
            <div className="text-sm space-y-1 min-w-[200px]">
              <div className="font-bold text-base border-b pb-1 mb-2">
                {ship.name || `MMSI: ${ship.mmsi}`}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">MMSI:</span>
                <span className="font-mono">{ship.mmsi}</span>
                
                <span className="text-muted-foreground">النوع:</span>
                <span>{getShipTypeName(ship.type)}</span>
                
                <span className="text-muted-foreground">السرعة:</span>
                <span>{ship.sog.toFixed(1)} عقدة</span>
                
                <span className="text-muted-foreground">الاتجاه:</span>
                <span>{ship.cog.toFixed(0)}°</span>
                
                <span className="text-muted-foreground">الموقع:</span>
                <span className="text-xs font-mono col-span-1">
                  {ship.lat.toFixed(4)}°, {ship.lon.toFixed(4)}°
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default MaritimeShipMarkers;
