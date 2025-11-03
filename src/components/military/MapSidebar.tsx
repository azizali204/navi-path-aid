import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Plus, 
  Save, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Pencil,
  Trash2,
  Menu,
  Bot,
  Send,
  LogOut
} from "lucide-react";
import { IconLabelsAr, CategoryLabelsAr, IconCategories } from "./MilitarySymbolIcons";
import { MarkersTable } from "./MarkersTable";
import { NewsEventsPanel } from "@/components/maritime/NewsEventsPanel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MapSidebarProps {
  activeCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  customMarkers: MarkerData[];
  onAddMarker: () => void;
  onEditMarker: (marker: MarkerData) => void;
  onDeleteMarker: (id: number) => void;
  onFocusMarker: (lat: number, lng: number) => void;
  onSaveView: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  map: any;
  onNewsEventsFound?: (events: any[]) => void;
  onAddMarkerFromAI?: (marker: Omit<MarkerData, 'id'>) => void;
  onLogout?: () => void;
}

export const MapSidebar = ({
  activeCategories,
  onToggleCategory,
  customMarkers,
  onAddMarker,
  onEditMarker,
  onDeleteMarker,
  onFocusMarker,
  onSaveView,
  searchTerm,
  onSearch,
  map,
  onNewsEventsFound,
  onAddMarkerFromAI,
  onLogout,
}: MapSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // AI Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getCategoryCount = (category: string) => {
    const types = IconCategories[category as keyof typeof IconCategories] || [];
    return customMarkers.filter(m => types.includes(m.icon)).length;
  };

  const handleAiSend = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('map-ai-chat', {
        body: { message: userMessage, markers: customMarkers }
      });

      if (error) throw error;

      if (data.action === "search_and_add" && data.markers && Array.isArray(data.markers)) {
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
          onAddMarkerFromAI?.(newMarker);
        });
        
        const responseMessage = `${data.summary || ""}\n\n${data.message || `تم إضافة ${data.markers.length} علامة بنجاح ✓`}`;
        setMessages(prev => [...prev, { role: "assistant", content: responseMessage }]);
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
        onAddMarkerFromAI?.(newMarker);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.message || "تم إضافة العلامة بنجاح ✓" 
        }]);
        toast({
          title: "تم إضافة العلامة",
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
      setIsAiLoading(false);
    }
  };

  const SidebarContent = () => (
    <>
      {/* الهيدر */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold">لوحة التحكم</h2>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="w-8 h-8 sm:w-10 sm:h-10"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
        </div>

        {/* أزرار رئيسية */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button onClick={onAddMarker} className="flex-1 gap-2 h-9 sm:h-10 text-sm sm:text-base">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              إضافة نقطة
            </Button>
            <Button onClick={onSaveView} variant="outline" className="gap-2 h-9 sm:h-10 text-sm sm:text-base">
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              حفظ
            </Button>
          </div>
        </div>
      </div>

      {/* البحث */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن نقطة..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pr-8 sm:pr-10 h-9 sm:h-10 text-sm sm:text-base"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* فئات الطبقات */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              الطبقات
            </h3>
            <Accordion type="multiple" defaultValue={['ships', 'facilities']} className="space-y-2">
              {Object.entries(CategoryLabelsAr).map(([key, label]) => {
                const types = IconCategories[key as keyof typeof IconCategories] || [];
                const activeCount = types.filter(t => activeCategories.has(t)).length;
                const count = getCategoryCount(key);
                
                return (
                  <AccordionItem key={key} value={key} className="border rounded-lg px-2 sm:px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs sm:text-sm">{label}</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {count > 0 && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 sm:h-auto">
                              {count}
                            </Badge>
                          )}
                          <Badge variant={activeCount > 0 ? "default" : "outline"} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                            {activeCount}/{types.length}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      {types.map((type) => (
                        <div key={type} className="flex items-center justify-between py-1">
                          <Label htmlFor={type} className="text-xs sm:text-sm cursor-pointer flex-1">
                            {IconLabelsAr[type]}
                          </Label>
                          <Switch
                            id={type}
                            checked={activeCategories.has(type)}
                            onCheckedChange={() => onToggleCategory(type)}
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          <Separator />

          {/* النقاط المخصصة */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
              النقاط المخصصة ({customMarkers.length})
            </h3>
            
            {customMarkers.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                لا توجد نقاط مخصصة
              </div>
            ) : (
              <div className="space-y-2">
                {customMarkers.slice(0, 5).map((marker) => (
                  <div
                    key={marker.id}
                    className="p-2 sm:p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-xs sm:text-sm">{marker.name_ar}</h4>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {IconLabelsAr[marker.icon]}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onFocusMarker(marker.lat, marker.lng);
                          if (isMobile) setIsOpen(false);
                        }}
                        className="h-7 px-2"
                      >
                        <MapPin className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onEditMarker(marker);
                          if (isMobile) setIsOpen(false);
                        }}
                        className="h-7 px-2"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteMarker(marker.id)}
                        className="h-7 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {customMarkers.length > 5 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                    و {customMarkers.length - 5} نقاط أخرى...
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* المساعد الذكي */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              المساعد الذكي
            </h3>
            
            <div className="bg-muted rounded-lg p-2 sm:p-3">
              <ScrollArea className="h-48 sm:h-64 mb-2 sm:mb-3" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-[10px] sm:text-xs py-4">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="mb-1">يمكنني مساعدتك في:</p>
                    <ul className="space-y-0.5 text-right">
                      <li>• البحث عن أحداث عسكرية وبحرية</li>
                      <li>• تلخيص المعلومات والأحداث</li>
                      <li>• إضافة علامات من نتائج البحث</li>
                    </ul>
                  </div>
                )}
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background"
                        }`}
                      >
                        <p className="text-[10px] sm:text-xs whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-end">
                      <div className="bg-background rounded-lg p-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-100" />
                          <div className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAiSend();
                }}
                className="flex gap-1"
              >
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="اسأل المساعد الذكي..."
                  disabled={isAiLoading}
                  className="text-right h-8 text-xs"
                  dir="rtl"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isAiLoading || !aiInput.trim()}
                  className="h-8 w-8"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            </div>
          </div>

          <Separator />

          {/* البحث عن الأحداث */}
          {onNewsEventsFound && (
            <>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                  البحث عن الأحداث
                </h3>
                <NewsEventsPanel onEventsFound={onNewsEventsFound} />
              </div>
              <Separator />
            </>
          )}

          {/* تسجيل الخروج */}
          {onLogout && (
            <div>
              <Button 
                onClick={onLogout}
                variant="destructive"
                className="w-full flex items-center justify-center gap-2"
                size="sm"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );

  // Mobile: Sheet overlay
  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="fixed top-2 right-2 z-[1001] w-10 h-10 shadow-lg"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 p-0" dir="rtl">
            <div className="h-full flex flex-col">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Collapsible sidebar
  if (isCollapsed) {
    return (
      <div className="w-12 sm:w-14 md:w-16 bg-card border-l border-border flex flex-col items-center py-3 sm:py-4 gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          title="فتح القائمة"
          className="w-8 h-8 sm:w-10 sm:h-10"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        
        <Separator />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddMarker}
          title="إضافة نقطة"
          className="text-primary w-8 h-8 sm:w-10 sm:h-10"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onSaveView}
          title="حفظ العرض"
          className="w-8 h-8 sm:w-10 sm:h-10"
        >
          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-96 h-screen bg-card border-l border-border flex flex-col">
      <SidebarContent />
    </div>
  );
};