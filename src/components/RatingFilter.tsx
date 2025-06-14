
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface RatingFilterProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const RatingFilter: React.FC<RatingFilterProps> = ({ value, onChange, disabled }) => {
  const handleValueChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  return (
    <div className="w-full max-w-xs space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="rating-slider" className="text-sm font-medium">
          Minimum Rating
        </Label>
        <span className="text-sm font-semibold text-primary">{value.toFixed(1)}</span>
      </div>
      <Slider
        id="rating-slider"
        min={0}
        max={10}
        step={0.5}
        value={[value]}
        onValueChange={handleValueChange}
        disabled={disabled}
      />
    </div>
  );
};

export default RatingFilter;
