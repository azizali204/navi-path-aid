import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MilitarySymbolIcons } from "./MilitarySymbolIcons";
import { MapControls } from "./MapControls";
import { MapLegend } from "./MapLegend";
import { SearchPanel } from "./SearchPanel";
import { AddMarkerDialog } from "./AddMarkerDialog";
import { MarkersTable } from "./MarkersTable";
import { ExportPanel } from "./ExportPanel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Save, Plus, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// DEMO: قم بوضع رمز Mapbox الخاص بك هنا
// في الإنتاج: استخدم رمز خادم آمن أو Proxy
const MAPBOX_ACCESS_TOKEN = 'REPLACE_WITH_YOUR_MAPBOX_TOKEN';

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
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<{ [key: string]: L.LayerGroup }>({});
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
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
  }, []);

  // حفظ النقاط المخصصة في LocalStorage
  useEffect(() => {
    if (customMarkers.length > 0) {
      localStorage.setItem('navmap_points_v1', JSON.stringify(customMarkers));
    }
  }, [customMarkers]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // تحميل المركز والزوم من LocalStorage
    const savedView = localStorage.getItem('naval-map-view');
    let center: [number, number] = [21.5433, 39.1520]; // Jeddah/Red Sea
    let zoom = 11;

    if (savedView) {
      const parsed = JSON.parse(savedView);
      center = [parsed.lat, parsed.lng];
      zoom = parsed.zoom;
    }

    // تهيئة الخريطة
    map.current = L.map(mapContainer.current, {
      center,
      zoom,
      zoomControl: false,
    });

    // إضافة طبقة Mapbox
    const tileUrl = MAPBOX_ACCESS_TOKEN.startsWith('REPLACE') 
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

    L.tileLayer(tileUrl, {
      attribution: MAPBOX_ACCESS_TOKEN.startsWith('REPLACE')
        ? '&copy; OpenStreetMap'
        : '&copy; Mapbox &copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map.current);

    // إضافة عناصر التحكم
    L.control.zoom({ position: 'bottomleft' }).addTo(map.current);
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(map.current);

    // تحديث الإحداثيات عند تحريك الخريطة
    map.current.on('move', () => {
      if (map.current) {
        const center = map.current.getCenter();
        setCoordinates({ lat: center.lat, lng: center.lng });
      }
    });

    // النقر على الخريطة لالتقاط الإحداثيات
    map.current.on('click', (e: L.LeafletMouseEvent) => {
      if (pickingCoordinates) {
        setTempCoordinates([e.latlng.lat, e.latlng.lng]);
        toast({
          title: "تم التقاط الإحداثيات",
          description: `Lat: ${e.latlng.lat.toFixed(6)}, Lng: ${e.latlng.lng.toFixed(6)}`,
        });
      }
    });

    // تحميل البيانات من GeoJSON
    fetch('/data/markers.geojson')
      .then(res => res.json())
      .then(data => {
        setAllMarkers(data.features);
        renderMarkers(data.features, customMarkers);
      })
      .catch(err => {
        console.error('خطأ في تحميل البيانات:', err);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "تعذر تحميل الرموز العسكرية",
          variant: "destructive",
        });
      });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // تحديث العرض عند تغيير النقاط المخصصة
  useEffect(() => {
    if (map.current && allMarkers.length > 0) {
      renderMarkers(allMarkers, customMarkers);
    }
  }, [customMarkers, activeCategories]);

  const renderMarkers = (features: MarkerFeature[], custom: MarkerData[] = []) => {
    if (!map.current) return;

    // مسح الطبقات القديمة
    Object.values(markersLayer.current).forEach(layer => {
      map.current?.removeLayer(layer);
    });
    markersLayer.current = {};

    // إنشاء طبقة لكل نوع - من GeoJSON
    features.forEach((feature) => {
      const { type, name_ar, description_ar, icon, severity } = feature.properties;
      const [lng, lat] = feature.geometry.coordinates;

      if (!markersLayer.current[type]) {
        markersLayer.current[type] = L.layerGroup();
        if (activeCategories.has(type)) {
          markersLayer.current[type].addTo(map.current!);
        }
      }

      const iconHtml = MilitarySymbolIcons[icon as keyof typeof MilitarySymbolIcons] || MilitarySymbolIcons['default'];
      const severityColor = severity === 'high' ? 'border-red-500' : severity === 'medium' ? 'border-yellow-500' : 'border-green-500';
      
      const divIcon = L.divIcon({
        html: `<div class="${severityColor} border-2 rounded-full p-1 bg-background">${iconHtml}</div>`,
        className: 'military-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lng], { icon: divIcon });
      
      marker.bindPopup(`
        <div dir="rtl" class="text-right p-2">
          <h3 class="font-bold text-lg mb-2">${name_ar}</h3>
          <p class="text-sm text-gray-600 mb-1"><strong>النوع:</strong> ${type}</p>
          <p class="text-sm mb-3">${description_ar}</p>
          <button 
            onclick="console.log('إضافة إلى المسار:', '${name_ar}')"
            class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            إضافة إلى المسار
          </button>
        </div>
      `);

      marker.addTo(markersLayer.current[type]);
    });

    // إضافة النقاط المخصصة
    custom.forEach((marker) => {
      const type = marker.type;

      if (!markersLayer.current[type]) {
        markersLayer.current[type] = L.layerGroup();
        if (activeCategories.has(type)) {
          markersLayer.current[type].addTo(map.current!);
        }
      }

      const iconHtml = MilitarySymbolIcons[marker.icon as keyof typeof MilitarySymbolIcons] || MilitarySymbolIcons['default'];
      const severityColor = marker.severity === 'high' ? 'border-red-500' : marker.severity === 'medium' ? 'border-yellow-500' : 'border-green-500';
      
      const divIcon = L.divIcon({
        html: `<div class="${severityColor} border-2 rounded-full p-1 bg-background"><div class="bg-primary/20 rounded-full p-1">${iconHtml}</div></div>`,
        className: 'military-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: divIcon });
      
      leafletMarker.bindPopup(`
        <div dir="rtl" class="text-right p-2">
          <h3 class="font-bold text-lg mb-2">${marker.name_ar} <span class="text-xs text-primary">(مخصص)</span></h3>
          <p class="text-sm text-gray-600 mb-1"><strong>النوع:</strong> ${marker.type}</p>
          <p class="text-sm mb-3">${marker.description_ar}</p>
          <button 
            onclick="console.log('إضافة إلى المسار:', '${marker.name_ar}')"
            class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            إضافة إلى المسار
          </button>
        </div>
      `);

      leafletMarker.addTo(markersLayer.current[type]);
    });
  };

  const toggleCategory = (category: string) => {
    const newCategories = new Set(activeCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
      if (markersLayer.current[category]) {
        map.current?.removeLayer(markersLayer.current[category]);
      }
    } else {
      newCategories.add(category);
      if (markersLayer.current[category]) {
        markersLayer.current[category].addTo(map.current!);
      }
    }
    setActiveCategories(newCategories);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      renderMarkers(allMarkers);
      return;
    }

    const filtered = allMarkers.filter(marker => 
      marker.properties.name_ar.includes(term) ||
      marker.properties.description_ar.includes(term)
    );
    renderMarkers(filtered);

    if (filtered.length > 0 && map.current) {
      const [lng, lat] = filtered[0].geometry.coordinates;
      map.current.setView([lat, lng], 13);
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
      map.current.setView([lat, lng], 15, { animate: true });
    }
  };

  const handlePickCoordinates = () => {
    setPickingCoordinates(!pickingCoordinates);
    if (pickingCoordinates) {
      setTempCoordinates(null);
    }
  };

  return (
    <div className="relative h-screen w-full" dir="rtl">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* شريط البحث */}
      <SearchPanel onSearch={handleSearch} searchTerm={searchTerm} />

      {/* عناصر التحكم */}
      <MapControls 
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
      />

      {/* المفتاح */}
      <MapLegend />

      {/* أزرار التحكم العلوية */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <Button onClick={handleAddMarker} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة نقطة
        </Button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Database className="w-4 h-4" />
              إدارة النقاط ({customMarkers.length})
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-4xl overflow-y-auto" dir="rtl">
            <SheetHeader>
              <SheetTitle>إدارة النقاط المخصصة</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <MarkersTable
                markers={customMarkers}
                onEdit={handleEditMarker}
                onDelete={handleDeleteMarker}
                onFocus={handleFocusMarker}
              />
              
              <ExportPanel
                markers={customMarkers}
                map={map.current}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Button onClick={saveView} variant="outline" className="gap-2">
          <Save className="w-4 h-4" />
          حفظ العرض
        </Button>
      </div>

      {/* شريط الإحداثيات */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-card/95 backdrop-blur px-4 py-2 rounded-lg border border-border">
        <div className="text-sm font-mono text-foreground" dir="ltr">
          Lat: {coordinates.lat.toFixed(4)}° | Lng: {coordinates.lng.toFixed(4)}°
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
        .military-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        ${pickingCoordinates ? `
        .leaflet-container {
          cursor: crosshair !important;
        }
        ` : ''}
      `}</style>
    </div>
  );
};
