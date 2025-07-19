
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Bell, Settings, User, Crown, Shield, CreditCard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getAccessibleNavigation } from '@/config/navigation';
import { Link } from 'react-router-dom';

export function ModernHeader() {
  const { userProfile, signOut } = useJWTAuth();
  const navigation = getAccessibleNavigation(userProfile?.role || 'pelanggan');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'keuangan': return <CreditCard className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-600';
      case 'admin': return 'text-blue-600';
      case 'keuangan': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Left section - Sidebar trigger and brand */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <SidebarTrigger className="-ml-1" />
          </div>

          {/* Mobile: Show logo and brand */}
          <div className="flex items-center space-x-2 md:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-sm font-semibold">Studio Noir</h1>
            </div>
          </div>
        </div>

        {/* Center section - Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavigationMenu className="relative z-10">
            <NavigationMenuList className="flex space-x-1">
              {navigation.map((item) => (
                <NavigationMenuItem key={item.name}>
                  {item.children && item.children.length > 0 ? (
                    <>
                      <NavigationMenuTrigger className="h-10 px-4 py-2">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="z-50">
                        <div className="grid w-[400px] gap-1 p-4">
                          {item.children.map((child) => (
                            <NavigationMenuLink key={child.name} asChild>
                              <Link
                                to={child.href}
                                className="flex items-center space-x-2 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <child.icon className="h-4 w-4" />
                                <span>{child.name}</span>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.href}
                        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right section - User actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(userProfile?.name || 'User')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 z-50" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.name}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs leading-none ${getRoleColor(userProfile?.role || 'pelanggan')}`}>
                      {userProfile?.role}
                    </span>
                    {getRoleIcon(userProfile?.role || 'pelanggan')}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <User className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
