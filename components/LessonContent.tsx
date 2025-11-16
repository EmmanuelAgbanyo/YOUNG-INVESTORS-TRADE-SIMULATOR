import React from 'react';
import YouTubeEmbed from './YouTubeEmbed';

interface LessonContentProps {
  title: string;
  children: React.ReactNode;
  videoId?: string;
}

const LessonContent: React.FC<LessonContentProps> = ({ title, children, videoId }) => {
  return (
    <div className="prose max-w-none text-base-content">
      <h1 className="text-3xl font-extrabold text-primary !mb-2">{title}</h1>
      <div className="lead">
        {children}
      </div>
      {videoId && <YouTubeEmbed videoId={videoId} />}
    </div>
  );
};

export default LessonContent;
