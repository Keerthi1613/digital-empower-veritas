import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle, Loader2, Image, Info, Shield, Share2, Camera, Eye, Zap } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

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
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const redirectKey = sessionStorage.getItem('profile_guard_redirect');
    if (redirectKey) {
      try {
        const fileUrl = sessionStorage.getItem(redirectKey);
        const fileName = sessionStorage.getItem(`${redirectKey}_name`);
        const fileSize = sessionStorage.getItem(`${redirectKey}_size`);
        
        if (fileUrl && fileName && fileSize) {
          fetch(fileUrl)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], fileName, {
                type: blob.type,
                lastModified: Date.now()
              });
              setSelectedImage(file);
              setPreviewUrl(fileUrl);
              
              toast({
                title: "Image transferred",
                description: "Your image has been transferred from ProfileGuard and is ready for analysis."
              });
            })
            .catch(err => {
              console.error("Error loading redirected image:", err);
            });
        }
        
        sessionStorage.removeItem('profile_guard_redirect');
        sessionStorage.removeItem(redirectKey);
        sessionStorage.removeItem(`${redirectKey}_name`);
        sessionStorage.removeItem(`${redirectKey}_size`);
      } catch (error) {
        console.error("Error processing redirected image:", error);
      }
    }
    
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

  useEffect(() => {
    const loadPreviousAnalyses = async () => {
      try {
        setLoadingPrevious(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('scammer_images')
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
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setAnalysisResult(null);
    setRiskLevel(null);
    setErrorMessage(null);
    setUploadProgress(0);
    setIsFallback(false);
    setIsRealImage(null);
    setAccuracyPercentage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
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
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 2 : 1;
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return Math.min(prev + increment, 90);
        });
      }, 250);
      
      const fileName = `analysis-${Date.now()}-${selectedImage.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      
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
      
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      
      console.log("Image public URL:", publicUrl);
      toast({
        title: "Image uploaded",
        description: "Now analyzing with our AI system...",
      });
      
      const { data, error } = await supabase.functions.invoke('facial-recognition', {
        body: { imageUrl: publicUrl },
      });
      
      setUploadProgress(100);
      clearInterval(progressInterval);
      
      if (error) {
        console.error("Function invocation error:", error);
        throw new Error(`Error calling analysis function: ${error.message}`);
      }
      
      console.log("Received facial recognition response:", data);
      
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
      
      setIsRealImage(data.riskLevel === 'low');
      
      let apiRisk = (data && typeof data.riskLevel === "string" ? data.riskLevel : null) as 'low' | 'medium' | 'high' | null;
      let confidence = typeof data.confidenceScore === "number" ? data.confidenceScore : null;

      let displayRisk: 'real' | 'ai' | 'uncertain' | 'likely-real' | 'likely-ai' = 'uncertain';
      let internalResultString = "";
      let displayConfidence = confidence;

      if (confidence === null || confidence < 60) {
        displayRisk = 'uncertain';
        internalResultString = "Could not determine authenticity.";
      } else if (confidence >= 60 && confidence < 85) {
        if (apiRisk === "low") {
          displayRisk = "likely-real";
          internalResultString = "Likely a real photo, proceed with care.";
        } else {
          displayRisk = "likely-ai";
          internalResultString = "Possibly AI-generated";
        }
      } else if (confidence >= 85) {
        if (apiRisk === "low") {
          displayRisk = "real";
          internalResultString = "This appears to be a genuine photograph of a real person.";
        } else if (apiRisk === "high") {
          displayRisk = "ai";
          internalResultString = "This image shows strong signs of being AI-generated.";
        } else {
          displayRisk = "likely-ai";
          internalResultString = "Possibly AI-generated";
        }
      }

      setStatusMessage(null);
      setAnalysisResult(internalResultString);
      setRiskLevel(
        displayRisk === "real" ? "low" :
        displayRisk === "ai" ? "high" :
        displayRisk === "likely-ai" ? "medium" :
        displayRisk === "likely-real" ? "low" :
        null
      );
      setIsRealImage(displayRisk === "real" || displayRisk === "likely-real");
      setAccuracyPercentage(displayConfidence ?? 0);

      const newAnalysis = {
        id: `temp-${Date.now()}`,
        image_url: publicUrl,
        risk_level: data.riskLevel,
        analysis: data.analysis,
        created_at: new Date().toISOString()
      };
      
      setPreviousAnalyses(prev => [newAnalysis, ...prev.slice(0, 4)]);
      
    } catch (error: any) {
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

  const handleShareResults = () => {
    const shareText = `I checked an image with ProfileGuard and it was classified as ${riskLevel?.toUpperCase()} RISK.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'ProfileGuard Image Analysis',
        text: shareText,
      })
      .then(() => console.log('Shared successfully'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
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

  const getResultMessage = () => {
    if (!riskLevel) return null;
    
    if (riskLevel === 'low') {
      return {
        title: "Authentic Image Detected",
        message: "This appears to be a genuine photograph of a real person.",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    } else if (riskLevel === 'medium') {
      return {
        title: "Suspicious Elements Detected",
        message: "This image has some characteristics that could indicate AI generation.",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200"
      };
    } else {
      return {
        title: "AI-Generated Image Detected",
        message: "This image shows strong signs of being AI-generated.",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      };
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow">
        <div className="veritas-container">
          <div className="max-w-4xl mx-auto">
            <h1 className="page-title">Face Check Scanner</h1>
            <p className="text-center text-gray-600 mb-8">
              Detect AI-generated and deepfake images with our advanced detection system.
            </p>

            {/* How It Works Section */}
            <div className="mb-10 bg-white rounded-xl border border-gray-200 p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-veritas-purple">How It Works</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-veritas-lightPurple rounded-lg p-4">
                  <div className="flex justify-center mb-3">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <Camera className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">1. Upload Image</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Upload a profile image or photo you want to verify
                  </p>
                </div>
                
                <div className="bg-veritas-lightPurple rounded-lg p-4">
                  <div className="flex justify-center mb-3">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <Eye className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">2. AI Analysis</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Our AI scans for signs of manipulation or generation
                  </p>
                </div>
                
                <div className="bg-veritas-lightPurple rounded-lg p-4">
                  <div className="flex justify-center mb-3">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <Zap className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">3. Get Results</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Receive a detailed authenticity assessment instantly
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-veritas-purple mr-2" />
                  <p className="text-sm text-veritas-purple font-medium">Your uploads are processed securely and privately</p>
                </div>
              </div>
            </div>

            {/* Upload Card */}
            <Card className="mb-8 shadow-md border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-veritas-purple/10 rounded-full p-2">
                    <Image className="h-5 w-5 text-veritas-purple" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-veritas-darkPurple">Upload Image</CardTitle>
                    <CardDescription>Drop your image here or click to browse</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Upload Zone */}
                <label 
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full min-h-[280px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300",
                    isDragOver 
                      ? "border-veritas-purple bg-veritas-lightPurple" 
                      : "border-gray-300 bg-gray-50 hover:bg-veritas-lightPurple hover:border-veritas-purple/50",
                    previewUrl && "border-solid border-veritas-purple/30"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isAnalyzing}
                  />
                  
                  {previewUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-64 max-w-full object-contain rounded-lg shadow-md"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl">
                          <Loader2 className="w-10 h-10 text-veritas-purple animate-spin mb-3" />
                          <p className="text-veritas-purple font-medium">{statusMessage || "Analyzing..."}</p>
                          <div className="w-48 mt-3">
                            <Progress value={uploadProgress} className="h-2" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="p-4 rounded-full bg-veritas-lightPurple mb-4">
                        <Upload className="w-8 h-8 text-veritas-purple" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-1">
                        Drop image here or click to upload
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports JPG, PNG, WEBP (max 5MB)
                      </p>
                    </div>
                  )}
                </label>

                {/* Action Buttons */}
                {selectedImage && !isAnalyzing && (
                  <div className="flex flex-wrap gap-3 mt-6 justify-center">
                    <Button
                      onClick={handleAnalyze}
                      className="bg-veritas-purple hover:bg-veritas-darkPurple text-white"
                      disabled={isAnalyzing}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Analyze Image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClear}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetry}
                      className="mt-2"
                    >
                      Retry Analysis
                    </Button>
                  </Alert>
                )}

                {/* Fallback Notice */}
                {isFallback && (
                  <Alert className="mt-6 border-amber-200 bg-amber-50">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Limited Analysis Mode</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Due to high demand, we're providing a basic analysis. Full service will resume shortly.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Results Section */}
                {analysisResult && riskLevel && (
                  <div className="mt-6">
                    {(() => {
                      const result = getResultMessage();
                      if (!result) return null;
                      
                      return (
                        <div className={cn(
                          "rounded-xl border p-6",
                          result.bgColor,
                          result.borderColor
                        )}>
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "p-2 rounded-full",
                              riskLevel === 'low' ? "bg-green-100" : 
                              riskLevel === 'medium' ? "bg-amber-100" : "bg-red-100"
                            )}>
                              {riskLevel === 'low' ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : (
                                <AlertCircle className={cn(
                                  "w-6 h-6",
                                  riskLevel === 'medium' ? "text-amber-600" : "text-red-600"
                                )} />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className={cn("text-lg font-semibold mb-1", result.color)}>
                                {result.title}
                              </h3>
                              <p className="text-gray-700 mb-3">{result.message}</p>
                              
                              {accuracyPercentage !== null && (
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Confidence</span>
                                    <span className="font-medium">{accuracyPercentage}%</span>
                                  </div>
                                  <Progress value={accuracyPercentage} className="h-2" />
                                </div>
                              )}
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleShareResults}
                                  className="border-gray-300"
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share Results
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleClear}
                                  className="border-gray-300"
                                >
                                  Analyze Another
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Analyses */}
            {previousAnalyses.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-veritas-darkPurple">Recent Analyses</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-veritas-purple hover:text-veritas-darkPurple"
                  >
                    {showHistory ? "Hide" : "Show"}
                  </Button>
                </div>
                
                {showHistory && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {previousAnalyses.map((analysis, index) => (
                      <div
                        key={analysis.id || index}
                        className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square rounded-md overflow-hidden bg-gray-100 mb-2">
                          <img
                            src={analysis.image_url}
                            alt={`Analysis ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded-full",
                            analysis.risk_level === 'low' ? "bg-green-100 text-green-700" :
                            analysis.risk_level === 'medium' ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {analysis.risk_level === 'low' ? 'Real' : 
                             analysis.risk_level === 'medium' ? 'Uncertain' : 'AI'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info Section */}
            <div className="bg-veritas-lightPurple rounded-xl border border-veritas-purple/20 p-6 text-center">
              <h3 className="text-xl font-semibold mb-4 text-veritas-purple">Why Use Face Check?</h3>
              <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
                With the rise of AI-generated images and deepfakes, it's becoming increasingly difficult 
                to distinguish real photos from fake ones. Our Face Check scanner helps you verify the 
                authenticity of profile images and photos before engaging with strangers online.
              </p>
              <div className="flex items-center justify-center gap-2 text-veritas-purple">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Protect yourself from catfishing and scams</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FaceCheck;
