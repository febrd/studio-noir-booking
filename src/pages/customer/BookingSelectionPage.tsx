
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Users, User, Heart, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface StudioType {
  id: string;
  name: string;
  type: 'self_photo' | 'regular';
  description: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const BookingSelectionPage = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch real studio types from database
  const { data: studioTypes = [], isLoading: studioLoading } = useQuery({
    queryKey: ['studio-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name, type, description, is_active')
        .eq('is_active', true);

      if (error) throw error;
      return data as StudioType[];
    },
  });

  // Fetch real categories from database
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['package-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('package_categories')
        .select('id, name, description');

      if (error) throw error;
      return data as Category[];
    },
  });

  // Group studios by type
  const selfPhotoStudios = studioTypes.filter(studio => studio.type === 'self_photo');
  const regularStudios = studioTypes.filter(studio => studio.type === 'regular');

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    if (typeId === 'self_photo') {
      navigate('/customer/self-photo-packages');
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/customer/regular-packages?category=${categoryId}`);
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('personal')) return User;
    if (name.includes('couple')) return Heart;
    if (name.includes('group') || name.includes('family')) return Users;
    return Camera;
  };

  const getCategoryColor = (index: number) => {
    const colors = ['bg-red-500', 'bg-blue-600', 'bg-yellow-400', 'bg-black'];
    return colors[index % colors.length];
  };

  if (studioLoading || categoriesLoading) {
    return (
      <ModernLayout>
        <div className="min-h-screen bg-white flex justify-center items-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Bauhaus Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-4 mb-6">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="border-2 border-black text-black hover:bg-black hover:text-white font-bold">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  KEMBALI
                </Button>
              </Link>
            </div>
            <h1 className="text-6xl font-black mb-4 tracking-tight">
              PILIH STUDIO
            </h1>
            <p className="text-xl font-light max-w-2xl mx-auto tracking-wide">
              Setiap pilihan memiliki keunikan tersendiri
            </p>
          </div>

          {!selectedType ? (
            /* Studio Type Selection */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
              {/* Self Photo Card */}
              {selfPhotoStudios.length > 0 && (
                <Card 
                  className="border-4 border-black shadow-none cursor-pointer hover:shadow-lg transition-shadow bg-white"
                  onClick={() => handleTypeSelect('self_photo')}
                >
                  <CardHeader className="bg-red-500 text-white text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-red-500" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-wide">SELF PHOTO</CardTitle>
                    <CardDescription className="text-red-100 font-medium">
                      Foto sendiri dengan kontrol penuh
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm font-medium">
                        <div className="w-3 h-3 bg-black mr-3"></div>
                        Kontrol penuh atas foto
                      </div>
                      <div className="flex items-center text-sm font-medium">
                        <div className="w-3 h-3 bg-black mr-3"></div>
                        Privacy maksimal
                      </div>
                      <div className="flex items-center text-sm font-medium">
                        <div className="w-3 h-3 bg-black mr-3"></div>
                        Waktu fleksibel
                      </div>
                      <div className="flex items-center text-sm font-medium">
                        <div className="w-3 h-3 bg-black mr-3"></div>
                        {selfPhotoStudios.length} studio tersedia
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-black text-white hover:bg-gray-800 font-black py-4 text-lg tracking-wide"
                      onClick={() => handleTypeSelect('self_photo')}
                    >
                      PILIH SELF PHOTO
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Regular Studio Card */}
              {regularStudios.length > 0 && (
                <Card 
                  className="border-4 border-black shadow-none cursor-pointer hover:shadow-lg transition-shadow bg-white"
                  onClick={() => setSelectedType('regular')}
                >
                  <CardHeader className="bg-blue-600 text-white text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                      <Camera className="h-10 w-10 text-blue-600" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-wide">STUDIO REGULER</CardTitle>
                    <CardDescription className="text-blue-100 font-medium">
                      Sesi foto profesional dengan fotografer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm font-medium">
                        <div className="w-3 h-3 bg-black mr-3"></div>
                        Fotografer profesional
                      </div>
                      <div className="flex items-center text-sm font-medium">
                        <div className="w-3 h-3 bg-black mr-3"></div>
                        Berbagai kategori
                      </div>
                      <div className="flex items-center text-sm font-medium">
                        <div className="w-3 h-3 bg-black mr-3"></div>
                        Hasil berkualitas tinggi
                      </div>
                      <div className="flex items-center text-sm font-medium">
                        <div className="w-3 h-3 bg-black mr-3"></div>
                        {regularStudios.length} studio tersedia
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-black text-white hover:bg-gray-800 font-black py-4 text-lg tracking-wide"
                      onClick={() => setSelectedType('regular')}
                    >
                      PILIH STUDIO REGULER
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : selectedType === 'regular' ? (
            /* Category Selection for Regular Studio */
            <div>
              <div className="text-center mb-8">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedType(null)}
                  className="mb-4 border-2 border-black text-black hover:bg-black hover:text-white font-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  KEMBALI KE PILIHAN STUDIO
                </Button>
                <h2 className="text-4xl font-black mb-4 tracking-tight">PILIH KATEGORI FOTO</h2>
                <p className="text-lg font-light tracking-wide">
                  Setiap kategori dirancang khusus untuk kebutuhan Anda
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {categories.map((category, index) => {
                  const IconComponent = getCategoryIcon(category.name);
                  const colorClass = getCategoryColor(index);
                  return (
                    <Card 
                      key={category.id}
                      className="border-4 border-black shadow-none cursor-pointer hover:shadow-lg transition-shadow bg-white"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <CardHeader className={`${colorClass} text-white text-center`}>
                        <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                          <IconComponent className={`h-8 w-8 ${colorClass.replace('bg-', 'text-')}`} />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-wide">{category.name.toUpperCase()}</CardTitle>
                        <CardDescription className="text-white/80 font-medium">
                          {category.description || `Foto ${category.name.toLowerCase()}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <Button 
                          className="w-full bg-black text-white hover:bg-gray-800 font-black py-3 tracking-wide"
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          PILIH {category.name.toUpperCase()}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gray-100 border-4 border-black p-8">
              <h3 className="text-3xl font-black mb-4 tracking-wide">BUTUH BANTUAN MEMILIH?</h3>
              <p className="text-lg mb-6 font-medium">
                Tim kami siap membantu Anda menemukan paket foto yang sempurna
              </p>
              <Button size="lg" className="bg-black text-white hover:bg-gray-800 font-black py-4 px-8 text-lg tracking-wide">
                HUBUNGI KAMI
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default BookingSelectionPage;
