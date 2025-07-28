
import React from 'react';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';

interface CustomOrderDateFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export const CustomOrderDateFilter: React.FC<CustomOrderDateFilterProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <DatePickerWithRange
      value={dateRange}
      onChange={onDateRangeChange}
      placeholder="Filter by date range"
      className="w-full"
    />
  );
};
