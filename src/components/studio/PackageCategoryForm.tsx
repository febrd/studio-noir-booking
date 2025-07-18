
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface PackageCategoryFormProps {
  category?: any;
  onSuccess: () => void;
}

const PackageCategoryForm = ({ category, onSuccess }: PackageCategoryFormProps) => {
  const [formData, setFormData] = useState({
    studio_id: category?.studio_id || '',
    name: category?.name || '',
    description: category?.description || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: regularStudios } = useQuery({
    queryKey: ['regular-studios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name')
        .eq('type', 'regular')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('package_categories')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kategori berhasil ditambahkan');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast.error('Gagal menambahkan kategori');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('package_categories')
        .update(data)
        .eq('id', category.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kategori berhasil diperbarui');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast.error('Gagal memperbarui kategori');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (category) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studio_id">Studio Reguler *</Label>
        <Select value={formData.studio_id} onValueChange={(value) => handleInputChange('studio_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih studio reguler" />
          </SelectTrigger>
          <SelectContent>
            {regularStudios?.map((studio) => (
              <SelectItem key={studio.id} value={studio.id}>
                {studio.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nama Kategori *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Contoh: Family, Personal, Group"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Masukkan deskripsi kategori"
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || !formData.studio_id} className="flex-1">
          {isSubmitting ? 'Menyimpan...' : category ? 'Perbarui' : 'Tambah'}
        </Button>
      </div>
    </form>
  );
};

export default PackageCategoryForm;
