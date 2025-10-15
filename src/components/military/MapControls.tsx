import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface MapControlsProps {
  activeCategories: Set<string>;
  onToggleCategory: (category: string) => void;
}

const categories = [
  { id: 'ship', label: 'سفن', emoji: '🚢' },
  { id: 'submarine', label: 'غواصات', emoji: '🫧' },
  { id: 'naval_base', label: 'قواعد بحرية', emoji: '🏰' },
  { id: 'barracks', label: 'ثكنات', emoji: '🏛️' },
  { id: 'port', label: 'موانئ', emoji: '⚓' },
  { id: 'defensive_line', label: 'خطوط دفاعية', emoji: '🛡️' },
  { id: 'watchtower', label: 'أبراج مراقبة', emoji: '👁️' },
  { id: 'navigation_buoy', label: 'عوامات ملاحية', emoji: '🔵' },
  { id: 'restricted_zone', label: 'مناطق محظورة', emoji: '🚫' },
  { id: 'anchor_point', label: 'نقاط رسو', emoji: '⚓' },
  { id: 'helipad', label: 'مهابط هليكوبتر', emoji: '🚁' },
  { id: 'minefield', label: 'حقول ألغام', emoji: '⚠️' },
];

export const MapControls = ({ activeCategories, onToggleCategory }: MapControlsProps) => {
  return (
    <Card className="absolute top-4 right-4 z-[1000] p-4 w-64 bg-card/95 backdrop-blur" dir="rtl">
      <h3 className="font-bold text-lg mb-3 text-foreground">طبقات الخريطة</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2">
            <Checkbox
              id={cat.id}
              checked={activeCategories.has(cat.id)}
              onCheckedChange={() => onToggleCategory(cat.id)}
            />
            <label
              htmlFor={cat.id}
              className="text-sm cursor-pointer flex items-center gap-2 text-foreground"
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </label>
          </div>
        ))}
      </div>
    </Card>
  );
};
