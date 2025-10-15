import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Voyage {
  id: string;
  date: string;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  distance: number;
  duration: string;
}

interface VoyageHistoryProps {
  voyages: Voyage[];
  onDeleteVoyage: (id: string) => void;
  onLoadVoyage: (voyage: Voyage) => void;
}

const VoyageHistory: React.FC<VoyageHistoryProps> = ({ 
  voyages, 
  onDeleteVoyage,
  onLoadVoyage 
}) => {
  return (
    <Card className="bg-card/95 backdrop-blur border-border shadow-lg h-full">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <History className="w-5 h-5 text-primary" />
          سجل الرحلات
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {voyages.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <p className="text-sm">لا توجد رحلات محفوظة</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {voyages.map((voyage) => (
                <div
                  key={voyage.id}
                  className="p-3 bg-secondary/50 rounded-lg border border-border hover:bg-secondary/70 transition-colors cursor-pointer"
                  onClick={() => onLoadVoyage(voyage)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-muted-foreground">
                      {new Date(voyage.date).toLocaleDateString('ar-SA')}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-destructive/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteVoyage(voyage.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">من:</span>
                      <span className="font-mono text-foreground">
                        {voyage.from.lat.toFixed(2)}°, {voyage.from.lon.toFixed(2)}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">إلى:</span>
                      <span className="font-mono text-foreground">
                        {voyage.to.lat.toFixed(2)}°, {voyage.to.lon.toFixed(2)}°
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">المسافة:</span>
                      <span className="text-accent font-bold">
                        {voyage.distance.toFixed(1)} كم
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المدة:</span>
                      <span className="text-primary font-bold">{voyage.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VoyageHistory;
