
import React from 'react';
import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';
import FeatureCard from '../components/FeatureCard';
import { ShieldCheck, FileText, Lock, Eye } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow">
        <HeroSection />

        <section className="veritas-container py-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="section-title">How VERITAS Protects You</h2>
            <p className="text-lg text-gray-600">
              Our platform uses advanced technology to provide multiple layers of digital protection
              and empowers you with the tools to fight back against online threats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="ProfileGuard Scanner"
              description="Upload suspicious profile images to detect AI-generated fakes and potential catfishing attempts with our advanced detection system."
              icon={<Eye className="h-8 w-8 text-veritas-purple" />}
              link="/profile-guard"
              linkText="Scan a profile"
            />

            <FeatureCard
              title="Anonymous Reporting"
              description="Report harassment, threats, or abuse without revealing your identity. Your information is protected with advanced encryption."
              icon={<ShieldCheck className="h-8 w-8 text-veritas-purple" />}
              link="/report"
              linkText="Submit a report"
            />

            <FeatureCard
              title="Blockchain Evidence"
              description="Create tamper-proof, timestamped digital evidence that can be verified later and potentially used in legal proceedings."
              icon={<Lock className="h-8 w-8 text-veritas-purple" />}
              link="/evidence"
              linkText="Secure your evidence"
            />

            <FeatureCard
              title="Digital Self-Defense Quiz"
              description="Test your knowledge and learn essential cybersecurity skills to protect yourself from common online threats and scams."
              icon={<FileText className="h-8 w-8 text-veritas-purple" />}
              link="/quiz"
              linkText="Take the quiz"
            />

            <FeatureCard
              title="Case Verification"
              description="Easily verify the authenticity and timestamp of previously submitted evidence using your unique case ID."
              icon={<ShieldCheck className="h-8 w-8 text-veritas-purple" />}
              link="/verify"
              linkText="Verify a case"
            />

            <div className="bg-veritas-purple rounded-xl shadow-md p-8 text-white flex flex-col items-start justify-center h-full">
              <h3 className="text-2xl font-semibold mb-4">Need Immediate Help?</h3>
              <p className="mb-6">
                If you're in danger or experiencing immediate threats, please contact local authorities or reach out to crisis support services.
              </p>
              <button className="bg-white text-veritas-purple font-medium py-2 px-6 rounded-lg hover:bg-gray-100 transition duration-300 mt-auto">
                Access Emergency Resources
              </button>
            </div>
          </div>
        </section>

        <section className="bg-veritas-lightPurple py-16">
          <div className="veritas-container">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="section-title mb-6">Why Women Trust VERITAS</h2>
              <p className="text-lg text-gray-700 mb-12">
                We've built a platform focused on privacy, security, and empowerment, designed specifically for women facing digital threats.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-3xl font-bold text-veritas-purple mb-2">100%</div>
                  <p className="text-gray-600">Anonymous Reporting</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-3xl font-bold text-veritas-purple mb-2">256-bit</div>
                  <p className="text-gray-600">SHA Encryption</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-3xl font-bold text-veritas-purple mb-2">24/7</div>
                  <p className="text-gray-600">Digital Protection</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
