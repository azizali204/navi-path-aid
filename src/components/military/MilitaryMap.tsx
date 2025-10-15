import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MilitarySymbolIcons } from "./MilitarySymbolIcons";
import { MapSidebar } from "./MapSidebar";
import { AddMarkerDialog } from "./AddMarkerDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// DEMO: قم بوضع رمز Mapbox الخاص بك هنا
// في الإنتاج: استخدم رمز خادم آمن أو Proxy

interface MarkerFeature {
  type: string;
  properties: {
    id: number;
    name_ar: string;
    type: string;
    subtype: string;
    description_ar: string;
    icon: string;
    severity?: 'low' | 'medium' | 'high';
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

interface MarkerData {
  id: number;
  name_ar: string;
  type: string;
  subtype: string;
  description_ar: string;
  icon: string;
  lat: number;
  lng: number;
  severity?: 'low' | 'medium' | 'high';
}

export const MilitaryMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker[] }>({});
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 21.5433, lng: 39.1520 });
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set([
    'ship', 'submarine', 'naval_base', 'port', 'defensive_line', 
    'watchtower', 'navigation_buoy', 'restricted_zone', 'anchor_point', 
    'helipad', 'minefield', 'barracks'
  ]));
  const [searchTerm, setSearchTerm] = useState("");
  const [allMarkers, setAllMarkers] = useState<MarkerFeature[]>([]);
  const [customMarkers, setCustomMarkers] = useState<MarkerData[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMarker, setEditingMarker] = useState<MarkerData | null>(null);
  const [pickingCoordinates, setPickingCoordinates] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<[number, number] | null>(null);
  const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/dark-v11');
  const { toast } = useToast();

  // تحميل النقاط المخصصة من LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('navmap_points_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomMarkers(parsed);
      } catch (error) {
        console.error('خطأ في تحميل النقاط المحفوظة:', error);
      }
    }
    
    // تحميل Mapbox token من LocalStorage
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
    }
  }, []);

  // حفظ النقاط المخصصة في LocalStorage
  useEffect(() => {
    if (customMarkers.length > 0) {
      localStorage.setItem('navmap_points_v1', JSON.stringify(customMarkers));
    }
  }, [customMarkers]);

  // تهيئة الخريطة عند توفر الـ token
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    // تحميل المركز والزوم من LocalStorage
    const savedView = localStorage.getItem('naval-map-view');
    let center: [number, number] = [39.1520, 21.5433]; // [lng, lat] for Mapbox
    let zoom = 11;

    if (savedView) {
      const parsed = JSON.parse(savedView);
      center = [parsed.lng, parsed.lat];
      zoom = parsed.zoom;
    }

    try {
      // تهيئة Mapbox
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center,
        zoom,
        pitch: 0,
      });

      // إضافة عناصر التحكم
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

      // تحديث الإحداثيات عند التحريك
      map.current.on('move', () => {
        if (map.current) {
          const center = map.current.getCenter();
          setCoordinates({ lat: center.lat, lng: center.lng });
        }
      });

      // النقر على الخريطة لالتقاط الإحداثيات
      map.current.on('click', (e) => {
        if (pickingCoordinates) {
          setTempCoordinates([e.lngLat.lat, e.lngLat.lng]);
          toast({
            title: "تم التقاط الإحداثيات",
            description: `Lat: ${e.lngLat.lat.toFixed(6)}, Lng: ${e.lngLat.lng.toFixed(6)}`,
          });
        }
      });

      map.current.on('load', () => {
        setIsMapReady(true);
        renderMarkers([], customMarkers);
      });

    } catch (error) {
      console.error('خطأ في تهيئة الخريطة:', error);
      toast({
        title: "خطأ",
        description: "تحقق من صحة رمز Mapbox",
        variant: "destructive",
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // تحديث العرض عند تغيير النقاط المخصصة
  useEffect(() => {
    if (map.current && isMapReady && allMarkers.length > 0) {
      renderMarkers(allMarkers, customMarkers);
    }
  }, [customMarkers, activeCategories, isMapReady]);

  const renderMarkers = (features: MarkerFeature[], custom: MarkerData[] = []) => {
    if (!map.current || !isMapReady) return;

    // مسح العلامات القديمة
    Object.values(markersRef.current).forEach(markers => {
      markers.forEach(m => m.remove());
    });
    markersRef.current = {};

    // إضافة النقاط المخصصة فقط
    custom.forEach((markerData) => {
      const type = markerData.type;

      if (!activeCategories.has(type)) return;

      if (!markersRef.current[type]) {
        markersRef.current[type] = [];
      }

      const iconHtml = MilitarySymbolIcons[markerData.icon as keyof typeof MilitarySymbolIcons] || MilitarySymbolIcons.default;
      const severityColor = markerData.severity === 'high' ? '#ef4444' : markerData.severity === 'medium' ? '#eab308' : '#22c55e';
      
      const el = document.createElement('div');
      el.className = 'marker-container';
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid ${severityColor};
          border-radius: 50%;
          background: #2563eb22;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 0 10px ${severityColor}44;
        ">
          ${iconHtml}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div dir="rtl" style="text-align: right; min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
              ${markerData.name_ar} 
              <span style="font-size: 12px; color: #3b82f6;">(مخصص)</span>
            </h3>
            <p style="font-size: 14px; color: #666; margin-bottom: 4px;"><strong>النوع:</strong> ${markerData.type}</p>
            <p style="font-size: 14px; margin-bottom: 12px;">${markerData.description_ar}</p>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button 
                class="edit-marker-btn-${markerData.id}"
                style="flex: 1; background: #3b82f6; color: white; padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;"
              >
                تعديل
              </button>
              <button 
                class="delete-marker-btn-${markerData.id}"
                style="flex: 1; background: #ef4444; color: white; padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;"
              >
                حذف
              </button>
            </div>
          </div>
        `);

      // إضافة event listeners بعد فتح الـ popup
      popup.on('open', () => {
        const editBtn = document.querySelector(`.edit-marker-btn-${markerData.id}`);
        const deleteBtn = document.querySelector(`.delete-marker-btn-${markerData.id}`);
        
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            handleEditMarker(markerData);
            popup.remove();
          });
        }
        
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            handleDeleteMarker(markerData.id);
            popup.remove();
          });
        }
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([markerData.lng, markerData.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current[type].push(marker);
    });
  };

  const toggleCategory = (category: string) => {
    const newCategories = new Set(activeCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setActiveCategories(newCategories);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      renderMarkers([], customMarkers);
      return;
    }

    const filtered = customMarkers.filter(marker => 
      marker.name_ar.includes(term) ||
      marker.description_ar.includes(term)
    );
    
    if (filtered.length > 0 && map.current) {
      map.current.flyTo({ center: [filtered[0].lng, filtered[0].lat], zoom: 13, duration: 2000 });
    }
  };

  const saveView = () => {
    if (map.current) {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      localStorage.setItem('naval-map-view', JSON.stringify({
        lat: center.lat,
        lng: center.lng,
        zoom
      }));
      toast({
        title: "تم حفظ العرض",
        description: "تم حفظ موضع الخريطة بنجاح",
      });
    }
  };

  const handleAddMarker = () => {
    setEditingMarker(null);
    setShowAddDialog(true);
  };

  const handleSaveMarker = (markerData: Omit<MarkerData, 'id'>) => {
    if (editingMarker) {
      // تحديث
      setCustomMarkers(prev => 
        prev.map(m => m.id === editingMarker.id ? { ...markerData, id: editingMarker.id } : m)
      );
      toast({
        title: "تم التحديث",
        description: "تم تحديث النقطة بنجاح",
      });
    } else {
      // إضافة جديد
      const newMarker: MarkerData = {
        ...markerData,
        id: Date.now(),
        lat: tempCoordinates?.[0] || markerData.lat,
        lng: tempCoordinates?.[1] || markerData.lng,
      };
      setCustomMarkers(prev => [...prev, newMarker]);
      toast({
        title: "تمت الإضافة",
        description: "تمت إضافة النقطة بنجاح",
      });
    }
    setPickingCoordinates(false);
    setTempCoordinates(null);
  };

  const handleEditMarker = (marker: MarkerData) => {
    setEditingMarker(marker);
    setShowAddDialog(true);
  };

  const handleDeleteMarker = (id: number) => {
    setCustomMarkers(prev => prev.filter(m => m.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف النقطة بنجاح",
    });
  };

  const handleFocusMarker = (lat: number, lng: number) => {
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 15, duration: 2000 });
    }
  };

  const changeMapStyle = (style: string) => {
    if (map.current) {
      map.current.setStyle(style);
      setMapStyle(style);
      
      // إعادة رسم النقاط بعد تحميل النمط الجديد
      map.current.once('style.load', () => {
        renderMarkers([], customMarkers);
      });
      
      toast({
        title: "تم تغيير نمط الخريطة",
        description: "تم تطبيق النمط الجديد بنجاح",
      });
    }
  };

  const handlePickCoordinates = () => {
    setPickingCoordinates(!pickingCoordinates);
    if (pickingCoordinates) {
      setTempCoordinates(null);
    }
  };

  // عرض نموذج إدخال الـ token إذا لم يتم إدخاله
  if (!mapboxToken) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background" dir="rtl">
        <Card className="p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4 text-center">رمز Mapbox مطلوب</h2>
          <p className="text-muted-foreground mb-6 text-center">
            للبدء، أدخل رمز Mapbox العام الخاص بك
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="token">Mapbox Public Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="pk.eyJ1..."
                dir="ltr"
                className="font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      setMapboxToken(value);
                      localStorage.setItem('mapbox_token', value);
                    }
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <p className="mb-2">للحصول على الرمز:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>انتقل إلى <a href="https://mapbox.com" target="_blank" className="text-primary hover:underline">mapbox.com</a></li>
                <li>سجل الدخول أو أنشئ حساباً</li>
                <li>انسخ الرمز العام (Public Token)</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex" dir="rtl">
      {/* القائمة الجانبية */}
      <MapSidebar
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        customMarkers={customMarkers}
        onAddMarker={handleAddMarker}
        onEditMarker={handleEditMarker}
        onDeleteMarker={handleDeleteMarker}
        onFocusMarker={handleFocusMarker}
        onSaveView={saveView}
        searchTerm={searchTerm}
        onSearch={handleSearch}
        map={map.current}
      />

      {/* الخريطة */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* عنصر تحكم نوع الخريطة */}
        <div className="absolute top-4 left-4 z-[10] bg-card/95 backdrop-blur rounded-lg border border-border shadow-lg">
          <div className="p-2 space-y-1">
            <button
              onClick={() => changeMapStyle('mapbox://styles/mapbox/satellite-v9')}
              className={`w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-right ${
                mapStyle === 'mapbox://styles/mapbox/satellite-v9' ? 'bg-accent' : ''
              }`}
              title="أقمار صناعية"
            >
              🛰️ أقمار صناعية
            </button>
            <button
              onClick={() => changeMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
              className={`w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-right ${
                mapStyle === 'mapbox://styles/mapbox/satellite-streets-v12' ? 'bg-accent' : ''
              }`}
              title="أقمار صناعية + شوارع"
            >
              🗺️ مختلط
            </button>
            <button
              onClick={() => changeMapStyle('mapbox://styles/mapbox/streets-v12')}
              className={`w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-right ${
                mapStyle === 'mapbox://styles/mapbox/streets-v12' ? 'bg-accent' : ''
              }`}
              title="شوارع"
            >
              📍 شوارع
            </button>
            <button
              onClick={() => changeMapStyle('mapbox://styles/mapbox/dark-v11')}
              className={`w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-right ${
                mapStyle === 'mapbox://styles/mapbox/dark-v11' ? 'bg-accent' : ''
              }`}
              title="داكن"
            >
              🌙 داكن
            </button>
            <button
              onClick={() => changeMapStyle('mapbox://styles/mapbox/light-v11')}
              className={`w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors text-right ${
                mapStyle === 'mapbox://styles/mapbox/light-v11' ? 'bg-accent' : ''
              }`}
              title="فاتح"
            >
              ☀️ فاتح
            </button>
          </div>
        </div>

        {/* شريط الإحداثيات */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[10] bg-card/95 backdrop-blur px-4 py-2 rounded-lg border border-border shadow-lg">
          <div className="text-sm font-mono text-foreground" dir="ltr">
            Lat: {coordinates.lat.toFixed(4)}° | Lng: {coordinates.lng.toFixed(4)}°
          </div>
        </div>
      </div>

      {/* مودال إضافة/تعديل نقطة */}
      <AddMarkerDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingMarker(null);
          setPickingCoordinates(false);
          setTempCoordinates(null);
        }}
        onSave={handleSaveMarker}
        initialData={editingMarker}
        pickingCoordinates={pickingCoordinates}
        onPickCoordinates={handlePickCoordinates}
      />

      <style>{`
        .mapboxgl-popup-content {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 8px;
          padding: 12px;
        }
        ${pickingCoordinates ? `
        .mapboxgl-canvas-container {
          cursor: crosshair !important;
        }
        ` : ''}
      `}</style>
    </div>
  );
};
