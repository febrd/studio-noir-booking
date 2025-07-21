
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

  if (studioLoading || categoriesLoading) {
    return (
      <ModernLayout>
        <div className="min-h-screen bg-white flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Clean Header - Only show when not in category selection */}
          {selectedType !== 'regular' && (
            <div className="text-center mb-16">
              <div className="flex justify-center items-center gap-4 mb-8">
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-inter font-medium">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                </Link>
              </div>
              <h1 className="text-6xl font-peace-sans font-black mb-4 tracking-tight text-black">
                Pilih Studio
              </h1>
              <p className="text-xl font-inter text-gray-500 max-w-lg mx-auto">
                Setiap pilihan memiliki keunikan tersendiri
              </p>
            </div>
          )}

          {!selectedType ? (
            /* Studio Type Selection */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
              {/* Self Photo Card */}
              {selfPhotoStudios.length > 0 && (
                <Card 
                  className="border border-gray-100 shadow-none cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all bg-white"
                  onClick={() => handleTypeSelect('self_photo')}
                >
                  <CardHeader className="bg-red-500 text-white text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-sm flex items-center justify-center">
                      <User className="h-8 w-8 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-peace-sans font-black">Self Photo</CardTitle>
                    <CardDescription className="text-red-100 font-inter">
                      Foto sendiri dengan kontrol penuh
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-sm font-inter text-gray-600">
                        <div className="w-2 h-2 bg-red-500 mr-3 rounded-sm"></div>
                        Kontrol penuh atas foto
                      </div>
                      <div className="flex items-center text-sm font-inter text-gray-600">
                        <div className="w-2 h-2 bg-red-500 mr-3 rounded-sm"></div>
                        Privacy maksimal
                      </div>
                      <div className="flex items-center text-sm font-inter text-gray-600">
                        <div className="w-2 h-2 bg-red-500 mr-3 rounded-sm"></div>
                        Waktu fleksibel
                      </div>
                      <div className="flex items-center text-sm font-inter text-gray-600">
                        <div className="w-2 h-2 bg-red-500 mr-3 rounded-sm"></div>
                        {selfPhotoStudios.length} studio tersedia
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-black text-white hover:bg-gray-800 font-peace-sans font-bold py-3 text-base"
                      onClick={() => handleTypeSelect('self_photo')}
                    >
                      Pilih Self Photo
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Regular Studio Card */}
              {regularStudios.length > 0 && (
                <Card 
                  className="border border-gray-100 shadow-none cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all bg-white"
                  onClick={() => setSelectedType('regular')}
                >
                  <CardHeader className="bg-blue-500 text-white text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-sm flex items-center justify-center">
                      <Camera className="h-8 w-8 text-blue-500" />
                    </div>
                    <CardTitle className="text-2xl font-peace-sans font-black">Studio Reguler</CardTitle>
                    <CardDescription className="text-blue-100 font-inter">
                      Sesi foto profesional dengan fotografer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-sm font-inter text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 mr-3 rounded-sm"></div>
                        Fotografer profesional
                      </div>
                      <div className="flex items-center text-sm font-inter text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 mr-3 rounded-sm"></div>
                        Berbagai kategori
                      </div>
                      <div className="flex items-center text-sm font-inter text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 mr-3 rounded-sm"></div>
                        Hasil berkualitas tinggi
                      </div>
                      <div className="flex items-center text-sm font-inter text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 mr-3 rounded-sm"></div>
                        {regularStudios.length} studio tersedia
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-black text-white hover:bg-gray-800 font-peace-sans font-bold py-3 text-base"
                      onClick={() => setSelectedType('regular')}
                    >
                      Pilih Studio Reguler
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : selectedType === 'regular' ? (
            /* Category Selection for Regular Studio */
            <div>
              <div className="text-center mb-12">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedType(null)}
                  className="mb-6 border border-gray-200 text-gray-600 hover:bg-gray-50 font-inter font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Pilihan Studio
                </Button>
                <h2 className="text-4xl font-peace-sans font-black mb-4 tracking-tight text-black">Pilih Kategori Foto</h2>
                <p className="text-lg font-inter text-gray-500">
                  Setiap kategori dirancang khusus untuk kebutuhan Anda
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {categories.map((category, index) => {
                  const IconComponent = getCategoryIcon(category.name);
                  const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-black'];
                  const colorClass = colors[index % colors.length];
                  return (
                    <Card 
                      key={category.id}
                      className="border border-gray-100 shadow-none cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all bg-white"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <CardHeader className={`${colorClass} text-white text-center p-6`}>
                        <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-sm flex items-center justify-center">
                          <IconComponent className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
                        </div>
                        <CardTitle className="text-xl font-peace-sans font-black">{category.name}</CardTitle>
                        <CardDescription className="text-white/80 font-inter">
                          {category.description || `Foto ${category.name.toLowerCase()}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <Button 
                          className="w-full bg-black text-white hover:bg-gray-800 font-peace-sans font-bold py-2"
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          Pilih {category.name}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Simple CTA - Only show when not in category selection */}
          {selectedType !== 'regular' && (
            <div className="text-center mt-20">
              <div className="bg-gray-50 border border-gray-100 p-12 max-w-2xl mx-auto">
                <h3 className="text-3xl font-peace-sans font-black mb-4 text-black">Butuh Bantuan?</h3>
                <p className="text-base mb-8 font-inter text-gray-600">
                  Tim kami siap membantu Anda menemukan paket foto yang sempurna
                </p>
                <Button className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold py-3 px-8 text-base">
                  Hubungi Kami
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
};

export default BookingSelectionPage;
