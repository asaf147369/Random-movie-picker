
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppCategory, SelectedCategoryType, TmdbGenre } from '@/types';

interface CategoryFilterProps {
  categories: AppCategory[]; // Expects TmdbGenre[] plus an "All" option
  selectedCategory: SelectedCategoryType;
  onSelectCategory: (categoryId: SelectedCategoryType) => void;
  isLoading?: boolean;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory, isLoading }) => {
  
  const handleValueChange = (value: string) => {
    if (value === "All") {
      onSelectCategory("All");
    } else {
      onSelectCategory(parseInt(value, 10));
    }
  };

  return (
    <div className="w-full max-w-xs">
      <Select 
        onValueChange={handleValueChange} 
        value={selectedCategory === "All" ? "All" : String(selectedCategory)}
        disabled={isLoading || categories.length === 0}
      >
        <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:ring-offset-background">
          <SelectValue placeholder={isLoading ? "Loading categories..." : "Filter by category..."} />
        </SelectTrigger>
        <SelectContent className="bg-popover text-popover-foreground border-border">
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : (
            categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)} className="hover:bg-accent focus:bg-accent">
                {category.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;
