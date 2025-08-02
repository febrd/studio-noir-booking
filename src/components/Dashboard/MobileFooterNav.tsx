
import { Calendar, Camera, CameraIcon, History, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const MobileFooterNav = () => {
  const location = useLocation();

  const navItems = [
    {
      name: 'Self Photo',
      href: '/customer/self-photo/packages',
      icon: Camera,
    },
    {
      name: 'Regular',
      href: '/customer/regular/packages',
      icon: CameraIcon,
    },
    {
      name: 'Booking',
      href: '/customer/booking-selection',
      icon: Calendar,
    },
    {
      name: 'History',
      href: '/customer/order-history',
      icon: History,
    },
    {
      name: 'Profile',
      href: '/customer/profile',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="font-medium truncate w-full text-center">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
