
import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Upload, 
  FileText, 
  Volume2,
  Loader2, 
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import StudentSidebar from '@/components/student/StudentSidebar';
import StudentMobileNav from '@/components/student/StudentMobileNav';

interface Translation {
  id: string;
  file_url: string;
  original_language: string;
  target_language: string;
  translated_text: string;
  created_at: string;
}

const LanguageBud: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('kannada');
  const [originalText, setOriginalText] = useState('');
  const [translatedResult, setTranslatedResult] = useState('');
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [activeTab, setActiveTab] = useState('translate');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For speech synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Grok API key
  const grokApiKey = 'grk-or-v1-23ab259715cba200ba4c7cf43ada808fa1a71166055c31a33ccca719230b862f';

  useEffect(() => {
    const fetchTranslations = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('language_bud_translations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setTranslations(data);
      } catch (error: any) {
        console.error('Error fetching translations:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your translation history.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [user, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      setFileUrl(null);
      return;
    }

    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Create a preview URL for the file
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    
    // For demonstration purposes only - in a real implementation
    // we would parse PDF/document text here
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        // For PDFs we would use a PDF parser library
        // For simplicity, we'll assume it's a text file
        const text = e.target.result as string;
        // Take first 500 characters as a sample
        setOriginalText(text.substring(0, 500) + "...");
      }
    };
    
    // If it's a text file, read as text, otherwise just provide sample text
    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      // Simulate text extraction from non-text files
      setOriginalText(`This is sample extracted text from the ${file.type} file "${file.name}". In a real implementation, we would extract actual text content from the document using appropriate libraries.`);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileUrl(null);
    setOriginalText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranslate = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to translate documents',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to translate',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsTranslating(true);
      
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('language_bud_uploads')
        .upload(filePath, selectedFile);
        
      if (uploadError) throw uploadError;
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('language_bud_uploads')
        .getPublicUrl(filePath);
        
      // For demonstration purposes, simulate translation with Grok API
      console.log('Simulating Grok API translation with key:', grokApiKey);
      
      // Simulate API response after a delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Determine target language full name
      let targetLanguageFullName;
      switch (targetLanguage) {
        case 'kannada':
          targetLanguageFullName = 'Kannada';
          break;
        case 'hindi':
          targetLanguageFullName = 'Hindi';
          break;
        case 'tamil':
          targetLanguageFullName = 'Tamil';
          break;
        case 'telugu':
          targetLanguageFullName = 'Telugu';
          break;
        default:
          targetLanguageFullName = 'Kannada';
      }
      
      // Generate simulated translation
      const simulatedTranslation = `This is a simulated translation of the document to ${targetLanguageFullName}. In a real implementation, we would use the Grok API to translate the text content.\n\nTranslated text would appear here in ${targetLanguageFullName} script. For example, if this was Kannada, you might see text like "ಇದು ಕನ್ನಡದಲ್ಲಿ ಅನುವಾದಿತ ಪಠ್ಯ".\n\nThe translation would preserve the formatting and structure of the original document as much as possible.`;
      
      // Store translation record in database
      const { data: translationData, error } = await supabase
        .from('language_bud_translations')
        .insert([
          {
            user_id: user.id,
            file_url: publicUrl,
            original_language: 'english',
            target_language: targetLanguage,
            translated_text: simulatedTranslation
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Update state
      setTranslatedResult(simulatedTranslation);
      setTranslations(prev => [translationData, ...prev]);
      
      toast({
        title: 'Success',
        description: `Document translated to ${targetLanguageFullName} successfully`,
      });
      
      // Switch to result tab
      setActiveTab('result');
    } catch (error: any) {
      console.error('Error translating document:', error);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: error.message || 'An error occurred during translation',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeech = (text: string) => {
    if (!text) return;
    
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      
      const speech = new SpeechSynthesisUtterance();
      speech.text = text;
      
      // Try to set appropriate voice based on target language
      const voices = window.speechSynthesis.getVoices();
      let targetVoice;
      
      switch (targetLanguage) {
        case 'hindi':
          targetVoice = voices.find(voice => voice.lang === 'hi-IN');
          break;
        case 'tamil':
          targetVoice = voices.find(voice => voice.lang === 'ta-IN');
          break;
        case 'telugu':
          targetVoice = voices.find(voice => voice.lang === 'te-IN');
          break;
        case 'kannada':
          targetVoice = voices.find(voice => voice.lang === 'kn-IN');
          break;
        default:
          // Fallback to default voice
          break;
      }
      
      if (targetVoice) {
        speech.voice = targetVoice;
      }
      
      speech.onend = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(speech);
    } else {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Speech synthesis is not supported in your browser',
      });
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const showTranslation = (translation: Translation) => {
    setTranslatedResult(translation.translated_text);
    setTargetLanguage(translation.target_language);
    setActiveTab('result');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      
      <div className="flex-1">
        <StudentMobileNav />
        
        <main className="px-4 py-6 md:px-8 md:pt-8 md:pb-16 md:ml-64">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Language Bud</h1>
            <p className="text-muted-foreground mt-1">Translate and learn in your preferred language</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="translate">Translate</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            {/* Translate Tab */}
            <TabsContent value="translate">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="file-upload" className="mb-2 block">Upload Document</Label>
                      <div className="relative">
                        <Input
                          id="file-upload"
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.txt"
                          className="hidden"
                        />
                        
                        {!selectedFile ? (
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                              <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium mb-1">Click to upload a document</p>
                            <p className="text-xs text-muted-foreground">
                              PDF, DOC, DOCX or TXT (max. 10MB)
                            </p>
                          </div>
                        ) : (
                          <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 text-primary mr-2" />
                                <span className="text-sm font-medium">{selectedFile.name}</span>
                              </div>
                              <button
                                onClick={clearFile}
                                className="p-1 rounded-full hover:bg-muted"
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </div>
                            
                            <div className="p-3 bg-muted rounded-md">
                              <h4 className="text-sm font-medium mb-1">Extracted Text Sample:</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {originalText || "Extracting text..."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Translate To</Label>
                      <Select
                        value={targetLanguage}
                        onValueChange={setTargetLanguage}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kannada">Kannada</SelectItem>
                          <SelectItem value="hindi">Hindi</SelectItem>
                          <SelectItem value="tamil">Tamil</SelectItem>
                          <SelectItem value="telugu">Telugu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleTranslate} 
                      disabled={!selectedFile || isTranslating}
                      className="w-full btn-primary-gradient"
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-2" />
                          Translate Document
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Result Tab */}
            <TabsContent value="result">
              <Card>
                <CardContent className="pt-6">
                  {translatedResult ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Translation Result</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => isSpeaking ? stopSpeech() : handleSpeech(translatedResult)}
                          >
                            {isSpeaking ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4 mr-2" />
                                Read Aloud
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                        {translatedResult}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No translation results yet.</p>
                      <Button onClick={() => setActiveTab('translate')}>
                        Translate a Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin h-8 w-8 border-4 border-edu-purple rounded-full border-t-transparent"></div>
                    </div>
                  ) : translations.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No translation history yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {translations.map(translation => (
                        <div key={translation.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => showTranslation(translation)}>
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-primary mr-2" />
                              <span className="text-sm font-medium">
                                {translation.file_url.split('/').pop()?.split('?')[0]}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(translation.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">English → </span>
                            <span className="font-medium capitalize">{translation.target_language}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default LanguageBud;
