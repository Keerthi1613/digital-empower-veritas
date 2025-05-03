
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, MessageCircle, Users, Lock, LogOut, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check current session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-veritas-purple" />
            <span className="text-xl font-bold text-veritas-purple">VERITAS</span>
          </Link>
          
          <div className="hidden md:flex space-x-6 items-center">
            <Link to="/" className="text-gray-700 hover:text-veritas-purple transition-colors">Home</Link>
            <Link to="/profile-guard" className="text-gray-700 hover:text-veritas-purple transition-colors">ProfileGuard</Link>
            <Link to="/chatbot" className="text-gray-700 hover:text-veritas-purple transition-colors">Safety Assistant</Link>
            <Link to="/face-check" className="text-gray-700 hover:text-veritas-purple transition-colors">Image Check</Link>
            <Link to="/vault" className="text-gray-700 hover:text-veritas-purple transition-colors">Secure Vault</Link>
            <Link to="/report" className="text-gray-700 hover:text-veritas-purple transition-colors">Report</Link>
            
            {user ? (
              <button 
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-veritas-purple transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            ) : (
              <Link to="/signin" className="btn-outline text-sm py-1.5 px-3 flex items-center">
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Link>
            )}
          </div>

          <button 
            onClick={toggleMenu} 
            className="md:hidden text-gray-700"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-2">
          <div className="container mx-auto px-4 flex flex-col space-y-3 py-3">
            <Link to="/" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>Home</Link>
            <Link to="/profile-guard" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>ProfileGuard</Link>
            <Link to="/chatbot" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>
              <MessageCircle className="h-4 w-4 inline mr-1" /> Safety Assistant
            </Link>
            <Link to="/face-check" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>
              <Users className="h-4 w-4 inline mr-1" /> Image Check
            </Link>
            <Link to="/vault" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>
              <Lock className="h-4 w-4 inline mr-1" /> Secure Vault
            </Link>
            <Link to="/report" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>Report</Link>
            <Link to="/evidence" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>Evidence</Link>
            <Link to="/quiz" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>Safety Quiz</Link>
            <Link to="/verify" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>Verify Case</Link>
            
            {user ? (
              <button 
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="text-gray-700 hover:text-veritas-purple py-2 transition-colors flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </button>
            ) : (
              <Link to="/signin" className="btn-outline text-center w-full mt-2" onClick={toggleMenu}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
