
import React, { useState } from 'react';
import Button from './ui/Button.tsx';

interface TeamInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  inviteCode: string;
}

const TicketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h-1.5m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v-1.5c0-.621.504-1.125 1.125-1.125H18v4.875c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125v-1.5-1.5H5.625c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5m9-1.5h-5.25m5.25 0h1.5m1.5 0h.375c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18v-4.875c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5m-9-1.5h5.25m-5.25 0h-1.5m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v-1.5c0-.621.504-1.125 1.125-1.125H18v4.875c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125v-1.5-1.5H5.625c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5Z" />
    </svg>
);

const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);


const TeamInviteModal: React.FC<TeamInviteModalProps> = ({ isOpen, onClose, teamName, inviteCode }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-secondary/20 rounded-full mb-4">
                <TicketIcon className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-text-strong">Team "{teamName}" Created!</h2>
            <p className="text-base-content/80 mt-2">Share this invite code with others to let them join your team's shared portfolio.</p>
        </div>
        <div className="my-6">
            <div className="flex items-center space-x-2 p-3 bg-base-100 border-2 border-dashed border-base-300 rounded-lg">
                 <input 
                    type="text" 
                    readOnly 
                    value={inviteCode} 
                    className="w-full bg-transparent text-center font-mono text-2xl text-text-strong tracking-widest focus:outline-none" 
                    aria-label="Team Invite Code"
                 />
            </div>
        </div>
        <div className="flex flex-col space-y-3">
            <Button onClick={handleCopy} variant="primary" className="w-full">
                <ClipboardIcon className="w-5 h-5 mr-2" />
                {copied ? 'Copied!' : 'Copy Code'}
            </Button>
            <Button onClick={onClose} variant="ghost" className="w-full">
                Close
            </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamInviteModal;
