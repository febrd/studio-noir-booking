
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Package, MessageCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";

const ShortcutsSection = () => {
  const shortcuts = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Booking",
      description: "Jadwalkan sesi foto kamu sekarang!",
      action: "Book Sekarang",
      href: "/auth",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Tracking Transaksi",
      description: "Cek status pembayaran dan booking kamu",
      action: "Cek Status",
      href: "/customer/order-history",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Customer Service",
      description: "Ada pertanyaan? Chat langsung dengan tim kami!",
      action: "Chat WhatsApp",
      href: "https://wa.me/6282211409296",
      external: true,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      icon: <Info className="w-8 h-8" />,
      title: "About Us",
      description: "Kenalan lebih dekat dengan Masuk Studio",
      action: "Learn More",
      href: "#about",
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6 font-playfair">
            Quick Actions
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Akses cepat ke semua yang kamu butuhkan. One click away! ⚡
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shortcuts.map((shortcut, index) => (
            <Card key={index} className={`group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br ${shortcut.bgGradient} border-0 shadow-lg hover:scale-105 cursor-pointer`}>
              <CardContent className="p-8 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${shortcut.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {shortcut.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {shortcut.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {shortcut.description}
                </p>
                
                {shortcut.external ? (
                  <a href={shortcut.href} target="_blank" rel="noopener noreferrer">
                    <Button className={`bg-gradient-to-r ${shortcut.gradient} hover:shadow-lg text-white rounded-full w-full transition-all duration-300`}>
                      {shortcut.action}
                    </Button>
                  </a>
                ) : shortcut.href.startsWith('#') ? (
                  <Button 
                    onClick={() => document.querySelector(shortcut.href)?.scrollIntoView({ behavior: 'smooth' })}
                    className={`bg-gradient-to-r ${shortcut.gradient} hover:shadow-lg text-white rounded-full w-full transition-all duration-300`}
                  >
                    {shortcut.action}
                  </Button>
                ) : (
                  <Link to={shortcut.href}>
                    <Button className={`bg-gradient-to-r ${shortcut.gradient} hover:shadow-lg text-white rounded-full w-full transition-all duration-300`}>
                      {shortcut.action}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShortcutsSection;
