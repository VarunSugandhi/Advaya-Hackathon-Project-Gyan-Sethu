
import React from 'react';
import { FlameIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type StreakCardProps = {
  currentStreak: number;
};

const StreakCard: React.FC<StreakCardProps> = ({ currentStreak }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-card rounded-xl border border-border/40 p-6 shadow-sm h-full">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-edu-orange/10 flex items-center justify-center mb-4">
          <FlameIcon className="h-8 w-8 text-edu-orange" />
        </div>
        <h3 className="text-lg font-medium text-center mb-1">{t('currentStreak')}</h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{currentStreak}</span>
          <span className="ml-1 text-muted-foreground">{t('days')}</span>
        </div>
        
        {currentStreak > 0 && (
          <div className="mt-4 w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-edu-orange to-edu-purple h-3 rounded-full"
              style={{ width: `${Math.min(100, (currentStreak / 30) * 100)}%` }}
            />
          </div>
        )}
        
        {currentStreak >= 7 && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Keep going! You're on fire!
          </p>
        )}
      </div>
    </div>
  );
};

export default StreakCard;
