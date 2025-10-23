import { Card } from "@/components/ui/card";
import { MapPin, Compass } from "lucide-react";

interface CoordinateDisplayProps {
  lat: number;
  lng: number;
  depth?: number;
}

export const CoordinateDisplay = ({ lat, lng, depth }: CoordinateDisplayProps) => {
  const formatCoordinate = (value: number, isLat: boolean) => {
    const direction = isLat 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    const absValue = Math.abs(value);
    const degrees = Math.floor(absValue);
    const minutes = ((absValue - degrees) * 60).toFixed(3);
    return `${degrees}° ${minutes}' ${direction}`;
  };

  return (
    <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3" dir="rtl">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <div className="flex gap-3">
            <div className="font-mono text-xs">{formatCoordinate(lat, true)}</div>
            <div className="font-mono text-xs">{formatCoordinate(lng, false)}</div>
          </div>
        </div>
        
        {depth !== undefined && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" />
              <div className="font-mono text-xs font-semibold">
                {depth > 0 ? `${depth}m` : 'N/A'}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
