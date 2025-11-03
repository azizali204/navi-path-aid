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
    <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] bg-transparent backdrop-blur-sm shadow-sm border-[#0066cc]/20" dir="rtl">
      <div className="flex items-center gap-3 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-[#66b3ff]" />
          <div className="flex gap-2">
            <div className="font-mono text-[10px] text-white/90">{formatCoordinate(lat, true)}</div>
            <div className="font-mono text-[10px] text-white/90">{formatCoordinate(lng, false)}</div>
          </div>
        </div>
        
        {depth !== undefined && (
          <>
            <div className="h-4 w-px bg-[#0066cc]/30" />
            <div className="flex items-center gap-1.5 bg-[#0066cc]/10 px-2 py-0.5 rounded">
              <Compass className="w-3 h-3 text-[#66b3ff]" />
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-sm font-bold text-white/90">{depth > 0 ? depth : '--'}</span>
                <span className="text-[10px] text-[#66b3ff]/80">متر</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
