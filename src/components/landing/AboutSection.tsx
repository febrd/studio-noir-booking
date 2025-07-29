
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Award, Heart } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 sm:mb-6 font-playfair">
            About Masuk Studio
          </h2>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
            Studio foto kreatif yang lahir dari passion untuk mengabadikan momen terbaik. 
            Berlokasi di jantung Limboto, Gorontalo, kami hadir untuk generasi yang berani tampil beda! 
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12 sm:mb-16">
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                Masuk Studio hadir untuk membantu setiap orang tampil sebagai versi terbaik dari dirinya sendiri lewat foto yang simetris, flawless, dan pantas dibanggakan.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Why Choose Us?</h3>
              <p className="text-gray-600 leading-relaxed">
                Karena di Masuk Studio, kamu nggak cuma difoto, kamu dipantaskan. Hasil akhirnya bukan asal jepret, tapi retouch profesional yang bikin kamu terlihat maksimal. Pelayanannya ramah, waktunya teratur, dan tiap paket kami rancang supaya makin tinggi yang kamu pilih, makin banyak value yang kamu bawa pulang.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-purple-400 via-blue-400 to-yellow-400 rounded-3xl p-1">
              <div className="bg-white rounded-3xl p-6 sm:p-8 h-full">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800">1000+</div>
                    <div className="text-xs sm:text-sm text-gray-600">Happy Clients</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800">3+</div>
                    <div className="text-xs sm:text-sm text-gray-600">Years Experience</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800">5★</div>
                    <div className="text-xs sm:text-sm text-gray-600">Average Rating</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800">1</div>
                    <div className="text-xs sm:text-sm text-gray-600">Location</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 sm:p-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Visit Our Studio</h3>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                    <span>Limboto, Gorontalo, Indonesia</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span>+62 822-1140-9296</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-6 sm:p-8 text-center">
                <div className="text-3xl sm:text-4xl mb-4">📍</div>
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Studio Location</h4>
                <p className="text-gray-600 text-sm">
                  Berada di lokasi strategis yang mudah dijangkau di Limboto, Gorontalo. 
                  Suasana yang nyaman dan instagramable!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AboutSection;
