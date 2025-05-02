
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
            <Link to="/report" className="text-gray-700 hover:text-veritas-purple transition-colors">Report</Link>
            <Link to="/evidence" className="text-gray-700 hover:text-veritas-purple transition-colors">Evidence</Link>
            <Link to="/quiz" className="text-gray-700 hover:text-veritas-purple transition-colors">Safety Quiz</Link>
            <Link to="/verify" className="btn-outline text-sm py-1.5 px-3">Verify Case</Link>
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
            <Link to="/report" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>Report</Link>
            <Link to="/evidence" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>Evidence</Link>
            <Link to="/quiz" className="text-gray-700 hover:text-veritas-purple py-2 transition-colors" onClick={toggleMenu}>Safety Quiz</Link>
            <Link to="/verify" className="btn-outline text-center w-full mt-2" onClick={toggleMenu}>Verify Case</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
