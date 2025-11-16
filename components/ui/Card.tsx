import React from 'react';

// FIX: Update CardProps to accept standard HTML div attributes like 'id'.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div {...props} className={`bg-base-200 p-6 rounded-2xl border border-base-300/70 shadow-lg dark:shadow-none transition-all duration-300 hover:shadow-xl dark:hover:shadow-primary/10 hover:-translate-y-1 ${className}`}>
      {children}
    </div>
  );
};

export default Card;