import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ShoppingCart, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import CustomOrderForm from '@/components/studio/CustomOrderForm';
import { CustomOrderDateFilter } from '@/components/studio/CustomOrderDateFilter';

const CustomOrdersPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<any>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const queryClient = useQueryClient();

  const { data: customOrders, isLoading } = useQuery({
    queryKey: ['customOrders', selectedDateRange],
    queryFn: async () => {
      let query = supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedDateRange.from) {
        query = query.gte('created_at', selectedDateRange.from.toISOString());
      }
      if (selectedDateRange.to) {
        query = query.lte('created_at', selectedDateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createCustomOrderMutation = useMutation({
    mutationFn: async (newOrder: any) => {
      const { data, error } = await supabase
        .from('custom_orders')
        .insert([newOrder]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      toast.success('Custom order berhasil ditambahkan');
    },
    onError: (error) => {
      console.error('Error creating custom order:', error);
      toast.error('Gagal menambahkan custom order');
    },
  });

  const updateCustomOrderMutation = useMutation({
    mutationFn: async (updatedOrder: any) => {
      const { data, error } = await supabase
        .from('custom_orders')
        .update(updatedOrder)
        .eq('id', updatedOrder.id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      toast.success('Custom order berhasil diperbarui');
    },
    onError: (error) => {
      console.error('Error updating custom order:', error);
      toast.error('Gagal memperbarui custom order');
    },
  });

  const deleteCustomOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('custom_orders')
        .delete()
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      toast.success('Custom order berhasil dihapus');
    },
    onError: (error) => {
      console.error('Error deleting custom order:', error);
      toast.error('Gagal menghapus custom order');
    },
  });

  const handleDateRangeChange = (dates: any) => {
    setSelectedDateRange(dates);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Orders</h1>
          <p className="text-gray-600">Kelola pesanan kustom dan khusus</p>
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
            <CustomOrderForm onSuccess={() => {
              setIsCreateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['customOrders'] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <CustomOrderDateFilter onDateRangeChange={handleDateRangeChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customOrders?.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Deskripsi:</span> {order.description}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Harga:</span> {order.price}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customOrders?.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada custom order</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan custom order pertama Anda</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Custom Order
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomOrdersPage;
