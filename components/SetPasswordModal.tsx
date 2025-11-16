
import React, { useState } from 'react';
import Button from './ui/Button.tsx';

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetPassword: (password: string) => void;
}

const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
  </svg>
);


const SetPasswordModal: React.FC<SetPasswordModalProps> = ({ isOpen, onClose, onSetPassword }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    setError(null);
    onSetPassword(password);
    onClose();
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
            <div className="p-3 bg-success/20 rounded-full mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-text-strong">Secure Your Profile</h2>
            <p className="text-base-content/80">Add a password to protect your account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="new-password" className="sr-only">New Password</label>
                <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="New Password (min. 6 characters)"
                className="input input-bordered w-full bg-base-100 border-base-300"
                autoFocus
                />
            </div>
            <div>
                <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                placeholder="Confirm New Password"
                className="input input-bordered w-full bg-base-100 border-base-300"
                />
            </div>
          {error && <p className="text-sm text-error text-center !mt-2">{error}</p>}
          <div className="flex space-x-3 !mt-6">
            <Button type="button" variant="ghost" className="w-full" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="w-full" disabled={!password || !confirmPassword}>
              Set Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordModal;
