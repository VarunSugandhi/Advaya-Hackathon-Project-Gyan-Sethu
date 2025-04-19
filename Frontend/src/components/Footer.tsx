
import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-edu-purple" />
              <span className="font-bold text-xl hero-gradient">{t('appName')}</span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              {t('heroSubtitle')}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t('appName')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/buy-courses" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('browseCourses')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('login')}
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('signup')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t('appName')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">hello@edusparkforge.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">+1 234 567 8900</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground">Bengaluru, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40">
          <p className="text-center text-muted-foreground text-sm">
            &copy; {currentYear} {t('appName')}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
