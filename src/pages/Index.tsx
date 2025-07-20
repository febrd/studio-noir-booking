
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Camera, Instagram, Music, ArrowRight, Star, Heart, Users, Award } from 'lucide-react';
import { useState, useEffect } from 'react';

const Index = () => {
  const { userProfile, loading } = useJWTAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero images for slideshow - using better photo studio examples
  const heroImages = [
    'https://images.unsplash.com/photo-1554048612-b6a482b224b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080',
    'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080',
  ];

  // Portfolio gallery images
  const portfolioImages = [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1494790108755-2616c4943dd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1d1d1d]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#1d1d1d] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1d1d1d]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Camera className="h-8 w-8 text-[#d30f0f]" />
              <h1 className="text-2xl font-bold font-serif">Masuk Studio</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="#" 
                className="text-[#0060ad] hover:text-[#0060ad]/80 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="text-[#0060ad] hover:text-[#0060ad]/80 transition-colors"
                aria-label="TikTok"
              >
                <Music className="h-6 w-6" />
              </a>
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <a href="/auth">Masuk</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Full-Screen Slideshow */}
      <section className="relative h-screen overflow-hidden">
        {/* Full-Screen Slideshow Background */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt={`Studio photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/70"></div>
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4 pt-20">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-5xl md:text-8xl font-serif font-bold mb-6 leading-tight">
              Your Best Self,<br />
              <span className="text-[#d30f0f]">Captured</span>
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
              Kami nggak cuma ambil foto. Kami bikin kamu bangga lihat hasilnya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[#d30f0f] hover:bg-[#d30f0f]/90 text-white px-8 py-4 text-lg font-semibold"
                asChild
              >
                <a href="/auth" className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Book Now
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg"
                asChild
              >
                <a href="#gallery" className="flex items-center gap-2">
                  Lihat Galeri
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Portfolio Gallery Section */}
      <section id="gallery" className="py-20 bg-[#1d1d1d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Portofolio Kami
            </h3>
            <p className="text-xl text-white/80 mb-8">
              Lihat hasil karya terbaik yang telah kami ciptakan
            </p>
            <div className="w-24 h-1 bg-[#d30f0f] mx-auto"></div>
          </div>

          <Carousel className="w-full max-w-6xl mx-auto">
            <CarouselContent className="-ml-2 md:-ml-4">
              {portfolioImages.map((image, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card className="border-0 bg-transparent overflow-hidden group">
                      <CardContent className="p-0">
                        <AspectRatio ratio={4/5}>
                          <img
                            src={image}
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                            <Heart className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </AspectRatio>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            <CarouselNext className="right-0 bg-white/10 border-white/20 text-white hover:bg-white/20" />
          </Carousel>
        </div>
      </section>

      {/* Why Choose Us Section - Visual focused */}
      <section className="py-20 bg-gradient-to-b from-[#1d1d1d] to-[#2d2d2d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Kenapa Masuk Studio
            </h3>
            <div className="w-24 h-1 bg-[#d30f0f] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              {
                title: "Kamu Pilih, Kami Sempurnakan",
                description: "Kamu bebas pilih sendiri foto terbaikmu. Kami retouch dengan teliti agar hasil akhirnya pantas dipamerkan.",
                icon: <Star className="h-12 w-12 text-[#d30f0f]" />,
                image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              },
              {
                title: "Yang Kami Jual: Foto yang Bikin Kamu Bangga",
                description: "Sesi fotonya cuma proses. Yang penting adalah hasil akhir—foto yang bikin kamu bilang, \"Ini gue banget.\"",
                icon: <Camera className="h-12 w-12 text-[#d30f0f]" />,
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              },
              {
                title: "Hasil Flawless, Bukan Sekadar Jepretan",
                description: "Setiap foto yang kamu pilih akan ditangani profesional agar tampil maksimal tanpa terlihat berlebihan.",
                icon: <Award className="h-12 w-12 text-[#d30f0f]" />,
                image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              },
              {
                title: "Bukan Sekadar Foto—Ini Cerminan Versi Terbaik Dirimu",
                description: "Di Masuk Studio, kamu nggak cuma difoto. Kamu dipantaskan jadi versi terbaik dari dirimu sendiri.",
                icon: <Users className="h-12 w-12 text-[#d30f0f]" />,
                image: "https://images.unsplash.com/photo-1567443177754-eca695e6e7b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#d30f0f]/50 transition-all duration-500"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="mb-4">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-white">
                    {item.title}
                  </h4>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1471341971476-ae15ff5dd904?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080"
            alt="Studio background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#d30f0f]/80"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            Siap Jadi Versi Terbaik Dirimu?
          </h3>
          <p className="text-xl mb-8 text-white/90">
            Bergabunglah dengan ribuan orang yang telah merasakan pengalaman foto profesional di Masuk Studio.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-[#d30f0f] hover:bg-white/90 px-8 py-4 text-lg font-semibold"
            asChild
          >
            <a href="/auth" className="flex items-center gap-2">
              Mulai Sekarang
              <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1d1d1d] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Camera className="h-6 w-6 text-[#d30f0f]" />
              <span className="text-lg font-serif font-semibold">Masuk Studio</span>
            </div>
            <div className="flex items-center space-x-6">
              <a 
                href="#" 
                className="text-[#0060ad] hover:text-[#0060ad]/80 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-[#0060ad] hover:text-[#0060ad]/80 transition-colors"
              >
                <Music className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/60">
            <p>© 2024 Masuk Studio. Your Best Self, Captured.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
