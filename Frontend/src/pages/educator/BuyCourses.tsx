
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorMobileNav from '@/components/educator/EducatorMobileNav';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  tags: string[];
  created_by: string;
  educator: {
    first_name: string;
    last_name: string;
  };
  is_enrolled: boolean;
}

const EducatorBuyCourses: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get user's enrollments
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id);
          
        if (enrollmentError) throw enrollmentError;
        
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        // Get all courses by other educators
        const { data, error } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            price,
            tags,
            created_by,
            educator:profiles(first_name, last_name)
          `)
          .neq('created_by', user.id); // Only show courses by other educators

        if (error) throw error;
        
        // Mark courses as enrolled or not
        const coursesWithEnrollmentStatus = data.map(course => ({
          ...course,
          is_enrolled: enrolledCourseIds.includes(course.id)
        }));
        
        setCourses(coursesWithEnrollmentStatus);
      } catch (error: any) {
        console.error('Error fetching courses:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load courses. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user, toast]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;

    try {
      // Check if already enrolled
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingEnrollment) {
        toast({
          title: 'Already enrolled',
          description: 'You are already enrolled in this course.',
        });
        return;
      }

      // Enroll in the course
      const { error } = await supabase
        .from('enrollments')
        .insert([
          {
            user_id: user.id,
            course_id: courseId,
            progress: 0
          }
        ]);

      if (error) throw error;

      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, is_enrolled: true } 
            : course
        )
      );

      toast({
        title: 'Enrolled successfully',
        description: 'You have successfully enrolled in this course.',
      });
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      toast({
        variant: 'destructive',
        title: 'Enrollment failed',
        description: error.message || 'Failed to enroll in this course.',
      });
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="flex min-h-screen bg-background">
      <EducatorSidebar />
      
      <div className="flex-1">
        <EducatorMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{t('browseCourses')}</h1>
            <p className="text-muted-foreground mt-1">Discover and learn from other educators</p>
          </div>
          
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-edu-purple rounded-full border-t-transparent"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No courses match your search criteria.' : 'No courses available yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
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
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {course.description || "No description available"}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.tags && course.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-accent/50">{tag}</Badge>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">
                        {course.price > 0 ? `₹${course.price.toFixed(2)}` : 'Free'}
                      </p>
                      {course.is_enrolled ? (
                        <Button variant="outline" asChild>
                          <Link to={`/student/course/${course.id}`}>{t('continueLearning')}</Link>
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleEnroll(course.id)}
                          className="btn-primary-gradient"
                        >
                          {t('enrollNow')}
                        </Button>
                      )}
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

export default EducatorBuyCourses;
