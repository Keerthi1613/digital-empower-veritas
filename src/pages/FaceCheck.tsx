
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle, Loader2, Image, Info, Shield } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const FaceCheck = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Check if bucket exists and create it if it doesn't
  useEffect(() => {
    const setupBucket = async () => {
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const profileImagesBucket = buckets?.find(bucket => bucket.name === 'profile-images');
        
        if (!profileImagesBucket) {
          console.log("Need to create profile-images bucket, will be created during first upload");
        }
      } catch (error) {
        console.error("Error checking buckets:", error);
      }
    };
    
    setupBucket();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.match('image.*')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset previous analysis
      setAnalysisResult(null);
      setRiskLevel(null);
      setErrorMessage(null);
      setUploadProgress(0);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setErrorMessage(null);
    setUploadProgress(0);
    
    try {
      console.log("Starting image analysis process");
      toast({
        title: "Starting analysis",
        description: "Uploading and preparing your image...",
      });
      
      // Begin simulated upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);
      
      // First, upload to Supabase storage for permanent storage
      const fileName = `analysis-${Date.now()}-${selectedImage.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      
      // Upload to profile-images bucket (which will be public)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, selectedImage, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error("Error uploading to Supabase storage:", uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }
      
      setUploadProgress(100);
      console.log("Image uploaded to Supabase storage successfully");
      
      // Get the public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      
      console.log("Image public URL:", publicUrl);
      toast({
        title: "Image uploaded",
        description: "Now analyzing with our AI system...",
      });
      
      // Call facial recognition edge function with the public URL
      const { data, error } = await supabase.functions.invoke('facial-recognition', {
        body: { imageUrl: publicUrl },
      });
      
      // Clear the interval if it hasn't been cleared yet
      clearInterval(progressInterval);
      
      if (error) {
        console.error("Function invocation error:", error);
        throw new Error(`Error calling analysis function: ${error.message}`);
      }
      
      console.log("Received facial recognition response:", data);
      
      // Handle quota error specially (we return status 200 but with error message)
      if (data.error && data.error.includes("quota")) {
        setAnalysisResult("The image analysis service is currently unavailable due to API usage limitations. This is a temporary issue and the service should be restored shortly.");
        setRiskLevel("medium");
        setErrorMessage("API quota exceeded. Please try again later.");
        
        toast({
          title: "Service temporarily unavailable",
          description: "The AI analysis service has reached its usage limit. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      if (data.error) {
        throw new Error(`Analysis error: ${data.error}`);
      }
      
      setAnalysisResult(data.analysis);
      setRiskLevel(data.riskLevel);
      
      toast({
        title: "Analysis complete",
        description: `Risk level: ${data.riskLevel.toUpperCase()}`,
        variant: data.riskLevel === 'high' ? "destructive" : "default",
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      setErrorMessage(error.message || "There was an error analyzing the image");
      toast({
        title: "Analysis failed",
        description: error.message || "There was an error analyzing the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskBadge = () => {
    if (!riskLevel) return null;
    
    const classes = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-red-100 text-red-800 border-red-200"
    };
    
    const icons = {
      low: <CheckCircle className="h-5 w-5 mr-1" />,
      medium: <AlertCircle className="h-5 w-5 mr-1" />,
      high: <AlertCircle className="h-5 w-5 mr-1" />
    };
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${classes[riskLevel]}`}>
        {icons[riskLevel]}
        {riskLevel.toUpperCase()} RISK
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      
      <main className="flex-grow">
        <div className="veritas-container py-8">
          <Card className="max-w-4xl mx-auto mb-8 border-veritas-purple/20">
            <CardHeader className="text-center bg-gradient-to-r from-veritas-lightPurple to-veritas-purple bg-clip-text text-transparent">
              <CardTitle className="text-3xl font-bold">ProfileGuard Scanner</CardTitle>
              <CardDescription className="text-gray-600 mt-2 max-w-2xl mx-auto">
                Upload a profile picture to check if it shows signs of being AI-generated.
                Our advanced AI system analyzes the image for suspicious patterns.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Image</h2>
                
                <div className="flex flex-col items-center justify-center">
                  <label 
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 ${previewUrl ? 'border-solid border-veritas-purple/30' : 'border-dashed border-gray-300'} 
                    rounded-lg cursor-pointer ${previewUrl ? 'bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex flex-col items-center justify-center p-5 text-center">
                      {previewUrl ? (
                        <div className="relative h-full w-full">
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="h-48 object-contain rounded"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="bg-veritas-lightPurple rounded-full p-3 mb-2">
                            <Upload className="w-6 h-6 text-veritas-purple" />
                          </div>
                          <p className="text-gray-700 font-medium">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, or WEBP (Max 5MB)</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>

                  {previewUrl && (
                    <div className="mt-4 text-sm text-gray-500">
                      {selectedImage?.name} • {(selectedImage?.size || 0) / 1024 < 1000 
                        ? `${Math.round((selectedImage?.size || 0) / 1024)} KB` 
                        : `${((selectedImage?.size || 0) / (1024 * 1024)).toFixed(2)} MB`}
                    </div>
                  )}
                </div>
                
                {isAnalyzing && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span>Analyzing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
                
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedImage || isAnalyzing}
                    className="bg-veritas-purple hover:bg-veritas-darkPurple transition-all"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analyzing Image...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </div>
                
                {errorMessage && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
          
          {analysisResult && (
            <Card className={`max-w-4xl mx-auto border ${
              riskLevel === 'high' ? 'border-red-200' : 
              riskLevel === 'medium' ? 'border-yellow-200' : 
              'border-green-200'
            }`}>
              <CardHeader className={`${
                riskLevel === 'high' ? 'bg-red-50' : 
                riskLevel === 'medium' ? 'bg-yellow-50' : 
                'bg-green-50'
              }`}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold">Analysis Results</CardTitle>
                  {getRiskBadge()}
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-gray-500" />
                    AI Analysis
                  </h3>
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {analysisResult}
                  </div>
                </div>

                <Alert className={`mt-4 ${
                  riskLevel === 'high' ? 'bg-red-50 border-red-200 text-red-800' : 
                  riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 
                  'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Safety Recommendation</AlertTitle>
                  <AlertDescription>
                    {riskLevel === 'high' ? 
                      "This image has a high risk of being fake or AI-generated. We strongly recommend avoiding contact with profiles using this image." : 
                      riskLevel === 'medium' ? 
                      "This image has some suspicious characteristics. Proceed with caution and look for other verification before trusting this profile." : 
                      "This image appears to be a legitimate photograph, but always remain vigilant about other warning signs of scams."}
                  </AlertDescription>
                </Alert>
              </CardContent>
              
              <CardFooter className="bg-gray-50 border-t border-gray-100 flex justify-end gap-2 pt-4">
                {riskLevel === 'high' ? (
                  <>
                    <Button variant="outline" size="sm">
                      Save Report
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700" size="sm">
                      Report Profile
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm">
                    Save Report
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
          
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-center text-veritas-purple mb-6">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="bg-veritas-lightPurple rounded-full w-12 h-12 flex items-center justify-center mb-3">
                    <Upload className="h-5 w-5 text-veritas-purple" />
                  </div>
                  <CardTitle className="text-lg font-medium">1. Upload Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Upload any profile picture you want to analyze for authenticity</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="bg-veritas-lightPurple rounded-full w-12 h-12 flex items-center justify-center mb-3">
                    <Image className="h-5 w-5 text-veritas-purple" />
                  </div>
                  <CardTitle className="text-lg font-medium">2. AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Our advanced AI model examines the image for signs of manipulation or generation</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="bg-veritas-lightPurple rounded-full w-12 h-12 flex items-center justify-center mb-3">
                    <Shield className="h-5 w-5 text-veritas-purple" />
                  </div>
                  <CardTitle className="text-lg font-medium">3. View Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Receive a comprehensive report with risk assessment and safety recommendations</p>
                </CardContent>
              </Card>
            </div>
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                <strong>Note:</strong> While our system uses advanced AI technology to analyze images, no detection system is 100% accurate. 
                Always use your judgment and look for multiple warning signs when interacting with unknown profiles online.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FaceCheck;
