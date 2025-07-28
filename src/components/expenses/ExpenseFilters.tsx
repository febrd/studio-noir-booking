
import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';

export interface ExpenseFilters {
  search: string;
  dateRange: DateRange | undefined;
  period: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  performedBy: string;
}

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  onFiltersChange: (filters: Partial<ExpenseFilters>) => void;
}

export const ExpenseFilters = ({ filters, onFiltersChange }: ExpenseFiltersProps) => {
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(filters.dateRange);

  const handlePeriodChange = (period: ExpenseFilters['period']) => {
    onFiltersChange({ period });
    
    if (period !== 'custom') {
      onFiltersChange({ dateRange: undefined });
    }
  };

  const handleCustomDateChange = (dateRange: DateRange | undefined) => {
    setCustomDateRange(dateRange);
    onFiltersChange({ 
      period: 'custom',
      dateRange: dateRange 
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Period</Label>
        <Select value={filters.period} onValueChange={handlePeriodChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filters.period === 'custom' && (
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !customDateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customDateRange?.from ? (
                  customDateRange.to ? (
                    <>
                      {format(customDateRange.from, "LLL dd, y")} -{" "}
                      {format(customDateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(customDateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={customDateRange?.from}
                selected={customDateRange}
                onSelect={handleCustomDateChange}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="space-y-2">
        <Label>Performed By</Label>
        <Select value={filters.performedBy} onValueChange={(value) => onFiltersChange({ performedBy: value })}>
          <SelectTrigger>
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {/* Add dynamic user options here if needed */}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
