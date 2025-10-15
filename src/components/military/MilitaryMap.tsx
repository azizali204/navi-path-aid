import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MilitarySymbolIcons } from "./MilitarySymbolIcons";
import { MapControls } from "./MapControls";
import { MapLegend } from "./MapLegend";
import { SearchPanel } from "./SearchPanel";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
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
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
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
  const { toast } = useToast();

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

    // تحميل البيانات من GeoJSON
    fetch('/data/markers.geojson')
      .then(res => res.json())
      .then(data => {
        setAllMarkers(data.features);
        renderMarkers(data.features);
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

  const renderMarkers = (features: MarkerFeature[]) => {
    if (!map.current) return;

    // مسح الطبقات القديمة
    Object.values(markersLayer.current).forEach(layer => {
      map.current?.removeLayer(layer);
    });
    markersLayer.current = {};

    // إنشاء طبقة لكل نوع
    features.forEach((feature) => {
      const { type, name_ar, description_ar, icon } = feature.properties;
      const [lng, lat] = feature.geometry.coordinates;

      if (!markersLayer.current[type]) {
        markersLayer.current[type] = L.layerGroup();
        if (activeCategories.has(type)) {
          markersLayer.current[type].addTo(map.current!);
        }
      }

      const iconHtml = MilitarySymbolIcons[icon as keyof typeof MilitarySymbolIcons] || MilitarySymbolIcons['default'];
      const divIcon = L.divIcon({
        html: iconHtml,
        className: 'military-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
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

      {/* زر حفظ العرض */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Button onClick={saveView} className="gap-2">
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
      `}</style>
    </div>
  );
};
