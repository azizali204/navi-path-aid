import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Navigation, Save, MapPin } from 'lucide-react';

interface NavigationPanelProps {
  onPositionSet: (lat: number, lon: number) => void;
  onDestinationSet: (lat: number, lon: number) => void;
  onCalculateRoute: () => void;
  onSaveVoyage: () => void;
  currentPosition: [number, number] | null;
  destination: [number, number] | null;
  distance: number | null;
  eta: string | null;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  onPositionSet,
  onDestinationSet,
  onCalculateRoute,
  onSaveVoyage,
  currentPosition,
  destination,
  distance,
  eta,
}) => {
  const [currentLat, setCurrentLat] = useState('');
  const [currentLon, setCurrentLon] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLon, setDestLon] = useState('');
  const [speed, setSpeed] = useState('25');

  const handleSetPosition = () => {
    const lat = parseFloat(currentLat);
    const lon = parseFloat(currentLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onPositionSet(lat, lon);
    }
  };

  const handleSetDestination = () => {
    const lat = parseFloat(destLat);
    const lon = parseFloat(destLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onDestinationSet(lat, lon);
    }
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCurrentLat(lat.toFixed(4));
          setCurrentLon(lon.toFixed(4));
          onPositionSet(lat, lon);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Card className="bg-card/95 backdrop-blur border-border shadow-lg">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Navigation className="w-5 h-5 text-primary" />
          لوحة الملاحة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Current Position */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">⚓ الموقع الحالي</Label>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleGetCurrentLocation}
              className="h-7 text-xs"
            >
              <MapPin className="w-3 h-3 mr-1" />
              GPS
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                step="0.0001"
                placeholder="خط العرض"
                value={currentLat}
                onChange={(e) => setCurrentLat(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Input
                type="number"
                step="0.0001"
                placeholder="خط الطول"
                value={currentLon}
                onChange={(e) => setCurrentLon(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <Button 
            onClick={handleSetPosition} 
            className="w-full"
            size="sm"
            disabled={!currentLat || !currentLon}
          >
            تحديد الموقع
          </Button>
        </div>

        {/* Destination */}
        <div className="space-y-3 pt-3 border-t border-border">
          <Label className="text-sm font-semibold text-foreground">🎯 الوجهة</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                step="0.0001"
                placeholder="خط العرض"
                value={destLat}
                onChange={(e) => setDestLat(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Input
                type="number"
                step="0.0001"
                placeholder="خط الطول"
                value={destLon}
                onChange={(e) => setDestLon(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <Button 
            onClick={handleSetDestination} 
            className="w-full"
            size="sm"
            disabled={!destLat || !destLon}
          >
            تحديد الوجهة
          </Button>
        </div>

        {/* Speed Input */}
        <div className="space-y-2 pt-3 border-t border-border">
          <Label className="text-sm font-semibold text-foreground">⚡ السرعة (عقدة)</Label>
          <Input
            type="number"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Calculate Button */}
        <Button 
          onClick={onCalculateRoute} 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!currentPosition || !destination}
        >
          <Calculator className="w-4 h-4 mr-2" />
          حساب المسار
        </Button>

        {/* Results */}
        {distance !== null && eta !== null && (
          <div className="space-y-3 pt-3 border-t border-border bg-secondary/30 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">المسافة:</span>
                <span className="text-lg font-bold text-accent">{distance.toFixed(2)} كم</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">المسافة البحرية:</span>
                <span className="text-lg font-bold text-accent">{(distance / 1.852).toFixed(2)} ميل بحري</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">الوقت المقدر:</span>
                <span className="text-lg font-bold text-primary">{eta}</span>
              </div>
            </div>
            <Button 
              onClick={onSaveVoyage} 
              variant="outline" 
              className="w-full mt-2"
            >
              <Save className="w-4 h-4 mr-2" />
              حفظ الرحلة
            </Button>
          </div>
        )}

        {/* Current Coordinates Display */}
        {currentPosition && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground text-center font-mono">
              <div>LAT: {currentPosition[1].toFixed(4)}°</div>
              <div>LON: {currentPosition[0].toFixed(4)}°</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NavigationPanel;
