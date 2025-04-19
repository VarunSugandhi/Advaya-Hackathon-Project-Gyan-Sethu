
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Edit,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorMobileNav from '@/components/educator/EducatorMobileNav';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  enrollmentCount: number;
}

const MyCourses: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get educator's courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, description, thumbnail_url')
          .eq('created_by', user.id);
          
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
              enrollmentCount: count || 0
            };
          })
        );
        
        setCourses(coursesWithStats);
      } catch (error: any) {
        console.error('Error fetching courses:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your courses. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user, toast]);

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      // Check if course has enrollments
      const { count, error: countError } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact' })
        .eq('course_id', courseToDelete);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast({
          variant: 'destructive',
          title: 'Cannot Delete Course',
          description: 'This course has active enrollments and cannot be deleted.',
        });
        return;
      }
      
      // Delete course
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete);
        
      if (error) throw error;
      
      // Update local state
      setCourses(prev => prev.filter(course => course.id !== courseToDelete));
      
      toast({
        title: 'Course Deleted',
        description: 'Your course has been successfully deleted.',
      });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete course. Please try again.',
      });
    } finally {
      setCourseToDelete(null);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-background">
      <EducatorSidebar />
      
      <div className="flex-1">
        <EducatorMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Courses</h1>
              <p className="text-muted-foreground mt-1">Manage your educational content</p>
            </div>
            
            <Button asChild className="btn-primary-gradient">
              <Link to="/educator/upload-course">
                <Plus className="h-4 w-4 mr-2" />
                Create New Course
              </Link>
            </Button>
          </div>
          
          <div className="mb-6">
            <Input
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-edu-purple rounded-full border-t-transparent"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No courses match your search criteria.' : 'You haven\'t created any courses yet.'}
                </p>
                <Button asChild className="btn-primary-gradient">
                  <Link to="/educator/upload-course">Create Your First Course</Link>
                </Button>
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
                  
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description || "No description available"}
                    </p>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{course.enrollmentCount} enrolled students</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={() => setCourseToDelete(course.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Course</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this course? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex items-center bg-destructive/10 p-3 rounded-md mb-4">
                            <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                            <p className="text-sm text-destructive">
                              {course.enrollmentCount > 0 
                                ? "This course has enrolled students and cannot be deleted."
                                : "This will permanently delete the course and all associated content."}
                            </p>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteCourse}
                              disabled={course.enrollmentCount > 0}
                            >
                              Delete Course
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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

export default MyCourses;
