
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  linkText: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  link,
  linkText,
}) => {
  return (
    <div className="card flex flex-col h-full">
      <div className="bg-veritas-lightPurple p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-veritas-purple">{title}</h3>
      <p className="text-gray-600 mb-4 flex-grow">{description}</p>
      <Link
        to={link}
        className="mt-auto text-veritas-purple font-medium hover:underline flex items-center"
      >
        {linkText}
      </Link>
    </div>
  );
};

export default FeatureCard;
