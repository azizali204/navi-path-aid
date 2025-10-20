import { useMapEvents } from 'react-leaflet';
import type { OperationZone } from '@/pages/Maritime';

interface MapClickHandlerProps {
  enabled: boolean;
  onLocationSelect: (lat: number, lon: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ enabled, onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
};

export default MapClickHandler;
