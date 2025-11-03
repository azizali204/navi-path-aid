import { Card } from "@/components/ui/card";
import { MilitarySymbolIcons } from "./MilitarySymbolIcons";
import { Ship, Anchor, Home, MapPin, Shield, Eye, Navigation, AlertTriangle, Target, Plane, Bomb, Building } from "lucide-react";

const legendItems = [
  { type: 'ship', icon: Ship, label: 'سفينة', color: '#3b82f6' },
  { type: 'submarine', icon: Target, label: 'غواصة', color: '#6366f1' },
  { type: 'naval_base', icon: Home, label: 'قاعدة بحرية', color: '#ef4444' },
  { type: 'port', icon: Anchor, label: 'ميناء', color: '#10b981' },
  { type: 'defensive_line', icon: Shield, label: 'خط دفاعي', color: '#f59e0b' },
  { type: 'watchtower', icon: Eye, label: 'برج مراقبة', color: '#8b5cf6' },
  { type: 'navigation_buoy', icon: Navigation, label: 'عوامة ملاحية', color: '#06b6d4' },
  { type: 'restricted_zone', icon: AlertTriangle, label: 'منطقة محظورة', color: '#dc2626' },
  { type: 'anchor_point', icon: MapPin, label: 'نقطة رسو', color: '#14b8a6' },
  { type: 'helipad', icon: Plane, label: 'مهبط هليكوبتر', color: '#f97316' },
  { type: 'minefield', icon: Bomb, label: 'حقل ألغام', color: '#b91c1c' },
  { type: 'barracks', icon: Building, label: 'ثكنات', color: '#84cc16' },
];

export const MapLegend = () => {
  return (
    <Card className="absolute bottom-20 right-4 z-[1000] p-3 sm:p-4 w-56 sm:w-64 bg-card/95 backdrop-blur" dir="rtl">
      <h3 className="font-bold text-sm sm:text-lg mb-2 sm:mb-3 text-foreground">مفتاح الخريطة</h3>
      <div className="space-y-1.5 sm:space-y-2 max-h-[300px] overflow-y-auto">
        {legendItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.type} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: item.color }} />
              </div>
              <span className="text-xs sm:text-sm text-foreground">{item.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
