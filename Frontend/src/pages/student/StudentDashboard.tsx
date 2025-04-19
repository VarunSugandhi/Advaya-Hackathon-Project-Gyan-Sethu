
import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Award,
  CalendarDays
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import StudentSidebar from '@/components/student/StudentSidebar';
import StudentMobileNav from '@/components/student/StudentMobileNav';
import ProgressChart from '@/components/student/ProgressChart';
import StreakCard from '@/components/student/StreakCard';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { formatDistanceToNow } from 'date-fns';

const StudentDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { 
    enrollments, 
    selectedCourse, 
    setSelectedCourse, 
    isLoading, 
    stats,
    streak,
    recentActivity,
    progressData
  } = useStudentDashboard();

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      
      <div className="flex-1">
        <StudentMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-edu-purple rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold">{t('welcomeBack')}, {profile?.first_name || 'Student'}!</h1>
                <p className="text-muted-foreground mt-1">Here's an overview of your learning progress</p>
              </div>
              
              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold">{t('yourProgress')}</h2>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder={t('selectCourse')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {enrollments.map((enrollment) => (
                        <SelectItem key={enrollment.course.id} value={enrollment.course.id}>
                          {enrollment.course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{t('lecturesWatched')}</p>
                        <h3 className="text-2xl font-bold">{stats.lecturesWatched}</h3>
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
                        <p className="text-sm font-medium text-muted-foreground mb-1">{t('lecturesRemaining')}</p>
                        <h3 className="text-2xl font-bold">{stats.lecturesRemaining}</h3>
                      </div>
                      <div className="bg-edu-blue/10 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-edu-blue" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Courses Completed</p>
                        <h3 className="text-2xl font-bold">{stats.coursesCompleted}</h3>
                      </div>
                      <div className="bg-edu-green/10 p-2 rounded-full">
                        <Award className="h-5 w-5 text-edu-green" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Progress Chart & Streak Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  <ProgressChart data={progressData} />
                </div>
                <div>
                  <StreakCard currentStreak={streak.current_streak} />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <Card>
                  <CardContent className="pt-6">
                    {recentActivity.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No recent activity</p>
                    ) : (
                      <ul className="space-y-4">
                        {recentActivity.map((activity) => (
                          <li key={activity.id} className="flex items-start gap-4">
                            <div className="bg-muted p-2 rounded-full">
                              <CalendarDays className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Watched "{activity.lecture.title}"</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.watched_at), { addSuffix: true })}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* My Courses */}
              <div>
                <h2 className="text-xl font-semibold mb-4">My Courses</h2>
                {enrollments.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground mb-4">You are not enrolled in any courses yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="overflow-hidden">
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
                          <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-edu-green h-2 rounded-full" 
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-right mt-1">{enrollment.progress}% complete</p>
                          </div>
                        </div>
                        <CardContent className="pt-4">
                          <h3 className="font-semibold text-lg mb-1">{enrollment.course.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {enrollment.course.description || "No description available"}
                          </p>
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

export default StudentDashboard;
