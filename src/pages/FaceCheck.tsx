
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle, Loader2, Image } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const FaceCheck = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.match('image.*')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
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
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    try {
      // Upload image to Supabase storage
      const fileName = `${Date.now()}-${selectedImage.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(`public/${fileName}`, selectedImage);
        
      if (uploadError) throw uploadError;
      
      // Get public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(`public/${fileName}`);
      
      // Call facial recognition edge function
      const { data, error } = await supabase.functions.invoke('facial-recognition', {
        body: { imageUrl: publicUrl },
      });
      
      if (error) throw error;
      
      setAnalysisResult(data.analysis);
      setRiskLevel(data.riskLevel);
      
      toast({
        title: "Analysis complete",
        description: `Risk level: ${data.riskLevel.toUpperCase()}`,
        variant: data.riskLevel === 'high' ? "destructive" : data.riskLevel === 'medium' ? "default" : "default",
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskBadge = () => {
    if (!riskLevel) return null;
    
    const classes = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800"
    };
    
    const icons = {
      low: <CheckCircle className="h-5 w-5 mr-1" />,
      medium: <AlertCircle className="h-5 w-5 mr-1" />,
      high: <AlertCircle className="h-5 w-5 mr-1" />
    };
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${classes[riskLevel]}`}>
        {icons[riskLevel]}
        {riskLevel.toUpperCase()} RISK
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow bg-gray-50">
        <div className="veritas-container py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-veritas-purple">ProfileGuard Scanner</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload a profile picture to check if it shows signs of being AI-generated or 
              used in common scams. Our system analyzes the image for suspicious patterns.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload Image</h2>
              <p className="text-gray-600 mb-4">
                Select a profile image you'd like to analyze for potential warning signs.
              </p>
              
              <div className="flex items-center justify-center">
                <label 
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed 
                  border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center p-5 text-center">
                    {previewUrl ? (
                      <div className="relative h-full w-full">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="h-48 object-contain"
                        />
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, or WEBP (Max 5MB)</p>
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
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                disabled={!selectedImage || isAnalyzing}
                className="bg-veritas-purple hover:bg-veritas-darkPurple"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
            </div>
            
            {analysisResult && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Analysis Results</h2>
                  {getRiskBadge()}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{analysisResult}</pre>
                </div>
                <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800">Safety Recommendation</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {riskLevel === 'high' ? 
                      "This image has a high risk of being fake or AI-generated. We strongly recommend avoiding contact with profiles using this image." : 
                      riskLevel === 'medium' ? 
                      "This image has some suspicious characteristics. Proceed with caution and look for other verification before trusting this profile." : 
                      "This image appears to be a legitimate photograph, but always remain vigilant about other warning signs of scams."}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-veritas-purple mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="bg-veritas-lightPurple rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <Upload className="h-5 w-5 text-veritas-purple" />
                </div>
                <h3 className="font-medium">1. Upload Image</h3>
                <p className="text-sm text-gray-600">Upload a suspicious profile picture</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="bg-veritas-lightPurple rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <Image className="h-5 w-5 text-veritas-purple" />
                </div>
                <h3 className="font-medium">2. AI Analysis</h3>
                <p className="text-sm text-gray-600">Our system analyzes the image for signs of manipulation</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="bg-veritas-lightPurple rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <AlertCircle className="h-5 w-5 text-veritas-purple" />
                </div>
                <h3 className="font-medium">3. Get Results</h3>
                <p className="text-sm text-gray-600">Receive a detailed report and risk assessment</p>
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
