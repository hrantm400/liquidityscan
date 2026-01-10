import React, { useState, useEffect, useCallback } from 'react';
import { Candle, PatternResult } from './types';
import { analyzeCandles } from './services/logic';
import { generateScenario, ScenarioType } from './services/scenarios';
import { CandleVisualizer } from './components/CandleVisualizer';
import { StrategyBuilder } from './components/StrategyBuilder';
import { QuizInterface } from './components/QuizInterface';
import { BookOpen, BarChart2, Activity, Shuffle, Zap, GraduationCap } from 'lucide-react';
import { playSound } from './services/audio';

const App: React.FC = () => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [patterns, setPatterns] = useState<(PatternResult | null)[]>([]);
  const [xParam, setXParam] = useState(3);
  const [mode, setMode] = useState<'playground' | 'learn' | 'quiz'>('playground');

  // Animation State
  const [scenarioData, setScenarioData] = useState<Candle[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);

  // Quiz State
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState<string | null>(null);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<string | null>(null);

  // --- Random Data Generator ---
  const generateRandomData = useCallback(() => {
    setPlaybackIndex(null);
    setScenarioData([]);

    const newData: Candle[] = [];
    let price = 100;
    const now = Date.now();

    for (let i = 0; i < 24; i++) {
      const volatility = Math.random() * 4;
      const isGreen = Math.random() > 0.5;
      
      let open = price;
      if (Math.random() > 0.8) open += (Math.random() - 0.5) * 2;
      let close = isGreen ? open + Math.random() * volatility : open - Math.random() * volatility;
      
      let high = Math.max(open, close) + Math.random() * (volatility / 2);
      let low = Math.min(open, close) - Math.random() * (volatility / 2);

      const candle: Candle = {
        id: i,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        timestamp: now + i * 60000
      };

      newData.push(candle);
      price = close;
    }
    setCandles(newData);
  }, []);

  // --- Quiz Generator ---
  const startNextQuizQuestion = useCallback(() => {
      // 1. Reset Quiz State for new question
      setQuizSelectedAnswer(null);
      setPlaybackIndex(null);

      // 2. Randomly select parameters
      const types: ScenarioType[] = ['RUN', 'REV', 'X'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const isPlus = Math.random() > 0.5;
      const isBull = Math.random() > 0.5;
      const randomX = Math.floor(Math.random() * 3) + 2; // 2 to 4

      setXParam(randomX); // Sync X logic so analyzer works

      // 3. Generate Scenario Data
      const data = generateScenario(randomType, isPlus, isBull, randomX);
      setCandles(data); // Show full data immediately for quiz

      // 4. Determine Correct Answer
      // Analyze the LAST candle to find the pattern
      const results = data.map((_, i) => analyzeCandles(data, i, randomX));
      const lastResult = results[results.length - 1];
      
      if (!lastResult) {
          // Retry if RNG failed to produce a valid pattern (edge case)
          startNextQuizQuestion();
          return;
      }

      const correctAnswer = lastResult.label;
      setQuizCorrectAnswer(correctAnswer);

      // 5. Generate Distractors (Wrong Answers)
      const allPossibleAnswers = [
          'RUN Bull', 'RUN Bear', 'RUN+ Bull', 'RUN+ Bear',
          'REV Bull', 'REV Bear', 'REV+ Bull', 'REV+ Bear',
          `SE x${randomX}`, `SE x${randomX+1}`,
          `RUN Bull (x${randomX})`, `REV Bear (x${randomX})` 
      ];

      // Filter out correct answer and duplicates
      let distractors = allPossibleAnswers.filter(a => a !== correctAnswer);
      
      // Shuffle and pick 3
      distractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
      setQuizOptions(options);

  }, []);

  // --- Play Specific Scenario ---
  const handlePlayScenario = (type: ScenarioType, isPlus: boolean, isBull: boolean) => {
      const data = generateScenario(type, isPlus, isBull, xParam);
      setScenarioData(data);
      setCandles([]);
      setPlaybackIndex(0);
  };

  // --- Animation Loop ---
  useEffect(() => {
    if (playbackIndex !== null && playbackIndex < scenarioData.length) {
        const timer = setTimeout(() => {
            setCandles(prev => [...prev, scenarioData[playbackIndex]]);
            setPlaybackIndex(prev => prev! + 1);
            playSound('tick'); 
        }, 150);
        return () => clearTimeout(timer);
    } else if (playbackIndex === scenarioData.length) {
        setPlaybackIndex(null);
    }
  }, [playbackIndex, scenarioData]);

  // --- Initial Load ---
  useEffect(() => {
    generateRandomData();
  }, [generateRandomData]);

  // --- Analysis & Audio Feedback ---
  useEffect(() => {
    if (candles.length === 0) {
        setPatterns([]);
        return;
    }
    const results = candles.map((_, index) => analyzeCandles(candles, index, xParam));
    setPatterns(results);

    // Audio triggers only in Playground mode during animation
    if (mode === 'playground' && playbackIndex !== null) {
        const lastResult = results[results.length - 1];
        if (lastResult) {
             if (lastResult.label.includes('Bull')) playSound('bull');
             else playSound('bear');
        }
    }
  }, [candles, xParam, playbackIndex, mode]);

  const latestPattern = patterns.length > 0 ? patterns[patterns.length - 1] : null;

  // Mode Switching Handlers
  const handleModeChange = (newMode: 'playground' | 'learn' | 'quiz') => {
      playSound('click');
      setMode(newMode);
      if (newMode === 'quiz') {
          setQuizScore(0);
          setQuizTotal(0);
          startNextQuizQuestion();
      } else {
          generateRandomData();
      }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black text-slate-100">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-indigo-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-center">
                        <BarChart2 size={24} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-mono text-white">
                        SUPER<span className="text-indigo-500">ENGULFING</span>
                    </h1>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                        <span>System 2026</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span className="text-emerald-500">Online</span>
                    </div>
                </div>
            </div>
            
            <nav className="hidden md:flex items-center bg-slate-900/50 p-1.5 rounded-xl border border-white/5 space-x-1">
                <button 
                    onClick={() => handleModeChange('playground')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-mono ${mode === 'playground' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    VISUALIZER
                </button>
                 <button 
                    onClick={() => handleModeChange('quiz')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-mono flex items-center space-x-2 ${mode === 'quiz' ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <GraduationCap size={16} />
                    <span>EXAM MODE</span>
                </button>
                <button 
                    onClick={() => handleModeChange('learn')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-mono ${mode === 'learn' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    THEORY_DB
                </button>
            </nav>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        
        {/* Layout for Playground AND Quiz */}
        {(mode === 'playground' || mode === 'quiz') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Chart Area */}
                <div className="lg:col-span-8 space-y-6">
                    <div className={`glass-panel rounded-2xl p-1 shadow-2xl relative group overflow-hidden border-t ${mode === 'quiz' ? 'border-pink-500/20' : 'border-indigo-500/20'}`}>
                        {/* Top Bar inside Chart */}
                        <div className="absolute top-0 left-0 right-0 h-14 bg-slate-900/40 backdrop-blur border-b border-white/5 flex items-center justify-between px-6 z-10">
                             <div className="flex items-center space-x-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-mono">ASSET</span>
                                    <span className="text-sm font-bold text-white font-mono">BTC/USD</span>
                                </div>
                                <div className="h-6 w-px bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-mono">TIMEFRAME</span>
                                    <span className="text-sm font-bold text-indigo-400 font-mono">5m</span>
                                </div>
                             </div>
                             
                             {mode === 'quiz' && (
                                 <div className="bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded text-xs font-mono text-pink-300">
                                     EXAM IN PROGRESS
                                 </div>
                             )}

                             {playbackIndex !== null && mode === 'playground' && (
                                <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-xs font-bold text-indigo-300 font-mono uppercase">Simulating</span>
                                </div>
                             )}
                        </div>

                        <div className="h-[550px] w-full pt-16 pb-4 px-4 bg-gradient-to-b from-slate-900/50 to-transparent">
                            <CandleVisualizer 
                                candles={candles} 
                                patterns={patterns} 
                                width={1000} 
                                height={550}
                                hideLabels={mode === 'quiz' && quizSelectedAnswer === null} // Hide labels during quiz question
                            />
                        </div>
                    </div>
                    
                    {/* Pattern Counts (Hidden in Quiz) */}
                    {mode === 'playground' && (
                        <div className="grid grid-cols-4 gap-4">
                            {['RUN', 'RUN+', 'REV', 'REV+'].map((type) => (
                                <div key={type} className="glass-panel rounded-xl p-4 flex flex-col items-center justify-center border-t border-white/5 hover:border-indigo-500/30 transition-colors">
                                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">{type} Count</span>
                                    <span className="text-xl font-bold text-white font-mono">
                                        {patterns.filter(p => p?.label.includes(type) && !p?.label.includes('x')).length}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {mode === 'playground' ? (
                        <>
                            {/* Signal Status Box */}
                            <div className="glass-panel p-6 rounded-2xl border-t border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-indigo-500 to-transparent opacity-50"></div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center">
                                    <Activity size={14} className="mr-2" />
                                    Signal Analysis
                                </h3>
                                
                                {latestPattern ? (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs px-2 py-1 rounded font-bold font-mono tracking-wide ${latestPattern.label.includes('Bull') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                {latestPattern.strength.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className={`text-3xl font-black font-mono tracking-tighter ${latestPattern.label.includes('Bull') ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500 neon-text-green' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-rose-500 neon-text-red'}`}>
                                            {latestPattern.label}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/5 text-sm text-slate-400 leading-relaxed">
                                            {latestPattern.type.includes('RUN') && "Market structure maintained. Liquidity grab successful, continuation likely."}
                                            {latestPattern.type.includes('REV') && "Trend reversal detected. Previous range engulfed. Prepare for shift."}
                                            {latestPattern.isPlus && <span className="block mt-2 text-indigo-300 font-bold">PLUS confirmed: Strong close beyond previous extreme.</span>}
                                            {latestPattern.xCount && <span className="block mt-2 text-purple-300 font-bold">X-FACTOR: Dominant engulfing of {latestPattern.xCount} candles.</span>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-24 text-slate-600 font-mono text-sm">
                                        <span>// AWAITING SIGNAL INPUT...</span>
                                    </div>
                                )}
                            </div>

                            <StrategyBuilder 
                                onGenerate={generateRandomData}
                                onPlayScenario={handlePlayScenario}
                                xParam={xParam}
                                setXParam={setXParam}
                                latestPattern={latestPattern}
                            />
                        </>
                    ) : (
                        <QuizInterface 
                            options={quizOptions}
                            correctOption={quizCorrectAnswer}
                            selectedOption={quizSelectedAnswer}
                            score={quizScore}
                            totalQuestions={quizTotal}
                            onSelect={(opt) => {
                                setQuizSelectedAnswer(opt);
                                if(opt === quizCorrectAnswer) setQuizScore(s => s + 1);
                                setQuizTotal(t => t + 1);
                            }}
                            onNext={startNextQuizQuestion}
                        />
                    )}

                    {/* Quick Cheat Sheet */}
                    <div className="bg-slate-900/30 p-5 rounded-2xl border border-white/5">
                        <h4 className="flex items-center text-xs font-bold text-slate-300 mb-4 uppercase tracking-widest font-mono">
                            <BookOpen size={14} className="mr-2 text-indigo-400" />
                            Algo Reference
                        </h4>
                        <ul className="space-y-3 text-xs text-slate-400 font-mono">
                            <li className="flex justify-between items-center group cursor-help">
                                <span className="group-hover:text-white transition-colors">RUN</span>
                                <span className="text-slate-600 group-hover:text-indigo-400 transition-colors">Sweep Low + Close High</span>
                            </li>
                            <li className="flex justify-between items-center group cursor-help">
                                <span className="group-hover:text-white transition-colors">REV</span>
                                <span className="text-slate-600 group-hover:text-indigo-400 transition-colors">Sweep Low + Engulf Open</span>
                            </li>
                            <li className="flex justify-between items-center group cursor-help">
                                <span className="group-hover:text-white transition-colors">PLUS (+)</span>
                                <span className="text-slate-600 group-hover:text-indigo-400 transition-colors">Close {'>'} Prev Extreme</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        )}

        {mode === 'learn' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 tracking-tight mb-4">
                        ALGORITHMIC LOGIC
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
                        The SuperEngulfing system identifies high-probability order block reclaims and liquidity sweeps.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-8 rounded-3xl border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={100} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 font-mono">RUN</h3>
                        <span className="inline-block px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-6">Continuation Model</span>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                            The trend pauses to grab liquidity. A candle sweeps the previous candle's low (in an uptrend) but refuses to reverse, closing higher than the previous close. This indicates trapped sellers.
                        </p>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border border-purple-500/20 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Shuffle size={100} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 font-mono">REV</h3>
                        <span className="inline-block px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-widest mb-6">Reversal Model</span>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                            A hard reversal. The candle opens against the trend, sweeps liquidity, and then engulfs the previous candle's body completely. This signifies a total shift in market control.
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                     <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-4 font-mono">THE <span className="text-yellow-400">PLUS (+)</span> STANDARD</h2>
                            <p className="text-slate-400 leading-relaxed">
                                Standard patterns are good, but <span className="text-white font-bold">PLUS</span> patterns are elite. To qualify for a PLUS tag, the candle must close beyond the <span className="text-indigo-400">absolute extreme</span> (High/Low) of the previous candle, not just the body. This filters out weak reactions.
                            </p>
                        </div>
                        <div className="w-full md:w-1/3 p-6 bg-black/40 rounded-xl border border-white/10 text-center">
                            <Zap size={48} className="mx-auto text-yellow-400 mb-4" />
                            <div className="text-xs text-slate-500 uppercase tracking-widest">Confidence Score</div>
                            <div className="text-3xl font-bold text-white">95%</div>
                        </div>
                     </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;