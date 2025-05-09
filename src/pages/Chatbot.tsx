
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  created_at: string;
  conversation_name: string | null;
}

const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getUser();
  }, []);
  
  // Create a new conversation when user is available
  useEffect(() => {
    if (!userId) return;
    
    const createNewConversation = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_conversations')
          .insert([{ 
            conversation_name: 'Safety Chat ' + new Date().toLocaleDateString(),
            user_id: userId 
          }])
          .select();
        
        if (error) {
          console.error('Error creating conversation:', error);
          toast({
            title: "Error",
            description: "Failed to start a new conversation. Try refreshing the page.",
            variant: "destructive",
          });
          return;
        }
        
        if (data && data.length > 0) {
          setConversationId(data[0].id);
          // Set welcome message
          const welcomeMessage = {
            id: 'welcome',
            role: 'assistant' as const,
            content: "Hello, I'm VERITAS Safety Assistant. How can I help you stay safe online today?",
            created_at: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
          
          // Save welcome message to database
          await supabase.from('chat_messages').insert({
            conversation_id: data[0].id,
            role: 'assistant',
            content: welcomeMessage.content
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    createNewConversation();
  }, [userId]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: { content: string }) => {
      if (!conversationId) throw new Error('No conversation ID available');
      
      // Save user message to database
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: newMessage.content
        })
        .select();
        
      if (messageError) throw messageError;
      
      // Call the AI chatbot function
      const response = await supabase.functions.invoke('ai-chatbot', {
        body: { 
          message: newMessage.content, 
          conversationId,
          userId
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      
      return { 
        userMessageId: messageData[0].id,
        response: response.data.response 
      };
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          id: data.userMessageId,
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString()
        }
      ]);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !conversationId) return;
    
    setIsLoading(true);
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    
    sendMessageMutation.mutate({ content: userMessage.content });
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to use the Safety Assistant</h1>
            <p>You need to be logged in to use this feature.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow flex flex-col bg-gray-50">
        <div className="veritas-container py-8 flex-grow flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-veritas-purple">Safety Assistant</h1>
            <p className="text-gray-600">Ask questions and get guidance on staying safe online</p>
          </div>
          
          <div className="flex-grow flex flex-col bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="flex-grow p-4 overflow-y-auto">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-veritas-purple text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center mb-1">
                        <Bot size={16} className="mr-1 text-veritas-purple" />
                        <span className="text-xs font-semibold text-veritas-purple">VERITAS AI</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-grow rounded-l-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-veritas-purple"
                  placeholder="Type your question here..."
                  disabled={isLoading}
                />
                <Button 
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="rounded-r-md bg-veritas-purple hover:bg-veritas-darkPurple"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Chatbot;
