
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Shield, CreditCard, User, Edit, Trash2, Search, Filter, Users as UsersIcon, UserCheck } from 'lucide-react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddUserForm } from '@/components/admin/AddUserForm';
import { EditUserForm } from '@/components/admin/EditUserForm';
import { useState } from 'react';

const Users = () => {
  const { userProfile } = useJWTAuth();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users', searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      console.log('Fetching users...');
      let query = supabase
        .from('users')
        .select('*');

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter as 'owner' | 'admin' | 'keuangan' | 'pelanggan');
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      console.log('Users data:', data);
      console.log('Users error:', error);
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      return data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First check if user has any bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (bookingsError) throw bookingsError;

      if (bookings && bookings.length > 0) {
        throw new Error('User tidak dapat dihapus karena memiliki riwayat pesanan');
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Gagal menghapus pengguna');
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'keuangan': return <CreditCard className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'keuangan': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleDeleteUser = async (userId: string, userRole: string) => {
    if (userRole === 'owner') {
      toast.error('Tidak dapat menghapus owner');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (user: any) => {
    // Check if current user can edit this user
    const canEdit = canEditUser(user.role);
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk mengedit user ini');
      return;
    }
    setEditingUser(user);
  };

  const canManageUsers = userProfile?.role === 'owner' || userProfile?.role === 'admin';

  const canEditUser = (targetUserRole: string) => {
    if (userProfile?.role === 'owner') return true;
    if (userProfile?.role === 'admin') {
      return ['admin', 'keuangan', 'pelanggan'].includes(targetUserRole);
    }
    return false;
  };

  const canDeleteUser = (targetUserRole: string) => {
    if (targetUserRole === 'owner') return false;
    return canEditUser(targetUserRole);
  };

  // Separate users into customers and internal members
  const customers = users?.filter(user => user.role === 'pelanggan') || [];
  const internalMembers = users?.filter(user => user.role !== 'pelanggan') || [];

  const renderUserCard = (user: any) => (
    <Card key={user.id} className="glass-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getRoleIcon(user.role)}
                {user.name}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="mt-2 flex gap-2">
                <Badge className={getRoleColor(user.role)}>
                  {user.role}
                </Badge>
                <Badge variant="outline" className={user.is_active ? "text-green-600" : "text-red-600"}>
                  {user.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </div>
            </div>
          </div>
          
          {canManageUsers && (
            <div className="flex space-x-2">
              {canEditUser(user.role) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditUser(user)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDeleteUser(user.role) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.role)}
                  className="text-destructive hover:text-destructive"
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">User ID</p>
            <p className="font-mono text-xs">{user.id}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Dibuat</p>
            <p>{new Date(user.created_at).toLocaleDateString('id-ID')}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Diperbarui</p>
            <p>{new Date(user.updated_at).toLocaleDateString('id-ID')}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Status</p>
            <Badge variant="outline" className={user.is_active ? "text-green-600" : "text-red-600"}>
              {user.is_active ? 'Aktif' : 'Tidak Aktif'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-muted-foreground">
              Kelola pengguna sistem dan peran mereka
            </p>
          </div>
          
          {canManageUsers && (
            <AddUserForm onSuccess={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }} />
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
                <label className="text-sm font-medium mb-2 block">Cari Pengguna</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="keuangan">Keuangan</SelectItem>
                    <SelectItem value="pelanggan">Pelanggan</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Tabs for separating customers and internal members */}
        <Tabs defaultValue="internal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Anggota Internal ({internalMembers.length})
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Pelanggan ({customers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="space-y-4">
            <div className="grid gap-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <p>Memuat anggota internal...</p>
                  </CardContent>
                </Card>
              ) : internalMembers.length > 0 ? (
                internalMembers.map(renderUserCard)
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Tidak ada anggota internal yang sesuai dengan filter
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="grid gap-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <p>Memuat pelanggan...</p>
                  </CardContent>
                </Card>
              ) : customers.length > 0 ? (
                customers.map(renderUserCard)
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Tidak ada pelanggan yang sesuai dengan filter
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {editingUser && (
          <EditUserForm 
            user={editingUser}
            open={!!editingUser}
            onOpenChange={(open) => !open && setEditingUser(null)}
            onSuccess={() => {
              setEditingUser(null);
              refetch();
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
          />
        )}
      </div>
    </ModernLayout>
  );
};

export default Users;
