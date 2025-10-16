import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MapPin } from "lucide-react";
import { MilitarySymbolIcons, IconLabelsAr } from "./MilitarySymbolIcons";

interface MarkerData {
  id: number;
  name_ar: string;
  type: string;
  description_ar: string;
  icon: string;
  lat: number;
  lng: number;
  severity?: 'low' | 'medium' | 'high';
}

interface MarkersTableProps {
  markers: MarkerData[];
  onEdit: (marker: MarkerData) => void;
  onDelete: (id: number) => void;
  onFocus: (lat: number, lng: number) => void;
}

const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};

const getSeverityLabel = (severity?: string) => {
  switch (severity) {
    case 'high': return 'عالي';
    case 'medium': return 'متوسط';
    case 'low': return 'منخفض';
    default: return '-';
  }
};

export const MarkersTable = ({ markers, onEdit, onDelete, onFocus }: MarkersTableProps) => {
  if (markers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        لا توجد نقاط محفوظة
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الأيقونة</TableHead>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">النوع</TableHead>
            <TableHead className="text-right">الأهمية</TableHead>
            <TableHead className="text-right">الإحداثيات</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markers.map((marker) => (
            <TableRow key={marker.id}>
              <TableCell>
                {marker.icon.startsWith('custom_') ? (
                  (() => {
                    const customIcons = JSON.parse(localStorage.getItem('customIcons') || '[]');
                    const customIcon = customIcons.find((icon: any) => icon.id === marker.icon);
                    return customIcon ? (
                      <img 
                        src={customIcon.dataUrl} 
                        alt={customIcon.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <div 
                        dangerouslySetInnerHTML={{ __html: MilitarySymbolIcons.default }}
                        className="w-6 h-6"
                      />
                    );
                  })()
                ) : (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: MilitarySymbolIcons[marker.icon as keyof typeof MilitarySymbolIcons] || MilitarySymbolIcons.default 
                    }}
                    className="w-6 h-6"
                  />
                )}
              </TableCell>
              <TableCell className="font-medium">{marker.name_ar}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {IconLabelsAr[marker.icon] || marker.type}
              </TableCell>
              <TableCell>
                <Badge variant={getSeverityColor(marker.severity)}>
                  {getSeverityLabel(marker.severity)}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs" dir="ltr">
                {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onFocus(marker.lat, marker.lng)}
                    title="التركيز على الخريطة"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(marker)}
                    title="تعديل"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(marker.id)}
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};