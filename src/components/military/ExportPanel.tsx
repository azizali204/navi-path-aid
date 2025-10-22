import { Button } from "@/components/ui/button";
import { FileImage, Presentation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import { MilitarySymbolIcons } from "@/components/military/MilitarySymbolIcons";
import mapboxgl from "mapbox-gl";
import pptxgen from "pptxgenjs";

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
  const iconCache = useRef<Record<string, HTMLImageElement>>({});
  const customIconCache = useRef<Record<string, HTMLImageElement>>({});

  const getSeverityColor = (sev?: string) => {
    switch (sev) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const getIconForMarker = async (m: MarkerData): Promise<HTMLImageElement> => {
    // أيقونة مخصصة محفوظة في localStorage
    if (m.icon && m.icon.startsWith('custom_')) {
      if (customIconCache.current[m.icon]) return customIconCache.current[m.icon];
      try {
        const customIcons = JSON.parse(localStorage.getItem('customIcons') || '[]');
        const found = customIcons.find((ci: any) => ci.id === m.icon);
        if (found?.dataUrl) {
          const img = await loadImage(found.dataUrl);
          customIconCache.current[m.icon] = img;
          return img;
        }
      } catch {}
    }

    // أيقونات SVG المعرفة في النظام
    const key = (m.icon as keyof typeof MilitarySymbolIcons) || 'default';
    if (iconCache.current[key]) return iconCache.current[key];
    const svg = (MilitarySymbolIcons as any)[key] || MilitarySymbolIcons.default;
    const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    iconCache.current[key] = img;
    return img;
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



  const exportPPTX = async () => {
    if (!map || markers.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "جاري التصدير...",
        description: "يتم إنشاء عرض PowerPoint",
      });

      // إنشاء عرض تقديمي جديد
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_16x9";
      pptx.author = "النظام البحري العسكري";
      pptx.title = "تقرير الخريطة العسكرية";

      // الشريحة 1: العنوان
      const slideTitle = pptx.addSlide();
      slideTitle.background = { color: "1e3a8a" };
      slideTitle.addText("تقرير الخريطة العسكرية", {
        x: 1,
        y: 2.5,
        w: 8,
        h: 1,
        fontSize: 44,
        bold: true,
        color: "FFFFFF",
        align: "center",
      });
      slideTitle.addText(`عدد الرموز: ${markers.length}`, {
        x: 1,
        y: 3.7,
        w: 8,
        h: 0.5,
        fontSize: 24,
        color: "cbd5e1",
        align: "center",
      });
      slideTitle.addText(`تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}`, {
        x: 1,
        y: 4.3,
        w: 8,
        h: 0.5,
        fontSize: 18,
        color: "94a3b8",
        align: "center",
      });

      // الشريحة 2: صورة الخريطة
      // حفظ العرض الحالي
      const originalCenter = map.getCenter();
      const originalZoom = map.getZoom();
      const originalPitch = map.getPitch();
      const originalBearing = map.getBearing();

      // حساب الحدود لجميع النقاط
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(m => bounds.extend([m.lng, m.lat]));
      
      // ضبط الخريطة لتشمل جميع الرموز
      map.fitBounds(bounds, { 
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        pitch: 0,
        bearing: 0,
        maxZoom: 8,
        animate: false
      });

      // انتظار استقرار الخريطة
      await new Promise<void>((resolve) => {
        map.once('idle', () => {
          setTimeout(() => resolve(), 800);
        });
      });

      // التقاط صورة الخريطة
      const baseCanvas: HTMLCanvasElement = map.getCanvas();
      const mapImageData = baseCanvas.toDataURL('image/png', 0.9);

      const slideMap = pptx.addSlide();
      slideMap.addText("الخريطة العسكرية", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: "1e3a8a",
        align: "center",
      });
      slideMap.addImage({
        data: mapImageData,
        x: 0.5,
        y: 1,
        w: 9,
        h: 4.5,
      });

      // إعادة العرض الأصلي
      map.flyTo({
        center: originalCenter,
        zoom: originalZoom,
        pitch: originalPitch,
        bearing: originalBearing,
        animate: false
      });

      // الشريحة 3: إحصائيات
      const slideStats = pptx.addSlide();
      slideStats.addText("الإحصائيات", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: "1e3a8a",
      });

      // حساب الإحصائيات
      const typeCount: Record<string, number> = {};
      const severityCount: Record<string, number> = {};
      markers.forEach(m => {
        typeCount[m.type] = (typeCount[m.type] || 0) + 1;
        if (m.severity) {
          severityCount[m.severity] = (severityCount[m.severity] || 0) + 1;
        }
      });

      const statsRows = [
        [
          { text: "النوع", options: { bold: true, color: "1e3a8a", fontSize: 16 } },
          { text: "العدد", options: { bold: true, color: "1e3a8a", fontSize: 16 } },
        ],
        ...Object.entries(typeCount).map(([type, count]) => [
          { text: type, options: { fontSize: 14 } },
          { text: count.toString(), options: { fontSize: 14 } },
        ]),
      ];

      slideStats.addTable(statsRows, {
        x: 1,
        y: 1.2,
        w: 4,
        h: 3,
        border: { pt: 1, color: "cbd5e1" },
        fill: { color: "f8fafc" },
      });

      const severityRows = [
        [
          { text: "مستوى الأهمية", options: { bold: true, color: "1e3a8a", fontSize: 16 } },
          { text: "العدد", options: { bold: true, color: "1e3a8a", fontSize: 16 } },
        ],
        ...Object.entries(severityCount).map(([severity, count]) => [
          { text: severity === "high" ? "عالي" : severity === "medium" ? "متوسط" : "منخفض", options: { fontSize: 14 } },
          { text: count.toString(), options: { fontSize: 14 } },
        ]),
      ];

      slideStats.addTable(severityRows, {
        x: 5.5,
        y: 1.2,
        w: 4,
        h: 3,
        border: { pt: 1, color: "cbd5e1" },
        fill: { color: "f8fafc" },
      });

      // الشريحة 4: جدول البيانات (أول 50 نقطة)
      const slideData = pptx.addSlide();
      slideData.addText("تفاصيل الرموز", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 28,
        bold: true,
        color: "1e3a8a",
      });

      const dataRows = [
        [
          { text: "الاسم", options: { bold: true, color: "1e3a8a", fontSize: 12 } },
          { text: "النوع", options: { bold: true, color: "1e3a8a", fontSize: 12 } },
          { text: "الوصف", options: { bold: true, color: "1e3a8a", fontSize: 12 } },
          { text: "الموقع", options: { bold: true, color: "1e3a8a", fontSize: 12 } },
        ],
        ...markers.slice(0, 50).map(m => [
          { text: m.name_ar, options: { fontSize: 10 } },
          { text: m.type, options: { fontSize: 10 } },
          { text: m.description_ar.substring(0, 50), options: { fontSize: 10 } },
          { text: `${m.lat.toFixed(2)}, ${m.lng.toFixed(2)}`, options: { fontSize: 10 } },
        ]),
      ];

      slideData.addTable(dataRows, {
        x: 0.5,
        y: 1,
        w: 9,
        h: 4.3,
        border: { pt: 1, color: "cbd5e1" },
        fill: { color: "ffffff" },
        fontSize: 10,
      });

      if (markers.length > 50) {
        slideData.addText(`عرض أول 50 رمز من إجمالي ${markers.length}`, {
          x: 0.5,
          y: 5.4,
          w: 9,
          h: 0.3,
          fontSize: 12,
          color: "64748b",
          align: "center",
          italic: true,
        });
      }

      // حفظ الملف
      await pptx.writeFile({ fileName: `military-map-${Date.now()}.pptx` });

      toast({
        title: "تم التصدير ✓",
        description: `تم حفظ العرض التقديمي مع ${markers.length} رمز`,
      });
    } catch (error) {
      console.error("خطأ في تصدير PPTX:", error);
      toast({
        title: "خطأ",
        description: "فشل تصدير العرض التقديمي",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 sm:gap-2 justify-start h-8 sm:h-9 text-xs sm:text-sm"
        onClick={exportSVG}
        disabled={markers.length === 0}
      >
        <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        SVG
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 sm:gap-2 justify-start h-8 sm:h-9 text-xs sm:text-sm"
        onClick={exportPPTX}
        disabled={!map || markers.length === 0}
      >
        <Presentation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">عرض PowerPoint</span>
        <span className="sm:hidden">PPTX</span>
      </Button>
      
      {markers.length === 0 && !map && (
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 text-center">
          أضف نقاطاً للتصدير
        </p>
      )}
    </div>
  );
};