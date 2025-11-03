import { Button } from "@/components/ui/button";
import { FileImage, Presentation, Globe, Box, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";
import { MilitarySymbolIcons } from "@/components/military/MilitarySymbolIcons";
import { AreaSelector } from "@/components/military/AreaSelector";
import mapboxgl from "mapbox-gl";
import pptxgen from "pptxgenjs";
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [selectedBounds, setSelectedBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

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

    // حفظ العرض الحالي
    const originalCenter = map.getCenter();
    const originalZoom = map.getZoom();
    const originalPitch = map.getPitch();
    const originalBearing = map.getBearing();

    try {
      toast({
        title: "جاري التصدير...",
        description: selectedBounds ? "يتم تصدير المنطقة المحددة" : "يتم إنشاء صورة الخريطة",
      });

      // ضبط الخريطة حسب المنطقة المحددة أو عرض كامل
      map.setPitch(0);
      map.setBearing(0);
      
      if (selectedBounds) {
        // Fit to selected bounds
        map.fitBounds([
          [selectedBounds.west, selectedBounds.south],
          [selectedBounds.east, selectedBounds.north]
        ], {
          padding: 20,
          duration: 0,
          animate: false
        });
      } else {
        map.flyTo({
          center: [0, 20],
          zoom: 1.5,
          pitch: 0,
          bearing: 0,
          duration: 0,
          animate: false
        });
      }

      // انتظار استقرار الخريطة
      await new Promise<void>((resolve) => {
        map.once('idle', () => {
          setTimeout(() => resolve(), 1000);
        });
      });

      // الحصول على canvas الخريطة
      const baseCanvas: HTMLCanvasElement = map.getCanvas();
      const container: HTMLDivElement = map.getContainer();
      
      const scaleFactor = 2;
      
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = baseCanvas.width * scaleFactor;
      outputCanvas.height = baseCanvas.height * scaleFactor;
      const ctx = outputCanvas.getContext('2d', { alpha: false });
      
      if (!ctx) {
        throw new Error('فشل في إنشاء السياق');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(baseCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

      // رسم الرموز إذا كانت موجودة
      if (markers.length > 0) {
        const cssWidth = container.clientWidth || baseCanvas.width;
        const ratio = (baseCanvas.width / cssWidth) * scaleFactor;

        const dotRadius = 6 * ratio;
        const borderWidth = 2 * ratio;

        // تحديد لون النقطة بناءً على النوع
        const getColorForType = (type: string): string => {
          const colorMap: Record<string, string> = {
            'ship': '#3b82f6',
            'submarine': '#6366f1',
            'naval_base': '#ef4444',
            'port': '#10b981',
            'defensive_line': '#f59e0b',
            'watchtower': '#8b5cf6',
            'navigation_buoy': '#06b6d4',
            'restricted_zone': '#dc2626',
            'anchor_point': '#14b8a6',
            'helipad': '#f97316',
            'minefield': '#b91c1c',
            'barracks': '#84cc16'
          };
          return colorMap[type] || '#6b7280';
        };

        for (const marker of markers) {
          try {
            const point = map.project({ lng: marker.lng, lat: marker.lat });
            const x = point.x * ratio;
            const y = point.y * ratio;

            if (x < -50 || y < -50 || x > outputCanvas.width + 50 || y > outputCanvas.height + 50) {
              continue;
            }

            const markerColor = getColorForType(marker.type);

            // رسم النقطة الملونة
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = markerColor;
            ctx.fill();

            // رسم الحدود البيضاء
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // إضافة ظل خفيف
            ctx.shadowBlur = 4 * ratio;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowOffsetY = 2 * ratio;
            
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = markerColor;
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
          } catch (error) {
            console.error('خطأ في رسم النقطة:', marker.id, error);
          }
        }
      }

      outputCanvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "خطأ",
            description: "فشل في إنشاء الصورة",
            variant: "destructive",
          });
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
        a.download = `world-map-2d-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        map.flyTo({
          center: originalCenter,
          zoom: originalZoom,
          pitch: originalPitch,
          bearing: originalBearing,
          duration: 1000
        });

        toast({
          title: "تم التصدير ✓",
          description: markers.length > 0 ? `تم حفظ خريطة العالم 2D مع ${markers.length} رمز` : "تم حفظ خريطة العالم 2D",
        });
      }, 'image/png', 0.95);

    } catch (error) {
      console.error('خطأ في التصدير:', error);
      
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

  const exportPNG3D = async () => {
    if (!map) {
      toast({
        title: "خطأ",
        description: "الخريطة غير جاهزة",
        variant: "destructive",
      });
      return;
    }

    const originalCenter = map.getCenter();
    const originalZoom = map.getZoom();
    const originalPitch = map.getPitch();
    const originalBearing = map.getBearing();
    const originalProjection = map.getProjection();

    try {
      toast({
        title: "جاري التصدير 3D...",
        description: "يتم إنشاء صورة كروية ثلاثية الأبعاد",
      });

      // تغيير إلى عرض globe 3D
      map.setProjection('globe');
      map.flyTo({
        center: [0, 20],
        zoom: 1.5,
        pitch: 0,
        bearing: 0,
        duration: 0,
        animate: false
      });

      await new Promise<void>((resolve) => {
        map.once('idle', () => {
          setTimeout(() => resolve(), 1200);
        });
      });

      const baseCanvas: HTMLCanvasElement = map.getCanvas();
      const container: HTMLDivElement = map.getContainer();
      
      const scaleFactor = 2;
      
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = baseCanvas.width * scaleFactor;
      outputCanvas.height = baseCanvas.height * scaleFactor;
      const ctx = outputCanvas.getContext('2d', { alpha: false });
      
      if (!ctx) {
        throw new Error('فشل في إنشاء السياق');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(baseCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

      // رسم الرموز
      if (markers.length > 0) {
        const cssWidth = container.clientWidth || baseCanvas.width;
        const ratio = (baseCanvas.width / cssWidth) * scaleFactor;

        const dotRadius = 6 * ratio;
        const borderWidth = 2 * ratio;

        // تحديد لون النقطة بناءً على النوع
        const getColorForType = (type: string): string => {
          const colorMap: Record<string, string> = {
            'ship': '#3b82f6',
            'submarine': '#6366f1',
            'naval_base': '#ef4444',
            'port': '#10b981',
            'defensive_line': '#f59e0b',
            'watchtower': '#8b5cf6',
            'navigation_buoy': '#06b6d4',
            'restricted_zone': '#dc2626',
            'anchor_point': '#14b8a6',
            'helipad': '#f97316',
            'minefield': '#b91c1c',
            'barracks': '#84cc16'
          };
          return colorMap[type] || '#6b7280';
        };

        for (const marker of markers) {
          try {
            const point = map.project({ lng: marker.lng, lat: marker.lat });
            const x = point.x * ratio;
            const y = point.y * ratio;

            if (x < -50 || y < -50 || x > outputCanvas.width + 50 || y > outputCanvas.height + 50) {
              continue;
            }

            const markerColor = getColorForType(marker.type);

            // رسم النقطة الملونة
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = markerColor;
            ctx.fill();

            // رسم الحدود البيضاء
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // إضافة ظل خفيف
            ctx.shadowBlur = 4 * ratio;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowOffsetY = 2 * ratio;
            
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = markerColor;
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
          } catch (error) {
            console.error('خطأ في رسم النقطة:', marker.id, error);
          }
        }
      }

      outputCanvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "خطأ",
            description: "فشل في إنشاء الصورة",
            variant: "destructive",
          });
          map.setProjection(originalProjection);
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
        a.download = `world-map-3d-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        // إعادة للوضع الأصلي
        map.setProjection(originalProjection);
        map.flyTo({
          center: originalCenter,
          zoom: originalZoom,
          pitch: originalPitch,
          bearing: originalBearing,
          duration: 1000
        });

        toast({
          title: "تم التصدير 3D ✓",
          description: markers.length > 0 ? `تم حفظ الكرة الأرضية 3D مع ${markers.length} رمز` : "تم حفظ الكرة الأرضية 3D",
        });
      }, 'image/png', 0.95);

    } catch (error) {
      console.error('خطأ في التصدير 3D:', error);
      
      try {
        map.setProjection(originalProjection);
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
        description: "فشل تصدير الصورة 3D",
        variant: "destructive",
      });
    }
  };

  const export3DGLB = async () => {
    if (!map) {
      toast({
        title: "خطأ",
        description: "الخريطة غير جاهزة",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "جاري التصدير 3D...",
        description: "يتم إنشاء نموذج ثلاثي الأبعاد GLB",
      });

      const scene = new THREE.Scene();
      const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
      
      const originalProjection = map.getProjection();
      map.setProjection('globe');
      map.flyTo({
        center: [0, 20],
        zoom: 1.5,
        pitch: 0,
        bearing: 0,
        duration: 0,
        animate: false
      });

      await new Promise<void>((resolve) => {
        map.once('idle', () => {
          setTimeout(() => resolve(), 1000);
        });
      });

      const canvas = map.getCanvas();
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      const earthMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2
      });

      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      if (markers.length > 0) {
        for (const marker of markers) {
          try {
            const phi = (90 - marker.lat) * (Math.PI / 180);
            const theta = (marker.lng + 180) * (Math.PI / 180);
            
            const x = -5.1 * Math.sin(phi) * Math.cos(theta);
            const y = 5.1 * Math.cos(phi);
            const z = 5.1 * Math.sin(phi) * Math.sin(theta);

            const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const markerMaterial = new THREE.MeshStandardMaterial({
              color: getSeverityColor(marker.severity),
              emissive: getSeverityColor(marker.severity),
              emissiveIntensity: 0.5
            });

            const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
            markerMesh.position.set(x, y, z);
            markerMesh.name = marker.name_ar;
            scene.add(markerMesh);
          } catch (error) {
            console.error('خطأ في إضافة رمز 3D:', marker.id, error);
          }
        }
      }

      const exporter = new GLTFExporter();
      
      exporter.parse(
        scene,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `world-map-3d-${Date.now()}.glb`;
          a.click();
          URL.revokeObjectURL(url);

          map.setProjection(originalProjection);

          toast({
            title: "تم التصدير 3D ✓",
            description: `تم حفظ النموذج ثلاثي الأبعاد GLB مع ${markers.length} رمز`,
          });

          scene.clear();
          earthGeometry.dispose();
          earthMaterial.dispose();
          texture.dispose();
        },
        (error) => {
          console.error('خطأ في تصدير GLB:', error);
          toast({
            title: "خطأ",
            description: "فشل تصدير النموذج ثلاثي الأبعاد",
            variant: "destructive",
          });
          map.setProjection(originalProjection);
        },
        { binary: true }
      );

    } catch (error) {
      console.error('خطأ في إنشاء النموذج 3D:', error);
      toast({
        title: "خطأ",
        description: "فشل إنشاء النموذج ثلاثي الأبعاد",
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
    <>
      {isSelectingArea && (
        <AreaSelector
          map={map}
          onAreaSelected={(bounds) => {
            setSelectedBounds(bounds);
            setIsSelectingArea(false);
            toast({
              title: "تم تحديد المنطقة",
              description: "يمكنك الآن تصدير المنطقة المحددة",
            });
          }}
          onCancel={() => setIsSelectingArea(false)}
        />
      )}
      
      <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
        <Button
          variant={selectedBounds ? "default" : "outline"}
          size="sm"
          className="gap-1.5 sm:gap-2 justify-start h-8 sm:h-9 text-xs sm:text-sm"
          onClick={() => setIsSelectingArea(true)}
          disabled={!map}
        >
          <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {selectedBounds ? "تغيير المنطقة" : "تحديد منطقة"}
        </Button>

        {selectedBounds && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 sm:gap-2 justify-start h-8 sm:h-9 text-xs sm:text-sm"
            onClick={() => {
              setSelectedBounds(null);
              toast({
                title: "تم إلغاء التحديد",
                description: "سيتم تصدير الخريطة كاملة",
              });
            }}
          >
            إلغاء التحديد
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 sm:gap-2 justify-start h-8 sm:h-9 text-xs sm:text-sm"
          onClick={exportPNG}
          disabled={!map}
        >
          <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          PNG {selectedBounds ? "(منطقة محددة)" : "(2D مسطح)"}
        </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 sm:gap-2 justify-start h-8 sm:h-9 text-xs sm:text-sm"
        onClick={exportPNG3D}
        disabled={!map}
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        PNG (3D كروي)
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 sm:gap-2 justify-start h-8 sm:h-9 text-xs sm:text-sm"
        onClick={export3DGLB}
        disabled={!map}
      >
        <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">نموذج 3D (GLB)</span>
        <span className="sm:hidden">GLB</span>
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
    </>
  );
};