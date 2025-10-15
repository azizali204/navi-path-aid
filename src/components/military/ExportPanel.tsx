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
    // Get current map state from localStorage
    const mapboxToken = localStorage.getItem('mapbox_token') || 'REPLACE_WITH_YOUR_MAPBOX_TOKEN';
    const center = map ? [map.getCenter().lat, map.getCenter().lng] : [21.5433, 39.1520];
    const zoom = map ? map.getZoom() : 11;

    // إنشاء ملف HTML مستقل محسّن للبوربوينت
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>خريطة بحرية عسكرية تفاعلية</title>
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0a1929;
            color: white;
        }
        #map { 
            height: 100vh; 
            width: 100vw; 
        }
        .mapboxgl-popup-content {
            background: rgba(10, 25, 41, 0.95);
            color: white;
            border-radius: 8px;
            padding: 12px;
            min-width: 200px;
        }
        .mapboxgl-popup-close-button {
            color: white;
            font-size: 20px;
        }
        .military-marker {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 50%;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .military-marker:hover {
            transform: scale(1.2);
        }
        .legend {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(10, 25, 41, 0.95);
            padding: 15px;
            border-radius: 8px;
            max-width: 250px;
            z-index: 1000;
        }
        .legend h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            border-bottom: 2px solid #1a73e8;
            padding-bottom: 5px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 5px 0;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="legend">
        <h3>دليل الرموز</h3>
        <div class="legend-item"><span style="color: #10b981;">●</span> منخفض</div>
        <div class="legend-item"><span style="color: #f59e0b;">●</span> متوسط</div>
        <div class="legend-item"><span style="color: #ef4444;">●</span> عالي</div>
    </div>
    <script>
        mapboxgl.accessToken = '${mapboxToken}';
        
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [${center[1]}, ${center[0]}],
            zoom: ${zoom},
            pitch: 0,
            bearing: 0
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-left');
        map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

        const markers = ${JSON.stringify(markers, null, 2)};
        
        const severityColors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };

        markers.forEach(marker => {
            const el = document.createElement('div');
            el.className = 'military-marker';
            el.style.border = \`2px solid \${severityColors[marker.severity || 'low']}\`;
            el.innerHTML = '📍';

            new mapboxgl.Marker(el)
                .setLngLat([marker.lng, marker.lat])
                .setPopup(
                    new mapboxgl.Popup({ offset: 25 })
                        .setHTML(\`
                            <div dir="rtl" style="text-align: right;">
                                <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">\${marker.name_ar}</h3>
                                <p style="margin: 4px 0; color: #aaa; font-size: 13px;"><strong>النوع:</strong> \${marker.type}</p>
                                \${marker.description_ar ? \`<p style="margin: 4px 0; font-size: 13px;">\${marker.description_ar}</p>\` : ''}
                                <p style="margin: 8px 0 0 0; font-size: 12px; color: #888;">
                                    📍 \${marker.lat.toFixed(4)}, \${marker.lng.toFixed(4)}
                                </p>
                            </div>
                        \`)
                )
                .addTo(map);
        });

        // Auto-fit to markers
        if (markers.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            markers.forEach(m => bounds.extend([m.lng, m.lat]));
            map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }
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
        HTML تفاعلي (بوربوينت)
      </Button>
      
      {markers.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          أضف نقاطاً للتصدير
        </p>
      )}
    </div>
  );
};