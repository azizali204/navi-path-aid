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
    <div className="fixed bottom-20 right-4 z-[1500] p-2 sm:p-3 backdrop-blur-sm bg-black/20 rounded-lg border border-white/20" dir="rtl">
      <h3 className="font-bold text-xs sm:text-sm mb-1.5 sm:mb-2 text-white drop-shadow-lg">مفتاح الخريطة</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {legendItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.type} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" style={{ color: item.color }} />
              <span className="text-[10px] sm:text-xs text-white drop-shadow">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
