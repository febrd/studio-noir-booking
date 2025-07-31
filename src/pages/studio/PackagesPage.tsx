import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PackageForm from '@/components/studio/PackageForm';

const PackagesPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [deletingPackage, setDeletingPackage] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['studio-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_packages')
        .select(`
          *,
          studios (
            id,
            name,
            type
          ),
          package_categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { error } = await supabase
        .from('studio_packages')
        .delete()
        .eq('id', packageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-packages'] });
      toast.success('Paket berhasil dihapus');
      setDeletingPackage(null);
    },
    onError: (error) => {
      console.error('Error deleting package:', error);
      toast.error('Gagal menghapus paket');
    }
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['studio-packages'] });
  };

  const handleEditSuccess = () => {
    setEditingPackage(null);
    queryClient.invalidateQueries({ queryKey: ['studio-packages'] });
  };

  const handleDelete = (pkg: any) => {
    setDeletingPackage(pkg);
  };

  const confirmDelete = () => {
    if (deletingPackage) {
      deletePackageMutation.mutate(deletingPackage.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studio Packages</h1>
          <p className="text-gray-600">Kelola paket studio dan pricing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Paket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Paket Baru</DialogTitle>
            </DialogHeader>
            <PackageForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages?.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pkg.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {pkg.studios?.name}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingPackage(pkg)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(pkg)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(pkg.price)}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {pkg.base_time_minutes} menit
                  </div>
                </div>
                {pkg.description && (
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={pkg.studios?.type === 'self_photo' ? 'default' : 'secondary'}>
                    {pkg.studios?.type === 'self_photo' ? 'Self Photo' : 'Regular'}
                  </Badge>
                  {pkg.package_categories && (
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      {pkg.package_categories.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Dibuat: {new Date(pkg.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages?.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada paket</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan paket studio pertama Anda</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Paket
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Paket</DialogTitle>
          </DialogHeader>
          {editingPackage && (
            <PackageForm 
              package={editingPackage} 
              onSuccess={handleEditSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPackage} onOpenChange={() => setDeletingPackage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus paket "{deletingPackage?.title}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PackagesPage;
