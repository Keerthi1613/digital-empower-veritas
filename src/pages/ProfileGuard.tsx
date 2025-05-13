
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Upload, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProfileGuard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setRedirecting(true);
    
    // Show a toast informing users
    toast({
      title: "Redirecting to new scanner",
      description: "We've upgraded our ProfileGuard Scanner with more advanced technology!",
      variant: "default",
    });
    
    // Redirect to the new FaceCheck page, passing the file if selected
    setTimeout(() => {
      if (file) {
        // Store the file in sessionStorage to pass it to FaceCheck
        // We'll use a timestamp as a key to avoid conflicts
        const key = `selected_image_${Date.now()}`;
        sessionStorage.setItem('profile_guard_redirect', key);
        
        // Create a URL for the file and store it
        const fileUrl = URL.createObjectURL(file);
        sessionStorage.setItem(key, fileUrl);
        sessionStorage.setItem(`${key}_name`, file.name);
        sessionStorage.setItem(`${key}_size`, String(file.size));
      }
      
      navigate('/face-check');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <div className="veritas-container">
          <div className="max-w-4xl mx-auto">
            <h1 className="page-title">ProfileGuard Scanner</h1>
            <p className="text-center text-gray-600 mb-2">
              Upload a profile image to detect if it's an AI-generated fake (deepfake) or an authentic photograph.
            </p>
            
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200 text-yellow-800 mb-8">
              <AlertDescription className="text-center">
                <p className="font-medium">We've upgraded our scanner!</p>
                <p className="text-sm mt-1">
                  Try our new and improved <a href="/face-check" className="underline font-semibold">FaceCheck Scanner</a> with enhanced AI detection capabilities.
                </p>
              </AlertDescription>
            </Alert>

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
                    
                    <Button
                      type="submit"
                      className="w-full max-w-md"
                      variant="default"
                      disabled={redirecting}
                    >
                      {redirecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Redirecting...
                        </>
                      ) : (
                        "Try Our New Scanner"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

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
                      <CheckCircle className="h-5 w-5 text-veritas-purple" />
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
