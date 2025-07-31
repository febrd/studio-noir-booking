
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CustomOrderForm from '@/components/studio/CustomOrderForm';
import CustomOrderDateFilter from '@/components/studio/CustomOrderDateFilter';

const CustomOrdersPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [deletingOrder, setDeletingOrder] = useState<any>(null);
  const [dateRange, setDateRange] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: customOrders, isLoading } = useQuery({
    queryKey: ['custom-orders', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('custom_orders')
        .select(`
          *,
          studios (name),
          customers (name, phone, email)
        `)
        .order('created_at', { ascending: false });

      // Apply date filter if exists
      if (dateRange?.from) {
        query = query.gte('order_date', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        query = query.lte('order_date', dateRange.to.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return data?.map(order => ({
        ...order,
        customer_name: order.customers?.name || 'Unknown Customer',
        studio_name: order.studios?.name || 'Unknown Studio'
      })) || [];
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('custom_orders')
        .delete()
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-orders'] });
      toast.success('Custom order berhasil dihapus');
      setDeletingOrder(null);
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
      toast.error('Gagal menghapus custom order');
    }
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['custom-orders'] });
  };

  const handleEditSuccess = () => {
    setEditingOrder(null);
    queryClient.invalidateQueries({ queryKey: ['custom-orders'] });
  };

  const handleDelete = (order: any) => {
    setDeletingOrder(order);
  };

  const confirmDelete = () => {
    if (deletingOrder) {
      deleteOrderMutation.mutate(deletingOrder.id);
    }
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading custom orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Orders</h1>
          <p className="text-gray-600">Kelola pesanan khusus pelanggan</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Custom Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Custom Order</DialogTitle>
            </DialogHeader>
            <CustomOrderForm 
              isOpen={isCreateDialogOpen}
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={handleCreateSuccess} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <CustomOrderDateFilter 
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange} 
      />

      <div className="grid gap-6">
        {customOrders?.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                      <p className="text-sm text-gray-600">{order.studio_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingOrder(order)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(order)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{new Date(order.order_date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{order.customers?.phone || 'No phone'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Payment: {order.payment_method}
                  </div>
                  <div className="text-sm text-gray-600">
                    Custom service details available
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>IDR {order.total_amount?.toLocaleString('id-ID') || '0'}</span>
                  </div>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {customOrders?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada custom order</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan custom order pertama</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Custom Order
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Custom Order</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <CustomOrderForm 
              isOpen={!!editingOrder}
              onClose={() => setEditingOrder(null)}
              order={editingOrder} 
              onSuccess={handleEditSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Custom Order</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus custom order untuk "{deletingOrder?.customer_name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomOrdersPage;
