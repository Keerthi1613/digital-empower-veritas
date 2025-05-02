
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProfileGuard from "./pages/ProfileGuard";
import ReportSubmission from "./pages/ReportSubmission";
import Evidence from "./pages/Evidence";
import Quiz from "./pages/Quiz";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile-guard" element={<ProfileGuard />} />
          <Route path="/report" element={<ReportSubmission />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
