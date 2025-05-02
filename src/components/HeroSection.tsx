
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Users, Lock, MessageCircle } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-b from-veritas-lightPurple to-white py-20 relative overflow-hidden">
      <div className="security-element absolute top-10 right-10 opacity-30">
        <Lock className="h-16 w-16 text-veritas-purple" />
      </div>
      <div className="security-element absolute bottom-10 left-10 opacity-20">
        <ShieldCheck className="h-20 w-20 text-veritas-blue" />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-veritas-purple mb-6">
            Digital Safety for Women
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8">
            VERITAS empowers women with tools to identify scams, report harassment, 
            and create tamper-proof digital evidence while staying anonymous.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/chatbot" className="btn-primary">
              Get Safety Guidance
            </Link>
            <Link to="/face-check" className="btn-secondary">
              Check Suspicious Profiles
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition duration-300">
            <div className="bg-veritas-lightPurple p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-veritas-purple" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Safety Assistant</h3>
            <p className="text-gray-600">Get personalized guidance on digital safety issues</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition duration-300">
            <div className="bg-veritas-lightPurple p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-veritas-purple" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Profile Scanner</h3>
            <p className="text-gray-600">Detect fake profiles and AI-generated images</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition duration-300">
            <div className="bg-veritas-lightPurple p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-veritas-purple" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure Vault</h3>
            <p className="text-gray-600">Store encrypted evidence safely in the cloud</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition duration-300">
            <div className="bg-veritas-lightPurple p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-veritas-purple" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Digital Self-Defense</h3>
            <p className="text-gray-600">Learn cybersecurity skills through interactive quizzes</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
