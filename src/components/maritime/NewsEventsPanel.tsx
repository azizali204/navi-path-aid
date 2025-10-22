import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Calendar, MapPin } from 'lucide-react';

interface NewsEvent {
  title: string;
  description: string;
  date: string;
  lat: number;
  lon: number;
  severity: 'high' | 'medium' | 'low';
  type: string;
}

interface NewsEventsPanelProps {
  onEventsFound: (events: NewsEvent[]) => void;
}

export const NewsEventsPanel = ({ onEventsFound }: NewsEventsPanelProps) => {
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<NewsEvent[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('الرجاء إدخال موضوع البحث');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('الرجاء إدخال الفترة الزمنية');
      return;
    }

    setIsLoading(true);
    setEvents([]);

    try {
      const { data, error } = await supabase.functions.invoke('search-news-events', {
        body: { query, startDate, endDate }
      });

      if (error) {
        console.error('Error invoking function:', error);
        throw error;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.events && Array.isArray(data.events)) {
        setEvents(data.events);
        onEventsFound(data.events);
        toast.success(`تم العثور على ${data.events.length} حدث`);
      } else {
        toast.info('لم يتم العثور على أحداث');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('حدث خطأ أثناء البحث');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-3">
        <div>
          <Label htmlFor="query" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            موضوع البحث
          </Label>
          <Input
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: هجمات الحوثيين، القرصنة البحرية..."
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              من تاريخ
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              إلى تاريخ
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <Button 
          onClick={handleSearch} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جارِ البحث...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              بحث عن أحداث
            </>
          )}
        </Button>
      </div>

      {events.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-sm">النتائج ({events.length})</h3>
          {events.map((event, index) => (
            <Card key={index} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm flex-1">{event.title}</h4>
                <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(event.severity)}`}>
                  {event.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{event.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(event.date).toLocaleDateString('ar-SA')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.lat.toFixed(2)}, {event.lon.toFixed(2)}
                </span>
              </div>
              <div className="text-xs px-2 py-1 bg-secondary rounded">
                {event.type}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};
