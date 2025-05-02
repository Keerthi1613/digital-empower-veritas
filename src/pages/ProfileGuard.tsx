
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Upload, Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const ProfileGuard = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    isFake: boolean | null;
    confidence: number | null;
    details: string | null;
  }>({
    isFake: null,
    confidence: null,
    details: null,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResult({
        isFake: null,
        confidence: null,
        details: null,
      });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an image to scan.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    // Simulate API call to scan image
    setTimeout(() => {
      // This is a simulation, in a real app you'd call your Flask backend
      const randomFake = Math.random() > 0.5;
      const randomConfidence = 70 + Math.floor(Math.random() * 25);
      
      setResult({
        isFake: randomFake,
        confidence: randomConfidence,
        details: randomFake 
          ? "This image shows signs of AI generation using GAN technology. The consistent symmetry and unnatural eye positions suggest a deepfake." 
          : "No clear indicators of AI manipulation detected. The image appears to be an authentic photograph."
      });
      
      setUploading(false);

      toast({
        title: randomFake ? "Warning: Potential fake detected" : "Analysis complete",
        description: randomFake 
          ? `This image is likely AI-generated (${randomConfidence}% confidence)` 
          : "This image appears to be authentic",
        variant: randomFake ? "destructive" : "default",
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <div className="veritas-container">
          <div className="max-w-4xl mx-auto">
            <h1 className="page-title">ProfileGuard Scanner</h1>
            <p className="text-center text-gray-600 mb-8">
              Upload a profile image to detect if it's an AI-generated fake (deepfake) or an authentic photograph.
            </p>

            <div className="mb-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="bg-veritas-lightPurple rounded-full p-4">
                      <Upload className="h-8 w-8 text-veritas-purple" />
                    </div>
                    <label htmlFor="profile-image" className="block text-lg font-medium text-gray-700">
                      Upload Image
                    </label>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      Supported formats: JPG, PNG, WEBP (Max 5MB)
                    </p>
                    
                    <input
                      type="file"
                      id="profile-image"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4 file:rounded-lg
                        file:border-0 file:text-sm file:font-medium
                        file:bg-veritas-lightPurple file:text-veritas-purple
                        hover:file:bg-veritas-lightPurple/90"
                    />
                    
                    {file && (
                      <div className="mt-4 w-full">
                        <p className="text-sm text-gray-600 mb-2">Selected file: {file.name}</p>
                        <div className="relative h-64 w-full max-w-md mx-auto border border-dashed border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                    
                    <button 
                      type="submit" 
                      className="btn-primary w-full max-w-md"
                      disabled={uploading || !file}
                    >
                      {uploading ? "Analyzing..." : "Scan Image"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {result.isFake !== null && (
              <div className={`rounded-xl border p-6 shadow-md ${
                result.isFake ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
              }`}>
                <div className="flex items-start">
                  <div className={`rounded-full p-2 mr-4 ${
                    result.isFake ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {result.isFake ? (
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold mb-2 ${
                      result.isFake ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {result.isFake ? 'Likely AI-Generated Fake' : 'Likely Authentic Image'}
                    </h3>
                    <div className="mb-4">
                      <div className="text-sm text-gray-600">Confidence Level</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div 
                          className={`h-2.5 rounded-full ${result.isFake ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{width: `${result.confidence}%`}}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-600 mt-1">{result.confidence}%</div>
                    </div>
                    <p className="text-gray-700 mb-4">{result.details}</p>
                    <div className="flex flex-wrap gap-2">
                      {result.isFake ? (
                        <>
                          <button className="btn-secondary text-sm py-1.5">Report This Profile</button>
                          <button className="btn-outline text-sm py-1.5">Learn How We Detected This</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-outline text-sm py-1.5">Save Analysis Result</button>
                          <button className="btn-outline text-sm py-1.5">Learn More</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-16 bg-veritas-lightPurple rounded-xl p-6">
              <h2 className="text-xl font-semibold text-center text-veritas-purple mb-4">How ProfileGuard Works</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <Upload className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">1. Upload</h3>
                  <p className="text-sm text-gray-600 text-center">Upload any suspicious profile image you want to analyze</p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <Shield className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">2. Analyze</h3>
                  <p className="text-sm text-gray-600 text-center">Our AI examines the image for signs of manipulation or generation</p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <Lock className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">3. Results</h3>
                  <p className="text-sm text-gray-600 text-center">Get detailed analysis on whether the image is authentic or fake</p>
                </div>
              </div>
              
              <p className="text-sm text-center text-gray-500 mt-6">
                Note: ProfileGuard uses advanced image analysis but is not 100% accurate. Always use your judgment when interacting with unknown profiles.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfileGuard;
