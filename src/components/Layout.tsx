import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthStatus } from "@/components/AuthStatus";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { 
  Menu, 
  X, 
  AlertTriangle, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Home,
  Map
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import CityFixLogo from './CityFixLogo';

const Layout = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/map', label: 'Map', icon: Map },
    ...(isAuthenticated ? [{ path: '/dashboard', label: 'Dashboard', icon: Bell }] : []),
    ...(currentUser?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: Settings }] : [])
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Auth Status component for session restoration notifications */}
      <AuthStatus enabled={isAuthenticated} />
      {/* Header */}
      <header 
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200",
          isScrolled ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm" : "bg-background"
        )}
      >
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-urban-500 rounded"
              aria-label="CityFix Home"
            >
              <CityFixLogo size={36} className="text-urban-600" />
              <span className="ml-2 text-xl font-semibold text-foreground">CityFix</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4" aria-label="Main navigation">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(path)
                    ? "bg-urban-100 text-urban-800 dark:bg-urban-800 dark:text-urban-100"
                    : "text-muted-foreground hover:bg-urban-50 hover:text-urban-800 dark:hover:bg-urban-900 dark:hover:text-urban-100"
                )}
                aria-current={isActive(path) ? 'page' : undefined}
              >
                <span className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                  {label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right side - Auth buttons or User menu */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="hidden md:flex"
                >
                  <Link to="/report">
                    <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
                    Report Issue
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="relative h-8 w-8 rounded-full focus:ring-2 focus:ring-urban-500"
                      aria-label="User menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                        <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{currentUser?.name}</p>
                        <p className="w-[200px] truncate text-xs text-muted-foreground">
                          {currentUser?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" aria-hidden="true" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {currentUser?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden focus:ring-2 focus:ring-urban-500"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  <div className="py-6 space-y-4">
                    {navItems.map(({ path, label, icon: Icon }) => (
                      <Link
                        key={path}
                        to={path}
                        className={cn(
                          "flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors",
                          isActive(path)
                            ? "bg-urban-100 text-urban-800 dark:bg-urban-800 dark:text-urban-100"
                            : "hover:bg-urban-50 hover:text-urban-800 dark:hover:bg-urban-900 dark:hover:text-urban-100"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActive(path) ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5 mr-3" aria-hidden="true" />
                        {label}
                      </Link>
                    ))}
                    {isAuthenticated && (
                      <Link
                        to="/report"
                        className="flex items-center px-4 py-2 text-base font-medium hover:bg-urban-100 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <AlertTriangle className="h-5 w-5 mr-3" aria-hidden="true" />
                        Report Issue
                      </Link>
                    )}
                  </div>

                  {/* Auth buttons for mobile */}
                  <div className="mt-auto border-t py-6">
                    {isAuthenticated ? (
                      <div className="px-4">
                        <div className="flex items-center mb-4">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                            <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{currentUser?.name}</p>
                            <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <Button 
                            variant="outline" 
                            className="w-full flex items-center justify-center" 
                            asChild
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Link to="/profile">
                              <User className="mr-2 h-4 w-4" aria-hidden="true" />
                              Profile
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full flex items-center justify-center" 
                            asChild
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Link to="/settings">
                              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                              Settings
                            </Link>
                          </Button>
                        </div>
                        <Button 
                          variant="default" 
                          className="w-full" 
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="px-4 space-y-2">
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            Login
                          </Link>
                        </Button>
                        <Button className="w-full" asChild>
                          <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                            Register
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-6 h-full">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CityFixLogo size={24} className="text-urban-600" />
              <span className="ml-2 text-sm text-muted-foreground">© 2024 CityFix. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
