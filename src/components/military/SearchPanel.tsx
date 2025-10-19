import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface SearchPanelProps {
  onSearch: (term: string) => void;
  searchTerm: string;
}

export const SearchPanel = ({ onSearch, searchTerm }: SearchPanelProps) => {
  return (
    <Card className="absolute top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[calc(100%-1rem)] sm:w-96 max-w-md bg-card/95 backdrop-blur" dir="rtl">
      <div className="relative p-1.5 sm:p-2">
        <Search className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ابحث عن موقع أو رمز..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="pr-8 sm:pr-10 text-right text-sm sm:text-base h-9 sm:h-10"
          dir="rtl"
        />
      </div>
    </Card>
  );
};
