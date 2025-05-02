
import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Lock, FileText, CheckCircle, Shield } from 'lucide-react';

const Evidence = () => {
  // Mock blockchain data for visualization
  const mockBlockchain = [
    {
      id: 'VR-8f32a-DQ7TR',
      timestamp: '2023-05-02T14:32:45Z',
      hash: '0x8f32a5d2c4e7b9a6d1f0e3c2b7a9d8e5f2c1b7a9',
      previousHash: '0x0000000000000000000000000000000000000000',
      type: 'Report Submission',
      verified: true
    },
    {
      id: 'VR-9c47b-FT52X',
      timestamp: '2023-05-03T09:17:22Z',
      hash: '0x9c47b3a8d5f2e1c7b9a4d2f1e8c5b3a7d9f2e1c4',
      previousHash: '0x8f32a5d2c4e7b9a6d1f0e3c2b7a9d8e5f2c1b7a9',
      type: 'Evidence Addition',
      verified: true
    },
    {
      id: 'VR-2e51c-PL93R',
      timestamp: '2023-05-04T16:45:08Z',
      hash: '0x2e51c7d9f3a6b8c5d2f1e7c9b5a3f1d8e4c2b7a9',
      previousHash: '0x9c47b3a8d5f2e1c7b9a4d2f1e8c5b3a7d9f2e1c4',
      type: 'Authority Verification',
      verified: true
    },
    {
      id: 'VR-6a23d-MN74W',
      timestamp: '2023-05-05T11:08:37Z',
      hash: '0x6a23d8f5c2b7a9d1f4e6c8a3b5d2f1e9c7b4a3d2',
      previousHash: '0x2e51c7d9f3a6b8c5d2f1e7c9b5a3f1d8e4c2b7a9',
      type: 'Report Submission',
      verified: true
    },
    {
      id: 'VR-3f42e-KL61Y',
      timestamp: '2023-05-06T08:21:15Z',
      hash: '0x3f42e1c9b7a5d2f4e8c1b7a9d5f2e4c8b7a3f1d9',
      previousHash: '0x6a23d8f5c2b7a9d1f4e6c8a3b5d2f1e9c7b4a3d2',
      type: 'Evidence Addition',
      verified: true
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <div className="veritas-container">
          <div className="max-w-4xl mx-auto">
            <h1 className="page-title">Evidence Blockchain</h1>
            <p className="text-center text-gray-600 mb-8">
              Our tamper-proof timestamping system creates an immutable record of your evidence.
            </p>

            <div className="mb-10 bg-white rounded-xl border border-gray-200 p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-veritas-purple">How It Works</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-veritas-lightPurple rounded-lg p-4">
                  <div className="flex justify-center mb-3">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <FileText className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">1. Report Submission</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Your evidence is hashed using SHA-256, creating a unique digital fingerprint
                  </p>
                </div>
                
                <div className="bg-veritas-lightPurple rounded-lg p-4">
                  <div className="flex justify-center mb-3">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <Lock className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">2. Blockchain Entry</h3>
                  <p className="text-sm text-gray-600 text-center">
                    The hash is added to our blockchain with a secure timestamp and unique ID
                  </p>
                </div>
                
                <div className="bg-veritas-lightPurple rounded-lg p-4">
                  <div className="flex justify-center mb-3">
                    <div className="bg-veritas-purple/10 rounded-full p-3">
                      <CheckCircle className="h-5 w-5 text-veritas-purple" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">3. Verification</h3>
                  <p className="text-sm text-gray-600 text-center">
                    The timestamp can be verified later, proving when evidence was submitted
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <h3 className="text-md font-medium mb-2">Why This Matters</h3>
                <p className="text-sm text-gray-600 mb-4">
                  In legal proceedings, establishing when evidence was created is crucial. 
                  Our blockchain timestamping provides cryptographic proof that your evidence existed 
                  at a specific point in time and hasn't been altered since.
                </p>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-veritas-purple mr-2" />
                  <p className="text-sm text-veritas-purple font-medium">Court-admissible digital proof</p>
                </div>
              </div>
            </div>

            <h2 className="section-title text-center mb-6">Evidence Chain Visualization</h2>
            
            <div className="mb-10 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-veritas-lightPurple -ml-0.5"></div>
              
              {mockBlockchain.map((block, index) => (
                <div key={index} className={`flex mb-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`hidden md:block w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-md ${index % 2 === 0 ? 'ml-auto' : 'mr-auto'} max-w-xs`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Case ID:</span>
                        <span className="font-mono text-sm">{block.id}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Type:</span>
                        <span className="text-sm">{block.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Verified
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500">Hash:</div>
                        <div className="font-mono text-xs text-gray-600 truncate">
                          {block.hash}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mx-auto md:mx-0 z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-veritas-purple flex items-center justify-center text-white text-sm">
                      {index + 1}
                    </div>
                    <div className="text-xs font-medium text-gray-500 mt-1">
                      {new Date(block.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className={`block md:hidden w-full ml-4 md:w-1/2 ${index % 2 === 0 ? 'md:pl-8' : 'md:pr-8 md:text-right'}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-md max-w-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Case ID:</span>
                        <span className="font-mono text-sm">{block.id}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Type:</span>
                        <span className="text-sm">{block.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Verified
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500">Hash:</div>
                        <div className="font-mono text-xs text-gray-600 truncate">
                          {block.hash}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mb-10">
              <div className="bg-veritas-lightPurple rounded-xl border border-veritas-purple/20 p-6 max-w-xl">
                <h3 className="text-xl font-semibold mb-4 text-center text-veritas-purple">Verify Your Evidence</h3>
                <p className="text-gray-600 mb-6 text-center">
                  Have a case ID? Check the timestamp and verification status of your evidence.
                </p>
                <form className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Enter Case ID (e.g. VR-8f32a-DQ7TR)"
                    className="w-full flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-veritas-purple focus:border-veritas-purple"
                  />
                  <button type="submit" className="btn-primary whitespace-nowrap">
                    Verify Evidence
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Evidence;
