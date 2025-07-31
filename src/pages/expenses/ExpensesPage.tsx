
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Receipt, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import type { Expense } from '@/types/expenses';

const ExpensesPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<any>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', selectedDateRange, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          users (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedDateRange?.from) {
        query = query.gte('created_at', selectedDateRange.from.toISOString());
      }
      if (selectedDateRange?.to) {
        query = query.lte('created_at', selectedDateRange.to.toISOString());
      }
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    },
  });

  const handleDeleteExpense = (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(expenseId);
    }
  };

  const handleDateRangeChange = (dateRange: any) => {
    setSelectedDateRange(dateRange);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses Management</h1>
          <p className="text-gray-600">Kelola pengeluaran dan biaya operasional</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
            </DialogHeader>
            <ExpenseForm 
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <ExpenseFilters
        selectedDateRange={selectedDateRange}
        selectedCategory={selectedCategory}
        onDateRangeChange={handleDateRangeChange}
        onCategoryChange={handleCategoryChange}
      />

      <ExpenseTable
        expenses={expenses || []}
        isLoading={isLoading}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
      />

      {editingExpense && (
        <ExpenseForm
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null);
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
          }}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
