import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle, Loader2, Image, Info, Shield, Download, Share2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FaceCheck = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFallback, setIsFallback] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [previousAnalyses, setPreviousAnalyses] = useState<any[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isRealImage, setIsRealImage] = useState<boolean | null>(null);
  const [accuracyPercentage, setAccuracyPercentage] = useState<number | null>(null);

  // Check for redirected image from ProfileGuard
  useEffect(() => {
    const redirectKey = sessionStorage.getItem('profile_guard_redirect');
    if (redirectKey) {
      try {
        const fileUrl = sessionStorage.getItem(redirectKey);
        const fileName = sessionStorage.getItem(`${redirectKey}_name`);
        const fileSize = sessionStorage.getItem(`${redirectKey}_size`);
        
        if (fileUrl && fileName && fileSize) {
          // Convert the stored data URL to a File object
          fetch(fileUrl)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], fileName, {
                type: blob.type,
                lastModified: Date.now()
              });
              setSelectedImage(file);
              setPreviewUrl(fileUrl);
              
              // Optional: Auto-analyze the redirected image
              toast({
                title: "Image transferred",
                description: "Your image has been transferred from ProfileGuard and is ready for analysis."
              });
            })
            .catch(err => {
              console.error("Error loading redirected image:", err);
            });
        }
        
        // Clean up session storage
        sessionStorage.removeItem('profile_guard_redirect');
        sessionStorage.removeItem(redirectKey);
        sessionStorage.removeItem(`${redirectKey}_name`);
        sessionStorage.removeItem(`${redirectKey}_size`);
      } catch (error) {
        console.error("Error processing redirected image:", error);
      }
    }
    
    // Check if bucket exists and create it if it doesn't
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
  }, [toast]);

  // Load previous analyses if user is authenticated
  useEffect(() => {
    const loadPreviousAnalyses = async () => {
      try {
        setLoadingPrevious(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if table exists first to avoid errors
          const { data, error } = await supabase
            .from('scammer_images') // Using an existing table instead of image_analyses
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (error) throw error;
          if (data) setPreviousAnalyses(data);
        }
      } catch (error) {
        console.error("Error loading previous analyses:", error);
      } finally {
        setLoadingPrevious(false);
      }
    };
    
    loadPreviousAnalyses();
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
      setIsFallback(false);
      setIsRealImage(null);
      setAccuracyPercentage(null);
    }
  };

  const handleRetry = () => {
    if (selectedImage) {
      setErrorMessage(null);
      setAnalysisResult(null);
      setRiskLevel(null);
      setIsFallback(false);
      setIsRealImage(null);
      setAccuracyPercentage(null);
      handleAnalyze();
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setRiskLevel(null);
    setErrorMessage(null);
    setUploadProgress(0);
    setIsFallback(false);
    setIsRealImage(null);
    setAccuracyPercentage(null);
    setStatusMessage(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setStatusMessage("Analyzing image...");
    setErrorMessage(null);
    setAnalysisResult(null);
    setRiskLevel(null);
    setIsFallback(false);
    setIsRealImage(null);
    setAccuracyPercentage(null);

    try {
      console.log("Starting image analysis process");
      toast({
        title: "Starting analysis",
        description: "Uploading and preparing your image...",
      });
      
      // Begin progress simulation with variable speed
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Slow down progress as it approaches 90%
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 2 : 1;
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return Math.min(prev + increment, 90);
        });
      }, 250);
      
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
      
      // Set progress to 100% when analysis is complete
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      if (error) {
        console.error("Function invocation error:", error);
        throw new Error(`Error calling analysis function: ${error.message}`);
      }
      
      console.log("Received facial recognition response:", data);
      
      // Check if we're using fallback analysis
      if (data.isFallback) {
        setIsFallback(true);
        toast({
          title: "Using Limited Analysis",
          description: "Due to high demand, we're providing a limited analysis. Full service will resume shortly.",
          variant: "default",
        });
      }
      
      if (data.error) {
        setErrorMessage(data.error);
        toast({
          title: "Analysis issue",
          description: data.error,
          variant: "destructive",
        });
      }
      
      setAnalysisResult(data.analysis);
      setRiskLevel(data.riskLevel);
      
      // Determine if the image is real based on risk level
      setIsRealImage(data.riskLevel === 'low');
      
      // Calculate accuracy percentage based on risk level
      let apiRisk = (data && typeof data.riskLevel === "string" ? data.riskLevel : null) as 'low' | 'medium' | 'high' | null;
      let confidence = typeof data.confidenceScore === "number" ? data.confidenceScore : null;

      let displayRisk: 'real' | 'ai' | 'uncertain' | 'likely-real' | 'likely-ai' = 'uncertain';
      let displayMessage = "";
      let badge = "";
      let color = "";
      let displayConfidence = confidence;
      let internalResultString = "";

      if (confidence === null) {
        // fallback
        displayRisk = 'uncertain';
        displayMessage = "⚠️ Unable to confidently classify this image.";
        badge = "Uncertain";
        color = "text-yellow-600";
        internalResultString = "Could not determine authenticity.";
      } else if (confidence < 60) {
        displayRisk = 'uncertain';
        displayMessage = "⚠️ Unable to confidently classify this image.";
        badge = "Uncertain";
        color = "text-yellow-600";
        internalResultString = "Could not determine authenticity.";
      } else if (confidence >= 60 && confidence < 85) {
        if (apiRisk === "low") {
          displayRisk = "likely-real";
          displayMessage = "This image is likely real, but not 100% certain.";
          badge = "Likely Real";
          color = "text-green-700";
          internalResultString = "Likely a real photo, proceed with care.";
        } else {
          displayRisk = "likely-ai";
          displayMessage = "This image is possibly AI-generated, confidence is moderate.";
          badge = "Possibly AI";
          color = "text-yellow-700";
          internalResultString = "Possibly AI-generated";
        }
      } else if (confidence >= 85) {
        if (apiRisk === "low") {
          displayRisk = "real";
          displayMessage = "Authentic Image Detected";
          badge = "Real";
          color = "text-green-800";
          internalResultString = "This appears to be a genuine photograph of a real person.";
        } else if (apiRisk === "high") {
          displayRisk = "ai";
          displayMessage = "AI-Generated Image Detected";
          badge = "AI";
          color = "text-red-700";
          internalResultString = "This image shows strong signs of being AI-generated.";
        } else {
          // Defensive if "medium" or strange API values
          displayRisk = "likely-ai";
          displayMessage = "This image is possibly AI-generated, but not 100% sure.";
          badge = "Possibly AI";
          color = "text-yellow-700";
          internalResultString = "Possibly AI-generated";
        }
      }

      setStatusMessage(null);

      // Feed everything back to state for final display
      setAnalysisResult(internalResultString);
      setRiskLevel(displayRisk === "real" ? "low" : displayRisk === "ai" ? "high" : displayRisk === "likely-ai" ? "medium" : null);
      setIsRealImage(displayRisk === "real" || displayRisk === "likely-real");
      setAccuracyPercentage(displayConfidence ?? 0);

      // Add to previous analyses in UI (optimistic update)
      const newAnalysis = {
        id: `temp-${Date.now()}`,
        image_url: publicUrl,
        risk_level: data.riskLevel,
        analysis: data.analysis,
        created_at: new Date().toISOString()
      };
      
      setPreviousAnalyses(prev => [newAnalysis, ...prev.slice(0, 4)]);
      
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

  const handleShareResults = () => {
    // Generate shareable text based on analysis
    const shareText = `I checked an image with ProfileGuard and it was classified as ${riskLevel?.toUpperCase()} RISK.`;
    
    // Check if the Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'ProfileGuard Image Analysis',
        text: shareText,
        // url: window.location.href,
      })
      .then(() => console.log('Shared successfully'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareText)
        .then(() => {
          toast({
            title: "Copied to clipboard",
            description: "Result summary copied to clipboard for sharing",
          });
        })
        .catch(err => console.error('Could not copy text: ', err));
    }
  };

  // Get clear message based on risk level
  const getResultMessage = () => {
    if (!riskLevel) return null;
    
    if (riskLevel === 'low') {
      return {
        title: "Authentic Image Detected",
        message: "This appears to be a genuine photograph of a real person.",
        color: "text-green-700"
      };
    } else if (riskLevel === 'medium') {
      return {
        title: "Suspicious Elements Detected",
        message: "This image has some characteristics that could indicate AI generation, but we're not entirely certain.",
        color: "text-yellow-700"
      };
    } else {
      return {
        title: "AI-Generated Image Detected",
        message: "This image shows strong signs of being AI-generated rather than a photograph of a real person.",
        color: "text-red-700"
      };
    }
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
                      <span>Analyzing{uploadProgress < 100 ? '...' : ' complete!'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
                
                <div className="flex justify-center mt-6 gap-3">
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
                        {analysisResult ? "Analyze Again" : "Analyze Image"}
                      </>
                    )}
                  </Button>
                  {(selectedImage || analysisResult) && (
                    <Button
                      onClick={handleClear}
                      variant="ghost"
                      className="text-veritas-purple border-veritas-purple"
                      size="lg"
                      disabled={isAnalyzing}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {errorMessage && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>{errorMessage}</p>
                      <Button variant="outline" size="sm" onClick={handleRetry}>
                        Try Again
                      </Button>
                    </AlertDescription>
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
                  <div className="flex items-center gap-2">
                    {isFallback && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                              LIMITED
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Limited analysis due to high demand</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {getRiskBadge()}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* New clear indicator at the top with accuracy percentage */}
                {getResultMessage() && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    riskLevel === 'high' ? 'bg-red-50 border border-red-200' : 
                    riskLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' : 
                    'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <h3 className={`text-lg font-bold ${getResultMessage()?.color}`}>
                        {getResultMessage()?.title}
                      </h3>
                      
                      {accuracyPercentage !== null && (
                        <div className={`text-lg font-bold ${
                          riskLevel === 'high' ? 'text-red-700' :
                          riskLevel === 'medium' ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          {isRealImage 
                            ? `${accuracyPercentage}% Real` 
                            : `${accuracyPercentage}% AI Generated`}
                        </div>
                      )}
                    </div>
                    <p className="mt-1">
                      {getResultMessage()?.message}
                    </p>
                    
                    {/* Accuracy indicator bar */}
                    {accuracyPercentage !== null && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                          <div className={`h-2.5 rounded-full ${
                            riskLevel === 'high' ? 'bg-red-600' : 
                            riskLevel === 'medium' ? 'bg-yellow-500' : 
                            'bg-green-600'
                          }`} style={{ width: `${accuracyPercentage}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span>{accuracyPercentage}% Confidence</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                {!isFallback && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShareResults}
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Results
                  </Button>
                )}
                
                {riskLevel === 'high' && (
                  <Button className="bg-red-600 hover:bg-red-700" size="sm">
                    Report Profile
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
