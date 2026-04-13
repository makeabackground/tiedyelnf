/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Wind, 
  RotateCw, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Hand,
  Shirt as ShirtIcon,
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';

// --- Constants & Types ---

type Step = 'colors' | 'wrap' | 'shake' | 'wait' | 'reveal';

const COLORS = [
  { name: 'Pink', value: '#ff00ff', class: 'bg-[#ff00ff]' },
  { name: 'Cyan', value: '#00ffff', class: 'bg-[#00ffff]' },
  { name: 'Yellow', value: '#ffff00', class: 'bg-[#ffff00]' },
  { name: 'Purple', value: '#8000ff', class: 'bg-[#8000ff]' },
  { name: 'Orange', value: '#ff8000', class: 'bg-[#ff8000]' },
  { name: 'Lime', value: '#00ff00', class: 'bg-[#00ff00]' },
  { name: 'Red', value: '#ff0000', class: 'bg-[#ff0000]' },
  { name: 'Indigo', value: '#4b0082', class: 'bg-[#4b0082]' },
];

const PATTERNS = [
  { id: 'spiral', name: 'Spiral', icon: RotateCw, description: 'Classic swirling pattern' },
  { id: 'crumple', name: 'Crumple', icon: Wind, description: 'Random organic texture' },
  { id: 'bullseye', name: 'Bullseye', icon: Sparkles, description: 'Concentric rings' },
  { id: 'stripes', name: 'Stripes', icon: ChevronRight, description: 'Bold horizontal lines' },
];

// --- Components ---

