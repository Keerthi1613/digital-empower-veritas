
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Shield, Lock, FileText, CheckCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const ReportSubmission = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    platform: '',
    evidence: null as File | null,
    contactMethod: 'none',
    contactInfo: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, evidence: e.target.files![0] }));
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.category || !formData.description || !formData.platform) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.contactMethod === 'email' && !formData.contactInfo) {
        toast({
          title: "Error",
          description: "Please provide contact information or choose 'No contact'",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call to submit report
    setTimeout(() => {
      // Generate a fake case ID
      const timestamp = new Date().getTime().toString(36).substring(0, 5);
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      const generatedCaseId = `VR-${timestamp}-${random}`;
      
      setCaseId(generatedCaseId);
      setSubmitting(false);
      setStep(4);
      
      toast({
        title: "Report Submitted",
        description: "Your report has been submitted anonymously",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <div className="veritas-container">
          <div className="max-w-2xl mx-auto">
            <h1 className="page-title">Anonymous Report Submission</h1>
            <p className="text-center text-gray-600 mb-8">
              File a secure, anonymous report about online harassment, scams, or threats.
            </p>

            <div className="mb-6">
              <div className="flex justify-between items-center">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 
                        ${step >= item ? 'bg-veritas-purple text-white' : 'bg-gray-200 text-gray-500'}`}
                    >
                      {step > item ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        item
                      )}
                    </div>
                    <div className={`text-xs ${step >= item ? 'text-veritas-purple' : 'text-gray-500'}`}>
                      {item === 1 && "Details"}
                      {item === 2 && "Contact"}
                      {item === 3 && "Review"}
                      {item === 4 && "Complete"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 h-1 mt-4">
                <div 
                  className="bg-veritas-purple h-1 transition-all duration-300" 
                  style={{ width: `${(step - 1) * 33.33}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
              {step === 1 && (
                <form onSubmit={handleNext}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Type of Incident *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-veritas-purple focus:border-veritas-purple"
                        required
                      >
                        <option value="">Select incident type</option>
                        <option value="harassment">Online Harassment</option>
                        <option value="threats">Threats or Intimidation</option>
                        <option value="impersonation">Impersonation or Fake Profile</option>
                        <option value="scam">Scam or Fraud</option>
                        <option value="stalking">Stalking</option>
                        <option value="non-consensual">Non-consensual Intimate Content</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                        Platform Where It Occurred *
                      </label>
                      <input
                        type="text"
                        id="platform"
                        name="platform"
                        value={formData.platform}
                        onChange={handleInputChange}
                        placeholder="e.g. Instagram, Twitter, Dating App, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-veritas-purple focus:border-veritas-purple"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description of Incident *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={5}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Please describe what happened. This information is encrypted and anonymous."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-veritas-purple focus:border-veritas-purple"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="btn-primary">
                        Next Step
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleNext}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="evidence" className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Evidence (Optional)
                      </label>
                      <input
                        type="file"
                        id="evidence"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4 file:rounded-lg
                          file:border-0 file:text-sm file:font-medium
                          file:bg-veritas-lightPurple file:text-veritas-purple
                          hover:file:bg-veritas-lightPurple/90"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        You can upload screenshots, messages, or other evidence (up to 10MB).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Preference
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Choose how (or if) you'd like to be contacted about this report.
                      </p>
                      
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="contactMethod"
                            value="none"
                            checked={formData.contactMethod === 'none'}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">No contact (completely anonymous)</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="contactMethod"
                            value="email"
                            checked={formData.contactMethod === 'email'}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Contact via secure anonymous email</span>
                        </label>
                      </div>
                    </div>

                    {formData.contactMethod === 'email' && (
                      <div>
                        <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-1">
                          Anonymous Email Address
                        </label>
                        <input
                          type="email"
                          id="contactInfo"
                          name="contactInfo"
                          value={formData.contactInfo}
                          onChange={handleInputChange}
                          placeholder="yourname@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-veritas-purple focus:border-veritas-purple"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Consider creating an anonymous email address for this purpose.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button type="button" onClick={handleBack} className="btn-outline">
                        Back
                      </button>
                      <button type="submit" className="btn-primary">
                        Next Step
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-center">Review Your Report</h3>
                    <p className="text-sm text-center text-gray-600">
                      Please review the information before submitting. Once submitted, a unique case ID will be generated.
                    </p>
                    
                    <div className="bg-veritas-lightPurple p-4 rounded-lg">
                      <dl className="space-y-3 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-gray-700">Incident Type:</dt>
                          <dd className="col-span-2 text-gray-700">{formData.category}</dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-gray-700">Platform:</dt>
                          <dd className="col-span-2 text-gray-700">{formData.platform}</dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-gray-700">Evidence File:</dt>
                          <dd className="col-span-2 text-gray-700">
                            {formData.evidence ? formData.evidence.name : "None uploaded"}
                          </dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="font-medium text-gray-700">Contact Method:</dt>
                          <dd className="col-span-2 text-gray-700">
                            {formData.contactMethod === 'none' ? "No contact (anonymous)" : `Via email: ${formData.contactInfo}`}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Description:</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{formData.description}</p>
                    </div>
                    
                    <div className="flex items-center border border-yellow-200 bg-yellow-50 p-3 rounded-lg">
                      <Shield className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <p className="text-xs text-yellow-700">
                        By submitting this report, you confirm all information provided is true to the best of your knowledge.
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <button type="button" onClick={handleBack} className="btn-outline">
                        Back
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? "Submitting..." : "Submit Report"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {step === 4 && (
                <div className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="bg-green-100 rounded-full p-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold">Report Successfully Submitted</h3>
                  
                  <div>
                    <p className="mb-2 text-gray-600">Your Case ID:</p>
                    <div className="bg-veritas-lightPurple border border-veritas-purple/20 rounded-lg p-3 font-mono text-lg font-semibold">
                      {caseId}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Important: Save this ID. You'll need it to check your report status or add additional information.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2 text-gray-700">What happens next?</h4>
                    <ul className="text-sm text-left text-gray-600 space-y-2">
                      <li className="flex items-start">
                        <Lock className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                        Your report has been encrypted and securely stored
                      </li>
                      <li className="flex items-start">
                        <FileText className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                        A timestamp has been created to validate your evidence
                      </li>
                      <li className="flex items-start">
                        <Shield className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                        You can use your Case ID to add more information later
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setStep(1);
                        setFormData({
                          category: '',
                          description: '',
                          platform: '',
                          evidence: null,
                          contactMethod: 'none',
                          contactInfo: '',
                        });
                        setCaseId('');
                      }}
                      className="btn-outline mr-3"
                    >
                      New Report
                    </button>
                    <a href="/evidence" className="btn-primary">
                      View Evidence Chain
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-veritas-purple">Your Privacy Matters</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <Lock className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                  Reports are encrypted end-to-end
                </li>
                <li className="flex items-start">
                  <Shield className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                  No IP addresses or personal identifiers are stored
                </li>
                <li className="flex items-start">
                  <FileText className="h-4 w-4 text-veritas-purple mr-2 mt-0.5" />
                  Evidence is hashed using SHA-256 for tamper-proof verification
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportSubmission;
