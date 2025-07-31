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
import { DateRange } from 'react-day-picker';
import { CustomOrderDateFilter } from '@/components/studio/CustomOrderDateFilter';
import CustomOrderForm from '@/components/studio/CustomOrderForm';

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
    id: string;
    full_name: string;
    email: string;
  } | null;
  custom_order_services?: Array<{
    id: string;
    additional_service_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    additional_services?: {
      id: string;
      name: string;
      price: number;
      description?: string;
    };
  }>;
}

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

const CustomOrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomOrder | null>(null);
  const queryClient = useQueryClient();

  const { data: customOrders, isLoading, isError } = useQuery({
    queryKey: ['custom-orders', searchQuery, statusFilter, dateRange],
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

      // Apply date range filter
      if (dateRange?.from) {
        ordersQuery = ordersQuery.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Set to end of day
        ordersQuery = ordersQuery.lte('created_at', toDate.toISOString());
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

      // Get order IDs for fetching services
      const orderIds = orders.map(order => order.id);

      // Fetch custom order services with explicit foreign key hinting
      const { data: orderServices, error: servicesError } = await supabase
        .from('custom_order_services')
        .select(`
          id,
          custom_order_id,
          additional_service_id,
          quantity,
          unit_price,
          total_price,
          additional_services!custom_order_services_additional_service_id_fkey (
            id,
            name,
            price,
            description
          )
        `)
        .in('custom_order_id', orderIds);

      if (servicesError) {
        console.error('Error fetching order services:', servicesError);
        // Don't throw error, just continue without services
      }

      // Create a map of customer profiles for quick lookup
      const profilesMap = new Map(
        customerProfiles?.map(profile => [profile.id, profile]) || []
      );

      // Create a map of services grouped by order ID
      const servicesMap = new Map<string, any[]>();
      if (orderServices) {
        orderServices.forEach(service => {
          const orderId = service.custom_order_id;
          if (!servicesMap.has(orderId)) {
            servicesMap.set(orderId, []);
          }
          servicesMap.get(orderId)?.push(service);
        });
      }

      // Combine orders with customer profiles and services
      const ordersWithProfiles = orders.map(order => ({
        ...order,
        status: order.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        customer_profiles: profilesMap.get(order.customer_id) || null,
        custom_order_services: servicesMap.get(order.id) || []
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

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOrder(null);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingOrder(null);
    queryClient.invalidateQueries({ queryKey: ['custom-orders'] });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateRange(undefined);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Orders</h1>
          <p className="text-muted-foreground">Manage custom photography orders</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Custom Order
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterType)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <CustomOrderDateFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Clear Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading custom orders...</p>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-red-500">Error fetching custom orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customOrders && customOrders.length > 0 ? (
            customOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="truncate">{order.customer_profiles?.full_name || 'Unknown Customer'}</span>
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
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Order Date: {format(new Date(order.created_at), 'dd MMMM yyyy', { locale: id })}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      Email: {order.customer_profiles?.email || 'No email'}
                    </p>
                    <p className="text-sm text-muted-foreground">Payment: {order.payment_method}</p>
                    <p className="font-semibold">Total: Rp {order.total_amount.toLocaleString('id-ID')}</p>
                    {order.notes && (
                      <p className="text-sm text-gray-500 truncate">Notes: {order.notes}</p>
                    )}
                  </div>
                  
                  {/* Display selected services */}
                  {order.custom_order_services && order.custom_order_services.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Layanan:</p>
                      <div className="space-y-1">
                        {order.custom_order_services.map((service) => (
                          <div key={service.id} className="text-xs bg-gray-50 p-2 rounded">
                            <span className="font-medium">{service.additional_services?.name || 'Unknown Service'}</span>
                            <span className="text-muted-foreground ml-2">
                              {service.quantity}x - Rp {service.total_price.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
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
            <div className="col-span-3 text-center py-8">
              <p className="text-muted-foreground">No custom orders found.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? 'Edit Custom Order' : 'Create New Custom Order'}
            </DialogTitle>
          </DialogHeader>
          <CustomOrderForm
            isOpen={isDialogOpen}
            onClose={handleCloseDialog}
            onSuccess={handleSuccess}
            editingOrder={editingOrder}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomOrdersPage;
