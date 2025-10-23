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
    <Card className="absolute bottom-4 left-4 z-[500] bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3" dir="rtl">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <div>
            <div className="font-mono">{formatCoordinate(lat, true)}</div>
            <div className="font-mono">{formatCoordinate(lng, false)}</div>
          </div>
        </div>
        
        {depth !== undefined && (
          <>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-xs text-muted-foreground">العمق</div>
                <div className="font-mono font-semibold">{depth > 0 ? `${depth}m` : 'غير متوفر'}</div>
              </div>
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground">
          <div>خط العرض: {lat.toFixed(6)}</div>
          <div>خط الطول: {lng.toFixed(6)}</div>
        </div>
      </div>
    </Card>
  );
};
