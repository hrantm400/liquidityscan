import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer } from '../utils/animations';

interface LessonContent {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
  content: string;
  videoUrl?: string;
  duration: string;
  completed: boolean;
}

const lessonContents: Record<string, LessonContent> = {
  '1-1': {
    id: '1-1',
    title: 'Welcome to Trading',
    type: 'video',
    content: 'Welcome to our comprehensive trading course! In this introductory lesson, we will cover the basics of trading and what you can expect from this course.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '5 min',
    completed: true,
  },
  '1-2': {
    id: '1-2',
    title: 'What is Trading?',
    type: 'video',
    content: 'Trading is the act of buying and selling financial instruments such as stocks, currencies, commodities, or cryptocurrencies with the goal of making a profit from price movements.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '15 min',
    completed: true,
  },
};

export const LessonView: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([
    { id: '1', author: 'John Doe', text: 'Great explanation! Very clear.', time: '2 hours ago', likes: 5 },
    { id: '2', author: 'Jane Smith', text: 'Can someone explain the second point in more detail?', time: '5 hours ago', likes: 2 },
  ]);
  const [newComment, setNewComment] = useState('');

  const lesson = lessonId ? lessonContents[lessonId] : null;

  useEffect(() => {
    if (lesson?.completed) {
      setIsCompleted(true);
      setProgress(100);
    }
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold dark:text-white light:text-text-dark mb-4">Lesson not found</h2>
          <Link to={`/academy/course/${courseId}`} className="text-primary hover:underline">
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    setIsCompleted(true);
    setProgress(100);
    // Here you would save to backend
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        author: 'You',
        text: newComment,
        time: 'just now',
        likes: 0,
      };
      setComments([comment, ...comments]);
      setNewComment('');
    }
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0 border-b dark:border-white/5 light:border-green-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/academy/course/${courseId}`)}
            className="p-2 rounded-lg hover:bg-white/5 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium dark:text-gray-500 light:text-text-light-secondary uppercase tracking-wider mb-1">
              <Link to="/academy" className="hover:text-primary">Academy</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <Link to={`/academy/course/${courseId}`} className="hover:text-primary">Course</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-primary">Lesson</span>
            </div>
            <h1 className="text-2xl font-black dark:text-white light:text-text-dark">{lesson.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="px-4 py-2 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-sm mr-2">note</span>
            Notes
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="px-4 py-2 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-sm mr-2">comment</span>
            Comments ({comments.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex">
        {/* Video/Content Area */}
        <div className="flex-1 min-w-0 flex flex-col p-8">
          <div className="glass-panel rounded-2xl overflow-hidden border dark:border-white/5 light:border-green-300 mb-6">
            {lesson.type === 'video' && lesson.videoUrl ? (
              <div className="relative aspect-video bg-black">
                <video
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => {
                    const video = e.currentTarget;
                    const progress = (video.currentTime / video.duration) * 100;
                    setProgress(progress);
                  }}
                />
                {isCompleted && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-bold border border-green-500/30 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Completed
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-primary/30">
                  {lesson.type === 'quiz' ? 'quiz' : 'article'}
                </span>
              </div>
            )}

            {/* Progress Bar */}
            <div className="p-4 bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium dark:text-white light:text-text-dark">Progress</span>
                <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300 mb-6">
            <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Lesson Content</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="dark:text-gray-300 light:text-text-dark leading-relaxed whitespace-pre-line">
                {lesson.content}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/academy/course/${courseId}`)}
              className="px-6 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined mr-2">arrow_back</span>
              Previous Lesson
            </button>
            {!isCompleted ? (
              <button
                onClick={handleComplete}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
              >
                Mark as Complete
                <span className="material-symbols-outlined ml-2">check_circle</span>
              </button>
            ) : (
              <button
                onClick={() => navigate(`/academy/course/${courseId}`)}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
              >
                Next Lesson
                <span className="material-symbols-outlined ml-2">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar - Notes and Comments */}
        <AnimatePresence>
          {(showNotes || showComments) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 border-l dark:border-white/5 light:border-green-300 flex flex-col"
            >
              {showNotes && (
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black dark:text-white light:text-text-dark">My Notes</h3>
                    <button
                      onClick={() => setShowNotes(false)}
                      className="p-1 rounded hover:bg-white/5"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Take notes as you learn..."
                    className="w-full h-64 p-4 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={() => {
                      // Save notes
                      console.log('Saving notes:', notes);
                    }}
                    className="mt-4 w-full py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all"
                  >
                    Save Notes
                  </button>
                </div>
              )}

              {showComments && (
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black dark:text-white light:text-text-dark">Comments</h3>
                    <button
                      onClick={() => setShowComments(false)}
                      className="p-1 rounded hover:bg-white/5"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="flex-1 space-y-4 mb-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="glass-panel rounded-xl p-4 border dark:border-white/5 light:border-green-300">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-sm">person</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm dark:text-white light:text-text-dark">{comment.author}</span>
                              <span className="text-xs dark:text-gray-500 light:text-text-light-secondary">{comment.time}</span>
                            </div>
                            <p className="text-sm dark:text-gray-300 light:text-text-dark mb-2">{comment.text}</p>
                            <button className="flex items-center gap-1 text-xs dark:text-gray-400 light:text-text-light-secondary hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-sm">thumb_up</span>
                              {comment.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t dark:border-white/5 light:border-green-300 pt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        placeholder="Add a comment..."
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        onClick={handleAddComment}
                        className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all"
                      >
                        <span className="material-symbols-outlined">send</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
