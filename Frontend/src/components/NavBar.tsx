
import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, GraduationCap, Menu, X, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

type NavBarProps = {
  isAuthenticated?: boolean;
};

const NavBar: React.FC<NavBarProps> = ({ isAuthenticated: isAuthProp }) => {
  const { theme, toggleTheme } = useTheme();
  const { t, language, changeLanguage } = useLanguage();
  const { user, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Use the authenticated status from the context if not provided via props
  const isAuthenticated = isAuthProp !== undefined ? isAuthProp : !!user;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-background z-40 border-b border-border/40 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-edu-purple" />
          <span className="font-bold text-lg md:text-xl hero-gradient">{t('appName')}</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/buy-courses" className="text-foreground/80 hover:text-foreground transition-colors">
            {t('browseCourses')}
          </Link>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Languages className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  English {language === 'en' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('kn')}>
                  ಕನ್ನಡ {language === 'kn' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">{profile?.first_name || profile?.role || 'User'}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={profile?.role === 'student' ? '/student/dashboard' : '/educator/dashboard'}>
                      {t('dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/logout">{t('logout')}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to="/login">{t('login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">{t('signup')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border/40 animate-fadeIn">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link 
              to="/buy-courses" 
              className="px-4 py-2 rounded-md hover:bg-accent"
              onClick={toggleMobileMenu}
            >
              {t('browseCourses')}
            </Link>
            
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => {
                changeLanguage(language === 'en' ? 'kn' : 'en');
                toggleMobileMenu();
              }}>
                <Languages className="mr-2 h-4 w-4" />
                {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
              </Button>
            </div>

            {isAuthenticated ? (
              <>
                <Link 
                  to={profile?.role === 'student' ? '/student/dashboard' : '/educator/dashboard'} 
                  className="px-4 py-2 rounded-md hover:bg-accent"
                  onClick={toggleMobileMenu}
                >
                  {t('dashboard')}
                </Link>
                <Link 
                  to="/logout" 
                  className="px-4 py-2 rounded-md hover:bg-accent"
                  onClick={toggleMobileMenu}
                >
                  {t('logout')}
                </Link>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={toggleMobileMenu}>{t('login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup" onClick={toggleMobileMenu}>{t('signup')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
