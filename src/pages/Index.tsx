
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Instagram, Music, ArrowRight, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const Index = () => {
  const { userProfile, loading } = useJWTAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero images for slideshow
  const heroImages = [
    '/placeholder.svg?height=600&width=1200',
    '/placeholder.svg?height=600&width=1200',
    '/placeholder.svg?height=600&width=1200',
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
      <nav className="relative z-50 bg-[#1d1d1d]/80 backdrop-blur-sm border-b border-white/10">
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

      {/* Hero Section with Slideshow */}
      <section className="relative h-screen overflow-hidden">
        {/* Slideshow Background */}
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
              <div className="absolute inset-0 bg-black/60"></div>
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-4xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              Your Best Self, Captured
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

      {/* Why Choose Us Section */}
      <section className="py-20 bg-[#1d1d1d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Kenapa Masuk Studio
            </h3>
            <div className="w-24 h-1 bg-[#d30f0f] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Kamu Pilih, Kami Sempurnakan",
                description: "Kamu bebas pilih sendiri foto terbaikmu. Kami retouch dengan teliti agar hasil akhirnya pantas dipamerkan.",
                icon: <CheckCircle className="h-8 w-8 text-[#d30f0f]" />
              },
              {
                title: "Yang Kami Jual: Foto yang Bikin Kamu Bangga",
                description: "Sesi fotonya cuma proses. Yang penting adalah hasil akhir—foto yang bikin kamu bilang, \"Ini gue banget.\"",
                icon: <Camera className="h-8 w-8 text-[#d30f0f]" />
              },
              {
                title: "Hasil Flawless, Bukan Sekadar Jepretan",
                description: "Setiap foto yang kamu pilih akan ditangani profesional agar tampil maksimal tanpa terlihat berlebihan.",
                icon: <CheckCircle className="h-8 w-8 text-[#d30f0f]" />
              },
              {
                title: "Bukan Sekadar Foto—Ini Cerminan Versi Terbaik Dirimu",
                description: "Di Masuk Studio, kamu nggak cuma difoto. Kamu dipantaskan jadi versi terbaik dari dirimu sendiri.",
                icon: <Camera className="h-8 w-8 text-[#d30f0f]" />
              }
            ].map((item, index) => (
              <Card 
                key={index}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {item.icon}
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-white group-hover:text-[#d30f0f] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#d30f0f] to-[#d30f0f]/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-serif font-bold mb-6">
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
