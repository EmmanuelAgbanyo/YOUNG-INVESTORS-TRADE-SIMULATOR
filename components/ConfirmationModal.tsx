


import React from 'react';
import Button from './ui/Button.tsx';
import Card from './ui/Card.tsx';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'success' | 'error';
  isConfirmDisabled?: boolean;
}

const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);


const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isConfirmDisabled = false
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (isConfirmDisabled) return;
    onConfirm();
  }

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
    >
      <Card 
        className="w-full max-w-md animate-fade-in-up" 
        onClick={(e) => e.stopPropagation()}
      >
          <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full bg-${confirmVariant}/10`}>
                <ExclamationTriangleIcon className={`w-6 h-6 text-${confirmVariant}`} />
              </div>
              <div>
                <h2 id="confirmation-modal-title" className="text-xl font-bold text-text-strong mb-2">{title}</h2>
                <div className="text-base-content">{children}</div>
              </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="ghost" onClick={onClose}>
              {cancelText}
            </Button>
            <Button variant={confirmVariant} onClick={handleConfirm} disabled={isConfirmDisabled}>
              {confirmText}
            </Button>
          </div>
      </Card>
    </div>
  );
};

export default ConfirmationModal;