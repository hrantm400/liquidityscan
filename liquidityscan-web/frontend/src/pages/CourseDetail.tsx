import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, listItemVariants } from '../utils/animations';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz';
  completed: boolean;
  locked: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessons: Lesson[];
  progress?: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  instructorBio: string;
  rating: number;
  students: number;
  price: 'Free' | 'Premium';
  tags: string[];
  whatYouWillLearn: string[];
  requirements: string[];
}

// Mock data - в реальном приложении это будет загружаться из API
const coursesData: Record<string, Course> = {
  '1': {
    id: '1',
    title: 'Introduction to Trading',
    description: 'Learn the fundamentals of trading',
    fullDescription: 'This comprehensive course will introduce you to the world of trading. You\'ll learn the basics of financial markets, how to read charts, understand market trends, and develop a solid foundation for your trading journey.',
    category: 'beginner',
    duration: '4 hours',
    level: 'Beginner',
    instructor: 'John Smith',
    instructorBio: 'John is a professional trader with over 10 years of experience in the financial markets. He has taught thousands of students and specializes in beginner education.',
    rating: 4.8,
    students: 1250,
    price: 'Free',
    tags: ['Basics', 'Trading 101', 'Market Fundamentals'],
    whatYouWillLearn: [
      'Understanding financial markets and how they work',
      'Reading and interpreting price charts',
      'Basic trading terminology and concepts',
      'Introduction to different asset classes',
      'Setting up your first trading account',
    ],
    requirements: [
      'No prior trading experience required',
      'Basic computer skills',
      'Internet connection',
    ],
    lessons: [
      { id: '1-1', title: 'Welcome to Trading', duration: '5 min', type: 'video', completed: true, locked: false },
      { id: '1-2', title: 'What is Trading?', duration: '15 min', type: 'video', completed: true, locked: false },
      { id: '1-3', title: 'Understanding Markets', duration: '20 min', type: 'video', completed: false, locked: false },
      { id: '1-4', title: 'Reading Price Charts', duration: '25 min', type: 'video', completed: false, locked: false },
      { id: '1-5', title: 'Chart Patterns Basics', duration: '30 min', type: 'reading', completed: false, locked: false },
      { id: '1-6', title: 'Quiz: Market Fundamentals', duration: '10 min', type: 'quiz', completed: false, locked: false },
    ],
    progress: 33,
  },
  '2': {
    id: '2',
    title: 'Super Engulfing Patterns Mastery',
    description: 'Master the Super Engulfing candlestick patterns',
    fullDescription: 'Dive deep into Super Engulfing patterns, one of the most powerful candlestick patterns in trading. Learn to identify RUN, REV, and PLUS patterns with x-logic, understand when to enter and exit trades, and master this advanced trading strategy.',
    category: 'intermediate',
    duration: '6 hours',
    level: 'Intermediate',
    instructor: 'Sarah Johnson',
    instructorBio: 'Sarah is a technical analysis expert with 15 years of experience. She specializes in candlestick patterns and has developed several proprietary trading strategies.',
    rating: 4.9,
    students: 890,
    price: 'Premium',
    tags: ['Candlestick Patterns', 'Super Engulfing', 'Technical Analysis'],
    whatYouWillLearn: [
      'Identifying Super Engulfing patterns across all timeframes',
      'Understanding RUN, REV, and PLUS pattern variations',
      'Mastering x-logic for pattern confirmation',
      'Entry and exit strategies for Super Engulfing trades',
      'Risk management specific to pattern trading',
    ],
    requirements: [
      'Basic understanding of candlestick charts',
      'Familiarity with trading platforms',
      'Completed Introduction to Trading course recommended',
    ],
    lessons: [
      { id: '2-1', title: 'Introduction to Super Engulfing', duration: '10 min', type: 'video', completed: true, locked: false },
      { id: '2-2', title: 'RUN Pattern Explained', duration: '25 min', type: 'video', completed: true, locked: false },
      { id: '2-3', title: 'REV Pattern Explained', duration: '25 min', type: 'video', completed: true, locked: false },
      { id: '2-4', title: 'PLUS Modifier', duration: '20 min', type: 'video', completed: false, locked: false },
      { id: '2-5', title: 'Understanding X-Logic', duration: '30 min', type: 'video', completed: false, locked: false },
      { id: '2-6', title: 'Practical Examples', duration: '40 min', type: 'video', completed: false, locked: true },
      { id: '2-7', title: 'Trading Strategy', duration: '35 min', type: 'reading', completed: false, locked: true },
      { id: '2-8', title: 'Quiz: Super Engulfing Mastery', duration: '15 min', type: 'quiz', completed: false, locked: true },
    ],
    progress: 35,
  },
};

