
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
import CustomOrderForm from '@/components/studio/CustomOrderForm';
import { ModernLayout } from '@/components/Layout/ModernLayout';

interface CustomOrder {
  id: string;
  created_at: string;
  customer_id: string;
  studio_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  payment_method: string;
  customer_profiles: {
    full_name: string;
    email: string;
  } | null;
}

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

const CustomOrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomOrder | null>(null);
  const queryClient = useQueryClient();

  const { data: customOrders, isLoading, isError } = useQuery({
    queryKey: ['custom-orders', searchQuery, statusFilter],
    queryFn: async () => {
      console.log('Fetching custom orders...');
      
      // First, get the custom orders
      let ordersQuery = supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        ordersQuery = ordersQuery.eq('status', statusFilter);
      }

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError) {
        console.error('Error fetching custom orders:', ordersError);
        throw new Error(ordersError.message);
      }

      if (!orders || orders.length === 0) {
        return [];
      }

      // Get all unique customer IDs
      const customerIds = [...new Set(orders.map(order => order.customer_id))];

      // Fetch customer profiles for these IDs
      const { data: customerProfiles, error: profilesError } = await supabase
        .from('customer_profiles')
        .select('id, full_name, email')
        .in('id', customerIds);

      if (profilesError) {
        console.error('Error fetching customer profiles:', profilesError);
        throw new Error(profilesError.message);
      }

      // Create a map of customer profiles for quick lookup
      const profilesMap = new Map(
        customerProfiles?.map(profile => [profile.id, profile]) || []
      );

      // Combine orders with customer profiles
      const ordersWithProfiles = orders.map(order => ({
        ...order,
        customer_profiles: profilesMap.get(order.customer_id) || null
      }));

      // Filter by search query if provided
      if (searchQuery) {
        return ordersWithProfiles.filter(order => {
          const customerName = order.customer_profiles?.full_name?.toLowerCase() || '';
          return customerName.includes(searchQuery.toLowerCase());
        });
      }

      return ordersWithProfiles;
    }
  });

  const { mutate: deleteOrder } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_orders')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Order deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['custom-orders'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete order: ${error.message}`);
    },
  });

  const handleEdit = (order: CustomOrder) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrder(id);
    }
  };

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
                isOpen={isDialogOpen}
                onClose={() => {
                  setIsDialogOpen(false);
                  setEditingOrder(null);
                }}
                onSuccess={() => {
                  setIsDialogOpen(false);
                  setEditingOrder(null);
                  queryClient.invalidateQueries({ queryKey: ['custom-orders'] });
                }}
                editingOrder={editingOrder}
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
            {customOrders && customOrders.length > 0 ? (
              customOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      {order.customer_profiles?.full_name || 'Unknown Customer'}
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
                    <p className="text-sm text-muted-foreground">
                      Email: {order.customer_profiles?.email || 'No email'}
                    </p>
                    <p className="text-sm text-muted-foreground">Payment: {order.payment_method}</p>
                    <p className="font-semibold">Total: Rp {order.total_amount.toLocaleString('id-ID')}</p>
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
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">No custom orders found.</p>
            )}
          </div>
        )}
      </div>
    </ModernLayout>
  );
};

export default CustomOrdersPage;
