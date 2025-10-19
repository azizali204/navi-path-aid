import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconPicker } from "./IconPicker";
import { MapPin, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarkerData {
  id?: number;
  name_ar: string;
  type: string;
  subtype: string;
  description_ar: string;
  icon: string;
  lat: number;
  lng: number;
  severity?: 'low' | 'medium' | 'high';
}

interface AddMarkerDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (marker: MarkerData) => void;
  initialData?: MarkerData | null;
  pickingCoordinates: boolean;
  onPickCoordinates: () => void;
}

export const AddMarkerDialog = ({ 
  open, 
  onClose, 
  onSave, 
  initialData,
  pickingCoordinates,
  onPickCoordinates 
}: AddMarkerDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MarkerData>({
    name_ar: '',
    type: 'ship',
    subtype: '',
    description_ar: '',
    icon: 'ship',
    lat: 21.5433,
    lng: 39.1520,
    severity: 'low'
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          name_ar: '',
          type: 'ship',
          subtype: '',
          description_ar: '',
          icon: 'ship',
          lat: 21.5433,
          lng: 39.1520,
          severity: 'low'
        });
      }
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    // التحقق من البيانات
    if (!formData.name_ar.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم النقطة",
        variant: "destructive",
      });
      return;
    }

    if (!formData.icon) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار أيقونة",
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة الإحداثيات
    if (isNaN(formData.lat) || isNaN(formData.lng)) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال إحداثيات صحيحة",
        variant: "destructive",
      });
      return;
    }

    if (formData.lat < -90 || formData.lat > 90 || formData.lng < -180 || formData.lng > 180) {
      toast({
        title: "خطأ",
        description: "الإحداثيات خارج النطاق المسموح",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[calc(100vw-2rem)] sm:w-full overflow-y-auto p-4 sm:p-6" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">
            {initialData ? 'تعديل نقطة' : 'إضافة نقطة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* الاسم */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">الاسم *</Label>
            <Input
              id="name"
              placeholder="مثال: قاعدة الملك فيصل البحرية"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              className="text-right h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          {/* النوع والفئة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs sm:text-sm">النوع *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ship">سفينة</SelectItem>
                  <SelectItem value="submarine">غواصة</SelectItem>
                  <SelectItem value="naval_base">قاعدة بحرية</SelectItem>
                  <SelectItem value="port">ميناء</SelectItem>
                  <SelectItem value="defensive_line">خط دفاعي</SelectItem>
                  <SelectItem value="watchtower">برج مراقبة</SelectItem>
                  <SelectItem value="navigation_buoy">عوامة ملاحية</SelectItem>
                  <SelectItem value="restricted_zone">منطقة محظورة</SelectItem>
                  <SelectItem value="anchor_point">نقطة رسو</SelectItem>
                  <SelectItem value="helipad">مهبط طائرات</SelectItem>
                  <SelectItem value="minefield">حقل ألغام</SelectItem>
                  <SelectItem value="barracks">ثكنة</SelectItem>
                  <SelectItem value="missile_battery">منصة صواريخ</SelectItem>
                  <SelectItem value="usv">زورق مسير</SelectItem>
                  <SelectItem value="uav">طائرة مسيرة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity" className="text-xs sm:text-sm">مستوى الأهمية</Label>
              <Select 
                value={formData.severity} 
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">الوصف</Label>
            <Textarea
              id="description"
              placeholder="وصف مختصر للنقطة..."
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              className="text-right min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
            />
          </div>

          {/* اختيار الأيقونة */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">اختيار الأيقونة *</Label>
            <IconPicker
              selectedIcon={formData.icon}
              onSelectIcon={(icon) => setFormData({ ...formData, icon })}
            />
          </div>

          {/* الإحداثيات */}
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <Label className="text-base sm:text-lg">الإحداثيات</Label>
              <Button
                type="button"
                variant={pickingCoordinates ? "destructive" : "outline"}
                size="sm"
                onClick={onPickCoordinates}
                className="gap-2 w-full sm:w-auto h-9 text-xs sm:text-sm"
              >
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {pickingCoordinates ? 'إلغاء الالتقاط' : 'التقاط من الخريطة'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat" className="text-xs sm:text-sm">خط العرض (Latitude)</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.000001"
                  placeholder="21.5433"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                  dir="ltr"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lng" className="text-xs sm:text-sm">خط الطول (Longitude)</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.000001"
                  placeholder="39.1520"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                  dir="ltr"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            </div>

            {pickingCoordinates && (
              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                انقر على الخريطة لتحديد الموقع...
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base">
            إلغاء
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base">
            {initialData ? 'تحديث' : 'حفظ النقطة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};