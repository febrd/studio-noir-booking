
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit, Trash2, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CustomOrderForm from '@/components/studio/CustomOrderForm';
import { DatePicker } from '@/components/ui/date-picker';

interface CustomOrder {
  id: string;
  customer_id: string;
  studio_id: string;
  total_amount: number;
  payment_method: string;
  status: string;
  order_date: string;
  notes?: string;
  created_at: string;
  customer_profiles: {
    full_name: string;
    email: string;
    phone?: string;
  };
  studios: {
    name: string;
  };
  custom_order_services: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    additional_service_id: string;
    additional_services: {
      name: string;
    };
  }>;
}

const CustomOrdersPage = () => {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomOrder | null>(null);
  const [filters, setFilters] = useState({
    customerName: '',
    status: '',
    paymentMethod: '',
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('custom_orders')
        .select(`
          *,
          customer_profiles (
            full_name,
            email,
            phone
          ),
          studios (
            name
          ),
          custom_order_services (
            id,
            quantity,
            unit_price,
            total_price,
            additional_service_id,
            additional_services (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.customerName) {
        query = query.ilike('customer_profiles.full_name', `%${filters.customerName}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters.dateFrom) {
        query = query.gte('order_date', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('order_date', filters.dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: CustomOrder) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const { error } = await supabase
        .from('custom_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('custom_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    return method === 'online' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  const columns: ColumnDef<CustomOrder>[] = [
    {
      accessorKey: 'order_date',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.order_date), 'dd/MM/yyyy HH:mm')
    },
    {
      accessorKey: 'customer_profiles.full_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customer_profiles.full_name}</div>
          <div className="text-sm text-gray-500">{row.original.customer_profiles.email}</div>
        </div>
      )
    },
    {
      accessorKey: 'studios.name',
      header: 'Studio'
    },
    {
      accessorKey: 'payment_method',
      header: 'Payment',
      cell: ({ row }) => (
        <Badge className={getPaymentMethodColor(row.original.payment_method)}>
          {row.original.payment_method}
        </Badge>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          onValueChange={(value) => handleStatusChange(row.original.id, value)}
        >
          <SelectTrigger className="w-32">
            <Badge className={getStatusColor(row.original.status)}>
              {row.original.status}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'custom_order_services',
      header: 'Services',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.custom_order_services.map((service) => (
            <div key={service.id} className="text-sm">
              {service.additional_services.name} ({service.quantity}x)
            </div>
          ))}
        </div>
      )
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ row }) => `Rp ${row.original.total_amount.toLocaleString()}`
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  const handleFormSuccess = () => {
    fetchOrders();
  };

  const clearFilters = () => {
    setFilters({
      customerName: '',
      status: '',
      paymentMethod: '',
      dateFrom: undefined,
      dateTo: undefined
    });
  };

  // Apply filters when they change
  useEffect(() => {
    fetchOrders();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Orders</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Customer Name</label>
              <Input
                placeholder="Search by name..."
                value={filters.customerName}
                onChange={(e) => setFilters({...filters, customerName: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <Select
                value={filters.paymentMethod}
                onValueChange={(value) => setFilters({...filters, paymentMethod: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All methods</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date From</label>
              <DatePicker
                selected={filters.dateFrom}
                onSelect={(date) => setFilters({...filters, dateFrom: date})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date To</label>
              <DatePicker
                selected={filters.dateTo}
                onSelect={(date) => setFilters({...filters, dateTo: date})}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <DataTable columns={columns} data={orders} />
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <CustomOrderForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editingOrder={editingOrder}
      />
    </div>
  );
};

export default CustomOrdersPage;
