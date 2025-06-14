import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ProfileGuard from "./pages/ProfileGuard";
import ReportSubmission from "./pages/ReportSubmission";
import Evidence from "./pages/Evidence";
import Quiz from "./pages/Quiz";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";
import Chatbot from "./pages/Chatbot";
import FaceCheck from "./pages/FaceCheck";
import EmergencyVault from "./pages/EmergencyVault";
import Login from "./pages/Login";
import SignIn from "./pages/SignIn";
import SafetyAnalyzer from "./pages/SafetyAnalyzer";
import ProfileGuardScanner from "./pages/ProfileGuardScanner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check current session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);
      setIsLoggedIn(!!session);
      setUserId(session?.user?.id || null);
    };
    
    getSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setIsLoggedIn(!!session);
        setUserId(session?.user?.id || null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking authentication
  if (isLoggedIn === null) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/signin" element={!isLoggedIn ? <SignIn /> : <Navigate to="/" />} />
            <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/" />} />
            
            {/* Protected routes - redirect to login if not authenticated */}
            <Route path="/" element={isLoggedIn ? <Index /> : <Navigate to="/signin" />} />
            <Route path="/profile-guard" element={isLoggedIn ? <ProfileGuard /> : <Navigate to="/signin" />} />
            <Route path="/report" element={isLoggedIn ? <ReportSubmission /> : <Navigate to="/signin" />} />
            <Route path="/evidence" element={isLoggedIn ? <Evidence /> : <Navigate to="/signin" />} />
            <Route path="/quiz" element={isLoggedIn ? <Quiz /> : <Navigate to="/signin" />} />
            <Route path="/verify" element={isLoggedIn ? <Verify /> : <Navigate to="/signin" />} />
            <Route path="/chatbot" element={isLoggedIn ? <Chatbot /> : <Navigate to="/signin" />} />
            <Route path="/face-check" element={isLoggedIn ? <FaceCheck /> : <Navigate to="/signin" />} />
            <Route path="/vault" element={isLoggedIn ? <EmergencyVault /> : <Navigate to="/signin" />} />
            <Route path="/analyzer" element={isLoggedIn ? <SafetyAnalyzer /> : <Navigate to="/signin" />} />
            <Route path="/profile-guard-scanner" element={<ProfileGuardScanner />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
