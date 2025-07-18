
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface PackageFormProps {
  package?: any;
  onSuccess: () => void;
}

const PackageForm = ({ package: pkg, onSuccess }: PackageFormProps) => {
  const [formData, setFormData] = useState({
    studio_id: pkg?.studio_id || '',
    category_id: pkg?.category_id || '',
    title: pkg?.title || '',
    description: pkg?.description || '',
    price: pkg?.price || '',
    base_time_minutes: pkg?.base_time_minutes || ''
  });

  const [selectedStudioType, setSelectedStudioType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: studios } = useQuery({
    queryKey: ['studios-for-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['package-categories-for-studio', formData.studio_id],
    queryFn: async () => {
      if (!formData.studio_id) return [];
      
      const { data, error } = await supabase
        .from('package_categories')
        .select('id, name, description')
        .eq('studio_id', formData.studio_id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.studio_id && selectedStudioType === 'regular'
  });

  // Update selected studio type when studio_id changes
  useEffect(() => {
    if (formData.studio_id && studios) {
      const selectedStudio = studios.find(studio => studio.id === formData.studio_id);
      if (selectedStudio) {
        setSelectedStudioType(selectedStudio.type);
        // Reset category_id if switching to self_photo studio
        if (selectedStudio.type === 'self_photo') {
          setFormData(prev => ({ ...prev, category_id: '' }));
        }
      }
    }
  }, [formData.studio_id, studios]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('studio_packages')
        .insert([{
          ...data,
          price: parseFloat(data.price),
          base_time_minutes: parseInt(data.base_time_minutes),
          category_id: data.category_id || null
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Paket berhasil ditambahkan');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating package:', error);
      toast.error('Gagal menambahkan paket');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('studio_packages')
        .update({
          ...data,
          price: parseFloat(data.price),
          base_time_minutes: parseInt(data.base_time_minutes),
          category_id: data.category_id || null
        })
        .eq('id', pkg.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Paket berhasil diperbarui');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating package:', error);
      toast.error('Gagal memperbarui paket');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for regular studios
    if (selectedStudioType === 'regular' && !formData.category_id) {
      toast.error('Kategori paket wajib dipilih untuk studio reguler');
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (pkg) {
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

  const isFormValid = formData.studio_id && 
    (selectedStudioType === 'self_photo' || (selectedStudioType === 'regular' && formData.category_id));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studio_id">Studio *</Label>
        <Select value={formData.studio_id} onValueChange={(value) => handleInputChange('studio_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih studio" />
          </SelectTrigger>
          <SelectContent>
            {studios?.map((studio) => (
              <SelectItem key={studio.id} value={studio.id}>
                {studio.name} ({studio.type === 'self_photo' ? 'Self Photo' : 'Regular'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStudioType === 'regular' && (
        <div className="space-y-2">
          <Label htmlFor="category_id">Kategori Paket *</Label>
          <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori paket" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories?.length === 0 && formData.studio_id && (
            <p className="text-sm text-amber-600">
              Belum ada kategori untuk studio ini. Silakan buat kategori terlebih dahulu.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Nama Paket *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Masukkan nama paket"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Masukkan deskripsi paket"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Harga (IDR) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="0"
            required
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_time_minutes">Durasi (Menit) *</Label>
          <Input
            id="base_time_minutes"
            type="number"
            value={formData.base_time_minutes}
            onChange={(e) => handleInputChange('base_time_minutes', e.target.value)}
            placeholder="0"
            required
            min="1"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || !isFormValid} className="flex-1">
          {isSubmitting ? 'Menyimpan...' : pkg ? 'Perbarui' : 'Tambah'}
        </Button>
      </div>
    </form>
  );
};

export default PackageForm;