export const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  const course = courseId ? coursesData[courseId] : null;

  if (!course) {
    return (
      <motion.div
        className="flex flex-col h-full items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold dark:text-white light:text-text-dark mb-4">Course not found</h2>
          <Link
            to="/academy"
            className="text-primary hover:underline"
          >
            Back to Academy
          </Link>
        </div>
      </motion.div>
    );
  }

  const completedLessons = course.lessons.filter(l => l.completed).length;
  const totalLessons = course.lessons.length;

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={staggerContainer}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 px-8 pt-8 pb-4 shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium dark:text-gray-500 light:text-text-light-secondary uppercase tracking-wider">
          <Link to="/academy" className="dark:hover:text-white light:hover:text-text-dark cursor-pointer transition-colors">
            Academy
          </Link>
          <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          <span className="text-primary drop-shadow-[0_0_5px_rgba(19,236,55,0.5)]">{course.title}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-black tracking-tight dark:text-white light:text-text-dark mb-2">
              {course.title}
            </h1>
            <p className="dark:text-gray-400 light:text-text-light-secondary mb-4">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">star</span>
                <span className="font-bold dark:text-white light:text-text-dark">{course.rating}</span>
                <span className="dark:text-gray-400 light:text-text-light-secondary">({course.students.toLocaleString()} students)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">schedule</span>
                <span className="dark:text-gray-400 light:text-text-light-secondary">{course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400">menu_book</span>
                <span className="dark:text-gray-400 light:text-text-light-secondary">{totalLessons} lessons</span>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                course.level === 'Beginner' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                course.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {course.level}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/academy')}
            className="px-4 py-2 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 px-8 pb-8 flex gap-6">
        {/* Left Column - Course Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="glass-panel rounded-2xl p-6 flex-1 overflow-y-auto custom-scrollbar border dark:border-white/5 light:border-green-300">
            {/* Progress Bar */}
            {course.progress !== undefined && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium dark:text-white light:text-text-dark">Course Progress</span>
                  <span className="text-sm font-bold text-primary">{course.progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            )}

            {/* Course Description */}
            <div className="mb-6">
              <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-3">About this course</h2>
              <p className="dark:text-gray-300 light:text-text-dark leading-relaxed">
                {course.fullDescription}
              </p>
            </div>

            {/* What You'll Learn */}
            <div className="mb-6">
              <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-3">What you'll learn</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.whatYouWillLearn.map((item, index) => (
                  <motion.li
                    key={index}
                    variants={listItemVariants}
                    custom={index}
                    className="flex items-start gap-3"
                  >
                    <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                    <span className="dark:text-gray-300 light:text-text-dark">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-3">Requirements</h2>
              <ul className="space-y-2">
                {course.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3 dark:text-gray-300 light:text-text-dark">
                    <span className="material-symbols-outlined text-gray-400 mt-0.5">info</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Course Content */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black dark:text-white light:text-text-dark">Course content</h2>
                <span className="text-sm dark:text-gray-400 light:text-text-light-secondary">
                  {completedLessons} of {totalLessons} lessons completed
                </span>
              </div>
              <div className="space-y-2">
                {course.lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    variants={listItemVariants}
                    custom={index}
                    className={`glass-panel rounded-xl p-4 border transition-all ${
                      lesson.locked
                        ? 'opacity-50 cursor-not-allowed border-gray-500/20'
                        : 'cursor-pointer hover:border-primary/30 dark:border-white/5 light:border-green-300'
                    } ${
                      selectedLesson === lesson.id ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                    onClick={() => !lesson.locked && navigate(`/academy/course/${course.id}/lesson/${lesson.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        lesson.completed
                          ? 'bg-green-500/20 text-green-400'
                          : lesson.locked
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {lesson.completed ? (
                          <span className="material-symbols-outlined">check_circle</span>
                        ) : lesson.locked ? (
                          <span className="material-symbols-outlined">lock</span>
                        ) : (
                          <span className="material-symbols-outlined">
                            {lesson.type === 'video' ? 'play_circle' : lesson.type === 'quiz' ? 'quiz' : 'article'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold dark:text-white light:text-text-dark">{lesson.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            lesson.type === 'video' ? 'bg-blue-500/20 text-blue-400' :
                            lesson.type === 'quiz' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {lesson.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs dark:text-gray-400 light:text-text-light-secondary">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {lesson.duration}
                        </div>
                      </div>
                      {lesson.completed && (
                        <span className="material-symbols-outlined text-green-400">check</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-6">
          {/* Course Card */}
          <div className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
            <div className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-xl mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-primary/30">school</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              {course.price === 'Free' ? (
                <span className="text-3xl font-black text-primary">Free</span>
              ) : (
                <div>
                  <span className="text-3xl font-black dark:text-white light:text-text-dark">$99</span>
                  <span className="dark:text-gray-400 light:text-text-light-secondary line-through ml-2">$149</span>
                </div>
              )}
            </div>
            <button className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all mb-4">
              {course.progress && course.progress > 0 ? 'Continue Learning' : 'Start Course'}
            </button>
            <button className="w-full py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark font-medium hover:bg-white/10 transition-all">
              Add to Wishlist
            </button>
          </div>

          {/* Instructor Card */}
          <div className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
            <h3 className="text-lg font-black dark:text-white light:text-text-dark mb-4">Instructor</h3>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">person</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold dark:text-white light:text-text-dark">{course.instructor}</h4>
                <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">Trading Expert</p>
              </div>
            </div>
            <p className="text-sm dark:text-gray-300 light:text-text-dark leading-relaxed">
              {course.instructorBio}
            </p>
          </div>

          {/* Course Stats */}
          <div className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300 mb-6">
            <h3 className="text-lg font-black dark:text-white light:text-text-dark mb-4">Course Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-gray-400 light:text-text-light-secondary">Total Students</span>
                <span className="font-bold dark:text-white light:text-text-dark">{course.students.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-gray-400 light:text-text-light-secondary">Rating</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-yellow-400">star</span>
                  <span className="font-bold dark:text-white light:text-text-dark">{course.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-gray-400 light:text-text-light-secondary">Duration</span>
                <span className="font-bold dark:text-white light:text-text-dark">{course.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-gray-400 light:text-text-light-secondary">Lessons</span>
                <span className="font-bold dark:text-white light:text-text-dark">{totalLessons}</span>
              </div>
            </div>
          </div>

          {/* Certificate Preview */}
          {course.progress === 100 && (
            <div className="glass-panel rounded-2xl p-6 border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">workspace_premium</span>
                </div>
                <div>
                  <h3 className="font-black dark:text-white light:text-text-dark">Certificate Ready!</h3>
                  <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">Download your certificate</p>
                </div>
              </div>
              <button className="w-full py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all">
                Download Certificate
              </button>
            </div>
          )}

          {/* Recommended Courses */}
          <div className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
            <h3 className="text-lg font-black dark:text-white light:text-text-dark mb-4">Recommended for you</h3>
            <div className="space-y-3">
              {[
                { id: '3', title: 'RSI Divergence Trading', level: 'Intermediate' },
                { id: '4', title: 'ICT Daily Bias Strategy', level: 'Advanced' },
                { id: '6', title: 'Risk Management Essentials', level: 'Beginner' },
              ].map((recCourse) => (
                <Link
                  key={recCourse.id}
                  to={`/academy/course/${recCourse.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">school</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm dark:text-white light:text-text-dark group-hover:text-primary transition-colors truncate">
                      {recCourse.title}
                    </p>
                    <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">{recCourse.level}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">arrow_forward</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
