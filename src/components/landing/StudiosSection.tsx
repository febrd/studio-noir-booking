
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sparkles } from "lucide-react";

interface Studio {
  id: string;
  name: string;
  location?: string;
  description?: string;
  type: string;
  is_active: boolean;
}

interface StudiosSectionProps {
  studios: Studio[];
}

const StudiosSection = ({ studios }: StudiosSectionProps) => {
  const getStudioTypeColor = (type: string) => {
    switch (type) {
      case 'self_photo':
        return 'bg-gradient-to-r from-pink-500 to-rose-500';
      case 'regular':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-purple-500 to-indigo-500';
    }
  };

  const getStudioTypeText = (type: string) => {
    switch (type) {
      case 'self_photo':
        return 'Self Photo';
      case 'regular':
        return 'Regular Photo';
      default:
        return 'Studio';
    }
  };

  return (
    <section className="py-20 bg-white/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6 font-playfair">
            Our Studios
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Pilih studio yang cocok dengan vibe kamu! Setiap studio punya karakter unik untuk hasil foto yang stunning ✨
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {studios.map((studio) => (
            <Card key={studio.id} className="group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:scale-105">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`${getStudioTypeColor(studio.type)} text-white border-0 px-3 py-1 text-sm`}>
                    {getStudioTypeText(studio.type)}
                  </Badge>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                  {studio.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {studio.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                    <span className="text-sm">{studio.location}</span>
                  </div>
                )}
                
                {studio.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {studio.description}
                  </p>
                )}
                
                <div className="pt-4">
                  <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-yellow-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudiosSection;
