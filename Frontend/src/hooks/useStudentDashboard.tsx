
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Enrollment {
  id: string;
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
  };
  progress: number;
}

export interface LectureWatch {
  id: string;
  watched_at: string;
  watched_duration: number;
  lecture: {
    title: string;
  };
}

export interface UserStats {
  lecturesWatched: number;
  lecturesRemaining: number;
  coursesCompleted: number;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

export const useStudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    lecturesWatched: 0,
    lecturesRemaining: 0,
    coursesCompleted: 0,
  });
  const [streak, setStreak] = useState<UserStreak>({
    current_streak: 0,
    longest_streak: 0,
    last_active_date: new Date().toISOString(),
  });
  const [recentActivity, setRecentActivity] = useState<LectureWatch[]>([]);
  const [progressData, setProgressData] = useState({
    weekly: [
      { name: 'Mon', watched: 0, remaining: 0 },
      { name: 'Tue', watched: 0, remaining: 0 },
      { name: 'Wed', watched: 0, remaining: 0 },
      { name: 'Thu', watched: 0, remaining: 0 },
      { name: 'Fri', watched: 0, remaining: 0 },
      { name: 'Sat', watched: 0, remaining: 0 },
      { name: 'Sun', watched: 0, remaining: 0 },
    ],
    monthly: [
      { name: 'Week 1', watched: 0, remaining: 0 },
      { name: 'Week 2', watched: 0, remaining: 0 },
      { name: 'Week 3', watched: 0, remaining: 0 },
      { name: 'Week 4', watched: 0, remaining: 0 },
    ],
  });

  // Fetch user enrollments
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            progress,
            course:courses (
              id,
              title,
              description,
              thumbnail_url
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setEnrollments(data as Enrollment[]);
      } catch (error: any) {
        console.error('Error fetching enrollments:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your courses. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollments();
  }, [user, toast]);

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch lectures watched count
        const { data: watchedData, error: watchedError } = await supabase
          .from('lecture_watch_logs')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('completed', true);

        if (watchedError) throw watchedError;

        // Fetch total lectures count
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
            course:courses (
              id
            )
          `)
          .eq('user_id', user.id);

        if (enrollmentError) throw enrollmentError;

        const courseIds = enrollmentData.map(item => item.course.id);
        
        let totalLectures = 0;
        if (courseIds.length > 0) {
          const { count, error: lectureError } = await supabase
            .from('lecture_videos')
            .select('id', { count: 'exact' })
            .in('course_id', courseIds);
            
          if (lectureError) throw lectureError;
          totalLectures = count || 0;
        }

        // Fetch completed courses count
        const { data: completedData, error: completedError } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('progress', 100);

        if (completedError) throw completedError;

        setStats({
          lecturesWatched: watchedData?.length || 0,
          lecturesRemaining: totalLectures - (watchedData?.length || 0),
          coursesCompleted: completedData?.length || 0,
        });
      } catch (error: any) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  // Fetch user streak
  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setStreak(data as UserStreak);
        } else {
          // Initialize streak if it doesn't exist
          const { data: newStreak, error: createError } = await supabase
            .from('user_streaks')
            .insert([
              { user_id: user.id, current_streak: 0, longest_streak: 0 }
            ])
            .select()
            .single();

          if (createError) throw createError;
          
          if (newStreak) {
            setStreak(newStreak as UserStreak);
          }
        }
      } catch (error: any) {
        console.error('Error fetching streak:', error);
      }
    };

    fetchStreak();
  }, [user]);

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('lecture_watch_logs')
          .select(`
            id,
            watched_at,
            watched_duration,
            lecture:lecture_id (
              title
            )
          `)
          .eq('user_id', user.id)
          .order('watched_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        setRecentActivity(data as LectureWatch[]);
      } catch (error: any) {
        console.error('Error fetching recent activity:', error);
      }
    };

    fetchRecentActivity();
  }, [user]);

  // Simulate progress data for chart
  // In a real app, you would fetch this from the database
  useEffect(() => {
    // This would be replaced with actual data from the database
    // For now, we'll simulate it with random data
    if (enrollments.length === 0) return;

    // Generate weekly data
    const weekly = [
      { name: 'Mon', watched: Math.floor(Math.random() * 5) + 1, remaining: Math.floor(Math.random() * 5) + 1 },
      { name: 'Tue', watched: Math.floor(Math.random() * 5) + 1, remaining: Math.floor(Math.random() * 5) + 1 },
      { name: 'Wed', watched: Math.floor(Math.random() * 5) + 1, remaining: Math.floor(Math.random() * 5) + 1 },
      { name: 'Thu', watched: Math.floor(Math.random() * 5) + 1, remaining: Math.floor(Math.random() * 5) + 1 },
      { name: 'Fri', watched: Math.floor(Math.random() * 5) + 1, remaining: Math.floor(Math.random() * 5) + 1 },
      { name: 'Sat', watched: Math.floor(Math.random() * 5) + 1, remaining: Math.floor(Math.random() * 5) + 1 },
      { name: 'Sun', watched: Math.floor(Math.random() * 5) + 1, remaining: Math.floor(Math.random() * 5) + 1 },
    ];

    // Generate monthly data
    const monthly = [
      { name: 'Week 1', watched: Math.floor(Math.random() * 15) + 5, remaining: Math.floor(Math.random() * 15) + 5 },
      { name: 'Week 2', watched: Math.floor(Math.random() * 15) + 5, remaining: Math.floor(Math.random() * 15) + 5 },
      { name: 'Week 3', watched: Math.floor(Math.random() * 15) + 5, remaining: Math.floor(Math.random() * 15) + 5 },
      { name: 'Week 4', watched: Math.floor(Math.random() * 15) + 5, remaining: Math.floor(Math.random() * 15) + 5 },
    ];

    setProgressData({ weekly, monthly });
  }, [enrollments]);

  return {
    enrollments,
    selectedCourse,
    setSelectedCourse,
    isLoading,
    stats,
    streak,
    recentActivity,
    progressData,
  };
};
