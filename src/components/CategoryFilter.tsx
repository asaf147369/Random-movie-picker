
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { AppCategory, SelectedCategoryType } from '@/types';
import { ChevronDown } from 'lucide-react';

interface CategoryFilterProps {
  categories: AppCategory[];
  selectedCategory: SelectedCategoryType;
  onSelectCategory: (categoryId: number) => void;
  isLoading?: boolean;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory, isLoading }) => {
  
  const getSelectedCategoryNames = () => {
    if (isLoading) return "Loading categories...";
    if (selectedCategory.length === 0) return "Filter by category...";
    
    const names = categories
      .filter(c => selectedCategory.includes(c.id))
      .map(c => c.name);

    if (names.length === 0 && selectedCategory.length > 0) return "Loading...";
    if (names.length === 0) return "Filter by category...";

    return names.join(', ');
  };

  return (
    <div className="w-full max-w-xs">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLoading || categories.length === 0}>
          <Button variant="outline" className="w-full justify-between bg-input text-foreground border-border focus:ring-ring focus:ring-offset-background h-10 px-3 py-2">
            <span className="truncate pr-2">{getSelectedCategoryNames()}</span>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-96 overflow-y-auto">
          <DropdownMenuLabel>Select up to 3 genres</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category.id}
              checked={selectedCategory.includes(category.id)}
              onCheckedChange={() => onSelectCategory(category.id)}
            >
              {category.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CategoryFilter;
