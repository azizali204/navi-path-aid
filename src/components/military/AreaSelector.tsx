import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Square } from "lucide-react";

interface AreaSelectorProps {
  map: any;
  onAreaSelected: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onCancel: () => void;
}

export const AreaSelector = ({ map, onAreaSelected, onCancel }: AreaSelectorProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const canvas = map.getCanvasContainer();
    canvas.style.cursor = 'crosshair';

    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.border = '2px dashed #3b82f6';
    box.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    box.style.pointerEvents = 'none';
    box.style.display = 'none';
    canvas.appendChild(box);
    setSelectionBox(box);

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setStartPoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsSelecting(true);
      box.style.display = 'block';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isSelecting || !startPoint) return;

      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const left = Math.min(startPoint.x, currentX);
      const top = Math.min(startPoint.y, currentY);
      const width = Math.abs(currentX - startPoint.x);
      const height = Math.abs(currentY - startPoint.y);

      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;

      setEndPoint({ x: currentX, y: currentY });
    };

    const onMouseUp = () => {
      if (!isSelecting || !startPoint || !endPoint) return;

      setIsSelecting(false);
      box.style.display = 'none';

      // Convert pixel coordinates to geographic coordinates
      const point1 = map.unproject([startPoint.x, startPoint.y]);
      const point2 = map.unproject([endPoint.x, endPoint.y]);

      const bounds = {
        north: Math.max(point1.lat, point2.lat),
        south: Math.min(point1.lat, point2.lat),
        east: Math.max(point1.lng, point2.lng),
        west: Math.min(point1.lng, point2.lng)
      };

      onAreaSelected(bounds);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.style.cursor = '';
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      if (box.parentNode) {
        box.parentNode.removeChild(box);
      }
    };
  }, [map, isSelecting, startPoint, endPoint, onAreaSelected]);

  return (
    <Card className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] p-4 bg-card shadow-2xl" dir="rtl">
      <div className="flex items-center gap-3 mb-3">
        <Square className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">تحديد منطقة الطباعة</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="mr-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        اسحب على الخريطة لتحديد المنطقة المراد طباعتها
      </p>
      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          إلغاء
        </Button>
      </div>
    </Card>
  );
};