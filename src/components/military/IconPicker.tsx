import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MilitarySymbolIcons, IconLabelsAr, IconCategories, CategoryLabelsAr } from "./MilitarySymbolIcons";
import { Search, Upload, X, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SymbolCategories, createMilSymbol } from "@/utils/milsymbolHelper";

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

interface CustomIcon {
  id: string;
  name: string;
  dataUrl: string;
}

export const IconPicker = ({ selectedIcon, onSelectIcon }: IconPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // تحميل الأيقونات المخصصة من localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customIcons');
    if (saved) {
      try {
        setCustomIcons(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom icons:', e);
      }
    }
  }, []);

  // حفظ الأيقونات المخصصة في localStorage
  const saveCustomIcons = (icons: CustomIcon[]) => {
    localStorage.setItem('customIcons', JSON.stringify(icons));
    setCustomIcons(icons);
  };

  // رفع أيقونة جديدة
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار ملف صورة",
        variant: "destructive",
      });
      return;
    }

    // التحقق من حجم الملف (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة كبير جداً (الحد الأقصى 2MB)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newIcon: CustomIcon = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl
      };

      const updatedIcons = [...customIcons, newIcon];
      saveCustomIcons(updatedIcons);
      onSelectIcon(newIcon.id);

      toast({
        title: "تم الرفع بنجاح",
        description: "تمت إضافة الأيقونة المخصصة",
      });
    };

    reader.readAsDataURL(file);
    
    // إعادة تعيين input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // حذف أيقونة مخصصة
  const deleteCustomIcon = (id: string) => {
    const updatedIcons = customIcons.filter(icon => icon.id !== id);
    saveCustomIcons(updatedIcons);
    
    if (selectedIcon === id) {
      onSelectIcon('ship');
    }

    toast({
      title: "تم الحذف",
      description: "تم حذف الأيقونة المخصصة",
    });
  };

  const filterIcons = (icons: string[]) => {
    if (!searchTerm.trim()) return icons;
    
    return icons.filter(icon => {
      const label = IconLabelsAr[icon] || icon;
      return label.includes(searchTerm) || icon.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const filterCustomIcons = (icons: CustomIcon[]) => {
    if (!searchTerm.trim()) return icons;
    
    return icons.filter(icon => 
      icon.name.includes(searchTerm) || icon.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderIconGrid = (icons: string[]) => {
    const filtered = filterIcons(icons);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد نتائج
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
        {filtered.map((iconKey) => {
          const isSelected = selectedIcon === iconKey;
          return (
            <button
              key={iconKey}
              type="button"
              onClick={() => onSelectIcon(iconKey)}
              className={`
                flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all
                hover:border-primary hover:bg-primary/10
                ${isSelected ? 'border-primary bg-primary/20' : 'border-border'}
              `}
              title={IconLabelsAr[iconKey]}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: MilitarySymbolIcons[iconKey as keyof typeof MilitarySymbolIcons] }}
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
              <span className="text-[10px] sm:text-xs text-center line-clamp-2">
                {IconLabelsAr[iconKey]}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderCustomIconGrid = () => {
    const filtered = filterCustomIcons(customIcons);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد أيقونات مخصصة
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
        {filtered.map((customIcon) => {
          const isSelected = selectedIcon === customIcon.id;
          return (
            <div key={customIcon.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelectIcon(customIcon.id)}
                className={`
                  flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all w-full
                  hover:border-primary hover:bg-primary/10
                  ${isSelected ? 'border-primary bg-primary/20' : 'border-border'}
                `}
                title={customIcon.name}
              >
                <img 
                  src={customIcon.dataUrl} 
                  alt={customIcon.name}
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
                <span className="text-[10px] sm:text-xs text-center line-clamp-2">
                  {customIcon.name}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteCustomIcon(customIcon.id)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 sm:p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="حذف"
              >
                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderNATOSymbolsGrid = () => {
    const filtered = SymbolCategories.filter(symbol => 
      searchTerm ? symbol.name.includes(searchTerm) : true
    );

    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد نتائج
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
        {filtered.map((symbol) => {
          const isSelected = selectedIcon === symbol.id;
          const symbolDataUrl = createMilSymbol(symbol.sidc, { size: 35 });
          
          return (
            <button
              key={symbol.id}
              type="button"
              onClick={() => onSelectIcon(symbol.id)}
              className={`
                flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition-all
                hover:border-primary hover:bg-primary/10
                ${isSelected ? 'border-primary bg-primary/20' : 'border-border'}
              `}
              title={symbol.name}
            >
              {symbolDataUrl ? (
                <img 
                  src={symbolDataUrl} 
                  alt={symbol.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <span className="text-[10px] sm:text-xs text-center line-clamp-2">
                {symbol.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // الحصول على الأيقونة المختارة للمعاينة
  const getSelectedIconDisplay = () => {
    const customIcon = customIcons.find(icon => icon.id === selectedIcon);
    if (customIcon) {
      return (
        <>
          <img 
            src={customIcon.dataUrl} 
            alt={customIcon.name}
            className="w-12 h-12 object-contain"
          />
          <div>
            <div className="font-semibold">{customIcon.name}</div>
            <div className="text-sm text-muted-foreground">أيقونة مخصصة</div>
          </div>
        </>
      );
    }

    return (
      <>
        <div 
          dangerouslySetInnerHTML={{ __html: MilitarySymbolIcons[selectedIcon as keyof typeof MilitarySymbolIcons] || MilitarySymbolIcons.default }}
          className="w-12 h-12"
        />
        <div>
          <div className="font-semibold">{IconLabelsAr[selectedIcon] || 'افتراضي'}</div>
          <div className="text-sm text-muted-foreground">{selectedIcon}</div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4 border rounded-lg p-3 sm:p-4">
      {/* معاينة الأيقونة المختارة */}
      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
        {getSelectedIconDisplay()}
      </div>

      {/* بحث ورفع */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن أيقونة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8 sm:pr-10 h-9 sm:h-10 text-sm sm:text-base"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
          title="رفع أيقونة من جهازك"
        >
          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="sm:inline">رفع أيقونة</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* تبويبات الفئات */}
      <Tabs defaultValue="nato" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 text-xs sm:text-sm h-auto">
          <TabsTrigger value="nato" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            NATO
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">الكل</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">مخصصة ({customIcons.length})</TabsTrigger>
          {Object.entries(CategoryLabelsAr).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="text-xs sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="h-[250px] sm:h-[300px] mt-3 sm:mt-4">
          <TabsContent value="nato" className="mt-0">
            {renderNATOSymbolsGrid()}
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            {renderIconGrid(Object.keys(MilitarySymbolIcons))}
          </TabsContent>

          <TabsContent value="custom" className="mt-0">
            {renderCustomIconGrid()}
          </TabsContent>

          {Object.entries(IconCategories).map(([category, icons]) => (
            <TabsContent key={category} value={category} className="mt-0">
              {renderIconGrid(icons)}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
};