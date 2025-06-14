
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from '@/types';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="w-full max-w-xs">
      <Select onValueChange={(value) => onSelectCategory(value as Category)} defaultValue={selectedCategory}>
        <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:ring-offset-background">
          <SelectValue placeholder="Filter by category..." />
        </SelectTrigger>
        <SelectContent className="bg-popover text-popover-foreground border-border">
          {categories.map((category) => (
            <SelectItem key={category} value={category} className="hover:bg-accent focus:bg-accent">
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;
