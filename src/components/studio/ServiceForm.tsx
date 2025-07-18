
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ServiceFormProps {
  service?: any;
  onSuccess: () => void;
}

const ServiceForm = ({ service, onSuccess }: ServiceFormProps) => {
  const [formData, setFormData] = useState({
    studio_id: service?.studio_id || '',
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: studios } = useQuery({
    queryKey: ['studios-for-services'],
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('additional_services')
        .insert([{
          ...data,
          price: parseFloat(data.price)
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Layanan berhasil ditambahkan');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating service:', error);
      toast.error('Gagal menambahkan layanan');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('additional_services')
        .update({
          ...data,
          price: parseFloat(data.price)
        })
        .eq('id', service.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Layanan berhasil diperbarui');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating service:', error);
      toast.error('Gagal memperbarui layanan');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (service) {
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

      <div className="space-y-2">
        <Label htmlFor="name">Nama Layanan *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Masukkan nama layanan"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Masukkan deskripsi layanan"
          rows={3}
        />
      </div>

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

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || !formData.studio_id} className="flex-1">
          {isSubmitting ? 'Menyimpan...' : service ? 'Perbarui' : 'Tambah'}
        </Button>
      </div>
    </form>
  );
};

export default ServiceForm;
