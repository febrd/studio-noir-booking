import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ShoppingCart, Calendar, DollarSign, Users, Package, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CustomOrderForm from '@/components/studio/CustomOrderForm';
import { CustomOrderDateFilter } from '@/components/studio/CustomOrderDateFilter';

const CustomOrdersPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [deletingOrder, setDeletingOrder] = useState<any>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: customOrders, isLoading } = useQuery({
    queryKey: ['customOrders', selectedDateRange],
    queryFn: async () => {
      let query = supabase
        .from('custom_orders')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });

      if (selectedDateRange?.from && selectedDateRange?.to) {
        query = query.gte('created_at', selectedDateRange.from.toISOString());
        query = query.lte('created_at', selectedDateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
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
      queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      toast.success('Pesanan berhasil dihapus');
      setDeletingOrder(null);
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
      toast.error('Gagal menghapus pesanan');
    }
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['customOrders'] });
  };

  const handleEditSuccess = () => {
    setEditingOrder(null);
    queryClient.invalidateQueries({ queryKey: ['customOrders'] });
  };

  const handleDelete = (order: any) => {
    setDeletingOrder(order);
  };

  const confirmDelete = () => {
    if (deletingOrder) {
      deleteOrderMutation.mutate(deletingOrder.id);
    }
  };

  const totalOrders = customOrders?.length || 0;
  const totalRevenue = customOrders?.reduce((sum, order) => sum + order.total_price, 0) || 0;

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
          <p className="text-gray-600">Kelola pesanan khusus dan paket custom</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Pesanan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pesanan Baru</DialogTitle>
            </DialogHeader>
            <CustomOrderForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-gray-500">Jumlah pesanan custom</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            <p className="text-gray-500">Pendapatan dari pesanan custom</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Daftar Pesanan</h2>
        <CustomOrderDateFilter onDateRangeChange={setSelectedDateRange} />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Total Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customOrders?.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell>{order.customer?.name || 'Pelanggan tidak dikenal'}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{order.description}</TableCell>
                <TableCell>Rp {order.total_price.toLocaleString('id-ID')}</TableCell>
                <TableCell>
                  <Badge variant={order.is_completed ? 'success' : 'secondary'}>
                    {order.is_completed ? 'Selesai' : 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {customOrders?.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pesanan custom</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan pesanan custom pertama Anda</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pesanan
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pesanan</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <CustomOrderForm
              order={editingOrder}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pesanan</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">
            Apakah Anda yakin ingin menghapus pesanan ini?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingOrder(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomOrdersPage;
