
import React, { useState, useEffect, useCallback } from 'react';
import Button from './ui/Button.tsx';

interface OnboardingModalProps {
  isVisible: boolean;
  onComplete: () => void;
  onOpenGuide: () => void;
}

const steps = [
  {
    title: "Welcome to the YIN Trade Simulator!",
    content: "This quick tour will guide you through the key features. It's designed to feel like a real trading platform, but in a completely risk-free environment.",
    targetId: null,
  },
  {
    title: "Your Financial Dashboard",
    content: "Track your portfolio value, available cash, and unsettled funds from recent sales. Note: 'Unsettled Cash' simulates the real-world T+2 settlement period.",
    targetId: "portfolio-summary",
    placement: 'bottom',
  },
  {
    title: "Manage Your Holdings",
    content: "All the stocks you own are listed here. You can see their current market value and your total gain or loss at a glance. Use the buttons to quickly initiate a new trade.",
    targetId: "holdings-view",
    placement: 'bottom',
  },
  {
    title: "Execute Your Trades",
    content: "Ready to trade? This is where you can place advanced order types like Market, Limit, and Trailing Stop to execute your strategy with precision.",
    targetId: "trade-view",
    placement: 'right',
  },
  {
    title: "Consult the AI Analyst",
    content: "Get AI-powered insights on any stock. Our analyst can provide a quick overview, assess risks, and even give a BUY, SELL, or HOLD recommendation.",
    targetId: "ai-analyst-view",
    placement: 'top',
  },
  {
    title: "You're All Set!",
    content: "You have the tools to get started. For a deeper dive into order types and strategies, check out the full Simulator Guide at any time.",
    targetId: "help-guide-button",
    placement: 'bottom',
  },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isVisible, onComplete, onOpenGuide }) => {
  const [currentStep, setCurrentStep] = useState(0);
  // FIX: Explicitly type style states with React.CSSProperties to allow for dynamic style properties.
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const step = steps[currentStep];
  const hasTarget = !!step.targetId;

  const updatePositions = useCallback(() => {
    if (isVisible && step.targetId) {
      const targetElement = document.getElementById(step.targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        const rect = targetElement.getBoundingClientRect();
        
        // Spotlight style
        setSpotlightStyle({
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
          top: `${rect.top - 8}px`,
          left: `${rect.left - 8}px`,
        });

        // Tooltip position logic
        const tooltipPos: { top: number | string, left: number | string, transform: string } = {
            top: 0,
            left: 0,
            transform: 'translate(0, 0)',
        };
        const offset = 12;

        switch(step.placement) {
            case 'bottom':
                tooltipPos.top = rect.bottom + offset;
                tooltipPos.left = rect.left + rect.width / 2;
                tooltipPos.transform = 'translateX(-50%)';
                break;
            case 'top':
                tooltipPos.top = rect.top - offset;
                tooltipPos.left = rect.left + rect.width / 2;
                tooltipPos.transform = 'translate(-50%, -100%)';
                break;
            case 'right':
                tooltipPos.top = rect.top + rect.height / 2;
                tooltipPos.left = rect.right + offset;
                tooltipPos.transform = 'translateY(-50%)';
                break;
            default: // Centered
                tooltipPos.top = window.innerHeight / 2;
                tooltipPos.left = window.innerWidth / 2;
                tooltipPos.transform = 'translate(-50%, -50%)';
        }

        setTooltipStyle({ ...tooltipPos, opacity: 1 });

      }
    } else if (isVisible) {
       setSpotlightStyle({
         width: '100px', height: '100px',
         top: '50%', left: '50%',
         transform: 'translate(-50%, -50%)',
         boxShadow: '0 0 0 9999px rgba(10, 10, 20, 0.0)', // Fade out shadow
       });
       setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 1 });
    }
  }, [currentStep, isVisible, step.targetId, step.placement]);


  useEffect(() => {
    // A small delay to allow the element to be in view before positioning
    const timer = setTimeout(updatePositions, 150);
    window.addEventListener('resize', updatePositions);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePositions);
    };
  }, [updatePositions]);


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
        onOpenGuide();
    }
  };
  
  const handlePrev = () => {
      if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
      }
  }

  if (!isVisible) return null;

  return (
    <>
      <div className="onboarding-backdrop" onClick={onComplete} />
      <div className="onboarding-spotlight-wrapper">
        <div className="onboarding-spotlight" style={spotlightStyle}>
          {hasTarget && <div className="onboarding-highlight-pulse"></div>}
        </div>
      </div>
      <div 
        className="onboarding-tooltip bg-base-200 w-full max-w-sm rounded-2xl border border-base-300/70 shadow-xl p-6"
        style={tooltipStyle}
      >
        <h3 className="text-xl font-bold text-text-strong mb-2">{step.title}</h3>
        <p className="text-base-content mb-6">{step.content}</p>
        <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-base-content/70">
                {currentStep + 1} / {steps.length}
            </span>
            <div className="flex space-x-2">
                {currentStep > 0 && <Button variant="ghost" size="sm" onClick={handlePrev}>Previous</Button>}
                <Button size="sm" onClick={handleNext}>
                    {currentStep === steps.length - 1 ? 'Finish & See Guide' : 'Next'}
                </Button>
            </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingModal;