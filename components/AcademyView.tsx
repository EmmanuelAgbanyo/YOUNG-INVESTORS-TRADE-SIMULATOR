
import React, { useState, useEffect } from 'react';
import type { UserProfile, AcademyProgress, Lesson, Module } from '../types';
import Card from './ui/Card';
import { ACADEMY_MODULES } from '../academy-content';
import Quiz from './Quiz';
import YouTubeEmbed from './YouTubeEmbed';
import Button from './ui/Button';

interface AcademyViewProps {
    profile: UserProfile;
}

// Icons
const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
);
const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
    </svg>
);
const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const AcademyView: React.FC<AcademyViewProps> = ({ profile }) => {
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [activeModule, setActiveModule] = useState<Module | null>(null);
    const [progress, setProgress] = useState<AcademyProgress>({});
    const [customVideos, setCustomVideos] = useState<Record<string, string>>({});

    const progressKey = `yin_trade_academy_progress_${profile.id}`;

    useEffect(() => {
        try {
            const savedProgress = localStorage.getItem(progressKey);
            if (savedProgress) setProgress(JSON.parse(savedProgress));

            const savedVideos = localStorage.getItem('yin_trade_academy_videos');
            if (savedVideos) setCustomVideos(JSON.parse(savedVideos));
        } catch (e) { console.error("Failed to load academy data", e); }
    }, [progressKey]);

    const handleCompleteQuiz = (lessonId: string, score: number) => {
        const newProgress = { ...progress, [lessonId]: { completed: true, score } };
        setProgress(newProgress);
        localStorage.setItem(progressKey, JSON.stringify(newProgress));
    };

    const isLessonCompleted = (lessonId: string) => progress[lessonId]?.completed || false;
    const allLessons = ACADEMY_MODULES.flatMap(m => m.lessons);
    const completedLessonsCount = allLessons.filter(l => isLessonCompleted(l.id)).length;
    const totalLessonsCount = allLessons.length;
    const overallCompletion = totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 0;

    const isModuleUnlocked = (moduleIndex: number): boolean => {
        if (moduleIndex === 0) return true;
        const prevModule = ACADEMY_MODULES[moduleIndex - 1];
        const prevModuleLessons = prevModule.lessons;
        return prevModuleLessons.every(l => isLessonCompleted(l.id));
    };

    const renderModuleSelection = () => (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <BookOpenIcon className="w-8 h-8 text-primary" />
                    <div>
                        <h2 className="text-3xl font-bold text-text-strong">Trader Academy</h2>
                        <p className="text-base-content/80">Build your trading knowledge from the ground up.</p>
                    </div>
                </div>
                <div className="w-full md:w-72 mt-4 md:mt-0">
                    <p className="text-sm font-semibold text-right mb-1">{completedLessonsCount} / {totalLessonsCount} Lessons Completed</p>
                    <div className="w-full bg-base-300 rounded-full h-2.5">
                        <div className="bg-success h-2.5 rounded-full" style={{ width: `${overallCompletion}%` }}></div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ACADEMY_MODULES.map((module, index) => {
                    const lessonsInModule = module.lessons.length;
                    const completedInModule = module.lessons.filter(l => isLessonCompleted(l.id)).length;
                    const moduleCompletion = lessonsInModule > 0 ? (completedInModule / lessonsInModule) * 100 : 0;
                    const isUnlocked = isModuleUnlocked(index);

                    return (
                        <div key={module.id} className={`bg-white/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-white/50 dark:border-slate-700/50 backdrop-blur-md shadow-sm transition-all duration-300 ${isUnlocked ? 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1' : 'opacity-60 grayscale-[50%]'}`}>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{module.title}</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 h-10 mt-2 mb-5 leading-relaxed">{module.description}</p>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden shadow-inner">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full" style={{ width: `${moduleCompletion}%` }}></div>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5">{completedInModule} / {lessonsInModule} COMPLETE</p>
                            <button
                                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center ${isUnlocked
                                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800 hover:shadow-lg hover:shadow-slate-800/20 active:scale-95'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                    }`}
                                disabled={!isUnlocked}
                                onClick={() => { setActiveModule(module); setActiveLesson(module.lessons[0]); }}
                            >
                                {isUnlocked ? 'Start Learning' : <><LockClosedIcon className="w-4 h-4 mr-2" />Locked</>}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );

    const renderLessonView = () => {
        if (!activeModule || !activeLesson) return null;

        const videoId = customVideos[activeLesson.id] || activeLesson.videoId;

        return (
            <div className="flex flex-col md:flex-row gap-6 animate-fade-in h-[60vh]">
                <nav className="md:w-1/3 lg:w-1/4 flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                        <button onClick={() => setActiveModule(null)} className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center transition-colors">
                            <ChevronLeftIcon className="w-4 h-4 mr-1 stroke-[3]" /> Back to Modules
                        </button>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight line-clamp-2">{activeModule.title}</h3>
                    </div>
                    <div className="space-y-1 p-3 flex-grow overflow-y-auto custom-scrollbar">
                        {activeModule.lessons.map(lesson => (
                            <button
                                key={lesson.id}
                                onClick={() => setActiveLesson(lesson)}
                                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center justify-between text-sm font-semibold ${activeLesson?.id === lesson.id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'}`}
                            >
                                <span className="line-clamp-2 pr-2">{lesson.title}</span>
                                {isLessonCompleted(lesson.id) && <CheckCircleIcon className={`w-5 h-5 shrink-0 ${activeLesson?.id === lesson.id ? 'text-white/90' : 'text-emerald-500'}`} />}
                            </button>
                        ))}
                    </div>
                </nav>
                <main className="md:w-2/3 lg:w-3/4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/50 dark:border-slate-700/50 p-8 rounded-3xl shadow-sm overflow-y-auto custom-scrollbar">
                    <div key={activeLesson.id} className="animate-fade-in max-w-3xl mx-auto">
                        {activeLesson.content}
                        {videoId && <YouTubeEmbed videoId={videoId} />}
                        {activeLesson.quiz && (
                            <div className="mt-8 pt-8 border-t border-base-300">
                                <Quiz
                                    quiz={activeLesson.quiz}
                                    title={activeLesson.title}
                                    onComplete={(score) => handleCompleteQuiz(activeLesson.id, score)}
                                    isCompleted={isLessonCompleted(activeLesson.id)}
                                    score={progress[activeLesson.id]?.score}
                                />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-6 sm:p-8">
            {activeModule ? renderLessonView() : renderModuleSelection()}
        </div>
    );
};

export default AcademyView;
