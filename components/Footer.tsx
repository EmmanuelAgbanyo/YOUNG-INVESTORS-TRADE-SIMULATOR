import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-base-300/50">
      <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-base-content/60 space-y-4 sm:space-y-0">
        <div className="text-center sm:text-left">
            <p className="font-semibold">© {currentYear} Young Investors Network</p>
            <p>Empowering the next generation of investors.</p>
        </div>
        <div className="text-center sm:text-right">
           <p>Developed by <strong className="font-semibold text-base-content/80">Emmanuel Agbanyo</strong></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
