
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

  // Get all navigation items based on user role including submenus
  const allNavigation = getAccessibleNavigation(userProfile?.role || 'pelanggan');
  
  // Flatten navigation to include both main items and subitems
  const flatNavigation = allNavigation.reduce((acc, item) => {
    // Add main item
    acc.push(item);
    
    // Add children if they exist
    if (item.children && item.children.length > 0) {
      acc.push(...item.children);
    }
    
    return acc;
  }, [] as typeof allNavigation);

  // Take first 5 most important items for mobile
  const mobileNavigation = flatNavigation.slice(0, 5);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <nav className="flex items-center justify-around py-2">
        {mobileNavigation.map((item, index) => (
          <NavLink
            key={`${item.href}-${index}`}
            to={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-2 text-xs transition-colors rounded-lg',
              isActive(item.href)
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-[10px] font-medium text-center leading-3">
              {item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
