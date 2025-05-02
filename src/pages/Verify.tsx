
import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Shield, CheckCircle, X, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from 'react-router-dom';

const Verify = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const caseIdFromUrl = searchParams.get('case_id');

  const [caseId, setCaseId] = useState(caseIdFromUrl || '');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean | null;
    timestamp: string | null;
    type: string | null;
    details: string | null;
    hash: string | null;
  }>({
    verified: null,
    timestamp: null,
    type: null,
    details: null,
    hash: null,
  });

  const handleCaseIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaseId(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) {
      toast({
        title: "Error",
        description: "Please enter a Case ID",
        variant: "destructive",
      });
      return;
    }

    // Validate case ID format (simple check)
    const caseIdPattern = /^VR-[a-zA-Z0-9]{5}-[A-Z0-9]{5}$/;
    if (!caseIdPattern.test(caseId)) {
      toast({
        title: "Invalid Case ID Format",
        description: "Please enter a valid Case ID (e.g., VR-8f32a-DQ7TR)",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    
    // Simulate verification API call
    setTimeout(() => {
      // This is just a simulation - in a real app, you'd check against your backend
      const isSuccess = Math.random() > 0.3; // 70% chance of success
      
      if (isSuccess) {
        // Generate fake verification data
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
        
        setVerificationResult({
          verified: true,
          timestamp: date.toISOString(),
          type: Math.random() > 0.5 ? "Report Submission" : "Evidence Addition",
          details: "This case has been verified against our blockchain records. The timestamp and hash match our secure database.",
          hash: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        });
        
        toast({
          title: "Verification Successful",
          description: "The case ID has been verified in our records.",
        });
      } else {
        setVerificationResult({
          verified: false,
          timestamp: null,
          type: null,
          details: "We couldn't verify this Case ID in our records. Please check for typos or contact support if you believe this is an error.",
          hash: null,
        });
        
        toast({
          title: "Verification Failed",
          description: "Case ID not found in our records.",
          variant: "destructive",
        });
      }
      
      setVerifying(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <div className="veritas-container">
          <div className="max-w-3xl mx-auto">
            <h1 className="page-title">Verify Case ID</h1>
            <p className="text-center text-gray-600 mb-8">
              Verify the authenticity and timestamp of a case using its unique ID.
            </p>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md mb-8">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="case-id" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter Case ID
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      id="case-id"
                      value={caseId}
                      onChange={handleCaseIdChange}
                      placeholder="e.g., VR-8f32a-DQ7TR"
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-veritas-purple focus:border-veritas-purple"
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={verifying || !caseId}
                    >
                      {verifying ? "Verifying..." : "Verify Case"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    The Case ID is provided when a report is submitted or evidence is added to our system.
                  </p>
                </div>
              </form>

              {verificationResult.verified !== null && (
                <div className={`mt-8 border rounded-lg p-6 ${
                  verificationResult.verified ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start">
                    <div className={`rounded-full p-2 mr-4 ${
                      verificationResult.verified ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {verificationResult.verified ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <X className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        verificationResult.verified ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {verificationResult.verified ? 'Verification Successful' : 'Verification Failed'}
                      </h3>
                      <p className={`text-sm mb-4 ${
                        verificationResult.verified ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {verificationResult.details}
                      </p>
                      
                      {verificationResult.verified && (
                        <div className="bg-white border border-gray-100 rounded p-4 space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="font-medium text-gray-700">Case ID:</span>
                            <span className="col-span-2 font-mono">{caseId}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="font-medium text-gray-700">Timestamp:</span>
                            <span className="col-span-2">
                              {new Date(verificationResult.timestamp!).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="font-medium text-gray-700">Record Type:</span>
                            <span className="col-span-2">{verificationResult.type}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="font-medium text-gray-700">Hash:</span>
                            <span className="col-span-2 font-mono text-xs break-all">
                              {verificationResult.hash}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {verificationResult.verified ? (
                          <>
                            <button className="btn-outline text-sm py-1.5">Download Certificate</button>
                            <button className="btn-outline text-sm py-1.5">View Blockchain Record</button>
                          </>
                        ) : (
                          <button className="btn-outline text-sm py-1.5">Contact Support</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
                <div className="flex items-start mb-4">
                  <div className="bg-veritas-lightPurple p-2 rounded-full mr-3">
                    <Shield className="h-5 w-5 text-veritas-purple" />
                  </div>
                  <h2 className="text-lg font-semibold text-veritas-purple">What Verification Means</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Verification confirms that evidence or a report was submitted at a specific point in time 
                  and has not been altered since. This is crucial for establishing the chain of custody for 
                  digital evidence that may be used in legal proceedings.
                </p>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
                <div className="flex items-start mb-4">
                  <div className="bg-veritas-lightPurple p-2 rounded-full mr-3">
                    <FileText className="h-5 w-5 text-veritas-purple" />
                  </div>
                  <h2 className="text-lg font-semibold text-veritas-purple">For Authorities & Legal Use</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Law enforcement and legal professionals can use this tool to authenticate digital evidence. 
                  The verification shows when evidence was submitted, creating an immutable record that can 
                  help establish facts in investigations or court proceedings.
                </p>
              </div>
            </div>

            <div className="bg-veritas-lightPurple rounded-lg border border-veritas-purple/20 p-6">
              <div className="flex items-start mb-4">
                <AlertTriangle className="h-5 w-5 text-veritas-purple mr-2" />
                <h3 className="text-lg font-semibold text-veritas-purple">Lost Your Case ID?</h3>
              </div>
              <p className="text-gray-700 mb-4">
                If you've lost your Case ID, please reach out to our support team with any information
                you have about your report. For privacy reasons, we may ask additional verification questions.
              </p>
              <button className="btn-outline">Contact Support</button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Verify;
