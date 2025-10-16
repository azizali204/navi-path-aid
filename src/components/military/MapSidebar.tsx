import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Save, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Pencil,
  Trash2,
  Download
} from "lucide-react";
import { IconLabelsAr, CategoryLabelsAr, IconCategories } from "./MilitarySymbolIcons";
import { MarkersTable } from "./MarkersTable";
import { ExportPanel } from "./ExportPanel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MarkerData {
  id: number;
  name_ar: string;
  type: string;
  subtype: string;
  description_ar: string;
  icon: string;
  lat: number;
  lng: number;
  severity?: 'low' | 'medium' | 'high';
}

interface MapSidebarProps {
  activeCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  customMarkers: MarkerData[];
  onAddMarker: () => void;
  onEditMarker: (marker: MarkerData) => void;
  onDeleteMarker: (id: number) => void;
  onFocusMarker: (lat: number, lng: number) => void;
  onSaveView: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  map: any;
}

export const MapSidebar = ({
  activeCategories,
  onToggleCategory,
  customMarkers,
  onAddMarker,
  onEditMarker,
  onDeleteMarker,
  onFocusMarker,
  onSaveView,
  searchTerm,
  onSearch,
  map,
}: MapSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getCategoryCount = (category: string) => {
    const types = IconCategories[category as keyof typeof IconCategories] || [];
    return customMarkers.filter(m => types.includes(m.icon)).length;
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-card border-l border-border flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          title="فتح القائمة"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <Separator />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddMarker}
          title="إضافة نقطة"
          className="text-primary"
        >
          <Plus className="w-5 h-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onSaveView}
          title="حفظ العرض"
        >
          <Save className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-96 h-screen bg-card border-l border-border flex flex-col">
      {/* الهيدر */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">لوحة التحكم</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* أزرار رئيسية */}
        <div className="flex gap-2">
          <Button onClick={onAddMarker} className="flex-1 gap-2" size="sm">
            <Plus className="w-4 h-4" />
            إضافة نقطة
          </Button>
          <Button onClick={onSaveView} variant="outline" size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            حفظ
          </Button>
        </div>
      </div>

      {/* البحث */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن نقطة..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* فئات الطبقات */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              الطبقات
            </h3>
            <Accordion type="multiple" defaultValue={['ships', 'facilities']} className="space-y-2">
              {Object.entries(CategoryLabelsAr).map(([key, label]) => {
                const types = IconCategories[key as keyof typeof IconCategories] || [];
                const activeCount = types.filter(t => activeCategories.has(t)).length;
                const count = getCategoryCount(key);
                
                return (
                  <AccordionItem key={key} value={key} className="border rounded-lg px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{label}</span>
                        <div className="flex items-center gap-2">
                          {count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {count}
                            </Badge>
                          )}
                          <Badge variant={activeCount > 0 ? "default" : "outline"} className="text-xs">
                            {activeCount}/{types.length}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      {types.map((type) => (
                        <div key={type} className="flex items-center justify-between py-1">
                          <Label htmlFor={type} className="text-sm cursor-pointer flex-1">
                            {IconLabelsAr[type]}
                          </Label>
                          <Switch
                            id={type}
                            checked={activeCategories.has(type)}
                            onCheckedChange={() => onToggleCategory(type)}
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          <Separator />

          {/* النقاط المخصصة */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              النقاط المخصصة ({customMarkers.length})
            </h3>
            
            {customMarkers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لا توجد نقاط مخصصة
              </div>
            ) : (
              <div className="space-y-2">
                {customMarkers.slice(0, 5).map((marker) => (
                  <div
                    key={marker.id}
                    className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{marker.name_ar}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {IconLabelsAr[marker.icon]}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onFocusMarker(marker.lat, marker.lng)}
                        className="h-7 px-2"
                      >
                        <MapPin className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditMarker(marker)}
                        className="h-7 px-2"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteMarker(marker.id)}
                        className="h-7 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {customMarkers.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    و {customMarkers.length - 5} نقاط أخرى...
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* التصدير */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" />
              التصدير
            </h3>
            <ExportPanel markers={customMarkers} map={map} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};