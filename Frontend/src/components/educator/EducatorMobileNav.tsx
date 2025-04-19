
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Home, 
  Upload, 
  ShoppingCart,
  DollarSign,
  Menu, 
  X,
  LogOut
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const EducatorMobileNav = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      href: '/educator/dashboard',
      icon: Home,
      label: t('dashboard')
    },
    {
      href: '/educator/my-courses',
      icon: BookOpen,
      label: 'My Courses'
    },
    {
      href: '/educator/upload-course',
      icon: Upload,
      label: t('uploadCourse')
    },
    {
      href: '/educator/revenue',
      icon: DollarSign,
      label: 'Revenue'
    },
    {
      href: '/educator/buy-courses',
      icon: ShoppingCart,
      label: t('buyCourses')
    }
  ];

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/educator/dashboard" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-edu-purple to-edu-blue">
          GYAN SETHU
        </Link>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 rounded-md hover:bg-accent">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-edu-purple to-edu-blue">
                    GYAN SETHU
                  </h1>
                  <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-accent">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {profile && (
                  <div className="flex items-center p-3 bg-accent/50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-edu-purple/20 flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.first_name || 'User'} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-edu-purple font-semibold">
                          {profile.first_name?.[0] || 'E'}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">
                        {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Educator'}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('educatorAccount')}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg",
                      location.pathname === item.href
                        ? "bg-edu-purple/10 text-edu-purple"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              
              <div className="p-4 mt-auto border-t border-border">
                <Link
                  to="/logout"
                  onClick={() => setOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  {t('signOut')}
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default EducatorMobileNav;