const ShirtSVG = ({ className, pattern, colors, isRevealed = false }: { 
  className?: string; 
  pattern?: string; 
  colors?: string[];
  isRevealed?: boolean;
}) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gooey filter for organic dye look */}
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>

        {/* Pattern Gradients */}
        {isRevealed && pattern === 'spiral' && (
          <radialGradient id="dyePattern" cx="50%" cy="50%" r="50%">
            {colors?.map((c, i) => (
              <stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </radialGradient>
        )}

        {isRevealed && pattern === 'bullseye' && (
          <radialGradient id="dyePattern" cx="50%" cy="50%" r="50%">
            {colors?.map((c, i) => (
              <React.Fragment key={i}>
                <stop offset={`${(i / colors.length) * 100}%`} stopColor={c} />
                <stop offset={`${((i + 1) / colors.length) * 100}%`} stopColor={c} />
              </React.Fragment>
            ))}
          </radialGradient>
        )}

        {isRevealed && pattern === 'stripes' && (
          <linearGradient id="dyePattern" x1="0%" y1="0%" x2="0%" y2="100%">
            {colors?.map((c, i) => (
              <React.Fragment key={i}>
                <stop offset={`${(i / colors.length) * 100}%`} stopColor={c} />
                <stop offset={`${((i + 1) / colors.length) * 100}%`} stopColor={c} />
              </React.Fragment>
            ))}
          </linearGradient>
        )}

        <clipPath id="shirtClip">
          <path d="M20 20 L30 10 L40 15 L60 15 L70 10 L80 20 L80 40 L70 40 L70 90 L30 90 L30 40 L20 40 Z" />
        </clipPath>
      </defs>

      {/* Shirt Outline */}
      <path 
        d="M20 20 L30 10 L40 15 L60 15 L70 10 L80 20 L80 40 L70 40 L70 90 L30 90 L30 40 L20 40 Z" 
        fill={isRevealed ? "url(#dyePattern)" : "white"} 
        stroke="#e4e4e7" 
        strokeWidth="1"
      />

      {/* Crumple effect using random blobs */}
      {isRevealed && pattern === 'crumple' && (
        <g clipPath="url(#shirtClip)" filter="url(#goo)">
          {Array.from({ length: 40 }).map((_, i) => (
            <circle 
              key={i}
              cx={20 + Math.random() * 60}
              cy={10 + Math.random() * 80}
              r={5 + Math.random() * 15}
              fill={colors ? colors[Math.floor(Math.random() * colors.length)] : 'white'}
              opacity="0.8"
            />
          ))}
        </g>
      )}

      {/* Spiral Overlay for extra texture */}
      {isRevealed && pattern === 'spiral' && (
        <g clipPath="url(#shirtClip)" opacity="0.4">
           <path 
            d="M50 50 Q 60 40 70 50 T 50 70 T 30 50 T 50 30" 
            stroke="white" 
            strokeWidth="2" 
            fill="none"
            className="animate-spin origin-center"
            style={{ animationDuration: '10s' }}
           />
        </g>
      )}
    </svg>
  );
};

export default function App() {
  const [step, setStep] = useState<Step>('colors');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [shakeCount, setShakeCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  // Helper to send data to Qualtrics parent window
  const sendToQualtrics = (data: any) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'TIE_DYE_DATA',
        ...data
      }, '*');
    }
  };

  const toggleColor = (color: string) => {
    let newColors;
    if (selectedColors.includes(color)) {
      newColors = selectedColors.filter(c => c !== color);
    } else if (selectedColors.length < 4) {
      newColors = [...selectedColors, color];
    } else {
      return;
    }
    setSelectedColors(newColors);
    sendToQualtrics({ 
      action: 'select_colors', 
      colors: newColors,
      colorNames: newColors.map(c => COLORS.find(col => col.value === c)?.name)
    });
  };

  const togglePattern = (id: string) => {
    let newPatterns;
    if (selectedPatterns.includes(id)) {
      newPatterns = selectedPatterns.filter(p => p !== id);
    } else if (selectedPatterns.length < 2) {
      newPatterns = [...selectedPatterns, id];
    } else {
      return;
    }
    setSelectedPatterns(newPatterns);
    sendToQualtrics({ 
      action: 'select_patterns', 
      patterns: newPatterns 
    });
  };

  const handleSetStep = (newStep: Step) => {
    setStep(newStep);
    sendToQualtrics({ 
      action: 'change_step', 
      step: newStep,
      completedSteps: ['colors', 'wrap', 'shake', 'wait', 'reveal'].indexOf(newStep)
    });
    
    if (newStep === 'reveal') {
      sendToQualtrics({
        action: 'final_summary',
        colors: selectedColors,
        patterns: selectedPatterns,
        shakeCount: shakeCount
      });
    }
  };

  const handleShake = () => {
    if (step !== 'shake') return;
    setIsShaking(true);
    setShakeCount(prev => prev + 1);
    setTimeout(() => setIsShaking(false), 500);
  };

  useEffect(() => {
    // Removed automatic transition at 10 shakes
  }, [shakeCount, step]);

  const reset = () => {
    handleSetStep('colors');
    setSelectedColors([]);
    setSelectedPatterns([]);
    setShakeCount(0);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-dye-pink via-dye-blue to-dye-yellow rounded-xl flex items-center justify-center shadow-lg">
            <ShirtIcon className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight">Tie-Dye Studio</h1>
        </div>
        
        <div className="flex gap-1">
          {(['colors', 'reveal'] as Step[]).map((s, i) => (
            <div 
              key={s}
              className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                step === s || (i < ['colors', 'reveal'].indexOf(step)) 
                  ? 'bg-zinc-900' 
                  : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col">
        <AnimatePresence mode="wait">
          {/* STEP 1: COLORS */}
          {step === 'colors' && (
            <motion.div 
              key="colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col gap-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-extrabold font-display">Pick Your Palette</h2>
                <p className="text-zinc-500 text-lg">Select between 2 to 4 colors for your design.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => toggleColor(color.value)}
                    className={`group relative aspect-square rounded-3xl p-4 transition-all duration-300 flex flex-col items-center justify-center gap-3 border-2 ${
                      selectedColors.includes(color.value) 
                        ? 'border-zinc-900 bg-white shadow-xl scale-105' 
                        : 'border-transparent bg-zinc-100 hover:bg-zinc-200'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full shadow-inner ${color.class} transition-transform group-hover:scale-110`} />
                    <span className="font-bold text-sm uppercase tracking-wider">{color.name}</span>
                    {selectedColors.includes(color.value) && (
                      <div className="absolute top-3 right-3 bg-zinc-900 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-auto flex justify-center pb-8">
                <button
                  disabled={selectedColors.length < 2}
                  onClick={() => {
                    // Fast-forward through removed steps for Qualtrics recording
                    setSelectedPatterns(['spiral', 'crumple']);
                    setShakeCount(10);
                    handleSetStep('wrap');
                    handleSetStep('shake');
                    handleSetStep('wait');
                    setTimeout(() => handleSetStep('reveal'), 3000);
                  }}
                  className="group flex items-center gap-3 bg-zinc-900 text-white px-10 py-4 rounded-full font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl active:scale-95"
                >
                  {selectedColors.length < 2 ? `Pick ${2 - selectedColors.length} more` : 'Next Step'}
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEPS 2 & 3 REMOVED: WRAP & SHAKE (SATURATION) */}


          {/* STEP 4: WAIT */}
          {step === 'wait' && (
            <motion.div 
              key="wait"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-8"
            >
              <div className="relative w-48 h-48">
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-zinc-100 border-t-zinc-900"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
                <div className="absolute inset-4 rounded-full bg-zinc-50 flex items-center justify-center">
                  <ShirtIcon className="w-16 h-16 text-zinc-900 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-extrabold font-display">Soaking in the magic...</h2>
                <p className="text-zinc-500">The dye is bonding with the fibers.</p>
              </div>
            </motion.div>
          )}

          {/* STEP 5: REVEAL */}
          {step === 'reveal' && (
            <motion.div 
              key="reveal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-12"
            >
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2 className="text-5xl font-extrabold font-display">Your Shirt</h2>
                  <p className="text-zinc-500 text-lg">Your custom design is ready.</p>
                </motion.div>
              </div>

              <motion.div 
                className="relative"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <div className="absolute -inset-12 bg-gradient-to-br from-dye-pink/20 via-dye-blue/20 to-dye-yellow/20 rounded-full blur-3xl" />
                <img 
                  src="https://tcu.co1.qualtrics.com/ControlPanel/Graphic.php?IM=IM_k9X6wssNAJK5g7f" 
                  alt="Final Tie-Dye Shirt"
                  className="w-80 h-auto relative z-10 drop-shadow-2xl rounded-2xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback if Qualtrics link fails
                    e.currentTarget.src = "https://images.unsplash.com/photo-1621335829175-95f437384d7c?q=80&w=1000&auto=format&fit=crop";
                  }}
                />
                
                {/* Confetti-like sparkles */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-yellow-400"
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * 400,
                      y: (Math.random() - 0.5) * 400,
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: Math.random() * 2,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </motion.div>

              
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Info */}
      <footer className="p-6 text-center text-zinc-400 text-sm border-t border-zinc-100 bg-white">
        <p>Made with 🎨 and 👕 in the Tie-Dye Studio</p>
      </footer>
    </div>
  );
}
