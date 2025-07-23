
import { useMemo } from 'react';
import { WalkinFilters } from '@/components/studio/WalkinSessionsFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export const useWalkinSessionsFilter = (sessions: any[], filters: WalkinFilters) => {
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];

    return sessions.filter((session) => {
      // Date range filter
      if (filters.dateRange?.from) {
        const sessionDate = new Date(session.created_at);
        const fromDate = startOfDay(filters.dateRange.from);
        const toDate = filters.dateRange.to ? endOfDay(filters.dateRange.to) : endOfDay(filters.dateRange.from);
        
        if (!isWithinInterval(sessionDate, { start: fromDate, end: toDate })) {
          return false;
        }
      }

      // Search query filter (realtime)
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const customerName = session.users?.name?.toLowerCase() || '';
        const customerEmail = session.users?.email?.toLowerCase() || '';
        
        if (!customerName.includes(query) && !customerEmail.includes(query)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && session.status !== filters.status) {
        return false;
      }

      // Studio filter
      if (filters.studioId !== 'all' && session.studio_id !== filters.studioId) {
        return false;
      }

      return true;
    });
  }, [sessions, filters.dateRange, debouncedSearchQuery, filters.status, filters.studioId]);

  return {
    filteredSessions,
    totalSessions: sessions?.length || 0,
    filteredCount: filteredSessions.length,
    isFiltered: filters.dateRange || debouncedSearchQuery || filters.status !== 'all' || filters.studioId !== 'all'
  };
};
