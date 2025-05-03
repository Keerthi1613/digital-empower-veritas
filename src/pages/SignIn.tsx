import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Shield } from 'lucide-react';
import Footer from '../components/Footer';

interface AuthState {
  isLoading: boolean;
  email: string;
  password: string;
  mode: 'signin' | 'signup';
  confirmPassword: string;
}

const SignIn = () => {
  const [state, setState] = useState<AuthState>({
    isLoading: false,
    email: '',
    password: '',
    mode: 'signin',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  const toggleAuthMode = () => {
    setState({
      ...state,
      mode: state.mode === 'signin' ? 'signup' : 'signin',
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ ...state, isLoading: true });

    try {
      if (state.mode === 'signup') {
        if (state.password !== state.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords don't match.",
            variant: "destructive",
          });
          setState({ ...state, isLoading: false });
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: state.email,
          password: state.password,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Registration successful! Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: state.email,
          password: state.password,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Login successful!",
        });
        
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setState({ ...state, isLoading: false });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow bg-gray-50 flex justify-center items-center py-12">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-md">
          <div className="flex justify-center mb-6">
            <Shield className="h-12 w-12 text-veritas-purple" />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {state.mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {state.mode === 'signup' 
              ? 'Sign up to access all VERITAS safety features' 
              : 'Sign in to access your secure VERITAS account'}
          </p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={state.email}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={state.password}
                  onChange={handleChange}
                  required
                  className="pl-10"
                  minLength={6}
                />
              </div>
            </div>
            
            {state.mode === 'signup' && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={state.confirmPassword}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={state.isLoading}
              className="w-full bg-veritas-purple hover:bg-veritas-darkPurple"
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {state.mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>{state.mode === 'signup' ? 'Create Account' : 'Sign In'}</>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {state.mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="ml-1 text-veritas-purple hover:underline font-medium"
              >
                {state.mode === 'signup' ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
          
          {state.mode === 'signin' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-veritas-purple hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SignIn;
