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
    <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] bg-[#001a33]/95 backdrop-blur-sm shadow-lg border-[#0066cc]/30" dir="rtl">
      <div className="flex items-center gap-4 px-4 py-2.5 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#66b3ff]" />
          <div className="flex gap-3">
            <div className="font-mono text-xs text-white">{formatCoordinate(lat, true)}</div>
            <div className="font-mono text-xs text-white">{formatCoordinate(lng, false)}</div>
          </div>
        </div>
        
        {depth !== undefined && (
          <>
            <div className="h-6 w-px bg-[#0066cc]/50" />
            <div className="flex items-center gap-2 bg-[#0066cc]/20 px-3 py-1 rounded">
              <Compass className="w-4 h-4 text-[#66b3ff]" />
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-base font-bold text-white">{depth > 0 ? depth : '--'}</span>
                <span className="text-xs text-[#66b3ff]">متر</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
