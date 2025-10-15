import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarkerData {
  id: number;
  name_ar: string;
  type: string;
  subtype: string;
  description_ar: string;
  icon: string;
  lat: number;
  lng: number;
  severity?: string;
}

interface ExportPanelProps {
  markers: MarkerData[];
  map: any;
}

export const ExportPanel = ({ markers, map }: ExportPanelProps) => {
  const { toast } = useToast();

  const exportGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      features: markers.map(marker => ({
        type: "Feature",
        properties: {
          id: marker.id,
          name_ar: marker.name_ar,
          type: marker.type,
          subtype: marker.subtype,
          description_ar: marker.description_ar,
          icon: marker.icon,
          severity: marker.severity
        },
        geometry: {
          type: "Point",
          coordinates: [marker.lng, marker.lat]
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naval-markers-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات بصيغة GeoJSON",
    });
  };

  const exportCSV = () => {
    const headers = ['الرقم', 'الاسم', 'النوع', 'خط العرض', 'خط الطول', 'الوصف', 'الأهمية'];
    const rows = markers.map(m => [
      m.id,
      m.name_ar,
      m.type,
      m.lat,
      m.lng,
      m.description_ar,
      m.severity || 'low'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add BOM for proper Arabic encoding
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naval-markers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات بصيغة CSV",
    });
  };


  const exportHTML = () => {
    // إنشاء ملف HTML مستقل
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>خريطة بحرية عسكرية</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        #map { height: 100vh; width: 100vw; }
        .military-marker { background: transparent; border: none; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // REPLACE_WITH_YOUR_MAPBOX_TOKEN
        const MAPBOX_ACCESS_TOKEN = 'REPLACE_WITH_YOUR_MAPBOX_TOKEN';
        
        const map = L.map('map').setView([21.5433, 39.1520], 11);
        
        const tileUrl = MAPBOX_ACCESS_TOKEN.startsWith('REPLACE') 
            ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            : \`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=\${MAPBOX_ACCESS_TOKEN}\`;
        
        L.tileLayer(tileUrl, {
            attribution: '© OpenStreetMap',
            maxZoom: 18,
        }).addTo(map);
        
        const markers = ${JSON.stringify(markers, null, 2)};
        
        markers.forEach(marker => {
            const icon = L.divIcon({
                html: '📍',
                className: 'military-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });
            
            L.marker([marker.lat, marker.lng], { icon })
                .bindPopup(\`
                    <div dir="rtl" style="text-align: right;">
                        <h3>\${marker.name_ar}</h3>
                        <p><strong>النوع:</strong> \${marker.type}</p>
                        <p>\${marker.description_ar}</p>
                    </div>
                \`)
                .addTo(map);
        });
    </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naval-map-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: "تم تصدير الخريطة كملف HTML مستقل",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 justify-start"
        onClick={exportGeoJSON}
        disabled={markers.length === 0}
      >
        <FileJson className="w-4 h-4" />
        GeoJSON
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 justify-start"
        onClick={exportCSV}
        disabled={markers.length === 0}
      >
        <FileSpreadsheet className="w-4 h-4" />
        CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 justify-start"
        onClick={exportHTML}
        disabled={markers.length === 0}
      >
        <FileCode className="w-4 h-4" />
        HTML
      </Button>
      
      {markers.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          أضف نقاطاً للتصدير
        </p>
      )}
    </div>
  );
};