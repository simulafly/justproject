/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameStats, GridPosition, ThemeConfig } from '../types';
import { globalSynth } from './SynthEngine';
import { Play, RotateCcw, Volume2, ShieldCheck, Zap, Award, Target } from 'lucide-react';

interface SnakeGameProps {
  theme: ThemeConfig;
  className?: string;
  onScoreChange?: (score: number) => void;
  onEatFood?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

const GRID_SIZE = 20; // Number of cells along x & y

export const SnakeGame: React.FC<SnakeGameProps> = ({
  theme,
  className = '',
  onScoreChange,
  onEatFood,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    foodEaten: 0,
    level: 1,
    isPlaying: false,
    isGameOver: false,
  });

  const [speedMode, setSpeedMode] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Game loop state refs to bypass frequent re-renderings of keyboard triggers
  const snakeRef = useRef<GridPosition[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const directionRef = useRef<GridPosition>({ x: 0, y: -1 }); // Default: moving UP
  const nextDirectionRef = useRef<GridPosition>({ x: 0, y: -1 });
  const foodRef = useRef<GridPosition>({ x: 5, y: 5 });
  const isSuperFoodRef = useRef<boolean>(false);
  const gameLoopRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef<number>(0);
  const highScoreRef = useRef<number>(0);

  // Load High Score from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('neon_snake_high_score');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          highScoreRef.current = parsed;
          setStats((prev) => ({ ...prev, highScore: parsed }));
        }
      }
    } catch (e) {
      console.warn('Failed to read high score from local storage', e);
    }
  }, []);

  // Update high score in local storage
  const saveHighScore = (score: number) => {
    try {
      localStorage.setItem('neon_snake_high_score', score.toString());
    } catch (e) {
      console.warn('Failed to store high score', e);
    }
  };

  // Generate random empty position for food
  const generateFoodPosition = useCallback((): GridPosition => {
    const snake = snakeRef.current;
    let newFood: GridPosition;
    let attempts = 0;

    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y) &&
      attempts < 100
    );

    return newFood;
  }, []);

  // Spawn explosion particles
  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    const cellPixels = canvasRef.current ? canvasRef.current.width / GRID_SIZE : 20;
    const px = x * cellPixels + cellPixels / 2;
    const py = y * cellPixels + cellPixels / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const life = Math.random() * 20 + 15;
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: Math.random() * 3 + 2,
        alpha: 1,
        life: life,
        maxLife: life,
      });
    }
  };

  // Sound triggering helper
  const playSfx = (type: 'eat' | 'crash' | 'high_score') => {
    globalSynth.triggerSfx(type);
  };

  // Restart Game
  const resetGame = () => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    directionRef.current = { x: 0, y: -1 };
    nextDirectionRef.current = { x: 0, y: -1 };
    scoreRef.current = 0;
    isSuperFoodRef.current = false;
    foodRef.current = generateFoodPosition();
    particlesRef.current = [];

    setStats((prev) => ({
      ...prev,
      score: 0,
      foodEaten: 0,
      level: 1,
      isPlaying: true,
      isGameOver: false,
    }));

    if (onScoreChange) onScoreChange(0);
  };

  // Keyboard controls handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = directionRef.current;
      let nextDir = { ...nextDirectionRef.current };

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dir.y === 0) nextDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dir.y === 0) nextDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dir.x === 0) nextDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dir.x === 0) nextDir = { x: 1, y: 0 };
          break;
        case ' ': // Space to Pause/Unpause
          e.preventDefault();
          setStats((prev) => {
            if (prev.isGameOver) {
              resetGame();
              return prev;
            }
            return { ...prev, isPlaying: !prev.isPlaying };
          });
          break;
        default:
          return; // Skip preventDefault
      }
      
      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      nextDirectionRef.current = nextDir;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generateFoodPosition, onScoreChange]);

  // Click controls for mobile / screen buttons
  const changeDirection = (x: number, y: number) => {
    const dir = directionRef.current;
    if (x !== 0 && dir.x === 0) {
      nextDirectionRef.current = { x, y: 0 };
    } else if (y !== 0 && dir.y === 0) {
      nextDirectionRef.current = { x: 0, y };
    }
  };

  // Main game tick calculations
  const updateGame = useCallback(() => {
    if (!stats.isPlaying || stats.isGameOver) return;

    // 1. Move direction
    directionRef.current = nextDirectionRef.current;
    const dir = directionRef.current;
    const snake = [...snakeRef.current];
    const head = snake[0];

    // Calculate next head position
    const nextHead: GridPosition = {
      x: head.x + dir.x,
      y: head.y + dir.y,
    };

    // 2. Wall collision (or Wrap grid optional, but standard wall death feels best for high stakes neon game!)
    if (
      nextHead.x < 0 ||
      nextHead.x >= GRID_SIZE ||
      nextHead.y < 0 ||
      nextHead.y >= GRID_SIZE
    ) {
      handleGameOver();
      return;
    }

    // 3. Snake self collision
    if (snake.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y)) {
      handleGameOver();
      return;
    }

    // Insert new head
    snake.unshift(nextHead);

    // 4. Check food collision
    const food = foodRef.current;
    if (nextHead.x === food.x && nextHead.y === food.y) {
      // Eat sound
      playSfx('eat');

      // Score logic: superfood gives triple score
      const points = isSuperFoodRef.current ? 30 : 10;
      const currentScore = scoreRef.current + points;
      scoreRef.current = currentScore;

      // Spawn custom particles
      const foodColor = isSuperFoodRef.current ? '#f43f5e' : theme.food || '#fbbf24';// rose vs theme-food
      spawnParticles(food.x, food.y, foodColor, isSuperFoodRef.current ? 18 : 10);

      // Trigger parents
      if (onScoreChange) onScoreChange(currentScore);
      if (onEatFood) onEatFood();

      // Spawn next food
      foodRef.current = generateFoodPosition();
      // Chance of next food being a glowing magenta Superfood (20%)
      isSuperFoodRef.current = Math.random() < 0.2;

      // Update statistics
      setStats((prev) => {
        const nextFoodEaten = prev.foodEaten + 1;
        const nextLevel = Math.floor(nextFoodEaten / 5) + 1;
        const reachedHighScore = currentScore > prev.highScore;

        if (reachedHighScore && prev.highScore > 0 && currentScore - points <= prev.highScore) {
          // Just breached high score sound!
          setTimeout(() => playSfx('high_score'), 100);
        }

        const nextHighScore = Math.max(prev.highScore, currentScore);
        if (reachedHighScore) {
          saveHighScore(nextHighScore);
        }

        return {
          ...prev,
          score: currentScore,
          foodEaten: nextFoodEaten,
          level: nextLevel,
          highScore: nextHighScore,
        };
      });
    } else {
      // Just step forward: slice tail
      snake.pop();
    }

    snakeRef.current = snake;
  }, [stats.isPlaying, stats.isGameOver, generateFoodPosition, onScoreChange, onEatFood, theme]);

  const handleGameOver = () => {
    playSfx('crash');
    setStats((prev) => ({
      ...prev,
      isPlaying: false,
      isGameOver: true,
    }));
  };

  // Game Speed mapping
  const getSpeedMs = (): number => {
    // Speed increases slightly based on levels!
    const baseSpeed =
      speedMode === 'easy' ? 160 : speedMode === 'medium' ? 110 : 75;
    // Speed up 5ms per level, capping at 40ms minimum acceleration
    return Math.max(40, baseSpeed - (stats.level - 1) * 6);
  };

  // Trigger game update loop
  useEffect(() => {
    let lastTime = 0;
    const speedMs = getSpeedMs();

    const loop = (time: number) => {
      if (!lastTime) lastTime = time;
      const progress = time - lastTime;

      if (progress >= speedMs) {
        updateGame();
        lastTime = time;
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    if (stats.isPlaying && !stats.isGameOver) {
      gameLoopRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [stats.isPlaying, stats.isGameOver, speedMode, updateGame, stats.level]);

  // Canvas visual rendering ticks (runs at fluid 60FPS for particle effects & animations)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cellSize = width / GRID_SIZE;

      // 1. Dark Neon Grid Background
      ctx.fillStyle = '#09090f';
      ctx.fillRect(0, 0, width, height);

      // Subtle grid lines with neon overlay
      ctx.strokeStyle = theme.gridLine || 'rgba(30, 41, 59, 0.3)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, height);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(width, i * cellSize);
        ctx.stroke();
      }

      // 2. Render Food
      const food = foodRef.current;
      const isSuper = isSuperFoodRef.current;
      const fRadius = cellSize / 2 - 2;
      const fx = food.x * cellSize + cellSize / 2;
      const fy = food.y * cellSize + cellSize / 2;

      ctx.save();
      ctx.shadowBlur = isSuper ? 16 : 8;
      ctx.shadowColor = isSuper ? '#f43f5e' : theme.food;
      ctx.fillStyle = isSuper ? '#f43f5e' : theme.food;

      ctx.beginPath();
      if (isSuper) {
        // Pulsing star or diamond for superfood
        const size = fRadius * (1.1 + Math.sin(Date.now() / 100) * 0.15);
        ctx.arc(fx, fy, size, 0, 2 * Math.PI);
      } else {
        // Normal pulsing ball
        const size = fRadius * (0.9 + Math.sin(Date.now() / 150) * 0.1);
        ctx.arc(fx, fy, size, 0, 2 * Math.PI);
      }
      ctx.fill();
      ctx.restore();

      // 3. Render Snake
      const snake = snakeRef.current;
      if (snake.length > 0) {
        // Draw neon connections/body
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.primaryGlow;
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = cellSize - 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        snake.forEach((segment, idx) => {
          const sx = segment.x * cellSize + cellSize / 2;
          const sy = segment.y * cellSize + cellSize / 2;
          if (idx === 0) {
            ctx.moveTo(sx, sy);
          } else {
            ctx.lineTo(sx, sy);
          }
        });
        ctx.stroke();
        ctx.restore();

        // Custom drawn Snake eyes and details on head
        const head = snake[0];
        const hx = head.x * cellSize + cellSize / 2;
        const hy = head.y * cellSize + cellSize / 2;
        const dir = directionRef.current;

        // Draw elegant glowing cockpit eye dots
        ctx.fillStyle = '#ffffff';
        const eyeOffset = cellSize * 0.22;
        ctx.beginPath();
        if (dir.x !== 0) {
          // Moving horizontally, draw eyes offset vertically
          ctx.arc(hx + dir.x * eyeOffset, hy - eyeOffset, 2.5, 0, 2 * Math.PI);
          ctx.arc(hx + dir.x * eyeOffset, hy + eyeOffset, 2.5, 0, 2 * Math.PI);
        } else {
          // Moving vertically, draw eyes offset horizontally
          ctx.arc(hx - eyeOffset, hy + dir.y * eyeOffset, 2.5, 0, 2 * Math.PI);
          ctx.arc(hx + eyeOffset, hy + dir.y * eyeOffset, 2.5, 0, 2 * Math.PI);
        }
        ctx.fill();
      }

      // 4. Render particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, p.life / p.maxLife);
        p.life -= 1;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [theme]);

  return (
    <div className={`flex flex-col h-full bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl shadow-black/60 ${className}`}>
      {/* Game Header Stats */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/60 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <Target 
            className="w-5 h-5 text-indigo-400 transition-all duration-350" 
            style={{ filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.95))' }}
          />
          <span className="font-mono text-sm uppercase text-slate-400">Score:</span>
          <span className="font-mono text-xl font-bold text-slate-100 transition-all">
            {stats.score}
          </span>
        </div>

        <div className="flex space-x-4">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-950/40 border border-slate-800/30">
            <Zap 
              className="w-3.5 h-3.5 transition-all duration-300 animate-pulse" 
              style={{ 
                color: theme.primary,
                filter: `drop-shadow(0 0 8px ${theme.primary})`
              }} 
            />
            <span className="text-xs font-mono text-slate-400">LVL {stats.level}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Award 
              className="w-4 h-4 text-amber-400 transition-all duration-300 animate-pulse" 
              style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.95))' }}
            />
            <span className="font-mono text-xs text-slate-400">HI:</span>
            <span className="font-mono text-sm font-semibold text-amber-400">{stats.highScore}</span>
          </div>
        </div>
      </div>

      {/* Main Screen Row */}
      <div className="relative flex-1 flex justify-center items-center bg-[#020205] p-4">
        {/* Playable Canvas Container with aspect ratio locked */}
        <div 
          className="relative w-full max-w-[400px] aspect-square rounded overflow-hidden border-4 bg-[#020205] transition-all duration-300"
          style={{ 
            borderColor: theme.primary, 
            boxShadow: `0 0 30px ${theme.primaryGlow}` 
          }}
        >
          {/* Authentic retro radial grid overlay */}
          <div className="absolute inset-0 radial-dots pointer-events-none opacity-20 z-10" />

          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            id="snakeCanvas"
            className="w-full h-full block relative z-0"
          />

          {/* OVERLAY: Welcome Start Screen */}
          {!stats.isPlaying && !stats.isGameOver && stats.score === 0 && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/90 backdrop-blur-xs p-6 text-center animate-fade-in">
              <div
                className="w-16 h-16 rounded-full border flex items-center justify-center mb-4 cursor-pointer scale-100 hover:scale-105 transition-all outline-none"
                style={{ borderColor: theme.primary, boxShadow: `0 0 15px ${theme.primaryGlow}` }}
                onClick={resetGame}
              >
                <Play 
                  className="w-8 h-8 ml-1 animate-pulse" 
                  style={{ 
                    color: theme.primary,
                    filter: `drop-shadow(0 0 10px ${theme.primary})`
                  }} 
                />
              </div>
              <h3 className="text-lg font-mono font-bold text-slate-100 tracking-wide uppercase">
                Neon Grid Snake
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-2 max-w-[240px]">
                Swipe, WASD, or Use Arrow Keys to navigate the grid. Eat food to speed up.
              </p>
              
              {/* Speed select */}
              <div className="flex justify-center space-x-2 mt-6">
                {(['easy', 'medium', 'hard'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSpeedMode(mode)}
                    className={`px-3 py-1 text-[10px] font-mono rounded-full border uppercase transition-all ${
                      speedMode === mode
                        ? 'bg-slate-800 text-white border-slate-500'
                        : 'bg-transparent text-slate-500 border-slate-800/50 hover:text-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* OVERLAY: Game Paused Screen */}
          {!stats.isPlaying && !stats.isGameOver && stats.score > 0 && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/80 backdrop-blur-xs text-center transition-all">
              <button
                onClick={() => setStats((prev) => ({ ...prev, isPlaying: true }))}
                className="px-6 py-2 rounded-full border font-mono text-sm tracking-widest uppercase transition-all flex items-center space-x-2 bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-100 cursor-pointer"
                style={{
                  boxShadow: `0 0 15px rgba(255,255,255,0.1)`
                }}
              >
                <Play className="w-4 h-4 fill-current text-white filter drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                <span>Resume</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono mt-2">
                Press Space bar to toggle
              </span>
            </div>
          )}

          {/* OVERLAY: Game Over Screen */}
          {stats.isGameOver && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/95 backdrop-blur-xs p-6 text-center animate-fade-in">
              <div className="text-rose-500 drop-shadow-[0_0_10px_#f43f5e] font-mono text-2xl font-black uppercase tracking-wider mb-2">
                Grid Collapsed
              </div>
              <p className="text-xs text-slate-400 font-mono mb-6">Simulation Terminated</p>

              <div className="grid grid-cols-2 gap-4 w-48 mb-8">
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40">
                  <div className="text-[9px] font-mono uppercase text-slate-500">Score</div>
                  <div className="text-lg font-mono font-bold text-slate-100">{stats.score}</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/40">
                  <div className="text-[9px] font-mono uppercase text-slate-500">Best</div>
                  <div className="text-lg font-mono font-bold text-amber-400">{stats.highScore}</div>
                </div>
              </div>

              <button
                onClick={resetGame}
                className="px-5 py-2 rounded-full border font-mono text-xs tracking-wider uppercase transition-all flex items-center space-x-2 hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderColor: theme.primary,
                  boxShadow: `0 0 15px ${theme.primaryGlow}`,
                  color: '#fff',
                }}
              >
                <RotateCcw 
                  className="w-3.5 h-3.5 animate-spin-slow" 
                  style={{ filter: `drop-shadow(0 0 4px ${theme.primary})` }}
                />
                <span>Reset Grid</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* D-PAD SCREEN ON-SCREEN CONTROLS FOR MOBILE/TABLET */}
      <div className="bg-slate-950 border-t border-slate-900 px-6 py-4 flex flex-col items-center">
        <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-2.5">
          Tactical D-Pad
        </div>
        <div className="grid grid-cols-3 gap-1.5 w-32 h-32">
          <div /> {/* Empty */}
          <button
            onClick={() => changeDirection(0, -1)}
            aria-label="Up"
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:bg-slate-800/40 transition-all outline-none"
          >
            ▲
          </button>
          <div /> {/* Empty */}
          <button
            onClick={() => changeDirection(-1, 0)}
            aria-label="Left"
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:bg-slate-800/40 transition-all outline-none"
          >
            ◀
          </button>
          <div className="flex items-center justify-center">
            {/* Center dot with reactive theme neon glow */}
            <span 
              className="w-2.5 h-2.5 rounded-full transition-all duration-300 animate-pulse" 
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 0 12px ${theme.primary}`,
                filter: `drop-shadow(0 0 4px ${theme.primary})`
              }}
            />
          </div>
          <button
            onClick={() => changeDirection(1, 0)}
            aria-label="Right"
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:bg-slate-800/40 transition-all outline-none"
          >
            ▶
          </button>
          <div /> {/* Empty */}
          <button
            onClick={() => changeDirection(0, 1)}
            aria-label="Down"
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:bg-slate-800/40 transition-all outline-none"
          >
            ▼
          </button>
          <div /> {/* Empty */}
        </div>
      </div>
    </div>
  );
};
