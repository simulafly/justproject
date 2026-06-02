/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Track, ThemeConfig } from './types';
import { MusicPlayer } from './components/MusicPlayer';
import { SnakeGame } from './components/SnakeGame';
import { Sparkles, Terminal, Activity, HelpCircle, Flame, Gamepad2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const THEMES: Record<string, ThemeConfig> = {
  grid_runner: {
    primary: '#10b981', // emerald
    primaryGlow: 'rgba(16, 185, 129, 0.4)',
    accent: '#34d399',
    bgDark: '#030307',
    gridLine: 'rgba(16, 185, 129, 0.09)',
    snakeHead: '#10b981',
    snakeBody: '#059669',
    food: '#fbbf24', // amber yellow food
    visualizerBars: '#10b981'
  },
  neon_horizon: {
    primary: '#06b6d4', // cyan
    primaryGlow: 'rgba(6, 182, 212, 0.4)',
    accent: '#22d3ee',
    bgDark: '#030307',
    gridLine: 'rgba(6, 182, 212, 0.09)',
    snakeHead: '#06b6d4',
    snakeBody: '#0891b2',
    food: '#ff007f', // hot pink food
    visualizerBars: '#06b6d4'
  },
  laser_fury: {
    primary: '#ec4899', // pink
    primaryGlow: 'rgba(236, 72, 153, 0.4)',
    accent: '#f472b6',
    bgDark: '#030307',
    gridLine: 'rgba(236, 72, 153, 0.09)',
    snakeHead: '#ec4899',
    snakeBody: '#db2777',
    food: '#10b981', // bright green food
    visualizerBars: '#ec4899'
  }
};

export default function App() {
  const [currentTrack, setCurrentTrack] = useState<Track>({
    id: 'grid_runner',
    title: 'Grid Runner 2099',
    artist: 'AI Synthwave Sequencer',
    bpm: 118,
    genre: 'Retro Electro Synth',
    color: '#10b981',
    description: '',
    notes: { bassSequence: [], leadSequence: [], scale: [] }
  });

  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(THEMES.grid_runner);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [isFoodPulseActive, setIsFoodPulseActive] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Sync visual colors to the playing track
  useEffect(() => {
    const theme = THEMES[currentTrack.id] || THEMES.grid_runner;
    setActiveTheme(theme);
  }, [currentTrack]);

  // Handle flash event when index eats food 
  const handleEatFood = () => {
    setIsFoodPulseActive(true);
    setTimeout(() => {
      setIsFoodPulseActive(false);
    }, 120);
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none selection:bg-indigo-500/30 selection:text-white">
      
      {/* Immersive CRT Scanline Overlay Effect */}
      <div className="crt-overlay absolute inset-0 pointer-events-none opacity-10 z-50 pointer-events-none" />

      {/* Background Neon Grid Matrix Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Top ambient colored lighting blurs */}
      <div 
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-[120px] opacity-15 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: currentTrack.color }}
      />
      <div 
        className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: '#4f46e5' }} // Purple accent
      />

      {/* Main Content Shell */}
      <main className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col justify-center">
        
        {/* Upper Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-cyan-500/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec4899] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ec4899]"></span>
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#8a8a9c] bg-slate-950 px-2 py-0.5 rounded border border-slate-900/60">
                  System Status: STABLE_V1.0.4
                </span>
              </div>

              <h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-widest text-cyan-400 mt-1 uppercase glitch-heading"
                data-text="NEON SYNTH-SNAKE"
              >
                NEON SYNTH-SNAKE
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-all cursor-pointer hover:border-slate-75 outline-none"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Dossier</span>
            </button>
            
            <div 
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all bg-slate-900/60"
              style={{ borderColor: activeTheme.primaryGlow }}
            >
              <Activity 
                className="w-3.5 h-3.5 animate-pulse transition-all duration-300" 
                style={{ 
                  color: currentTrack.color,
                  filter: `drop-shadow(0 0 6px ${currentTrack.color})`
                }} 
              />
              <span className="text-slate-350 select-none">SYNTH OSC: RECTIFIER</span>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Bento Matrix Grid Layout */}
        <div 
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch transition-all duration-150 ${
            isFoodPulseActive ? 'scale-[1.002]' : ''
          }`}
          style={{
            transformOrigin: 'center'
          }}
        >
          {/* LEFT CHASSIS: Music Player Deck (4 Columns on Desktop) */}
          <div className="lg:col-span-5 h-full">
            <MusicPlayer
              currentTheme={activeTheme}
              onTrackChange={(track) => setCurrentTrack(track)}
              onPlayingStateChange={(isPlaying) => setIsMusicPlaying(isPlaying)}
            />
          </div>

          {/* CENTER CHASSIS: Snake Game Grid Panel (5 Columns on Desktop) */}
          <div 
            className="lg:col-span-4 h-full relative"
          >
            {/* Visual Flash Trigger Surround */}
            <div 
              className="absolute -inset-0.5 rounded-2xl filter blur-xs opacity-0 transition-opacity duration-100 pointer-events-none"
              style={{
                backgroundColor: currentTrack.color,
                opacity: isFoodPulseActive ? 0.8 : 0,
                boxShadow: `0 0 20px ${currentTrack.color}`
              }}
            />
            
            <SnakeGame
              theme={activeTheme}
              onScoreChange={(score) => setGameScore(score)}
              onEatFood={handleEatFood}
            />
          </div>

          {/* RIGHT CHASSIS: System Telemetry Board (3 Columns on Desktop) */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full bg-slate-950/40 border border-slate-900 rounded-xl p-5 shadow-lg relative overflow-hidden">
            
            <div>
              {/* Card Header */}
              <div className="flex items-center space-x-2 border-b border-slate-900 pb-3 mb-4">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  Tactical Logs
                </span>
              </div>

              {/* Stats Indicators */}
              <div className="space-y-4">
                {/* Score panel */}
                <div className="bg-slate-900/30 border border-slate-900 rounded p-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Active Score</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-mono font-bold text-slate-100">{gameScore}</span>
                    <span className="text-[10px] font-mono text-emerald-450 uppercase">
                      +{gameScore * 10} pts
                    </span>
                  </div>
                </div>

                {/* Reactivity Logs */}
                <div className="bg-slate-900/30 border border-slate-900 rounded p-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Music Feedback</span>
                  <div className="mt-1.5 flex flex-col space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">Track:</span>
                      <span className="text-white font-semibold truncate max-w-[120px]">{currentTrack.title}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono mt-1">
                      <span className="text-slate-500">BPM Sync:</span>
                      <span className="text-slate-300 font-semibold">{currentTrack.bpm}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono mt-1">
                      <span className="text-slate-500">Audio Synth:</span>
                      <span className={`font-semibold ${isMusicPlaying ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isMusicPlaying ? 'ACTIVE' : 'IDLE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hotkeys Guideline lists */}
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block pl-1">
                    Control Console
                  </span>
                  
                  <div className="flex items-center space-x-2 text-xs bg-slate-900/40 p-2 rounded">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-indigo-400">WASD</kbd>
                    <span className="text-[#8a8a9c] font-sans text-[11px]">Navigate grids (snake movement)</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs bg-slate-900/40 p-2 rounded">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-indigo-400">Space</kbd>
                    <span className="text-[#8a8a9c] font-sans text-[11px]">Pause / Resume simulation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cabinet Quote / Aesthetic Details */}
            <div className="mt-8 pt-4 border-t border-slate-900/60">
              <div className="flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">Interactive Arcade Mode</span>
              </div>
              <p className="text-[10px] text-slate-600 font-sans mt-1.5 leading-relaxed">
                Notice: Sound synthesis operates completely in browser memory via local Web Audio APIs. No backend servers, cloud database dependencies or keys required.
              </p>
            </div>

          </div>
        </div>

      </main>

      {/* Footer Branding Line - Elegant & Minimal */}
      <footer className="w-full text-center py-4 border-t border-slate-950 bg-slate-950/60 mt-8">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          SYSTEM MATRIX 2026 // NEON SOUND GRID
        </p>
      </footer>

      {/* Modal Overlay / Dossier panel */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-950 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <h3 className="font-display font-bold text-lg text-white mb-3 tracking-wide uppercase">
                System Dossier
              </h3>
              
              <div className="space-y-4 font-sans text-xs text-slate-400 leading-relaxed">
                <div>
                  <h4 className="font-mono text-[11px] text-indigo-400 uppercase font-semibold mb-1">
                    1. Responsive Keyboard Controls
                  </h4>
                  <p>
                    Use standard gaming bindings like <code className="text-white px-1 font-mono">W / A / S / D</code> or tactile <code className="text-white px-1 font-mono">↑ / ↓ / ← / →</code> keys on your keyboard to instantly control the physical snake direction inside the grid dashboard. Press <code className="text-white px-1 font-mono">Spacebar</code> to toggle pause at any point in time.
                  </p>
                </div>

                <div>
                  <h4 className="font-mono text-[11px] text-indigo-400 uppercase font-semibold mb-1">
                    2. In-Browser Sound Synthesis
                  </h4>
                  <p>
                    This app uses completely real Web Audio API synthesizers instead of static empty mp3 wrappers. When you click play, a dual-sawtooth retro bass and triangle voice oscillator schedule patterns dynamically in microsecond timing!
                  </p>
                </div>

                <div>
                  <h4 className="font-mono text-[11px] text-indigo-400 uppercase font-semibold mb-1">
                    3. Theme Synced States
                  </h4>
                  <p>
                    When you skip or select different tracks on the subsequencer deck, the active theme colors automatically adapt! The canvas frequencies, D-Pad, neon highlights, and grid borders will morph in real-time.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="mt-6 w-full py-2 bg-slate-900 border border-slate-800 text-xs text-white font-mono rounded hover:bg-slate-800 cursor-pointer outline-none transition-all"
              >
                Close System Dossier
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
