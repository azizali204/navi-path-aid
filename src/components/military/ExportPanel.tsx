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





  const exportPNG = async () => {
    if (!map) {
      toast({
        title: "خطأ",
        description: "الخريطة غير جاهزة",
        variant: "destructive",
      });
      return;
    }

    if (markers.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد نقاط للتصدير",
        variant: "destructive",
      });
      return;
    }

    // حفظ العرض الحالي خارج try للوصول إليه في catch
    const originalCenter = map.getCenter();
    const originalZoom = map.getZoom();
    const originalPitch = map.getPitch();
    const originalBearing = map.getBearing();

    try {
      toast({
        title: "جاري التصدير...",
        description: "يتم إنشاء صورة خريطة العالم مع جميع الرموز",
      });

      // ضبط الخريطة لعرض العالم كاملاً 2D
      map.flyTo({
        center: [0, 20], // مركز العالم
        zoom: 1.5, // زوم لعرض العالم كاملاً
        pitch: 0, // بدون ميل (2D)
        bearing: 0, // بدون دوران
        duration: 0,
        animate: false
      });

      // انتظار استقرار الخريطة
      await new Promise<void>((resolve) => {
        map.once('idle', () => {
          setTimeout(() => resolve(), 1000); // وقت أطول للتأكد من تحميل خريطة العالم
        });
      });

      // الحصول على canvas الخريطة الأساسية
      const baseCanvas: HTMLCanvasElement = map.getCanvas();
      const container: HTMLDivElement = map.getContainer();
      
      // معامل تكبير لزيادة جودة الصورة (2x للجودة العالية)
      const scaleFactor = 2;
      
      // إنشاء canvas جديد بحجم أكبر للجودة العالية
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = baseCanvas.width * scaleFactor;
      outputCanvas.height = baseCanvas.height * scaleFactor;
      const ctx = outputCanvas.getContext('2d', { alpha: false });
      
      if (!ctx) {
        throw new Error('فشل في إنشاء السياق');
      }

      // تحسين جودة الرسم
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // 1. رسم الخريطة الأساسية أولاً بحجم مكبر
      ctx.drawImage(baseCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

      // حساب النسبة بين CSS pixels و canvas pixels مع معامل التكبير
      const cssWidth = container.clientWidth || baseCanvas.width;
      const ratio = (baseCanvas.width / cssWidth) * scaleFactor;

      // 2. تحميل ورسم الأيقونات فوق الخريطة
      const iconSizeCss = 32;
      const iconSize = iconSizeCss * ratio;
      const ringRadius = 20 * ratio;
      const ringFillRadius = 18 * ratio;

      for (const marker of markers) {
        try {
          // حساب موقع الأيقونة على الخريطة
          const point = map.project({ lng: marker.lng, lat: marker.lat });
          const x = point.x * ratio;
          const y = point.y * ratio;

          // تخطي الأيقونات خارج حدود الخريطة
          if (x < -50 || y < -50 || x > outputCanvas.width + 50 || y > outputCanvas.height + 50) {
            continue;
          }

          // رسم خلفية دائرية خفيفة
          ctx.beginPath();
          ctx.arc(x, y, ringFillRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(37, 99, 235, 0.13)';
          ctx.fill();

          // رسم إطار دائري حسب مستوى الأهمية
          ctx.beginPath();
          ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
          ctx.lineWidth = 3 * ratio;
          ctx.strokeStyle = getSeverityColor(marker.severity);
          ctx.shadowBlur = 10 * ratio;
          ctx.shadowColor = getSeverityColor(marker.severity);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // رسم الأيقونة
          const iconImage = await getIconForMarker(marker);
          ctx.drawImage(
            iconImage,
            x - iconSize / 2,
            y - iconSize / 2,
            iconSize,
            iconSize
          );
        } catch (error) {
          console.error('خطأ في رسم الأيقونة:', marker.id, error);
        }
      }

      // 3. تصدير الصورة النهائية
      outputCanvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "خطأ",
            description: "فشل في إنشاء الصورة",
            variant: "destructive",
          });
          // إعادة العرض الأصلي
          map.flyTo({
            center: originalCenter,
            zoom: originalZoom,
            pitch: originalPitch,
            bearing: originalBearing,
            animate: false
          });
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `world-map-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        // إعادة العرض الأصلي
        map.flyTo({
          center: originalCenter,
          zoom: originalZoom,
          pitch: originalPitch,
          bearing: originalBearing,
          duration: 1000
        });

        toast({
          title: "تم التصدير ✓",
          description: `تم حفظ خريطة العالم مع ${markers.length} رمز`,
        });
      }, 'image/png', 0.95);

    } catch (error) {
      console.error('خطأ في التصدير:', error);
      
      // إعادة العرض الأصلي في حالة الخطأ
      try {
        map.flyTo({
          center: originalCenter,
          zoom: originalZoom,
          pitch: originalPitch,
          bearing: originalBearing,
          animate: false
        });
      } catch (e) {
        console.error('خطأ في إعادة العرض:', e);
      }
      
      toast({
        title: "خطأ",
        description: "فشل تصدير الصورة",
        variant: "destructive",
      });
    }
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
        onClick={exportPNG}
        disabled={!map || markers.length === 0}
      >
        <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        PNG
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