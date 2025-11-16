import React, { useState } from 'react';
import type { QuizQuestion } from '../types';
import Button from './ui/Button';

interface QuizProps {
  quiz: QuizQuestion[];
  title: string;
  onComplete: (score: number) => void;
  isCompleted: boolean;
  score?: number;
}

const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
);
const XCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
);


const Quiz: React.FC<QuizProps> = ({ quiz, title, onComplete, isCompleted, score }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(quiz.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  
  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(Array(quiz.length).fill(null));
    setShowResults(false);
  }

  const currentQuestion = quiz[currentQuestionIndex];
  const finalScore = selectedAnswers.reduce((correct, answer, index) => {
    return answer === quiz[index].correctAnswerIndex ? correct + 1 : correct;
  }, 0);
  const finalPercentage = (finalScore / quiz.length) * 100;
  
  const handleCompleteAndContinue = () => {
    onComplete(finalPercentage);
  }

  if (isCompleted && typeof score === 'number') {
     return (
        <div className="text-center flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold text-text-strong mb-2">Quiz Completed!</h1>
            <p className="text-base-content mb-4">{title}</p>
            <div className={`text-6xl font-bold ${score >= 70 ? 'text-success' : 'text-error'}`}>{score.toFixed(0)}%</div>
            <p className="font-semibold mt-2">You have already passed this quiz.</p>
        </div>
     )
  }

  if (showResults) {
    const isPass = finalPercentage >= 70;
    return (
      <div className="animate-fade-in text-center flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-text-strong mb-2">Quiz Results</h1>
        <p className="text-base-content mb-4">{title}</p>
        <div className={`text-6xl font-bold ${isPass ? 'text-success' : 'text-error'}`}>{finalPercentage.toFixed(0)}%</div>
        <p className="font-semibold mt-2">{isPass ? "Congratulations, you passed!" : "You can do better. Try again!"}</p>
        <div className="mt-6 flex space-x-4">
            <Button variant="ghost" onClick={handleRetake}>Retake Quiz</Button>
            {isPass && <Button variant="success" onClick={handleCompleteAndContinue}>Complete & Continue</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="prose max-w-none text-base-content">
      <h1 className="text-3xl font-extrabold text-primary mb-2">Quiz: {title}</h1>
      <p className="lead">Question {currentQuestionIndex + 1} of {quiz.length}</p>

      <div className="mt-6 p-4 bg-base-200 rounded-lg border border-base-300">
        <h3 className="text-lg font-semibold text-text-strong">{currentQuestion.question}</h3>
      </div>
      
      <div className="mt-4 space-y-3">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3
              ${selectedAnswers[currentQuestionIndex] === index 
                ? 'border-primary bg-primary/10 ring-2 ring-primary/50' 
                : 'border-base-300 hover:border-primary/50 hover:bg-base-200'}`
            }
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm shrink-0
              ${selectedAnswers[currentQuestionIndex] === index ? 'bg-primary text-white' : 'bg-base-300'}`
            }>
                {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 text-right">
        <Button onClick={handleNext} disabled={selectedAnswers[currentQuestionIndex] === null}>
          {currentQuestionIndex < quiz.length - 1 ? 'Next Question' : 'Finish & See Results'}
        </Button>
      </div>
    </div>
  );
};

export default Quiz;