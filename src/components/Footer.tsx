
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Github, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-10 pb-6">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-veritas-purple" />
              <span className="text-xl font-bold text-veritas-purple">VERITAS</span>
            </div>
            <p className="text-gray-600 mb-4">
              A digital safety platform empowering women against online threats and harassment.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-veritas-purple hover:text-veritas-darkPurple transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-veritas-purple">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/profile-guard" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  ProfileGuard
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Report Submission
                </Link>
              </li>
              <li>
                <Link to="/evidence" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Evidence Timestamping
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Self-Defense Quiz
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-veritas-purple">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/verify" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Verify Case ID
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-veritas-purple">Help</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Safety Resources
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Report Abuse
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-veritas-purple transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} VERITAS. All rights reserved.
          </p>
          <div className="flex items-center text-gray-500 text-sm">
            <span>Made with</span>
            <Heart className="h-4 w-4 mx-1 text-veritas-purple" />
            <span>for a safer digital world</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
