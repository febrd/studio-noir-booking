
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Edit, Trash2, Search, Filter, Plus, Phone, MapPin, Calendar } from 'lucide-react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { AddCustomerForm } from '@/components/admin/AddCustomerForm';
import { EditCustomerForm } from '@/components/admin/EditCustomerForm';

const Customers = () => {
  const { userProfile } = useJWTAuth();
  const queryClient = useQueryClient();
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ['customers', searchTerm, statusFilter],
    queryFn: async () => {
      console.log('Fetching customers...');
      let query = supabase
        .from('customer_profiles')
        .select('*');

      // Apply search filter
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      console.log('Customers data:', data);
      console.log('Customers error:', error);
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      return data;
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customer_profiles')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Customer berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      console.error('Error deleting customer:', error);
      toast.error('Gagal menghapus customer: ' + error.message);
    },
  });

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus customer ini?')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
  };

  const canManageCustomers = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  const filteredCustomers = customers || [];

  const handleAddSuccess = () => {
    setShowAddForm(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleEditSuccess = () => {
    setEditingCustomer(null);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Customer</h1>
            <p className="text-muted-foreground">
              Kelola profil data customer
            </p>
          </div>
          
          {canManageCustomers && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Customer
            </Button>
          )}
        </div>

        {/* Filter and Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Cari Customer</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama, email, atau telepon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p>Memuat customer...</p>
              </CardContent>
            </Card>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="glass-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {customer.full_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span>{customer.email}</span>
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                        </CardDescription>
                        <div className="mt-2 flex gap-2">
                          <Badge variant={customer.is_active ? "default" : "secondary"}>
                            {customer.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                          {customer.gender && (
                            <Badge variant="outline">
                              {customer.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {canManageCustomers && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={deleteCustomerMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {customer.address && (
                      <div>
                        <p className="font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Alamat
                        </p>
                        <p className="text-sm">{customer.address}</p>
                      </div>
                    )}
                    {customer.date_of_birth && (
                      <div>
                        <p className="font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Tanggal Lahir
                        </p>
                        <p>{new Date(customer.date_of_birth).toLocaleDateString('id-ID')}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-muted-foreground">Bergabung</p>
                      <p>{new Date(customer.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    {customer.notes && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="font-medium text-muted-foreground">Catatan</p>
                        <p className="text-sm">{customer.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' ? 'Tidak ada customer yang sesuai dengan filter' : 'Belum ada customer yang terdaftar'}
                </p>
                {canManageCustomers && !searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Customer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {showAddForm && (
          <AddCustomerForm 
            open={showAddForm}
            onOpenChange={setShowAddForm}
            onSuccess={handleAddSuccess}
          />
        )}

        {editingCustomer && (
          <EditCustomerForm 
            customer={editingCustomer}
            open={!!editingCustomer}
            onOpenChange={(open) => !open && setEditingCustomer(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </ModernLayout>
  );
};

export default Customers;
