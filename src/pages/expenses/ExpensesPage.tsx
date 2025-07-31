
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters';
import { useExpenseFilters } from '@/hooks/useExpenseFilters';
import { JWTProtectedRoute } from '@/components/auth/JWTProtectedRoute';
import { ModernLayout } from '@/components/Layout/ModernLayout';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  description?: string;
  date: string;
  performed_by: string;
  note_file_path?: string;
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
    email: string;
  };
}

const ExpensesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { filters, updateFilters, resetFilters, getFilteredQuery } = useExpenseFilters();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          users:performed_by (
            name,
            email
          )
        `)
        .order('date', { ascending: false });

      // Apply filters
      const filteredQuery = getFilteredQuery(query);
      const { data, error } = await filteredQuery;
      
      if (error) throw error;
      return data as Expense[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    handleFormClose();
  };

  return (
    <JWTProtectedRoute allowedRoles={['admin', 'owner', 'keuangan']}>
      <ModernLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Daftar Pengeluaran</h1>
              <p className="text-muted-foreground">Kelola dan pantau pengeluaran perusahaan</p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengeluaran Studio
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filter Pengeluaran Studio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Cari pengeluaran..."
                    value={filters.search}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
              
              {showFilters && (
                <div className="mt-4">
                  <ExpenseFilters
                    filters={filters}
                    onFiltersChange={updateFilters}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <ExpenseTable
            expenses={expenses}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {showForm && (
            <ExpenseForm
              expense={editingExpense}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
          )}
        </div>
      </ModernLayout>
    </JWTProtectedRoute>
  );
};

export default ExpensesPage;
