import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

interface MaritimeFiltersProps {
  filters: {
    types: number[];
    minSpeed: number;
    maxSpeed: number;
  };
  onFiltersChange: (filters: any) => void;
}

const shipTypes = [
  { value: 30, label: 'سفن الصيد', range: [30, 39] },
  { value: 40, label: 'السفن السريعة', range: [40, 49] },
  { value: 50, label: 'سفن الإرشاد', range: [50, 59] },
  { value: 60, label: 'سفن الركاب', range: [60, 69] },
  { value: 70, label: 'سفن الشحن', range: [70, 79] },
  { value: 80, label: 'الناقلات', range: [80, 89] },
];

const MaritimeFilters: React.FC<MaritimeFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleTypeToggle = (typeRange: number[]) => {
    const types = Array.from({ length: typeRange[1] - typeRange[0] + 1 }, (_, i) => typeRange[0] + i);
    const hasType = types.some(t => filters.types.includes(t));
    
    if (hasType) {
      onFiltersChange({
        ...filters,
        types: filters.types.filter(t => !types.includes(t))
      });
    } else {
      onFiltersChange({
        ...filters,
        types: [...filters.types, ...types]
      });
    }
  };

  const isTypeChecked = (typeRange: number[]) => {
    const types = Array.from({ length: typeRange[1] - typeRange[0] + 1 }, (_, i) => typeRange[0] + i);
    return types.some(t => filters.types.includes(t));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">نوع السفينة</h3>
        <div className="space-y-2">
          {shipTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={`type-${type.value}`}
                checked={isTypeChecked(type.range)}
                onCheckedChange={() => handleTypeToggle(type.range)}
              />
              <Label
                htmlFor={`type-${type.value}`}
                className="text-sm cursor-pointer"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">نطاق السرعة (عقدة)</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">
              الحد الأدنى: {filters.minSpeed} عقدة
            </Label>
            <Slider
              value={[filters.minSpeed]}
              onValueChange={(value) => {
                const newMin = value[0];
                const newMax = Math.max(newMin, filters.maxSpeed);
                onFiltersChange({ ...filters, minSpeed: newMin, maxSpeed: newMax });
              }}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">
              الحد الأقصى: {filters.maxSpeed} عقدة
            </Label>
            <Slider
              value={[filters.maxSpeed]}
              onValueChange={(value) => {
                const newMax = value[0];
                const newMin = Math.min(filters.minSpeed, newMax);
                onFiltersChange({ ...filters, minSpeed: newMin, maxSpeed: newMax });
              }}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {filters.types.length > 0 && (
        <Card className="p-3 bg-muted">
          <div className="text-sm">
            <span className="font-semibold">المرشحات النشطة:</span>
            <div className="mt-2 space-y-1">
              {filters.types.length > 0 && (
                <div>• أنواع السفن: {filters.types.length} محدد</div>
              )}
              <div>• السرعة: {filters.minSpeed}-{filters.maxSpeed} عقدة</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MaritimeFilters;
