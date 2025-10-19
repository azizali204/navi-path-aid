import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ship as ShipIcon, Target, Layers, Eye, EyeOff } from 'lucide-react';
import MaritimeShipMarkers from '@/components/maritime/MaritimeShipMarkers';
import MaritimeFilters from '@/components/maritime/MaritimeFilters';
import OperationZoneEditor from '@/components/maritime/OperationZoneEditor';
import ZoneTracker from '@/components/maritime/ZoneTracker';
import { useToast } from '@/components/ui/use-toast';

export interface Ship {
  mmsi: number;
  lat: number;
  lon: number;
  cog: number;
  sog: number;
  type?: number;
  name?: string;
  timestamp?: string;
}

export interface OperationZone {
  center: [number, number];
  radius: number;
}

const Maritime = () => {
  const { toast } = useToast();
  const [ships, setShips] = useState<Map<number, Ship>>(new Map());
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [filters, setFilters] = useState({ types: [], minSpeed: 0, maxSpeed: 50 });
  const [operationZone, setOperationZone] = useState<OperationZone>(() => {
    const saved = localStorage.getItem('operation_zone');
    return saved ? JSON.parse(saved) : { center: [15.9, 44.0], radius: 50000 };
  });
  const [tracking, setTracking] = useState(false);
  const [layersVisible, setLayersVisible] = useState({ ships: true, zone: true, seamarks: true });

  const connectWebSocket = useCallback(() => {
    const projectId = 'mvtowcdrwyzbcmwpuppl';
    const wsUrl = `wss://${projectId}.functions.supabase.co/functions/v1/ais-stream`;
    
    console.log('Attempting to connect to:', wsUrl);
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('Connected to AIS stream');
      setConnected(true);
      toast({
        title: "متصل",
        description: "تم الاتصال ببث السفن بنجاح",
      });
    };
    
    socket.onmessage = (event) => {
      try {
        const ship: Ship = JSON.parse(event.data);
        if (ship.mmsi && ship.lat && ship.lon) {
          setShips(prev => {
            const updated = new Map(prev);
            updated.set(ship.mmsi, ship);
            return updated;
          });
        }
      } catch (error) {
        console.error('Error parsing ship data:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Don't show toast on every error to avoid spam
    };
    
    socket.onclose = (event) => {
      console.log('Disconnected from AIS stream. Code:', event.code, 'Reason:', event.reason);
      setConnected(false);
      setWs(null);
      
      // Only show error toast if not a normal closure
      if (event.code !== 1000) {
        toast({
          title: "انقطع الاتصال",
          description: "سيتم إعادة المحاولة تلقائياً...",
          variant: "destructive",
        });
      }
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
    
    setWs(socket);
  }, [toast]);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('operation_zone', JSON.stringify(operationZone));
  }, [operationZone]);

  const filteredShips = Array.from(ships.values()).filter(ship => {
    if (filters.types.length > 0 && ship.type && !filters.types.includes(ship.type)) {
      return false;
    }
    if (ship.sog < filters.minSpeed || ship.sog > filters.maxSpeed) {
      return false;
    }
    return true;
  });

  const renderMapChildren = () => (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {layersVisible.seamarks ? (
        <TileLayer
          url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
          attribution='Marine: <a href="http://www.openseamap.org">OpenSeaMap</a>'
        />
      ) : null}
      {layersVisible.ships ? (
        <MaritimeShipMarkers ships={filteredShips} />
      ) : null}
      {layersVisible.zone ? (
        <Circle
          center={operationZone.center as LatLngExpression}
          radius={operationZone.radius}
          pathOptions={{
            color: tracking ? '#ef4444' : '#3b82f6',
            fillColor: tracking ? '#ef4444' : '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            className: tracking ? 'animate-pulse' : ''
          }}
        />
      ) : null}
    </>
  );

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b p-2 sm:p-4 flex items-center justify-between gap-2 sm:gap-4 z-10">
        <div className="flex items-center gap-2">
          <ShipIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-2xl font-bold">خريطة حركة السفن البحرية</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "متصل" : "غير متصل"}
          </Badge>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {filteredShips.length} سفينة
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r bg-background overflow-y-auto">
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="filters" className="text-xs sm:text-sm">
                <Target className="h-4 w-4 ml-1" />
                فلترة
              </TabsTrigger>
              <TabsTrigger value="zone" className="text-xs sm:text-sm">
                <Layers className="h-4 w-4 ml-1" />
                المنطقة
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-xs sm:text-sm">
                <Eye className="h-4 w-4 ml-1" />
                الطبقات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="p-3 sm:p-4">
              <MaritimeFilters filters={filters} onFiltersChange={setFilters} />
            </TabsContent>

            <TabsContent value="zone" className="p-3 sm:p-4">
              <OperationZoneEditor 
                zone={operationZone} 
                onZoneChange={setOperationZone}
              />
              <ZoneTracker
                tracking={tracking}
                onTrackingChange={setTracking}
                zone={operationZone}
                ships={filteredShips}
              />
            </TabsContent>

            <TabsContent value="layers" className="p-3 sm:p-4">
              <div className="space-y-3">
                <h3 className="font-semibold mb-2">طبقات الخريطة</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">السفن</span>
                  <Button
                    variant={layersVisible.ships ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLayersVisible(prev => ({ ...prev, ships: !prev.ships }))}
                  >
                    {layersVisible.ships ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">منطقة التشغيل</span>
                  <Button
                    variant={layersVisible.zone ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLayersVisible(prev => ({ ...prev, zone: !prev.zone }))}
                  >
                    {layersVisible.zone ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">العلامات البحرية</span>
                  <Button
                    variant={layersVisible.seamarks ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLayersVisible(prev => ({ ...prev, seamarks: !prev.seamarks }))}
                  >
                    {layersVisible.seamarks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[15.9, 44.0]}
            zoom={7}
            className="w-full h-full"
            zoomControl={true}
          >
            {renderMapChildren as unknown as React.ReactNode}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Maritime;
