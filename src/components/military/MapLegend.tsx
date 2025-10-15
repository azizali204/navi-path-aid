import { Card } from "@/components/ui/card";
import { MilitarySymbolIcons } from "./MilitarySymbolIcons";

const legendItems = [
  { icon: 'ship-patrol', label: 'سفينة دورية' },
  { icon: 'ship-frigate', label: 'فرقاطة' },
  { icon: 'submarine', label: 'غواصة' },
  { icon: 'naval-base', label: 'قاعدة بحرية' },
  { icon: 'port', label: 'ميناء' },
  { icon: 'watchtower', label: 'برج مراقبة' },
  { icon: 'buoy', label: 'عوامة' },
  { icon: 'restricted', label: 'منطقة محظورة' },
  { icon: 'anchor', label: 'نقطة رسو' },
  { icon: 'helipad', label: 'مهبط هليكوبتر' },
  { icon: 'minefield', label: 'حقل ألغام' },
];

export const MapLegend = () => {
  return (
    <Card className="absolute bottom-20 right-4 z-[1000] p-4 w-64 bg-card/95 backdrop-blur" dir="rtl">
      <h3 className="font-bold text-lg mb-3 text-foreground">مفتاح الرموز</h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {legendItems.map((item) => (
          <div key={item.icon} className="flex items-center gap-3">
            <div 
              className="w-6 h-6 flex items-center justify-center"
              dangerouslySetInnerHTML={{ 
                __html: MilitarySymbolIcons[item.icon as keyof typeof MilitarySymbolIcons] 
              }}
            />
            <span className="text-sm text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
