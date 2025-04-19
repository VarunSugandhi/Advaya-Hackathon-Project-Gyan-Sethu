
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, LucideShield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import AnimatedText from '@/components/AnimatedText';
import HeroAnimation from '@/components/HeroAnimation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const Landing: React.FC = () => {
  const { t } = useLanguage();
  
  const animatedItems = [
    'interactive',
    'engaging',
    'effective',
    'personalized',
    'innovative'
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar isAuthenticated={false} />
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 hero-gradient leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-2xl mx-auto">
              <AnimatedText 
                items={animatedItems} 
                className="font-semibold text-edu-purple" 
              /> {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="btn-primary-gradient">
                <Link to="/signup">{t('getStarted')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/buy-courses">{t('browseCourses')}</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* 3D Animation */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <HeroAnimation />
        </div>
        
        {/* Bottom Curve */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
            <path 
              fill="currentColor" 
              fillOpacity="0.05" 
              d="M0,224L60,213.3C120,203,240,181,360,192C480,203,600,245,720,250.7C840,256,960,224,1080,197.3C1200,171,1320,149,1380,138.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            />
          </svg>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12 md:py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 hero-gradient">
            {t('appName')} Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-background rounded-xl p-6 shadow-md border border-border/40 card-hover">
              <div className="h-12 w-12 bg-edu-blue/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-edu-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Courses</h3>
              <p className="text-muted-foreground">
                Engage with dynamic content designed to make learning enjoyable and effective.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-background rounded-xl p-6 shadow-md border border-border/40 card-hover">
              <div className="h-12 w-12 bg-edu-purple/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-edu-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Educators</h3>
              <p className="text-muted-foreground">
                Learn from experienced professionals who are passionate about teaching.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-background rounded-xl p-6 shadow-md border border-border/40 card-hover">
              <div className="h-12 w-12 bg-edu-green/10 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-edu-green" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Certifications</h3>
              <p className="text-muted-foreground">
                Earn certificates that showcase your newly acquired skills and knowledge.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-background rounded-xl p-6 shadow-md border border-border/40 card-hover">
              <div className="h-12 w-12 bg-edu-orange/10 rounded-lg flex items-center justify-center mb-4">
                <LucideShield className="h-6 w-6 text-edu-orange" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Tutoring</h3>
              <p className="text-muted-foreground">
                Get personalized help with our AI tutoring system that adapts to your learning style.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-gradient-to-r from-edu-blue/5 via-edu-purple/5 to-edu-green/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 hero-gradient">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-foreground/80 mb-8">
              Join thousands of students and educators on our platform today.
            </p>
            <Button size="lg" asChild className="btn-primary-gradient">
              <Link to="/signup">{t('getStarted')}</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Landing;
