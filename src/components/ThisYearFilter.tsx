
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ThisYearFilterProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ThisYearFilter: React.FC<ThisYearFilterProps> = ({ checked, onCheckedChange, disabled }) => {
  const currentYear = new Date().getFullYear();
  return (
    <div className="w-full max-w-xs flex items-center justify-between p-2 rounded-lg bg-input/50">
      <Label htmlFor="this-year-filter" className="text-sm font-medium cursor-pointer">
        Only Movies from {currentYear}
      </Label>
      <Switch
        id="this-year-filter"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};

export default ThisYearFilter;
