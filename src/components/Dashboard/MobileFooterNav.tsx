
import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, CalendarDays, History, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileFooterNav() {
  const navigationItems = [
    {
      name: 'Self Photo',
      href: '/customer/self-photo-packages',
      icon: Camera,
      color: 'text-purple-600'
    },
    {
      name: 'Regular',
      href: '/customer/regular-packages',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      name: 'Booking',
      href: '/customer/booking-selection',
      icon: CalendarDays,
      color: 'text-green-600'
    },
    {
      name: 'History',
      href: '/customer/order-history',
      icon: History,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <nav className="grid grid-cols-4 py-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex flex-col items-center gap-1 px-2 py-2 transition-all duration-200 hover:bg-gray-50 active:bg-gray-100"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              "bg-gray-50 hover:bg-gray-100"
            )}>
              <item.icon className={cn("w-4 h-4", item.color)} />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-3">
              {item.name}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
