import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MarkerData {
  id: number;
  name_ar: string;
  type: string;
  subtype: string;
  description_ar: string;
  icon: string;
  lat: number;
  lng: number;
  severity?: 'low' | 'medium' | 'high';
}

interface AIChatPanelProps {
  markers: MarkerData[];
  onAddMarker: (marker: Omit<MarkerData, 'id'>) => void;
  onMoveMarker: (markerId: string, coordinates: [number, number]) => void;
}

export const AIChatPanel = ({ markers, onAddMarker, onMoveMarker }: AIChatPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('map-ai-chat', {
        body: { message: userMessage, markers }
      });

      if (error) throw error;

      if (data.action === "search_and_add" && data.markers && Array.isArray(data.markers)) {
        // إضافة عدة علامات من نتائج البحث
        data.markers.forEach((marker: any) => {
          const newMarker: Omit<MarkerData, 'id'> = {
            name_ar: marker.name || "علامة جديدة",
            type: marker.type || "military",
            subtype: marker.subtype || "",
            description_ar: marker.description || "",
            icon: marker.icon || "🎯",
            lat: marker.coordinates[1],
            lng: marker.coordinates[0],
            severity: marker.severity || "medium"
          };
          onAddMarker(newMarker);
        });
        
        const responseMessage = `${data.summary || ""}\n\n${data.message || `تم إضافة ${data.markers.length} علامة بنجاح ✓`}`;
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: responseMessage
        }]);
        toast({
          title: "تم إضافة العلامات",
          description: `تم إضافة ${data.markers.length} علامة من نتائج البحث`,
        });
      } else if (data.action === "add" && data.marker) {
        const newMarker: Omit<MarkerData, 'id'> = {
          name_ar: data.marker.name || "علامة جديدة",
          type: data.marker.type || "military",
          subtype: data.marker.subtype || "",
          description_ar: data.marker.description || "",
          icon: data.marker.icon || "🎯",
          lat: data.marker.coordinates[1],
          lng: data.marker.coordinates[0],
          severity: data.marker.severity || "medium"
        };
        onAddMarker(newMarker);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.message || "تم إضافة العلامة بنجاح ✓" 
        }]);
        toast({
          title: "تم إضافة العلامة",
          description: data.message,
        });
      } else if (data.action === "move" && data.markerId && data.newCoordinates) {
        onMoveMarker(data.markerId, data.newCoordinates);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.message || "تم تحريك العلامة بنجاح ✓" 
        }]);
        toast({
          title: "تم تحريك العلامة",
          description: data.message,
        });
      } else if (data.message) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error calling AI:', error);
      const errorMessage = error.message || "حدث خطأ في الاتصال بالذكاء الاصطناعي";
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `عذراً، ${errorMessage}` 
      }]);
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[1000] rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 left-6 z-[1000] w-96 h-[500px] flex flex-col shadow-2xl" dir="rtl">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">مساعد الخريطة الذكي</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>مرحباً! يمكنني مساعدتك في:</p>
            <ul className="mt-2 text-right space-y-1">
              <li>• البحث عن أحداث عسكرية وبحرية</li>
              <li>• تلخيص المعلومات والأحداث المهمة</li>
              <li>• إضافة علامات تلقائياً من نتائج البحث</li>
              <li>• إدارة وتحريك العلامات الموجودة</li>
            </ul>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            disabled={isLoading}
            className="text-right"
            dir="rtl"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};
