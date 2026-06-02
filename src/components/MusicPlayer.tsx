/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Track, ThemeConfig } from '../types';
import { globalSynth } from './SynthEngine';
import { Visualizer } from './Visualizer';
import { Play, Pause, SkipForward, Volume2, Music } from 'lucide-react';

interface MusicPlayerProps {
  currentTheme: ThemeConfig;
  onTrackChange?: (track: Track) => void;
  onPlayingStateChange?: (isPlaying: boolean) => void;
}

const TRACKS: Track[] = [
  {
    id: 'grid_runner',
    title: 'Grid Runner 2099',
    artist: 'AI Synthwave Sequencer',
    bpm: 118,
    genre: 'Retro Electro Synth',
    color: '#10b981', // Emerald
    description: 'A driving, fat sawtooth bass line paired with hi-frequency digital hats. Perfect for fast reflex grid runs.',
    notes: { bassSequence: [], leadSequence: [], scale: [] }
  },
  {
    id: 'neon_horizon',
    title: 'Neon Horizon',
    artist: 'AI Sunset Lounge',
    bpm: 96,
    genre: 'Chill Synthwave',
    color: '#06b6d4', // Cyan
    description: 'A warm resonant lowpass drone overlaid with a beautiful calming minor-chord arpeggio progression.',
    notes: { bassSequence: [], leadSequence: [], scale: [] }
  },
  {
    id: 'laser_fury',
    title: 'Laser Fury',
    artist: 'AI Cyberpunk Fight',
    bpm: 130,
    genre: 'Darksynth / Industrial',
    color: '#ec4899', // Pink
    description: 'High-octane industrial overdrive bass beat with double-time hats. High voltage synthwave chase.',
    notes: { bassSequence: [], leadSequence: [], scale: [] }
  }
];

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTheme,
  onTrackChange,
  onPlayingStateChange
}) => {
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4); // 40%
  const [visStyle, setVisStyle] = useState<'bars' | 'wave' | 'pulse'>('bars');
  const [activeStep, setActiveStep] = useState(0);

  const activeTrack = TRACKS[activeTrackIndex];

  // Callback from SynthEngine when steps trigger
  useEffect(() => {
    globalSynth.onStepChange = (step: number) => {
      setActiveStep(step);
    };

    // Clean up volume or sequencer on unmount
    return () => {
      globalSynth.onStepChange = null;
    };
  }, []);

  // Update Synth on states
  useEffect(() => {
    globalSynth.setVolume(volume);
  }, [volume]);

  // Handle Play/Pause
  const togglePlay = async () => {
    if (isPlaying) {
      globalSynth.pause();
      setIsPlaying(false);
      if (onPlayingStateChange) onPlayingStateChange(false);
    } else {
      await globalSynth.start(activeTrack.id);
      setIsPlaying(true);
      if (onPlayingStateChange) onPlayingStateChange(true);
    }
  };

  // Skip Tracks
  const handleSkip = async () => {
    const nextIdx = (activeTrackIndex + 1) % TRACKS.length;
    setActiveTrackIndex(nextIdx);
    const nextTrack = TRACKS[nextIdx];

    if (onTrackChange) {
      onTrackChange(nextTrack);
    }

    if (isPlaying) {
      // Audio Engine hot re-load sequence
      globalSynth.pause();
      setTimeout(async () => {
        await globalSynth.start(nextTrack.id);
      }, 50);
    }
  };

  // Direct Select Track
  const handleSelectTrack = async (index: number) => {
    if (index === activeTrackIndex) return;
    setActiveTrackIndex(index);
    const nextTrack = TRACKS[index];

    if (onTrackChange) {
      onTrackChange(nextTrack);
    }

    if (isPlaying) {
      globalSynth.pause();
      setTimeout(async () => {
        await globalSynth.start(nextTrack.id);
      }, 50);
    }
  };

  return (
    <div className="flex flex-col bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl p-6 h-full justify-between">
      
      {/* Header Panel */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
          <div className="flex items-center space-x-2">
            <Music 
              className="w-5 h-5 transition-all duration-300" 
              style={{ 
                color: activeTrack.color,
                filter: `drop-shadow(0 0 8px ${activeTrack.color})`
              }} 
            />
            <h3 className="font-mono text-sm uppercase text-slate-300 font-bold tracking-wide">
              Subsequence Deck
            </h3>
          </div>
          <div className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-400">
            Realtime Synthesis
          </div>
        </div>

        {/* Visualizer Frame */}
        <div className="mb-6 h-28">
          <Visualizer
            analyser={globalSynth.getAnalyser()}
            colour={activeTrack.color}
            style={visStyle}
            isPlaying={isPlaying}
          />
        </div>

        {/* Track detail info */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-lg p-4 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-sans font-semibold text-lg text-slate-100 leading-snug tracking-tight">
                {activeTrack.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {activeTrack.artist}
              </p>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase"
              style={{
                backgroundColor: `rgba(${hexToDecimalRgb(activeTrack.color)}, 0.1)`,
                color: activeTrack.color,
                border: `1px solid rgba(${hexToDecimalRgb(activeTrack.color)}, 0.2)`
              }}
            >
              {activeTrack.bpm} BPM
            </span>
          </div>

          <p className="text-xs text-slate-500 font-sans mt-3 line-clamp-2 leading-relaxed">
            {activeTrack.description}
          </p>
          
          {/* Audio Visualizer Style selector */}
          <div className="flex space-x-3 mt-4 pt-4 border-t border-slate-900/60">
            <span className="text-[10px] font-mono text-slate-600 self-center">VIS MODE:</span>
            {(['bars', 'wave', 'pulse'] as const).map((styleOpt) => (
              <button
                key={styleOpt}
                onClick={() => setVisStyle(styleOpt)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase transition-all border outline-none ${
                  visStyle === styleOpt
                    ? 'border-slate-700 bg-slate-800 text-slate-200'
                    : 'border-transparent text-slate-600 hover:text-slate-400'
                }`}
              >
                {styleOpt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Module and Steps */}
      <div>
        {/* Real-time Step Sequencer Lights Tracker */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-slate-500 tracking-wider">SEQUENCER STEP:</span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold">
              {(activeStep + 1).toString().padStart(2, '0')} / 16
            </span>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
            {Array.from({ length: 16 }).map((_, stepIdx) => {
              const pulseActive = isPlaying && activeStep === stepIdx;
              return (
                <div
                  key={stepIdx}
                  className="relative h-4 rounded-xs border transition-all duration-75"
                  style={{
                    backgroundColor: pulseActive 
                      ? activeTrack.color 
                      : stepIdx % 4 === 0 
                        ? 'rgba(30, 41, 59, 0.4)' 
                        : 'rgba(15, 23, 42, 0.2)',
                    borderColor: pulseActive 
                      ? '#fff' 
                      : stepIdx % 4 === 0 
                        ? 'rgba(71, 85, 105, 0.3)' 
                        : 'rgba(30, 41, 59, 0.15)',
                    boxShadow: pulseActive 
                      ? `0 0 8px ${activeTrack.color}` 
                      : 'none'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Volume controller */}
        <div className="flex items-center space-x-3 mb-6 bg-slate-900/20 p-2.5 rounded border border-slate-900/60">
          <Volume2 className="w-4 h-4 text-slate-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-current outline-none"
            style={{ color: activeTrack.color }}
          />
          <span className="text-[10px] font-mono w-6 text-right text-slate-500">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Deck controllers */}
        <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800/80 mb-5">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer outline-none"
              style={{
                backgroundColor: activeTrack.color,
                boxShadow: `0 0 12px ${activeTrack.color}`
              }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-slate-950 fill-current" />
              ) : (
                <Play className="w-5 h-5 text-slate-950 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={handleSkip}
              className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600 transition-all cursor-pointer outline-none"
              title="Next Synthesized Loop"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex space-x-2 text-right">
            <div className="text-[9px] font-mono uppercase text-slate-400">
              <div>Format</div>
              <div className="font-bold text-slate-300 text-xs mt-0.5">32-BIT FM</div>
            </div>
          </div>
        </div>

        {/* Sub Track select items */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 pl-1">
            Sequence Selector
          </div>
          {TRACKS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => handleSelectTrack(idx)}
              className={`w-full flex items-center justify-between p-2 rounded text-left transition-all text-xs font-mono border cursor-pointer outline-none ${
                activeTrackIndex === idx
                  ? 'bg-slate-900 border-slate-800/60 font-semibold'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span
                  className="w-2 h-2 rounded-full transition-all duration-300 animate-pulse"
                  style={{ 
                    backgroundColor: t.color,
                    boxShadow: `0 0 10px ${t.color}`,
                    filter: `drop-shadow(0 0 4px ${t.color})`
                  }}
                />
                <span className={activeTrackIndex === idx ? 'text-slate-150' : 'text-slate-500'}>
                  {t.title}
                </span>
              </div>
              <div className="text-[10px] text-slate-600">{t.bpm} BPM</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Internal RGB Convert helper
function hexToDecimalRgb(hex: string) {
  let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  let fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '16, 185, 129';
}
