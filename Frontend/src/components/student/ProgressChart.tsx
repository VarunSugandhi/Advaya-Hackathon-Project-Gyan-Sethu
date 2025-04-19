
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

type ProgressChartProps = {
  data: {
    weekly: {
      name: string;
      watched: number;
      remaining: number;
    }[];
    monthly: {
      name: string;
      watched: number;
      remaining: number;
    }[];
  };
};

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <div className="w-full p-4 bg-card rounded-xl border border-border/40 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">{t('yourProgress')}</h3>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as 'weekly' | 'monthly')}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('weeklyStats')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">{t('weeklyStats')}</SelectItem>
            <SelectItem value="monthly">{t('monthlyStats')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={period === 'weekly' ? data.weekly : data.monthly}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="watched" 
              name={t('lecturesWatched')}
              stroke="#7C3AED" 
              fill="url(#colorWatched)" 
              fillOpacity={0.8}
            />
            <Area 
              type="monotone" 
              dataKey="remaining" 
              name={t('lecturesRemaining')}
              stroke="#1E3A8A" 
              fill="url(#colorRemaining)" 
              fillOpacity={0.6}
            />
            <defs>
              <linearGradient id="colorWatched" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
