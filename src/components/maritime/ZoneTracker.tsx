import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, X } from 'lucide-react';
import { Ship, OperationZone } from '@/pages/Maritime';
import { useToast } from '@/components/ui/use-toast';

interface ZoneTrackerProps {
  tracking: boolean;
  onTrackingChange: (tracking: boolean) => void;
  zone: OperationZone;
  ships: Ship[];
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const ZoneTracker: React.FC<ZoneTrackerProps> = ({ tracking, onTrackingChange, zone, ships }) => {
  const { toast } = useToast();
  const [shipsInZone, setShipsInZone] = useState<Ship[]>([]);
  const [newEntries, setNewEntries] = useState<Ship[]>([]);
  const prevShipsInZoneRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!tracking) return;

    const currentShipsInZone = ships.filter(ship => {
      const distance = calculateDistance(
        zone.center[0],
        zone.center[1],
        ship.lat,
        ship.lon
      );
      return distance <= zone.radius;
    });

    setShipsInZone(currentShipsInZone);

    // Detect new entries
    const currentMMSIs = new Set(currentShipsInZone.map(s => s.mmsi));
    const prevMMSIs = prevShipsInZoneRef.current;

    const newShips = currentShipsInZone.filter(ship => !prevMMSIs.has(ship.mmsi));
    
    if (newShips.length > 0) {
      setNewEntries(prev => [...newShips, ...prev].slice(0, 5)); // Keep last 5 entries
      
      newShips.forEach(ship => {
        toast({
          title: "🚢 سفينة جديدة في المنطقة",
          description: `${ship.name || `MMSI: ${ship.mmsi}`} - السرعة: ${ship.sog.toFixed(1)} عقدة`,
          duration: 5000,
        });
      });
    }

    prevShipsInZoneRef.current = currentMMSIs;
  }, [tracking, ships, zone, toast]);

  const clearEntry = (mmsi: number) => {
    setNewEntries(prev => prev.filter(s => s.mmsi !== mmsi));
  };

  return (
    <div className="space-y-4 mt-6 pt-6 border-t">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" />
          تتبع المنطقة
        </h3>
        <Button
          variant={tracking ? "destructive" : "default"}
          size="sm"
          onClick={() => {
            onTrackingChange(!tracking);
            if (!tracking) {
              setNewEntries([]);
              prevShipsInZoneRef.current = new Set();
            }
          }}
        >
          {tracking ? "إيقاف التتبع" : "بدء التتبع"}
        </Button>
      </div>

      {tracking && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">السفن في المنطقة:</span>
            <Badge variant="default">{shipsInZone.length}</Badge>
          </div>

          {newEntries.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <span className="text-sm font-medium text-destructive">تنبيهات حديثة:</span>
              {newEntries.map((ship) => (
                <div
                  key={ship.mmsi}
                  className="flex items-center justify-between bg-destructive/10 p-2 rounded-md animate-in fade-in slide-in-from-right"
                >
                  <div className="text-sm">
                    <div className="font-medium">{ship.name || `MMSI: ${ship.mmsi}`}</div>
                    <div className="text-xs text-muted-foreground">
                      {ship.sog.toFixed(1)} عقدة • {ship.cog.toFixed(0)}°
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearEntry(ship.mmsi)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {tracking && newEntries.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              جارٍ المراقبة... سيتم التنبيه عند دخول سفن جديدة
            </p>
          )}
        </Card>
      )}

      {!tracking && (
        <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-md">
          <p>🎯 عند تفعيل التتبع:</p>
          <ul className="list-disc list-inside space-y-1 mr-2">
            <li>مراقبة مستمرة لحدود المنطقة</li>
            <li>تنبيه فوري عند دخول سفن جديدة</li>
            <li>وميض بصري لحدود المنطقة</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ZoneTracker;
