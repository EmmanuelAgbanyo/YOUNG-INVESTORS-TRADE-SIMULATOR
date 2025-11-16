import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

const ButtonSpinner: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>
);


const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', size = 'md', loading = false, ...props }) => {
  const baseClasses = 'btn font-semibold border-none rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 active:scale-[0.98] relative';
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-white focus:ring-primary hover:shadow-lg hover:shadow-primary/30',
    success: 'bg-success hover:bg-success/90 text-white focus:ring-success',
    error: 'bg-error hover:bg-error/90 text-white focus:ring-error',
    ghost: 'bg-transparent hover:bg-base-300 text-text-strong focus:ring-primary',
  };
  
  const sizeClasses = {
      sm: 'btn-sm text-sm',
      md: '', // default size
      lg: 'btn-lg',
  };

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loading ? 'text-transparent' : '',
    className
  ].join(' ');

  return (
    <button className={combinedClasses} {...props} disabled={loading || props.disabled}>
      <span className={loading ? 'opacity-0' : 'opacity-100'}>{children}</span>
      {loading && <ButtonSpinner />}
    </button>
  );
};

export default Button;