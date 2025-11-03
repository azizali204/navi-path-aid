// @ts-nocheck
import { Button } from "@/components/ui/button";
import { FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

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

  const exportPNG = async () => {
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
        title: "جاري التصدير...",
        description: "يتم أخذ لقطة للشاشة",
      });

      // البحث عن container الخريطة الرئيسي
      const mapContainer = map.getContainer().parentElement;
      
      if (!mapContainer) {
        throw new Error('لم يتم العثور على container الخريطة');
      }

      // أخذ لقطة شاشة لكل العناصر الظاهرة
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#000000',
        scale: 2, // دقة عالية
        logging: false,
        imageTimeout: 0,
      });

      // تحويل إلى blob وتحميل
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "خطأ",
            description: "فشل في إنشاء الصورة",
            variant: "destructive",
          });
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `naval-map-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "تم التصدير ✓",
          description: "تم حفظ لقطة الشاشة بنجاح",
        });
      }, 'image/png', 0.95);

    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "خطأ",
        description: "فشل تصدير الصورة",
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
        disabled={!map}
      >
        <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        تصدير PNG
      </Button>
    </div>
  );
};
