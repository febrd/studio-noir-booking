
import { useState } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DateRange } from 'react-day-picker';
import type { ExpenseFilters } from '@/components/expenses/ExpenseFilters';

export const useExpenseFilters = () => {
  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '',
    dateRange: undefined,
    period: 'all',
    performedBy: 'all',
  });

  const updateFilters = (newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      dateRange: undefined,
      period: 'all',
      performedBy: 'all',
    });
  };

  const getDateRangeForPeriod = (period: ExpenseFilters['period']): DateRange | undefined => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        return {
          from: startOfDay(now),
          to: endOfDay(now),
        };
      case 'week':
        return {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case 'year':
        return {
          from: startOfYear(now),
          to: endOfYear(now),
        };
      case 'custom':
        return filters.dateRange;
      default:
        return undefined;
    }
  };

  const getFilteredQuery = (query: any) => {
    let filteredQuery = query;

    // Apply search filter
    if (filters.search) {
      filteredQuery = filteredQuery.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Apply date range filter
    const dateRange = getDateRangeForPeriod(filters.period);
    if (dateRange?.from && dateRange?.to) {
      filteredQuery = filteredQuery
        .gte('date', dateRange.from.toISOString())
        .lte('date', dateRange.to.toISOString());
    }

    // Apply performed by filter
    if (filters.performedBy !== 'all') {
      filteredQuery = filteredQuery.eq('performed_by', filters.performedBy);
    }

    return filteredQuery;
  };

  return {
    filters,
    updateFilters,
    resetFilters,
    getFilteredQuery,
  };
};
