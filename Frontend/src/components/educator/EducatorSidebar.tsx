
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Home, 
  Upload, 
  ShoppingCart,
  DollarSign,
  LogOut
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const EducatorSidebar = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const location = useLocation();

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
    <div className="hidden md:flex flex-col w-64 bg-card border-r border-border z-20 fixed top-0 bottom-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-edu-purple to-edu-blue">
          GYAN SETHU
        </h1>
      </div>
      
      <div className="px-4 mb-4">
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
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
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
      
      <div className="p-4 mt-auto">
        <Link
          to="/logout"
          className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          {t('signOut')}
        </Link>
      </div>
    </div>
  );
};

export default EducatorSidebar;
