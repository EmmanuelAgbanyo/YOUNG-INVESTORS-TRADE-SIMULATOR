import React from 'react';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
    return (
        <div className="text-center p-8 flex flex-col items-center justify-center">
            <div className="p-4 bg-base-300/50 rounded-full text-primary mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-text-strong">{title}</h3>
            <p className="text-base-content mt-1 max-w-sm">{message}</p>
        </div>
    );
};

export default EmptyState;
