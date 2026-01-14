import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle, Loader2, Image, Info, Shield, Share2, Sparkles, Scan, Eye, Zap, Camera, Brain } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

  // Check for redirected image from ProfileGuard
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
        icon: CheckCircle,
        gradient: "from-emerald-500 to-green-600"
      };
    } else if (riskLevel === 'medium') {
      return {
        title: "Suspicious Elements Detected",
        message: "This image has some characteristics that could indicate AI generation.",
        icon: AlertCircle,
        gradient: "from-amber-500 to-orange-600"
      };
    } else {
      return {
        title: "AI-Generated Image Detected",
        message: "This image shows strong signs of being AI-generated.",
        icon: AlertCircle,
        gradient: "from-red-500 to-rose-600"
      };
    }
  };

  const features = [
    {
      icon: Brain,
      title: "Neural Analysis",
      description: "Deep learning models trained on millions of images"
    },
    {
      icon: Eye,
      title: "Pattern Detection",
      description: "Identifies subtle artifacts invisible to human eye"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get comprehensive analysis in seconds"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      <Navigation />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-200">AI-Powered Detection</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Face Check Scanner
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Detect AI-generated and deepfake images with our advanced neural network analysis
            </p>
          </div>

          {/* Main Scanner Card */}
          <div className="max-w-4xl mx-auto mb-8 animate-scale-in">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              
              <Card className="relative bg-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
                {/* Scan line animation when analyzing */}
                {isAnalyzing && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan" />
                  </div>
                )}
                
                <CardHeader className="text-center border-b border-white/10 pb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <Scan className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Upload Image</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    Drop your image here or click to browse
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-8">
                  {/* Upload Zone */}
                  <label 
                    className={cn(
                      "relative flex flex-col items-center justify-center w-full h-72 rounded-xl cursor-pointer transition-all duration-300",
                      "border-2 border-dashed",
                      isDragOver 
                        ? "border-purple-400 bg-purple-500/20" 
                        : previewUrl 
                          ? "border-purple-500/50 bg-black/20" 
                          : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {previewUrl ? (
                      <div className="relative w-full h-full p-4">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-contain rounded-lg"
                        />
                        {/* Scanning overlay when analyzing */}
                        {isAnalyzing && (
                          <div className="absolute inset-4 rounded-lg bg-purple-500/10 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-3" />
                              <p className="text-purple-200 font-medium">Analyzing...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 p-6">
                        <div className={cn(
                          "p-4 rounded-2xl transition-all duration-300",
                          isDragOver 
                            ? "bg-purple-500/30 scale-110" 
                            : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                        )}>
                          <Camera className="w-10 h-10 text-purple-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-medium mb-1">
                            {isDragOver ? "Drop your image here" : "Drag & drop your image"}
                          </p>
                          <p className="text-gray-400 text-sm">or click to browse</p>
                        </div>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 rounded bg-white/5">PNG</span>
                          <span className="px-2 py-1 rounded bg-white/5">JPG</span>
                          <span className="px-2 py-1 rounded bg-white/5">WEBP</span>
                          <span className="px-2 py-1 rounded bg-white/5">Max 5MB</span>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>

                  {/* File info */}
                  {previewUrl && selectedImage && (
                    <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-400">
                      <Image className="w-4 h-4" />
                      <span>{selectedImage.name}</span>
                      <span className="text-gray-600">•</span>
                      <span>
                        {(selectedImage.size / 1024 < 1000 
                          ? `${Math.round(selectedImage.size / 1024)} KB` 
                          : `${(selectedImage.size / (1024 * 1024)).toFixed(2)} MB`)}
                      </span>
                    </div>
                  )}

                  {/* Progress bar */}
                  {isAnalyzing && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-purple-300">Analyzing image...</span>
                        <span className="text-purple-400 font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-300 bg-[length:200%_100%] animate-shimmer"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-center gap-4 mt-8">
                    <Button
                      onClick={handleAnalyze}
                      disabled={!selectedImage || isAnalyzing}
                      size="lg"
                      className={cn(
                        "relative px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300",
                        "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500",
                        "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          {analysisResult ? "Analyze Again" : "Start Analysis"}
                        </>
                      )}
                    </Button>
                    
                    {(selectedImage || analysisResult) && (
                      <Button
                        onClick={handleClear}
                        variant="outline"
                        size="lg"
                        disabled={isAnalyzing}
                        className="px-6 py-6 text-lg rounded-xl border-white/20 text-white hover:bg-white/10"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Error message */}
                  {errorMessage && (
                    <Alert variant="destructive" className="mt-6 bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>{errorMessage}</p>
                        <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2">
                          Try Again
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Results Section */}
          {analysisResult && (
            <div className="max-w-4xl mx-auto mb-12 animate-fade-up">
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 rounded-2xl blur-lg opacity-50 transition-opacity duration-500",
                  riskLevel === 'low' && "bg-gradient-to-r from-emerald-600 to-green-600",
                  riskLevel === 'medium' && "bg-gradient-to-r from-amber-600 to-orange-600",
                  riskLevel === 'high' && "bg-gradient-to-r from-red-600 to-rose-600"
                )} />
                
                <Card className="relative bg-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
                  {/* Result header with gradient */}
                  <CardHeader className={cn(
                    "border-b border-white/10",
                    riskLevel === 'low' && "bg-gradient-to-r from-emerald-500/20 to-green-500/20",
                    riskLevel === 'medium' && "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
                    riskLevel === 'high' && "bg-gradient-to-r from-red-500/20 to-rose-500/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          riskLevel === 'low' && "bg-emerald-500/20",
                          riskLevel === 'medium' && "bg-amber-500/20",
                          riskLevel === 'high' && "bg-red-500/20"
                        )}>
                          {riskLevel === 'low' && (
                            <CheckCircle className={cn(
                              "w-8 h-8 text-emerald-400"
                            )} />
                          )}
                          {(riskLevel === 'medium' || riskLevel === 'high') && (
                            <AlertCircle className={cn(
                              "w-8 h-8",
                              riskLevel === 'medium' && "text-amber-400",
                              riskLevel === 'high' && "text-red-400"
                            )} />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-white">{getResultMessage()?.title}</CardTitle>
                          <p className="text-gray-400 mt-1">{getResultMessage()?.message}</p>
                        </div>
                      </div>
                      
                      {/* Risk badge */}
                      <div className={cn(
                        "px-4 py-2 rounded-full font-bold text-sm",
                        riskLevel === 'low' && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                        riskLevel === 'medium' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                        riskLevel === 'high' && "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}>
                        {riskLevel?.toUpperCase()} RISK
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Accuracy meter */}
                    {accuracyPercentage !== null && (
                      <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-300 font-medium">Confidence Score</span>
                          <span className={cn(
                            "text-2xl font-bold",
                            riskLevel === 'low' && "text-emerald-400",
                            riskLevel === 'medium' && "text-amber-400",
                            riskLevel === 'high' && "text-red-400"
                          )}>
                            {accuracyPercentage}%
                          </span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              riskLevel === 'low' && "bg-gradient-to-r from-emerald-500 to-green-500",
                              riskLevel === 'medium' && "bg-gradient-to-r from-amber-500 to-orange-500",
                              riskLevel === 'high' && "bg-gradient-to-r from-red-500 to-rose-500"
                            )}
                            style={{ width: `${accuracyPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Analysis details */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-medium">AI Analysis</span>
                      </div>
                      <p className="text-gray-300">{analysisResult}</p>
                    </div>

                    {/* Safety recommendation */}
                    <div className={cn(
                      "p-4 rounded-xl border",
                      riskLevel === 'low' && "bg-emerald-500/10 border-emerald-500/20",
                      riskLevel === 'medium' && "bg-amber-500/10 border-amber-500/20",
                      riskLevel === 'high' && "bg-red-500/10 border-red-500/20"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className={cn(
                          "w-4 h-4",
                          riskLevel === 'low' && "text-emerald-400",
                          riskLevel === 'medium' && "text-amber-400",
                          riskLevel === 'high' && "text-red-400"
                        )} />
                        <span className="text-white font-medium">Safety Recommendation</span>
                      </div>
                      <p className={cn(
                        "text-sm",
                        riskLevel === 'low' && "text-emerald-300",
                        riskLevel === 'medium' && "text-amber-300",
                        riskLevel === 'high' && "text-red-300"
                      )}>
                        {riskLevel === 'high' 
                          ? "This image has a high risk of being fake or AI-generated. We strongly recommend avoiding contact with profiles using this image." 
                          : riskLevel === 'medium' 
                          ? "This image has some suspicious characteristics. Proceed with caution and look for other verification before trusting this profile." 
                          : "This image appears to be a legitimate photograph, but always remain vigilant about other warning signs of scams."}
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t border-white/10 p-4 flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleShareResults}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Results
                    </Button>
                    
                    {riskLevel === 'high' && (
                      <Button className="bg-red-600 hover:bg-red-700">
                        Report Profile
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-center text-white mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="group relative animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Card className="relative h-full bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 w-fit mb-3">
                        <feature.icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <p className="text-sm text-gray-500 max-w-2xl mx-auto">
                <strong className="text-gray-400">Note:</strong> While our system uses advanced AI technology to analyze images, no detection system is 100% accurate. 
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
