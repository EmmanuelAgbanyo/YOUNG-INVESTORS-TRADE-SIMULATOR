import React, { useState, useEffect } from 'react';
import Button from './ui/Button.tsx';
import type { UserProfile } from '../types.ts';

interface PasswordLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  profile: UserProfile | null;
}

const verifyPassword = (password: string, hash: string): boolean => btoa(password) === hash;

// FIX: Completed the LockClosedIcon component definition which was uninitialized.
const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);


// FIX: Implemented the missing PasswordLoginModal component and added a default export to resolve the module resolution error.
const PasswordLoginModal: React.FC<PasswordLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  profile,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !profile) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate async check
    setTimeout(() => {
      if (profile.password && verifyPassword(password, profile.password)) {
        onSuccess(profile);
      } else {
        setError('Incorrect password. Please try again.');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-base-200 p-8 rounded-2xl shadow-2xl border border-base-300/50 w-full max-w-sm animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 bg-primary/20 rounded-full mb-4">
                <LockClosedIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-strong">Enter Password</h2>
            <p className="text-base-content/80">Profile for "{profile.name}" is password protected.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="modal-password" className="sr-only">Password</label>
                <input
                id="modal-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Password"
                className="input input-bordered w-full bg-base-100 border-base-300"
                autoFocus
                />
            </div>
          {error && <p className="text-sm text-error text-center !mt-2">{error}</p>}
          <div className="flex space-x-3 !mt-6">
            <Button type="button" variant="ghost" className="w-full" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="w-full" loading={isLoading} disabled={!password}>
              Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordLoginModal;
