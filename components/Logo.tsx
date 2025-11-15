import React from 'react';

const logoSrc = `https://iili.io/f9QJocF.png`;

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <img 
      src={logoSrc}
      alt="Medication Tracker Logo"
      className={className}
    />
  );
};

export default Logo;