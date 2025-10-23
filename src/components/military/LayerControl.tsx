import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LayerControlProps {
  onLayerChange: (layerId: string, enabled: boolean) => void;
  onBaseMapChange: (style: string) => void;
  currentBaseMap: string;
}

export const LayerControl = ({ onLayerChange, onBaseMapChange, currentBaseMap }: LayerControlProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [layers, setLayers] = useState({
    navigation: true,
    bathymetry: false,
    satellite: false,
  });

  const handleLayerToggle = (layerId: string, enabled: boolean) => {
    setLayers(prev => ({ ...prev, [layerId]: enabled }));
    onLayerChange(layerId, enabled);
  };

  const baseMaps = [
    { id: 'streets', name: 'شوارع', style: 'mapbox://styles/mapbox/streets-v12' },
    { id: 'satellite', name: 'أقمار صناعية', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { id: 'dark', name: 'داكن', style: 'mapbox://styles/mapbox/dark-v11' },
    { id: 'light', name: 'فاتح', style: 'mapbox://styles/mapbox/light-v11' },
  ];

  return (
    <Card className="absolute top-4 left-4 z-[500] w-72 bg-background/95 backdrop-blur-sm shadow-lg" dir="rtl">
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-between mb-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            <span className="font-semibold">التحكم بالطبقات</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {isExpanded && (
          <>
            <Separator className="mb-4" />

            {/* Base Map Selection */}
            <div className="space-y-3 mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">الخريطة الأساسية</h3>
              <div className="grid grid-cols-2 gap-2">
                {baseMaps.map(map => (
                  <Button
                    key={map.id}
                    variant={currentBaseMap === map.style ? "default" : "outline"}
                    size="sm"
                    onClick={() => onBaseMapChange(map.style)}
                    className="text-xs"
                  >
                    {map.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Overlay Layers */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">الطبقات البحرية</h3>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="navigation" className="text-sm cursor-pointer flex-1">
                  طبقة الملاحة البحرية
                  <span className="block text-xs text-muted-foreground">علامات، موانئ، خطوط شحن</span>
                </Label>
                <Switch
                  id="navigation"
                  checked={layers.navigation}
                  onCheckedChange={(checked) => handleLayerToggle('navigation', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="bathymetry" className="text-sm cursor-pointer flex-1">
                  طبقة قياس الأعماق
                  <span className="block text-xs text-muted-foreground">خطوط العمق والتضاريس</span>
                </Label>
                <Switch
                  id="bathymetry"
                  checked={layers.bathymetry}
                  onCheckedChange={(checked) => handleLayerToggle('bathymetry', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="satellite" className="text-sm cursor-pointer flex-1">
                  تفاصيل الأقمار الصناعية
                  <span className="block text-xs text-muted-foreground">صور عالية الدقة</span>
                </Label>
                <Switch
                  id="satellite"
                  checked={layers.satellite}
                  onCheckedChange={(checked) => handleLayerToggle('satellite', checked)}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Legend */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">مفتاح الألوان (العمق)</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e6f3ff' }}></div>
                  <span>0-50 متر (ضحل)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#66b3ff' }}></div>
                  <span>50-200 متر</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0066cc' }}></div>
                  <span>200-1000 متر</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#003d7a' }}></div>
                  <span>1000-3000 متر</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#001a33' }}></div>
                  <span>&gt;3000 متر (عميق جداً)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
