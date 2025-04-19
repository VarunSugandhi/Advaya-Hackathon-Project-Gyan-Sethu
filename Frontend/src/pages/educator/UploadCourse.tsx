
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  XCircle, 
  ImagePlus,
  Loader2, 
  Tag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EducatorSidebar from '@/components/educator/EducatorSidebar';
import EducatorMobileNav from '@/components/educator/EducatorMobileNav';

const UploadCourse: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [tagsInput, setTagsInput] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setThumbnail(null);
      setThumbnailPreview(null);
      return;
    }

    const file = e.target.files[0];
    setThumbnail(file);

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setThumbnailPreview(objectUrl);
  };

  const clearThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication error',
        description: 'You must be logged in to upload a course.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Process tags
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnail) {
        const fileExt = thumbnail.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('course_thumbnails')
          .upload(filePath, thumbnail);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('course_thumbnails')
          .getPublicUrl(filePath);
          
        thumbnailUrl = publicUrl;
      }
      
      // Create course
      const { data: course, error } = await supabase
        .from('courses')
        .insert([
          {
            title,
            description,
            price: parseFloat(price),
            tags,
            thumbnail_url: thumbnailUrl,
            created_by: user.id,
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Course created',
        description: 'Your course has been successfully created.',
      });
      
      // Navigate to course details/edit page
      navigate(`/educator/courses/${course.id}`);
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        variant: 'destructive',
        title: 'Error creating course',
        description: error.message || 'An error occurred during course creation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <EducatorSidebar />
      
      <div className="flex-1">
        <EducatorMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{t('uploadTitle')}</h1>
            <p className="text-muted-foreground mt-1">Create a new course for your students</p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('courseTitle')}</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter course title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">{t('courseDescription')}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter course description"
                    rows={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground">$</span>
                    </div>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter 0 for free courses
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">{t('courseTags')}</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="tags"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="programming, javascript, web development"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">{t('courseImage')}</Label>
                  
                  {!thumbnailPreview ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                      />
                      <Label htmlFor="thumbnail" className="cursor-pointer">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                          <ImagePlus className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium mb-1">Click to upload a thumbnail</p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF (max. 2MB)
                        </p>
                      </Label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="rounded-lg object-cover w-full max-h-64"
                      />
                      <button
                        type="button"
                        onClick={clearThumbnail}
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1 rounded-full hover:bg-background"
                      >
                        <XCircle className="h-6 w-6 text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn-primary-gradient"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Create Course
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default UploadCourse;
