
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Users, User, Heart, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ModernLayout } from '@/components/Layout/ModernLayout';

const BookingSelectionPage = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const navigate = useNavigate();

  const studioTypes = [
    {
      id: 'self_photo',
      title: 'Self Photo',
      description: 'Foto sendiri dengan kontrol penuh atas gaya dan pose Anda',
      icon: User,
      color: 'from-blue-500 to-purple-600',
      features: ['Kontrol penuh atas foto', 'Privacy maksimal', 'Waktu fleksibel', 'Harga terjangkau'],
      image: '/api/placeholder/400/300'
    },
    {
      id: 'regular',
      title: 'Studio Reguler',
      description: 'Sesi foto profesional dengan fotografer berpengalaman',
      icon: Camera,
      color: 'from-pink-500 to-orange-500',
      features: ['Fotografer profesional', 'Berbagai kategori', 'Hasil berkualitas tinggi', 'Konsultasi pose'],
      image: '/api/placeholder/400/300'
    }
  ];

  const categories = [
    {
      id: 'personal',
      title: 'Personal',
      description: 'Foto individu untuk keperluan pribadi',
      icon: User,
      color: 'from-emerald-400 to-cyan-400'
    },
    {
      id: 'couple',
      title: 'Couple',
      description: 'Foto romantis untuk pasangan',
      icon: Heart,
      color: 'from-rose-400 to-pink-500'
    },
    {
      id: 'group',
      title: 'Group',
      description: 'Foto bersama teman atau keluarga',
      icon: Users,
      color: 'from-violet-400 to-purple-500'
    },
    {
      id: 'family',
      title: 'Family',
      description: 'Foto keluarga yang hangat dan berkesan',
      icon: Users,
      color: 'from-amber-400 to-orange-500'
    }
  ];

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    if (typeId === 'self_photo') {
      // Navigate to self photo packages
      navigate('/customer/self-photo-packages');
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    // Navigate to regular studio packages with category filter
    navigate(`/customer/regular-packages?category=${categoryId}`);
  };

  return (
    <ModernLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex justify-center items-center gap-4 mb-6">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="hover-scale">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <Sparkles className="h-12 w-12 text-purple-500 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pilih Tipe Studio Anda
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Setiap pilihan memiliki keunikan tersendiri. Pilih yang paling sesuai dengan kebutuhan Anda.
            </p>
          </div>

          {!selectedType ? (
            /* Studio Type Selection */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {studioTypes.map((type, index) => {
                const IconComponent = type.icon;
                return (
                  <Card 
                    key={type.id} 
                    className={`relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-scale-in`}
                    style={{ animationDelay: `${index * 200}ms` }}
                    onClick={() => handleTypeSelect(type.id)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-5`}></div>
                    <CardHeader className="relative z-10 text-center pb-4">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                        <IconComponent className="h-10 w-10 text-white" />
                      </div>
                      <CardTitle className="text-2xl mb-2">{type.title}</CardTitle>
                      <CardDescription className="text-base">{type.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-3 mb-6">
                        {type.features.map((feature, i) => (
                          <div key={i} className="flex items-center text-sm">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${type.color} mr-3`}></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                      <Button 
                        className={`w-full bg-gradient-to-r ${type.color} hover:opacity-90 transition-all duration-300 text-white font-medium py-3`}
                        onClick={() => handleTypeSelect(type.id)}
                      >
                        Pilih {type.title}
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : selectedType === 'regular' ? (
            /* Category Selection for Regular Studio */
            <div>
              <div className="text-center mb-8">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedType(null)}
                  className="mb-4 hover-scale"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Pilihan Studio
                </Button>
                <h2 className="text-3xl font-bold mb-4">Pilih Kategori Foto</h2>
                <p className="text-lg text-muted-foreground">
                  Setiap kategori dirancang khusus untuk kebutuhan Anda
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {categories.map((category, index) => {
                  const IconComponent = category.icon;
                  return (
                    <Card 
                      key={category.id}
                      className={`relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10`}></div>
                      <CardHeader className="relative z-10 text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-xl mb-2">{category.title}</CardTitle>
                        <CardDescription className="text-sm">{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <Button 
                          variant="outline" 
                          className="w-full hover:bg-gradient-to-r hover:bg-opacity-10 transition-all duration-300"
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          Pilih {category.title}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Call to Action */}
          <div className="text-center mt-16 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Butuh Bantuan Memilih?</h3>
              <p className="text-lg mb-6 opacity-90">
                Tim kami siap membantu Anda menemukan paket foto yang sempurna
              </p>
              <Button variant="secondary" size="lg" className="hover-scale">
                Hubungi Kami
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default BookingSelectionPage;
