
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-500/20 to-yellow-400/20" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce">
        <div className="w-16 h-16 bg-purple-500 rounded-full opacity-70 blur-sm" />
      </div>
      <div className="absolute top-40 right-20 animate-pulse">
        <div className="w-12 h-12 bg-yellow-400 rotate-45 opacity-80" />
      </div>
      <div className="absolute bottom-32 left-20 animate-ping">
        <div className="w-8 h-8 bg-blue-500 rounded-full opacity-60" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-8">
          <div className="bg-white/20 backdrop-blur-lg rounded-full p-6 border border-white/30">
            <Camera className="w-16 h-16 text-purple-600" />
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-yellow-500 bg-clip-text text-transparent mb-6 font-playfair">
          Masuk Studio
        </h1>
        
        <p className="text-2xl md:text-3xl text-gray-700 mb-8 font-light">
          Your Best Self, <span className="font-bold text-purple-600">Captured</span> ✨
        </p>
        
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Studio foto kreatif di Limboto, Gorontalo yang menyediakan layanan pemotretan profesional dengan hasil memukau untuk generasi yang berani tampil beda!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Sparkles className="w-5 h-5 mr-2" />
              Book Sekarang
            </Button>
          </Link>
          
          <Button variant="outline" size="lg" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 text-lg rounded-full transition-all duration-300">
            <Heart className="w-5 h-5 mr-2" />
            Lihat Portfolio
          </Button>
        </div>

        {/* Social Media Quick Access */}
        <div className="flex justify-center gap-6">
          <a 
            href="https://instagram.com/masukstudio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-pink-500 to-purple-600 text-white p-3 rounded-full hover:scale-110 transition-transform duration-300"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.329-1.297l.718-.687c.679.615 1.569.98 2.611.98 2.041 0 3.69-1.649 3.69-3.69s-1.649-3.69-3.69-3.69c-1.042 0-1.932.365-2.611.98l-.718-.687C6.001 7.478 7.152 6.988 8.449 6.988c2.602 0 4.706 2.104 4.706 4.706s-2.104 4.706-4.706 4.706z"/>
            </svg>
          </a>
          
          <a 
            href="https://tiktok.com/@masukstudio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-3 rounded-full hover:scale-110 transition-transform duration-300"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
