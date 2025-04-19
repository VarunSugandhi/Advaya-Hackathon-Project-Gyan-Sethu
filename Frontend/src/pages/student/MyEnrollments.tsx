
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  PlayCircle, 
  Clock,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import StudentSidebar from '@/components/student/StudentSidebar';
import StudentMobileNav from '@/components/student/StudentMobileNav';
import { format } from 'date-fns';

interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
    created_by: string;
    educator: {
      first_name: string | null;
      last_name: string | null;
    };
    lecture_count: number;
    completed_lectures: number;
  };
}

const MyEnrollments: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get user enrollments with course details
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            course_id,
            progress,
            enrolled_at,
            course:courses(
              id,
              title,
              description,
              thumbnail_url,
              created_by,
              educator:profiles(first_name, last_name)
            )
          `)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Get lecture counts for each course
        const enrollmentsWithLectureCounts = await Promise.all(
          data.map(async (enrollment) => {
            // Get total lecture count
            const { count: lectureCount, error: lectureCountError } = await supabase
              .from('lecture_videos')
              .select('id', { count: 'exact' })
              .eq('course_id', enrollment.course_id);
              
            if (lectureCountError) throw lectureCountError;
            
            // Get completed lecture count
            // Fix: Don't use the filter builder as a value for the 'in' method
            // First, get lecture IDs for the course
            const { data: lectureIds } = await supabase
              .from('lecture_videos')
              .select('id')
              .eq('course_id', enrollment.course_id);
            
            // Then use these IDs to filter the watch logs
            const { count: completedLecturesCount, error: completedError } = 
              lectureIds && lectureIds.length > 0
                ? await supabase
                    .from('lecture_watch_logs')
                    .select('id', { count: 'exact' })
                    .eq('user_id', user.id)
                    .eq('completed', true)
                    .in('lecture_id', lectureIds.map(l => l.id))
                : { count: 0, error: null };
              
            if (completedError) throw completedError;
            
            return {
              ...enrollment,
              course: {
                ...enrollment.course,
                lecture_count: lectureCount || 0,
                completed_lectures: completedLecturesCount || 0
              }
            };
          })
        );
        
        setEnrollments(enrollmentsWithLectureCounts);
      } catch (error: any) {
        console.error('Error fetching enrollments:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your enrollments. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollments();
  }, [user, toast]);

  // Calculate time remaining (dummy calculation)
  const getTimeRemaining = (enrollment: Enrollment) => {
    const totalLectures = enrollment.course.lecture_count;
    const completedLectures = enrollment.course.completed_lectures;
    const remainingLectures = totalLectures - completedLectures;
    
    // Assuming each lecture takes 20 minutes on average
    const minutesRemaining = remainingLectures * 20;
    
    if (minutesRemaining <= 0) return 'Complete';
    if (minutesRemaining < 60) return `${minutesRemaining} mins remaining`;
    
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      
      <div className="flex-1">
        <StudentMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{t('myEnrollments')}</h1>
            <p className="text-muted-foreground mt-1">Continue your learning journey</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-edu-purple rounded-full border-t-transparent"></div>
            </div>
          ) : enrollments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You are not enrolled in any courses yet.</p>
                <Button asChild className="btn-primary-gradient">
                  <Link to="/student/buy-courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-video bg-muted relative">
                    {enrollment.course.thumbnail_url ? (
                      <img 
                        src={enrollment.course.thumbnail_url} 
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg mb-1">{enrollment.course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {enrollment.course.description || "No description available"}
                    </p>
                    
                    <div className="flex flex-col gap-4 mt-auto">
                      <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-2" />
                      </div>
                      
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-edu-blue" />
                          <span>{getTimeRemaining(enrollment)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-edu-purple" />
                          <span>Enrolled on {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      
                      <Button asChild className="w-full">
                        <Link to={`/student/course/${enrollment.course_id}`}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Resume Learning
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyEnrollments;
