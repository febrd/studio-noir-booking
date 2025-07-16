
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Shield, CreditCard, User, UserPlus, Edit, Trash2 } from 'lucide-react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Users = () => {
  const { userProfile } = useJWTAuth();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'keuangan': return 'outline';
      default: return 'outline';
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
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        toast.success('Pengguna berhasil dihapus');
        refetch();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Gagal menghapus pengguna');
      }
    }
  };

  // Check if current user can manage users
  const canManageUsers = userProfile?.role === 'owner' || userProfile?.role === 'admin';

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
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p>Memuat pengguna...</p>
              </CardContent>
            </Card>
          ) : (
            users?.map((user) => (
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
                        <div className="mt-2">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {canManageUsers && (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.role !== 'owner' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.role)}
                            className="text-destructive hover:text-destructive"
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
                      <Badge variant="outline" className="text-green-600">Aktif</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ModernLayout>
  );
};

export default Users;
