import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilitarySymbolIcons, IconLabelsAr, IconCategories, CategoryLabelsAr } from "./MilitarySymbolIcons";
import { Search } from "lucide-react";

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

export const IconPicker = ({ selectedIcon, onSelectIcon }: IconPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filterIcons = (icons: string[]) => {
    if (!searchTerm.trim()) return icons;
    
    return icons.filter(icon => {
      const label = IconLabelsAr[icon] || icon;
      return label.includes(searchTerm) || icon.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const renderIconGrid = (icons: string[]) => {
    const filtered = filterIcons(icons);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد نتائج
        </div>
      );
    }

    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {filtered.map((iconKey) => {
          const isSelected = selectedIcon === iconKey;
          return (
            <button
              key={iconKey}
              type="button"
              onClick={() => onSelectIcon(iconKey)}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                hover:border-primary hover:bg-primary/10
                ${isSelected ? 'border-primary bg-primary/20' : 'border-border'}
              `}
              title={IconLabelsAr[iconKey]}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: MilitarySymbolIcons[iconKey as keyof typeof MilitarySymbolIcons] }}
                className="w-8 h-8"
              />
              <span className="text-xs text-center line-clamp-2">
                {IconLabelsAr[iconKey]}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      {/* معاينة الأيقونة المختارة */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <div 
          dangerouslySetInnerHTML={{ __html: MilitarySymbolIcons[selectedIcon as keyof typeof MilitarySymbolIcons] || MilitarySymbolIcons.default }}
          className="w-12 h-12"
        />
        <div>
          <div className="font-semibold">{IconLabelsAr[selectedIcon] || 'افتراضي'}</div>
          <div className="text-sm text-muted-foreground">{selectedIcon}</div>
        </div>
      </div>

      {/* بحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ابحث عن أيقونة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* تبويبات الفئات */}
      <Tabs defaultValue="all" dir="rtl">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">الكل</TabsTrigger>
          {Object.entries(CategoryLabelsAr).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="h-[300px] mt-4">
          <TabsContent value="all" className="mt-0">
            {renderIconGrid(Object.keys(MilitarySymbolIcons))}
          </TabsContent>

          {Object.entries(IconCategories).map(([category, icons]) => (
            <TabsContent key={category} value={category} className="mt-0">
              {renderIconGrid(icons)}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
};