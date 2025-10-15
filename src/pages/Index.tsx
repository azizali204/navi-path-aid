import React, { useState } from 'react';
import MapView from '@/components/maritime/MapView';
import NavigationPanel from '@/components/maritime/NavigationPanel';
import VoyageHistory, { Voyage } from '@/components/maritime/VoyageHistory';
import { calculateDistance, calculateETA } from '@/utils/navigationCalc';
import { toast } from 'sonner';
import { Anchor } from 'lucide-react';

const Index = () => {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [voyages, setVoyages] = useState<Voyage[]>([]);

  const handlePositionSet = (lat: number, lon: number) => {
    setCurrentPosition([lon, lat]);
    toast.success('تم تحديد الموقع الحالي', {
      description: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
    });
  };

  const handleDestinationSet = (lat: number, lon: number) => {
    setDestination([lon, lat]);
    toast.success('تم تحديد الوجهة', {
      description: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
    });
  };

  const handleCalculateRoute = () => {
    if (!currentPosition || !destination) {
      toast.error('يرجى تحديد الموقع الحالي والوجهة أولاً');
      return;
    }

    const dist = calculateDistance(
      currentPosition[1],
      currentPosition[0],
      destination[1],
      destination[0]
    );

    const speed = 25; // Default speed in knots
    const calculatedEta = calculateETA(dist, speed);

    setDistance(dist);
    setEta(calculatedEta);

    toast.success('تم حساب المسار', {
      description: `المسافة: ${dist.toFixed(2)} كم - الوقت: ${calculatedEta}`,
    });
  };

  const handleSaveVoyage = () => {
    if (!currentPosition || !destination || distance === null || eta === null) {
      toast.error('لا يوجد مسار لحفظه');
      return;
    }

    const newVoyage: Voyage = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      from: { lat: currentPosition[1], lon: currentPosition[0] },
      to: { lat: destination[1], lon: destination[0] },
      distance,
      duration: eta,
    };

    const updatedVoyages = [newVoyage, ...voyages].slice(0, 5); // Keep only last 5
    setVoyages(updatedVoyages);
    
    // Save to localStorage
    localStorage.setItem('maritime-voyages', JSON.stringify(updatedVoyages));
    
    toast.success('تم حفظ الرحلة', {
      description: 'تم إضافة الرحلة إلى السجل',
    });
  };

  const handleDeleteVoyage = (id: string) => {
    const updatedVoyages = voyages.filter((v) => v.id !== id);
    setVoyages(updatedVoyages);
    localStorage.setItem('maritime-voyages', JSON.stringify(updatedVoyages));
    toast.success('تم حذف الرحلة');
  };

  const handleLoadVoyage = (voyage: Voyage) => {
    setCurrentPosition([voyage.from.lon, voyage.from.lat]);
    setDestination([voyage.to.lon, voyage.to.lat]);
    setDistance(voyage.distance);
    setEta(voyage.duration);
    toast.success('تم تحميل الرحلة');
  };

  // Load voyages from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('maritime-voyages');
    if (saved) {
      setVoyages(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Anchor className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">نظام الملاحة البحرية</h1>
                <p className="text-sm text-muted-foreground">Maritime Navigation System - MVP</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              {new Date().toLocaleString('ar-SA', { 
                dateStyle: 'short', 
                timeStyle: 'short' 
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 h-[600px]">
            <MapView
              currentPosition={currentPosition}
              destination={destination}
            />
          </div>

          {/* Navigation Panel */}
          <div className="lg:col-span-1">
            <NavigationPanel
              onPositionSet={handlePositionSet}
              onDestinationSet={handleDestinationSet}
              onCalculateRoute={handleCalculateRoute}
              onSaveVoyage={handleSaveVoyage}
              currentPosition={currentPosition}
              destination={destination}
              distance={distance}
              eta={eta}
            />
          </div>

          {/* Voyage History */}
          <div className="lg:col-span-1">
            <VoyageHistory
              voyages={voyages}
              onDeleteVoyage={handleDeleteVoyage}
              onLoadVoyage={handleLoadVoyage}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>⚓ نظام الخرائط الملاحية البحرية - MVP</p>
          <p className="mt-1 text-xs">للاستخدام الملاحي التجريبي فقط</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
