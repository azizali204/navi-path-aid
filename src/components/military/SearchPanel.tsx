import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface SearchPanelProps {
  onSearch: (term: string) => void;
  searchTerm: string;
}

export const SearchPanel = ({ onSearch, searchTerm }: SearchPanelProps) => {
  return (
    <Card className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-96 bg-card/95 backdrop-blur" dir="rtl">
      <div className="relative p-2">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ابحث عن موقع أو رمز..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="pr-10 text-right"
          dir="rtl"
        />
      </div>
    </Card>
  );
};
