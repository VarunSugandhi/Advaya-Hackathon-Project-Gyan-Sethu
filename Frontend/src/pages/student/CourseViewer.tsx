
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BookOpen, 
  PlayCircle, 
  ChevronLeft, 
  Check,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration: number;
  order_number: number;
  completed: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_by: string;
  educator: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface RecommendedCourse {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

const CourseViewer: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDropoutMessage, setShowDropoutMessage] = useState(false);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchTimeRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!user || !courseId) return;

      try {
        setIsLoading(true);
        
        // Get course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            created_by,
            educator:profiles(first_name, last_name)
          `)
          .eq('id', courseId)
          .single();
          
        if (courseError) throw courseError;
        
        setCourse(courseData);
        
        // Get lecture videos
        const { data: lectureData, error: lectureError } = await supabase
          .from('lecture_videos')
          .select('*')
          .eq('course_id', courseId)
          .order('order_number', { ascending: true });
          
        if (lectureError) throw lectureError;
        
        // Get completed lectures for this user
        const { data: watchData, error: watchError } = await supabase
          .from('lecture_watch_logs')
          .select('lecture_id, completed')
          .eq('user_id', user.id)
          .in('lecture_id', lectureData.map(lecture => lecture.id));
          
        if (watchError) throw watchError;
        
        // Map completed status to lectures
        const lecturesWithStatus = lectureData.map(lecture => ({
          ...lecture,
          completed: watchData.some(log => log.lecture_id === lecture.id && log.completed)
        }));
        
        setLectures(lecturesWithStatus);
        
        // Set first lecture as selected if available
        if (lecturesWithStatus.length > 0) {
          setSelectedLecture(lecturesWithStatus[0]);
        }
        
        // Calculate progress
        const completedCount = lecturesWithStatus.filter(l => l.completed).length;
        const progressPercent = lecturesWithStatus.length > 0 
          ? (completedCount / lecturesWithStatus.length) * 100 
          : 0;
        
        setProgress(progressPercent);
        
        // Update enrollment progress
        if (lecturesWithStatus.length > 0) {
          await supabase
            .from('enrollments')
            .update({ progress: progressPercent })
            .eq('user_id', user.id)
            .eq('course_id', courseId);
        }
        
        // Get recommended courses
        const { data: recommendedData, error: recommendedError } = await supabase
          .from('courses')
          .select('id, title, thumbnail_url')
          .neq('id', courseId)
          .limit(3);
          
        if (recommendedError) throw recommendedError;
        
        setRecommendedCourses(recommendedData);
      } catch (error: any) {
        console.error('Error fetching course data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load course data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
    
    // Clear watch time interval on unmount
    return () => {
      if (watchTimeRef.current) {
        clearInterval(watchTimeRef.current);
      }
    };
  }, [user, courseId, toast]);

  useEffect(() => {
    // Start tracking watch time when selected lecture changes
    if (selectedLecture && videoRef.current) {
      setWatchTime(0);
      setIsCompleted(selectedLecture.completed);
      
      // Set up interval to track watch time
      if (watchTimeRef.current) {
        clearInterval(watchTimeRef.current);
      }
      
      watchTimeRef.current = setInterval(() => {
        if (videoRef.current && !videoRef.current.paused) {
          setWatchTime(prev => prev + 1);
        }
      }, 1000);
    }
    
    return () => {
      if (watchTimeRef.current) {
        clearInterval(watchTimeRef.current);
      }
    };
  }, [selectedLecture]);

  useEffect(() => {
    // Check if user has spent enough time watching
    if (selectedLecture && watchTime >= selectedLecture.duration) {
      markLectureCompleted();
    }
    
    // Show dropout message if user spends 10+ minutes more than the video duration
    if (selectedLecture && watchTime >= selectedLecture.duration + 600 && !showDropoutMessage) {
      setShowDropoutMessage(true);
    }
  }, [watchTime, selectedLecture]);

  const markLectureCompleted = async () => {
    if (!user || !selectedLecture || isCompleted) return;
    
    try {
      // Log the watch completion
      const { error } = await supabase
        .from('lecture_watch_logs')
        .insert([
          {
            user_id: user.id,
            lecture_id: selectedLecture.id,
            watched_duration: watchTime,
            completed: true
          }
        ]);
        
      if (error) throw error;
      
      // Update local state
      setIsCompleted(true);
      setLectures(prev => 
        prev.map(lecture => 
          lecture.id === selectedLecture.id 
            ? { ...lecture, completed: true } 
            : lecture
        )
      );
      
      // Recalculate progress
      const completedCount = lectures.filter(l => 
        l.completed || l.id === selectedLecture.id
      ).length;
      
      const progressPercent = (completedCount / lectures.length) * 100;
      setProgress(progressPercent);
      
      // Update enrollment progress
      await supabase
        .from('enrollments')
        .update({ progress: progressPercent })
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      
      toast({
        title: 'Lecture Completed',
        description: 'Your progress has been saved',
      });
    } catch (error: any) {
      console.error('Error marking lecture as completed:', error);
    }
  };

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setShowDropoutMessage(false);
    
    // Reset video position
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm border-b border-border">
        <div className="container px-4 py-4 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/student/my-enrollments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Enrollments
            </Link>
          </Button>
          
          <div>
            <h1 className="text-lg font-semibold line-clamp-1">{course?.title || 'Loading...'}</h1>
            {course?.educator && (
              <p className="text-sm text-muted-foreground">
                By {course.educator.first_name} {course.educator.last_name}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="container px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-edu-purple rounded-full border-t-transparent"></div>
          </div>
        </div>
      ) : (
        <div className="container px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player and Content */}
            <div className="lg:col-span-2">
              {selectedLecture ? (
                <>
                  {/* Video Player */}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                    <video
                      ref={videoRef}
                      src={selectedLecture.video_url}
                      controls
                      className="w-full h-full"
                      onEnded={markLectureCompleted}
                    />
                  </div>
                  
                  {/* Lecture Info */}
                  <h2 className="text-xl font-semibold mb-2">
                    {selectedLecture.title}
                  </h2>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>
                      {Math.floor(selectedLecture.duration / 60)} min {selectedLecture.duration % 60} sec
                    </span>
                    {isCompleted && (
                      <span className="ml-3 flex items-center text-edu-green">
                        <Check className="h-4 w-4 mr-1" />
                        Completed
                      </span>
                    )}
                  </div>
                  
                  {selectedLecture.description && (
                    <p className="text-muted-foreground mb-6">
                      {selectedLecture.description}
                    </p>
                  )}
                  
                  {/* Dropout Message */}
                  {showDropoutMessage && (
                    <Card className="mb-6 bg-primary/5 border-primary/20">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-2">Stay motivated!</h3>
                        <p>
                          We've noticed you've been on this lecture for quite a while. 
                          Remember, consistent learning is key to success. 
                          Don't give up - you're making great progress!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Recommendations shown when course is completed */}
                  {progress === 100 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Recommended Next Courses</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {recommendedCourses.map(course => (
                          <Link key={course.id} to={`/student/course/${course.id}`}>
                            <div className="border border-border rounded-lg overflow-hidden hover:border-primary transition-colors">
                              <div className="aspect-video bg-muted">
                                {course.thumbnail_url ? (
                                  <img 
                                    src={course.thumbnail_url} 
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="p-3">
                                <h4 className="font-medium line-clamp-2">{course.title}</h4>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center p-6">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">This course has no lectures yet.</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Course Lectures List */}
            <div>
              <Card>
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Course Content</h3>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Your progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto">
                  {lectures.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-muted-foreground">No lectures available</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {lectures.map((lecture) => (
                        <div 
                          key={lecture.id}
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${selectedLecture?.id === lecture.id ? 'bg-muted' : ''}`}
                          onClick={() => handleLectureSelect(lecture)}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-3">
                              {lecture.completed ? (
                                <div className="h-6 w-6 rounded-full bg-edu-green/20 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-edu-green" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                                  <PlayCircle className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1 line-clamp-2">
                                {lecture.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseViewer;
