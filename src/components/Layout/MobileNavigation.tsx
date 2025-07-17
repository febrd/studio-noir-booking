
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { getAccessibleNavigation } from '@/config/navigation';

export function MobileNavigation() {
  const { userProfile } = useJWTAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // Get navigation items based on user role (only show main items on mobile)
  const navigation = getAccessibleNavigation(userProfile?.role || 'pelanggan')
    .filter(item => !item.children || item.children.length === 0)
    .slice(0, 5); // Limit to 5 items for mobile

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <nav className="flex items-center justify-around py-2">
        {navigation.map((item) => (
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
