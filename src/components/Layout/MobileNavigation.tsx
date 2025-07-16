
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CreditCard, Users, Building2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Payment', href: '/payment-gateway', icon: CreditCard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Studio', href: '/studio', icon: Building2 },
  { name: 'Customers', href: '/customers', icon: Calendar },
];

export function MobileNavigation() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <nav className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors rounded-lg',
              isActive(item.href)
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
