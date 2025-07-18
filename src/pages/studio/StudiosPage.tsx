
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StudioForm from '@/components/studio/StudioForm';

const StudiosPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<any>(null);
  const [deletingStudio, setDeletingStudio] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: studios, isLoading } = useQuery({
    queryKey: ['studios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const deleteStudioMutation = useMutation({
    mutationFn: async (studioId: string) => {
      const { error } = await supabase
        .from('studios')
        .delete()
        .eq('id', studioId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studios'] });
      toast.success('Studio berhasil dihapus');
      setDeletingStudio(null);
    },
    onError: (error) => {
      console.error('Error deleting studio:', error);
      toast.error('Gagal menghapus studio');
    }
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['studios'] });
  };

  const handleEditSuccess = () => {
    setEditingStudio(null);
    queryClient.invalidateQueries({ queryKey: ['studios'] });
  };

  const handleDelete = (studio: any) => {
    setDeletingStudio(studio);
  };

  const confirmDelete = () => {
    if (deletingStudio) {
      deleteStudioMutation.mutate(deletingStudio.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading studios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studios</h1>
          <p className="text-gray-600">Kelola studio self photo dan regular</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Studio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Studio Baru</DialogTitle>
            </DialogHeader>
            <StudioForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studios?.map((studio) => (
          <Card key={studio.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{studio.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={studio.type === 'self_photo' ? 'default' : 'secondary'}>
                        {studio.type === 'self_photo' ? 'Self Photo' : 'Regular'}
                      </Badge>
                      <Badge variant={studio.is_active ? 'outline' : 'destructive'}>
                        {studio.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingStudio(studio)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(studio)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {studio.location && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Lokasi:</span> {studio.location}
                  </p>
                )}
                {studio.description && (
                  <p className="text-sm text-gray-600">{studio.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  Dibuat: {new Date(studio.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {studios?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada studio</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan studio pertama Anda</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Studio
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingStudio} onOpenChange={() => setEditingStudio(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Studio</DialogTitle>
          </DialogHeader>
          {editingStudio && (
            <StudioForm 
              studio={editingStudio} 
              onSuccess={handleEditSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingStudio} onOpenChange={() => setDeletingStudio(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Studio</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus studio "{deletingStudio?.name}"? 
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
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

export default StudiosPage;
