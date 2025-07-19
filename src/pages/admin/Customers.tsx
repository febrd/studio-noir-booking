
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Edit, Trash2, Search, Filter, Plus, Phone, Mail, MapPin, Calendar, FileText } from 'lucide-react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddCustomerForm } from '@/components/admin/AddCustomerForm';
import { EditCustomerForm } from '@/components/admin/EditCustomerForm';
import { useState } from 'react';

interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Customers = () => {
  const { userProfile } = useJWTAuth();
  const queryClient = useQueryClient();
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ['customers', searchTerm, statusFilter, genderFilter],
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

      // Apply gender filter
      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      console.log('Customers data:', data);
      console.log('Customers error:', error);
      
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      return data as CustomerProfile[];
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

  const toggleCustomerStatusMutation = useMutation({
    mutationFn: async ({ customerId, isActive }: { customerId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('customer_profiles')
        .update({ is_active: isActive })
        .eq('id', customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status customer berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      console.error('Error updating customer status:', error);
      toast.error('Gagal memperbarui status customer: ' + error.message);
    },
  });

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus customer ini?')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleEditCustomer = (customer: CustomerProfile) => {
    setEditingCustomer(customer);
  };

  const handleToggleStatus = (customerId: string, currentStatus: boolean) => {
    toggleCustomerStatusMutation.mutate({ customerId, isActive: !currentStatus });
  };

  const canManageCustomers = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  if (!canManageCustomers) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center h-64">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">Akses Ditolak</h2>
              <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            </CardContent>
          </Card>
        </div>
      </ModernLayout>
    );
  }

  const filteredCustomers = customers || [];

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Customer</h1>
            <p className="text-muted-foreground">
              Kelola data customer dan profil mereka
            </p>
          </div>
          
          <AddCustomerForm onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['customers'] });
          }} />
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
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Gender</label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Gender</SelectItem>
                    <SelectItem value="male">Pria</SelectItem>
                    <SelectItem value="female">Wanita</SelectItem>
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
                      <div className="bg-primary/10 p-3 rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {customer.full_name}
                        </CardTitle>
                        <CardDescription>{customer.email}</CardDescription>
                        <div className="mt-2 flex gap-2">
                          <Badge 
                            variant={customer.is_active ? "default" : "secondary"}
                            className={customer.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {customer.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                          {customer.gender && (
                            <Badge variant="outline">
                              {customer.gender === 'male' ? 'Pria' : 'Wanita'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
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
                        onClick={() => handleToggleStatus(customer.id, customer.is_active)}
                        className={customer.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                      >
                        {customer.is_active ? 'Nonaktifkan' : 'Aktifkan'}
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-muted-foreground">Telepon</p>
                          <p>{customer.phone}</p>
                        </div>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-muted-foreground">Alamat</p>
                          <p className="truncate">{customer.address}</p>
                        </div>
                      </div>
                    )}
                    {customer.date_of_birth && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-muted-foreground">Tanggal Lahir</p>
                          <p>{new Date(customer.date_of_birth).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-muted-foreground">Terdaftar</p>
                        <p>{new Date(customer.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                  {customer.notes && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">Catatan</span>
                      </div>
                      <p className="text-sm">{customer.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || genderFilter !== 'all' 
                    ? 'Tidak ada customer yang sesuai dengan filter' 
                    : 'Belum ada customer yang terdaftar'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && genderFilter === 'all' && (
                  <AddCustomerForm onSuccess={() => {
                    refetch();
                    queryClient.invalidateQueries({ queryKey: ['customers'] });
                  }} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {editingCustomer && (
          <EditCustomerForm 
            customer={editingCustomer}
            open={!!editingCustomer}
            onOpenChange={(open) => !open && setEditingCustomer(null)}
            onSuccess={() => {
              setEditingCustomer(null);
              refetch();
              queryClient.invalidateQueries({ queryKey: ['customers'] });
            }}
          />
        )}
      </div>
    </ModernLayout>
  );
};

export default Customers;
