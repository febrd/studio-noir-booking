
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Camera, Users, Clock, Star, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const heroImages = [
    "/placeholder.svg",
    "/placeholder.svg", 
    "/placeholder.svg"
  ];

  const portfolioImages = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg"
  ];

  const whyChooseUsItems = [
    {
      icon: Camera,
      title: "Peralatan Professional",
      description: "Kamera dan peralatan lighting terkini untuk hasil foto terbaik",
      bgImage: "/placeholder.svg"
    },
    {
      icon: Users,
      title: "Fotografer Berpengalaman", 
      description: "Tim fotografer profesional dengan portfolio yang menawan",
      bgImage: "/placeholder.svg"
    },
    {
      icon: Clock,
      title: "Pelayanan Fleksibel",
      description: "Jadwal yang fleksibel sesuai kebutuhan Anda",
      bgImage: "/placeholder.svg"
    },
    {
      icon: Star,
      title: "Kualitas Terjamin",
      description: "Hasil foto berkualitas tinggi dengan editing professional",
      bgImage: "/placeholder.svg"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Studio Noir</h1>
            <div className="hidden md:flex space-x-8 text-white">
              <a href="#beranda" className="hover:text-gray-300 transition-colors">Beranda</a>
              <a href="#portfolio" className="hover:text-gray-300 transition-colors">Portfolio</a>
              <a href="#layanan" className="hover:text-gray-300 transition-colors">Layanan</a>
              <a href="#kontak" className="hover:text-gray-300 transition-colors">Kontak</a>
            </div>
            <Link to="/auth">
              <Button className="bg-white text-black hover:bg-gray-100">
                Masuk
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Slideshow */}
      <section id="beranda" className="relative h-screen overflow-hidden">
        <Carousel className="h-full w-full">
          <CarouselContent className="h-full">
            {heroImages.map((image, index) => (
              <CarouselItem key={index} className="h-full">
                <div 
                  className="h-full w-full bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${image})` }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white max-w-4xl px-6">
                      <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
                        Abadikan Momen Terbaik
                      </h1>
                      <p className="text-xl md:text-2xl mb-8 text-gray-200">
                        Studio fotografi profesional dengan hasil yang memukau
                      </p>
                      <Link to="/auth">
                        <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6">
                          Mulai Booking Sekarang
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-8" />
          <CarouselNext className="right-8" />
        </Carousel>
      </section>

      {/* Portfolio Gallery */}
      <section id="portfolio" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-black mb-4">Portfolio Kami</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Lihat karya-karya terbaik dari studio kami yang telah dipercaya oleh ribuan klien
            </p>
          </div>
          
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {portfolioImages.map((image, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={image} 
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* Why Choose Us with Background Images */}
      <section id="layanan" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-black mb-4">Mengapa Pilih Kami?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Dengan pengalaman bertahun-tahun, kami berkomitmen memberikan yang terbaik
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUsItems.map((item, index) => (
              <Card key={index} className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-0 relative h-80">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.bgImage})` }}
                  />
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    <item.icon className="h-12 w-12 mb-4 text-white" />
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-200 text-sm">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Background */}
      <section className="relative py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/placeholder.svg)` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-4xl mx-auto text-center px-6">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Siap Untuk Sesi Foto Anda?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan klien yang telah mempercayai kami untuk mengabadikan momen spesial mereka
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6">
              Booking Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Footer */}
      <footer id="kontak" className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Studio Noir</h3>
              <p className="text-gray-400 mb-4">
                Studio fotografi profesional yang menghadirkan karya seni dalam setiap jepretan.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak Kami</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Jl. Fotografi No. 123, Kota Studio</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+62 812-3456-7890</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>info@studionoir.com</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Jam Operasional</h4>
              <div className="space-y-1 text-gray-400">
                <p>Senin - Jumat: 09:00 - 21:00</p>
                <p>Sabtu - Minggu: 08:00 - 22:00</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Studio Noir. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
