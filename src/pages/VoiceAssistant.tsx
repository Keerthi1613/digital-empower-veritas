import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Trash2, Phone, Shield, AlertTriangle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import { useVoiceAssistant, LANGUAGE_OPTIONS, SupportedLanguage } from '@/hooks/useVoiceAssistant';
import { cn } from '@/lib/utils';

const VoiceAssistant = () => {
  const {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    language,
    setLanguage,
    startListening,
    stopListening,
    stopSpeaking,
    sendTextMessage,
    clearConversation,
  } = useVoiceAssistant();

  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendTextMessage(textInput);
      setTextInput('');
    }
  };

  const quickActions = [
    { label: "What is ProfileGuard?", icon: Shield },
    { label: "I need help - feeling unsafe", icon: AlertTriangle },
    { label: "Emergency helplines", icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            VERITAS Voice Assistant
          </h1>
          <p className="text-gray-600 mb-4">
            Your AI safety companion - speak or type to get help
          </p>
          
          {/* Language Selector */}
          <div className="flex items-center justify-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <Select value={language} onValueChange={(val) => setLanguage(val as SupportedLanguage)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeLabel} ({lang.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Voice Interface */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Voice Control Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                    : isProcessing 
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 hover:scale-105"
                )}
              >
                {isListening ? (
                  <MicOff className="w-12 h-12 text-white" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </button>

              {/* Status Text */}
              <div className="text-center">
                {isListening && (
                  <p className="text-lg font-medium text-red-600 animate-pulse">
                    Listening...
                  </p>
                )}
                {isProcessing && (
                  <p className="text-lg font-medium text-purple-600">
                    Thinking...
                  </p>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    <span className="font-medium">Speaking...</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={stopSpeaking}
                      className="ml-2"
                    >
                      <VolumeX className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {!isListening && !isProcessing && !isSpeaking && (
                  <p className="text-gray-500">
                    Tap the microphone to start speaking
                  </p>
                )}
              </div>

              {/* Live Transcript */}
              {transcript && (
                <div className="w-full max-w-md bg-gray-100 rounded-lg p-4">
                  <p className="text-gray-700 italic">"{transcript}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <Card className="mb-6 border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Tap to ask common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => sendTextMessage(action.label)}
                    disabled={isProcessing}
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation History */}
        {messages.length > 0 && (
          <Card className="mb-6 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Conversation</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearConversation}
                className="text-gray-500 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3",
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Text Input */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-4">
            <form onSubmit={handleTextSubmit} className="flex gap-3">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type your message here..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!textInput.trim() || isProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Emergency Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            In case of immediate danger, call 911 or your local emergency number
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
