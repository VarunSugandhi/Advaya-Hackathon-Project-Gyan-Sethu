import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  FileText, 
  HelpCircle, 
  BookOpenCheck,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import StudentSidebar from '@/components/student/StudentSidebar';
import StudentMobileNav from '@/components/student/StudentMobileNav';

interface Course {
  id: string;
  title: string;
}

interface AIOutput {
  id: string;
  data: any;
  created_at: string;
  output_type: 'note' | 'quiz' | 'flashcard';
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Flashcard {
  front: string;
  back: string;
}

const AITutor: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tab, setTab] = useState('notes');
  const [aiOutputs, setAiOutputs] = useState<AIOutput[]>([]);
  const [currentOutput, setCurrentOutput] = useState<AIOutput | null>(null);
  
  // Grok API key
  const grokApiKey = 'grk-or-v1-23ab259715cba200ba4c7cf43ada808fa1a71166055c31a33ccca719230b862f';

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
        
        if (enrollments.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Get course info
        const courseIds = enrollments.map(e => e.course_id);
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds);
          
        if (coursesError) throw coursesError;
        
        setCourses(coursesData);
        
        if (coursesData.length > 0 && !selectedCourse) {
          setSelectedCourse(coursesData[0].id);
        }
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

  useEffect(() => {
    const fetchAIOutputs = async () => {
      if (!user || !selectedCourse) return;

      try {
        const { data, error } = await supabase
          .from('ai_outputs')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', selectedCourse)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Explicitly cast the output_type to the expected type
        const typedData = data.map(item => ({
          ...item,
          output_type: item.output_type as 'note' | 'quiz' | 'flashcard'
        }));
        
        setAiOutputs(typedData);
        
        // Set the most recent output of the current type as the current output
        const typeOutput = typedData.find(output => output.output_type === tab);
        if (typeOutput) {
          setCurrentOutput(typeOutput);
        } else {
          setCurrentOutput(null);
        }
      } catch (error: any) {
        console.error('Error fetching AI outputs:', error);
      }
    };

    fetchAIOutputs();
  }, [user, selectedCourse, tab]);

  const getCourseInfo = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          title, 
          description,
          lecture_videos (
            title,
            description
          )
        `)
        .eq('id', courseId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching course info:', error);
      return null;
    }
  };

  const generateWithGrok = async (type: 'note' | 'quiz' | 'flashcard') => {
    if (!user || !selectedCourse) {
      toast({
        title: 'Error',
        description: 'Please select a course first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Get course info for context
      const courseInfo = await getCourseInfo(selectedCourse);
      if (!courseInfo) {
        throw new Error('Could not fetch course information');
      }
      
      // Prepare lectures information
      const lectureInfo = courseInfo.lecture_videos.map((lecture: any) => 
        `${lecture.title}: ${lecture.description || 'No description'}`
      ).join('\n\n');
      
      // Prepare prompt based on type
      let prompt = '';
      let responseFormat = {};
      
      switch (type) {
        case 'note':
          prompt = `Generate comprehensive study notes for a course titled "${courseInfo.title}" with description "${courseInfo.description}". The course covers the following lectures:\n\n${lectureInfo}\n\nCreate well-organized notes with headings, subheadings, and bullet points covering all key concepts.`;
          break;
        case 'quiz':
          prompt = `Create a quiz with 5 multiple-choice questions about the course "${courseInfo.title}" with description "${courseInfo.description}". The course covers the following lectures:\n\n${lectureInfo}\n\nReturn a JSON array with 5 questions, each with a question, 4 options, and the correct answer.`;
          responseFormat = {
            questions: [
              {
                question: "Example question?",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: "Option A"
              }
            ]
          };
          break;
        case 'flashcard':
          prompt = `Create 5 flashcards to help study the course "${courseInfo.title}" with description "${courseInfo.description}". The course covers the following lectures:\n\n${lectureInfo}\n\nReturn a JSON array with 5 flashcards, each with a front (term/question) and back (definition/answer).`;
          responseFormat = {
            flashcards: [
              {
                front: "Front of card (term or question)",
                back: "Back of card (definition or answer)"
              }
            ]
          };
          break;
      }
      
      // For demonstration purposes, let's simulate Grok API call
      // In a real implementation, you would make an actual API call to Grok
      
      console.log('Simulating Grok API call with key:', grokApiKey);
      
      // Simulate API response after a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let generatedContent;
      
      switch (type) {
        case 'note':
          generatedContent = {
            notes: `# ${courseInfo.title} - Study Notes\n\n## Course Overview\n${courseInfo.description}\n\n## Key Concepts\n\n${courseInfo.lecture_videos.map((lecture: any, index: number) => 
              `### ${index + 1}. ${lecture.title}\n${lecture.description || 'No description'}\n\n- Important point 1\n- Important point 2\n- Important point 3\n\n`
            ).join('')}`
          };
          break;
        case 'quiz':
          generatedContent = {
            questions: Array.from({ length: 5 }, (_, i) => ({
              question: `Question ${i + 1} about ${courseInfo.title}?`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: "Option A"
            }))
          };
          break;
        case 'flashcard':
          generatedContent = {
            flashcards: Array.from({ length: 5 }, (_, i) => ({
              front: `Term/Concept ${i + 1} from ${courseInfo.title}`,
              back: `Definition/Explanation for term/concept ${i + 1}`
            }))
          };
          break;
      }
      
      // Store the generated content in Supabase
      const { data, error } = await supabase
        .from('ai_outputs')
        .insert([
          {
            user_id: user.id,
            course_id: selectedCourse,
            output_type: type,
            data: generatedContent
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Explicitly cast the output_type for type safety
      const typedData = {
        ...data,
        output_type: data.output_type as 'note' | 'quiz' | 'flashcard'
      };
        
      // Update the state
      setAiOutputs(prev => [typedData, ...prev]);
      setCurrentOutput(typedData);
      setTab(type);
      
      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully`,
      });
    } catch (error: any) {
      console.error('Error generating with Grok:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to generate ${type}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      
      <div className="flex-1">
        <StudentMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">AI Tutor</h1>
            <p className="text-muted-foreground mt-1">Learn with AI-powered resources</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-edu-purple rounded-full border-t-transparent"></div>
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You are not enrolled in any courses yet.</p>
                <Button asChild className="btn-primary-gradient">
                  <Link to="/student/buy-courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Course</label>
                    <Select
                      value={selectedCourse || ''}
                      onValueChange={setSelectedCourse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end gap-3">
                    <Button 
                      onClick={() => generateWithGrok('note')} 
                      disabled={!selectedCourse || isGenerating}
                      className="flex-1"
                    >
                      {isGenerating && tab === 'notes' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Generate Notes
                    </Button>
                    <Button 
                      onClick={() => generateWithGrok('quiz')} 
                      disabled={!selectedCourse || isGenerating}
                      className="flex-1"
                    >
                      {isGenerating && tab === 'quiz' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <HelpCircle className="h-4 w-4 mr-2" />
                      )}
                      Generate Quiz
                    </Button>
                    <Button 
                      onClick={() => generateWithGrok('flashcard')} 
                      disabled={!selectedCourse || isGenerating}
                      className="flex-1"
                    >
                      {isGenerating && tab === 'flashcard' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <BookOpenCheck className="h-4 w-4 mr-2" />
                      )}
                      Generate Flashcards
                    </Button>
                  </div>
                </div>
              </div>
              
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  <TabsTrigger value="flashcard">Flashcards</TabsTrigger>
                </TabsList>
                
                {/* Notes Tab */}
                <TabsContent value="notes">
                  <Card>
                    <CardContent className="pt-6">
                      {currentOutput && currentOutput.output_type === 'note' ? (
                        <div className="prose max-w-none dark:prose-invert">
                          {currentOutput.data.notes.split('\n').map((line: string, index: number) => {
                            if (line.startsWith('# ')) {
                              return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
                            } else if (line.startsWith('## ')) {
                              return <h2 key={index} className="text-xl font-bold mt-5 mb-3">{line.substring(3)}</h2>;
                            } else if (line.startsWith('### ')) {
                              return <h3 key={index} className="text-lg font-bold mt-4 mb-2">{line.substring(4)}</h3>;
                            } else if (line.startsWith('- ')) {
                              return <li key={index} className="ml-5 mb-1">{line.substring(2)}</li>;
                            } else if (line === '') {
                              return <br key={index} />;
                            } else {
                              return <p key={index} className="mb-3">{line}</p>;
                            }
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No notes generated yet. Click "Generate Notes" to create study materials.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Quiz Tab */}
                <TabsContent value="quiz">
                  <Card>
                    <CardContent className="pt-6">
                      {currentOutput && currentOutput.output_type === 'quiz' ? (
                        <div className="space-y-6">
                          {currentOutput.data.questions.map((question: QuizQuestion, qIndex: number) => (
                            <div key={qIndex} className="p-4 border border-border rounded-lg">
                              <h3 className="text-lg font-medium mb-3">{question.question}</h3>
                              <div className="space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex items-center">
                                    <input 
                                      type="radio" 
                                      id={`q${qIndex}o${oIndex}`} 
                                      name={`question-${qIndex}`} 
                                      className="mr-2"
                                    />
                                    <label htmlFor={`q${qIndex}o${oIndex}`}>{option}</label>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-3 border-t border-border">
                                <details>
                                  <summary className="cursor-pointer text-sm text-primary">Show Answer</summary>
                                  <p className="mt-2 p-2 bg-primary/10 rounded-md text-sm">
                                    Correct Answer: {question.correctAnswer}
                                  </p>
                                </details>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No quiz generated yet. Click "Generate Quiz" to create questions.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Flashcards Tab */}
                <TabsContent value="flashcard">
                  <Card>
                    <CardContent className="pt-6">
                      {currentOutput && currentOutput.output_type === 'flashcard' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentOutput.data.flashcards.map((flashcard: Flashcard, index: number) => (
                            <div key={index} className="border border-border rounded-lg overflow-hidden">
                              <div className="bg-muted p-4 font-medium flex justify-between items-center">
                                <span>Flashcard {index + 1}</span>
                              </div>
                              <details>
                                <summary className="p-4 cursor-pointer">
                                  <div className="font-medium">{flashcard.front}</div>
                                </summary>
                                <div className="p-4 pt-0 border-t border-border">
                                  <p>{flashcard.back}</p>
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BookOpenCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No flashcards generated yet. Click "Generate Flashcards" to create study cards.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AITutor;
