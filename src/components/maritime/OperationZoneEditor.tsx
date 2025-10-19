import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { OperationZone } from '@/pages/Maritime';
import { MapPin, Circle as CircleIcon } from 'lucide-react';

interface OperationZoneEditorProps {
  zone: OperationZone;
  onZoneChange: (zone: OperationZone) => void;
}

const OperationZoneEditor: React.FC<OperationZoneEditorProps> = ({ zone, onZoneChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-3">منطقة التشغيل</h3>
      
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            المركز (خط العرض)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={zone.center[0]}
            onChange={(e) => onZoneChange({
              ...zone,
              center: [parseFloat(e.target.value) || 0, zone.center[1]]
            })}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            المركز (خط الطول)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={zone.center[1]}
            onChange={(e) => onZoneChange({
              ...zone,
              center: [zone.center[0], parseFloat(e.target.value) || 0]
            })}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CircleIcon className="h-4 w-4" />
            نصف القطر (متر)
          </Label>
          <Input
            type="number"
            step="1000"
            value={zone.radius}
            onChange={(e) => onZoneChange({
              ...zone,
              radius: parseFloat(e.target.value) || 10000
            })}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            ≈ {(zone.radius / 1000).toFixed(1)} كم
          </p>
        </div>

        <div className="pt-2 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onZoneChange({
              center: [15.9, 44.0],
              radius: 50000
            })}
          >
            إعادة تعيين للوسط
          </Button>
        </div>
      </Card>

      <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-md">
        <p>💡 نصيحة: يمكنك تعديل المنطقة يدوياً بإدخال الإحداثيات أو سحب الدائرة على الخريطة.</p>
      </div>
    </div>
  );
};

export default OperationZoneEditor;
