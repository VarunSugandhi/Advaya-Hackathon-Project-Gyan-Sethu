
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  ArrowUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorMobileNav from '@/components/educator/EducatorMobileNav';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface Course {
  id: string;
  title: string;
  revenue: number;
  enrollmentCount: number;
  percentGrowth: number;
}

interface RevenueData {
  monthlyRevenue: { name: string; revenue: number }[];
  totalRevenue: number;
  monthlyGrowth: number;
  courses: Course[];
}

const Revenue: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    monthlyRevenue: [],
    totalRevenue: 0,
    monthlyGrowth: 0,
    courses: []
  });

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get educator's courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, price')
          .eq('created_by', user.id);
          
        if (coursesError) throw coursesError;
        
        if (coursesData.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Get enrollments for each course to calculate revenue
        const courseIds = coursesData.map(course => course.id);
        
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('course_id, enrolled_at')
          .in('course_id', courseIds);
          
        if (enrollmentsError) throw enrollmentsError;
        
        // Calculate revenue per course (dummy data)
        const coursesWithRevenue = coursesData.map(course => {
          const courseEnrollments = enrollmentsData.filter(e => e.course_id === course.id);
          const revenue = courseEnrollments.length * (course.price || 500); // Each enrollment worth course price or ₹500
          
          // Calculate random growth percentage between 1-20%
          const percentGrowth = Math.floor(Math.random() * 20) + 1;
          
          return {
            id: course.id,
            title: course.title,
            revenue,
            enrollmentCount: courseEnrollments.length,
            percentGrowth
          };
        });
        
        // Generate monthly revenue data (dummy data)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        
        const monthlyRevenue = monthNames.map((name, index) => {
          // Generate increasing revenue trend with some randomness
          const revenue = index <= currentMonth 
            ? Math.floor(1000 + (index * 500) + (Math.random() * 500)) 
            : 0;
            
          return { name, revenue };
        });
        
        // Calculate total revenue
        const totalRevenue = coursesWithRevenue.reduce((sum, course) => sum + course.revenue, 0);
        
        // Set revenue data
        setRevenueData({
          monthlyRevenue: monthlyRevenue.slice(0, currentMonth + 1), // Only show data up to current month
          totalRevenue,
          monthlyGrowth: 12.5, // Dummy growth percentage
          courses: coursesWithRevenue.sort((a, b) => b.revenue - a.revenue) // Sort by revenue
        });
      } catch (error: any) {
        console.error('Error fetching revenue data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load revenue data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueData();
  }, [user, toast]);

  return (
    <div className="flex min-h-screen bg-background">
      <EducatorSidebar />
      
      <div className="flex-1">
        <EducatorMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Revenue</h1>
            <p className="text-muted-foreground mt-1">Track your earnings from course sales</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-edu-purple rounded-full border-t-transparent"></div>
            </div>
          ) : revenueData.courses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You haven't created any courses yet.</p>
                <Button asChild className="btn-primary-gradient">
                  <Link to="/educator/upload-course">Create Your First Course</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Revenue Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                        <h3 className="text-2xl font-bold">₹{revenueData.totalRevenue.toLocaleString()}</h3>
                      </div>
                      <div className="bg-edu-green/10 p-2 rounded-full">
                        <DollarSign className="h-5 w-5 text-edu-green" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Growth</p>
                        <h3 className="text-2xl font-bold flex items-center">
                          {revenueData.monthlyGrowth}%
                          <ArrowUp className="h-4 w-4 ml-1 text-edu-green" />
                        </h3>
                      </div>
                      <div className="bg-edu-purple/10 p-2 rounded-full">
                        <TrendingUp className="h-5 w-5 text-edu-purple" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Active Courses</p>
                        <h3 className="text-2xl font-bold">{revenueData.courses.length}</h3>
                      </div>
                      <div className="bg-edu-blue/10 p-2 rounded-full">
                        <BarChart3 className="h-5 w-5 text-edu-blue" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Revenue Chart */}
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Monthly Revenue</h3>
                    <Select
                      value={timeRange}
                      onValueChange={setTimeRange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">Last Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={revenueData.monthlyRevenue}
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
                          formatter={(value) => [`₹${value}`, 'Revenue']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#7C3AED" 
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#7C3AED' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Revenue by Course */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-6">Revenue by Course</h3>
                  
                  <div className="h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueData.courses}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                        <XAxis type="number" stroke="var(--muted-foreground)" />
                        <YAxis 
                          dataKey="title" 
                          type="category" 
                          stroke="var(--muted-foreground)" 
                          width={150}
                          tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--border)',
                            borderRadius: '8px',
                          }}
                          formatter={(value) => [`₹${value}`, 'Revenue']}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="url(#colorGradient)" 
                          radius={[0, 4, 4, 0]}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#7C3AED" />
                            <stop offset="100%" stopColor="#2563EB" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    {revenueData.courses.map(course => (
                      <div key={course.id} className="flex justify-between items-center p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {course.enrollmentCount} enrollments
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{course.revenue.toLocaleString()}</p>
                          <p className="text-xs flex items-center justify-end text-edu-green">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            {course.percentGrowth}% this month
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const Button = ButtonWithLink;
const Link = LinkForButton;

// Helper components
function ButtonWithLink({ children, asChild, ...props }: any) {
  if (asChild) {
    return <button {...props}>{children}</button>;
  }
  return <button {...props}>{children}</button>;
}

function LinkForButton({ to, children, ...props }: any) {
  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
}

export default Revenue;
