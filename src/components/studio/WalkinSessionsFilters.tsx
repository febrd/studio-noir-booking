
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface FilterProps {
  onFilterChange: (filters: WalkinFilters) => void;
  studios: any[];
  isLoading?: boolean;
}

export interface WalkinFilters {
  dateRange: DateRange | undefined;
  searchQuery: string;
  status: string;
  studioId: string;
}

const WalkinSessionsFilters = ({ onFilterChange, studios, isLoading = false }: FilterProps) => {
  const [filters, setFilters] = useState<WalkinFilters>({
    dateRange: undefined,
    searchQuery: '',
    status: 'all',
    studioId: 'all'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (newFilters: Partial<WalkinFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleReset = () => {
    const resetFilters: WalkinFilters = {
      dateRange: undefined,
      searchQuery: '',
      status: 'all',
      studioId: 'all'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = filters.dateRange || filters.searchQuery || filters.status !== 'all' || filters.studioId !== 'all';

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm"
          >
            {isExpanded ? 'Sembunyikan' : 'Tampilkan'} Filter
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama atau email customer..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
              className="pl-10"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rentang Tanggal</label>
              <DatePickerWithRange
                value={filters.dateRange}
                onChange={(range) => handleFilterChange({ dateRange: range })}
                placeholder="Pilih rentang tanggal"
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange({ status: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Studio Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Studio</label>
              <Select
                value={filters.studioId}
                onValueChange={(value) => handleFilterChange({ studioId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih studio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Studio</SelectItem>
                  {studios?.map((studio) => (
                    <SelectItem key={studio.id} value={studio.id}>
                      {studio.name} ({studio.type === 'self_photo' ? 'Self Photo' : 'Regular'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {hasActiveFilters && (
                <span className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Filter aktif
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasActiveFilters || isLoading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Reset Filter
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default WalkinSessionsFilters;
