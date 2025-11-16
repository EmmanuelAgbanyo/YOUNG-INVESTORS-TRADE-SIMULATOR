import React, { useState } from 'react';
import Button from './ui/Button';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (teamName: string) => void;
}

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.75 3.75 0 0115 12a3.75 3.75 0 01-2.25 3.512m-3.75 1.488A2.25 2.25 0 016.75 18v-2.25m0 0a3.75 3.75 0 01-3.75-3.75m3.75 3.75A3.75 3.75 0 016 16.5m-3 3.75a3.75 3.75 0 01-3.75-3.75m0 0A3.75 3.75 0 013 12.75m3.75 1.488A3.75 3.75 0 019 15.25m-3.75 1.488a3.75 3.75 0 01-3.75-3.75m3.75 3.75c-1.33 0-2.51-.54-3.375-1.417-1.146-1.146-1.146-3.033 0-4.179 1.146-1.146 3.033-1.146 4.179 0 1.146 1.146 1.146 3.033 0 4.179Z" />
    </svg>
);


const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onCreateTeam }) => {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim().length < 3) {
        setError("Team name must be at least 3 characters long.");
        return;
    }
    setError(null);
    onCreateTeam(teamName.trim());
    onClose();
    setTeamName('');
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
            <div className="p-3 bg-info/20 rounded-full mb-4">
                <UsersIcon className="w-8 h-8 text-info" />
            </div>
            <h2 className="text-2xl font-bold text-text-strong">Create a Trading Team</h2>
            <p className="text-base-content/80">Assemble your team and trade together.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="team-name" className="sr-only">Team Name</label>
                <input
                id="team-name"
                type="text"
                value={teamName}
                onChange={(e) => { setTeamName(e.target.value); setError(null); }}
                placeholder="Enter your team name"
                className="input input-bordered w-full bg-base-100 border-base-300"
                autoFocus
                />
            </div>
          {error && <p className="text-sm text-error text-center !mt-2">{error}</p>}
          <div className="flex space-x-3 !mt-6">
            <Button type="button" variant="ghost" className="w-full" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="w-full" disabled={!teamName.trim()}>
              Create Team
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
