
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorMobileNav from '@/components/educator/EducatorMobileNav';

interface CourseStat {
  id: string;
  title: string;
  enrollmentCount: number;
  thumbnail_url: string | null;
}

const EducatorDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
  });
  const [courses, setCourses] = useState<CourseStat[]>([]);

  useEffect(() => {
    const fetchEducatorStats = async () => {
      if (!profile) return;

      try {
        setIsLoading(true);
        
        // Get educator courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, thumbnail_url')
          .eq('created_by', profile.id);
          
        if (coursesError) throw coursesError;
        
        // Get enrollments for each course
        const coursesWithStats = await Promise.all(
          coursesData.map(async (course) => {
            const { count, error: countError } = await supabase
              .from('enrollments')
              .select('id', { count: 'exact' })
              .eq('course_id', course.id);
              
            if (countError) throw countError;
            
            return {
              ...course,
              enrollmentCount: count || 0,
            };
          })
        );
        
        // Calculate total students (unique)
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('user_id')
          .in('course_id', coursesData.map(c => c.id));
          
        if (enrollmentError) throw enrollmentError;
        
        const uniqueStudents = new Set(enrollmentData.map(e => e.user_id));
        
        // Set the stats
        setStats({
          totalCourses: coursesData.length,
          totalStudents: uniqueStudents.size,
          totalRevenue: 0, // This would come from a payments table in a real app
        });
        
        setCourses(coursesWithStats);
      } catch (error) {
        console.error('Error fetching educator stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEducatorStats();
  }, [profile]);

  return (
    <div className="flex min-h-screen bg-background">
      <EducatorSidebar />
      
      <div className="flex-1">
        <EducatorMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-edu-purple rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold">{t('welcomeBack')}, {profile?.first_name || 'Educator'}!</h1>
                <p className="text-muted-foreground mt-1">Here's an overview of your teaching platform</p>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Courses</p>
                        <h3 className="text-2xl font-bold">{stats.totalCourses}</h3>
                      </div>
                      <div className="bg-edu-purple/10 p-2 rounded-full">
                        <BookOpen className="h-5 w-5 text-edu-purple" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
                        <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
                      </div>
                      <div className="bg-edu-blue/10 p-2 rounded-full">
                        <Users className="h-5 w-5 text-edu-blue" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                        <h3 className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</h3>
                      </div>
                      <div className="bg-edu-green/10 p-2 rounded-full">
                        <DollarSign className="h-5 w-5 text-edu-green" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* My Courses */}
              <div>
                <h2 className="text-xl font-semibold mb-4">My Courses</h2>
                {courses.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground mb-4">You haven't created any courses yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <Card key={course.id}>
                        <div className="aspect-video bg-muted">
                          {course.thumbnail_url ? (
                            <img 
                              src={course.thumbnail_url} 
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="pt-4">
                          <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{course.enrollmentCount} students</span>
                            </div>
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              <span>+{Math.floor(Math.random() * 10)}% this week</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default EducatorDashboard;
