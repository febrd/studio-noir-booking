import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CustomOrderForm } from '@/components/studio/CustomOrderForm';
import { ModernLayout } from '@/components/Layout/ModernLayout';

interface CustomOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_price: number;
  studio_id: string;
  notes: string | null;
}

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

const CustomOrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomOrder | null>(null);
  const queryClient = useQueryClient();

  const { data: customOrders, isLoading, isError } = useQuery<CustomOrder[]>(
    ['custom-orders', searchQuery, statusFilter],
    async () => {
      let query = supabase
        .from<CustomOrder>('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('customer_name', `%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    }
  );

  const { mutate: deleteOrder } = useMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('custom_orders')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        toast.success('Order deleted successfully!');
        queryClient.invalidateQueries({ queryKey: ['custom-orders'] });
      },
      onError: (error: any) => {
        toast.error(`Failed to delete order: ${error.message}`);
      },
    }
  );

  const handleEdit = (order: CustomOrder) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrder(id);
    }
  };

  const filteredOrders = customOrders?.filter(order => {
    const searchTerm = searchQuery.toLowerCase();
    const customerName = order.customer_name.toLowerCase();
    return customerName.includes(searchTerm);
  }) || [];

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Custom Orders</h1>
            <p className="text-muted-foreground">Manage custom photography orders</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Custom Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrder ? 'Edit Custom Order' : 'Create New Custom Order'}
                </DialogTitle>
              </DialogHeader>
              <CustomOrderForm
                order={editingOrder}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setEditingOrder(null);
                  queryClient.invalidateQueries({ queryKey: ['custom-orders'] });
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingOrder(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder="Search customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="col-span-2"
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterType)}>
            <SelectTrigger className="col-span-1">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p>Loading custom orders...</p>
        ) : isError ? (
          <p>Error fetching custom orders.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    {order.customer_name}
                    <Badge
                      variant="secondary"
                      className={
                        order.status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : order.status === 'in_progress'
                            ? 'bg-blue-500 text-white'
                            : order.status === 'completed'
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                      }
                    >
                      {order.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Order Date: {format(new Date(order.created_at), 'dd MMMM yyyy', { locale: id })}
                  </p>
                  <p className="text-sm text-muted-foreground">Email: {order.customer_email}</p>
                  <p className="text-sm text-muted-foreground">Description: {order.description}</p>
                  <p className="font-semibold">Total: Rp {order.total_price.toLocaleString('id-ID')}</p>
                  {order.notes && <p className="text-sm text-gray-500">Notes: {order.notes}</p>}
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(order)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(order.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ModernLayout>
  );
};

export default CustomOrdersPage;
