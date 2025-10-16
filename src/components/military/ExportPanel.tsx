import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, FileCode, FileImage, Shapes, Camera, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

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

  const exportSVG = () => {
    const width = 1920;
    const height = 1080;
    const padding = 100;

    // حساب الحدود للنقاط
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    markers.forEach(m => {
      minLat = Math.min(minLat, m.lat);
      maxLat = Math.max(maxLat, m.lat);
      minLng = Math.min(minLng, m.lng);
      maxLng = Math.max(maxLng, m.lng);
    });

    // إضافة هامش
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;
    minLat -= latRange * 0.1;
    maxLat += latRange * 0.1;
    minLng -= lngRange * 0.1;
    maxLng += lngRange * 0.1;

    // دالة لتحويل الإحداثيات إلى نقاط SVG
    const latLngToSVG = (lat: number, lng: number) => {
      const x = padding + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * padding);
      const y = height - padding - ((lat - minLat) / (maxLat - minLat)) * (height - 2 * padding);
      return { x, y };
    };

    const severityColors: { [key: string]: string } = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    };

    // إنشاء SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .marker-text { font-family: Arial, sans-serif; font-size: 14px; fill: white; }
      .title-text { font-family: Arial, sans-serif; font-size: 24px; fill: white; font-weight: bold; }
      .coord-text { font-family: monospace; font-size: 10px; fill: #999; }
    </style>
  </defs>
  
  <!-- خلفية -->
  <rect width="${width}" height="${height}" fill="#0a1929"/>
  
  <!-- شبكة الإحداثيات -->
  <g opacity="0.2">`;

    // خطوط الشبكة
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding);
      const y = padding + (i / 10) * (height - 2 * padding);
      svg += `
    <line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" stroke="#444" stroke-width="1"/>
    <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#444" stroke-width="1"/>`;
    }

    svg += `
  </g>
  
  <!-- العنوان -->
  <text x="${width / 2}" y="50" text-anchor="middle" class="title-text">خريطة بحرية عسكرية</text>
  
  <!-- النقاط -->
  <g>`;

    markers.forEach(marker => {
      const { x, y } = latLngToSVG(marker.lat, marker.lng);
      const color = severityColors[marker.severity || 'low'];
      
      svg += `
    <g>
      <!-- دائرة النقطة -->
      <circle cx="${x}" cy="${y}" r="8" fill="${color}" opacity="0.3"/>
      <circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="white" stroke-width="2"/>
      
      <!-- اسم النقطة -->
      <text x="${x}" y="${y - 15}" text-anchor="middle" class="marker-text">${marker.name_ar}</text>
      
      <!-- الإحداثيات -->
      <text x="${x}" y="${y + 25}" text-anchor="middle" class="coord-text">${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}</text>
    </g>`;
    });

    svg += `
  </g>
  
  <!-- مفتاح الألوان -->
  <g transform="translate(${width - 200}, ${height - 150})">
    <rect width="180" height="120" fill="rgba(0,0,0,0.8)" rx="8"/>
    <text x="90" y="25" text-anchor="middle" class="marker-text" font-weight="bold">مستوى الأهمية</text>
    
    <circle cx="30" cy="50" r="6" fill="#10b981"/>
    <text x="50" y="55" class="marker-text">منخفض</text>
    
    <circle cx="30" cy="75" r="6" fill="#f59e0b"/>
    <text x="50" y="80" class="marker-text">متوسط</text>
    
    <circle cx="30" cy="100" r="6" fill="#ef4444"/>
    <text x="50" y="105" class="marker-text">عالي</text>
  </g>
  
  <!-- تفاصيل الخريطة -->
  <text x="20" y="${height - 20}" class="coord-text">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</text>
  <text x="${width - 20}" y="${height - 20}" text-anchor="end" class="coord-text">عدد النقاط: ${markers.length}</text>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naval-map-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: "تم تصدير الخريطة بصيغة SVG",
    });
  };

  const exportVector = () => {
    // تصدير بصيغة vector متقدمة (KML/KMZ format)
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>خريطة بحرية عسكرية</name>
    <description>نقاط مخصصة تم تصديرها من نظام الخرائط البحرية</description>
    
    <!-- أنماط النقاط -->
    <Style id="severity-low">
      <IconStyle>
        <color>ff81c910</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    <Style id="severity-medium">
      <IconStyle>
        <color>ff0b9ef5</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    <Style id="severity-high">
      <IconStyle>
        <color>ff4444ef</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
`;

    markers.forEach(marker => {
      kml += `    <Placemark>
      <name>${marker.name_ar}</name>
      <description><![CDATA[
        <h3>${marker.name_ar}</h3>
        <p><strong>النوع:</strong> ${marker.type}</p>
        ${marker.description_ar ? `<p><strong>الوصف:</strong> ${marker.description_ar}</p>` : ''}
        <p><strong>الإحداثيات:</strong> ${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}</p>
        <p><strong>الأهمية:</strong> ${marker.severity || 'low'}</p>
      ]]></description>
      <styleUrl>#severity-${marker.severity || 'low'}</styleUrl>
      <Point>
        <coordinates>${marker.lng},${marker.lat},0</coordinates>
      </Point>
    </Placemark>
`;
    });

    kml += `  </Document>
</kml>`;

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naval-map-${Date.now()}.kml`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: "تم تصدير الخريطة بصيغة KML (Vector)",
    });
  };

  const exportImage = async () => {
    if (!map) {
      toast({
        title: "خطأ",
        description: "الخريطة غير جاهزة",
        variant: "destructive",
      });
      return;
    }

    try {
      // التقاط الخريطة الأساسية
      map.once('render', () => {
        const canvas = map.getCanvas();
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `naval-map-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);

          toast({
            title: "تم التصدير ✓",
            description: "تم حفظ صورة الخريطة. للحصول على الأيقونات، استخدم أداة لقطة الشاشة (Print Screen)",
          });
        });
      });
      
      map.triggerRepaint();
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "خطأ",
        description: "فشل تصدير الصورة",
        variant: "destructive",
      });
    }
  };

  const startRecording = () => {
    if (!map) {
      toast({
        title: "خطأ",
        description: "الخريطة غير جاهزة",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = map.getCanvas();
      const stream = canvas.captureStream(30); // 30 FPS
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `naval-map-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "تم التسجيل ✓",
          description: "تم حفظ فيديو الخريطة. للحصول على الأيقونات، استخدم برنامج تسجيل شاشة",
        });
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      toast({
        title: "بدأ التسجيل",
        description: "جاري تسجيل الخريطة... (حرك الخريطة لتسجيل حركتها)",
      });
    } catch (error) {
      console.error('خطأ في بدء التسجيل:', error);
      toast({
        title: "خطأ",
        description: "فشل بدء التسجيل",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
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
        onClick={exportSVG}
        disabled={markers.length === 0}
      >
        <FileImage className="w-4 h-4" />
        SVG
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 justify-start"
        onClick={exportVector}
        disabled={markers.length === 0}
      >
        <Shapes className="w-4 h-4" />
        Vector (KML)
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

      <Button
        variant="outline"
        size="sm"
        className="gap-2 justify-start"
        onClick={exportImage}
        disabled={!map}
      >
        <Camera className="w-4 h-4" />
        صورة PNG
      </Button>

      <Button
        variant={isRecording ? "destructive" : "outline"}
        size="sm"
        className="gap-2 justify-start"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!map}
      >
        <Video className="w-4 h-4" />
        {isRecording ? "إيقاف التسجيل" : "تسجيل فيديو"}
      </Button>
      
      {markers.length === 0 && !map && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          أضف نقاطاً للتصدير
        </p>
      )}
    </div>
  );
};