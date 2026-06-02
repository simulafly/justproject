/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  colour: string; // Tailwind color hex or keyword (e.g. '#10b981', '#ec4899')
  isPlaying: boolean;
  style?: 'bars' | 'wave' | 'pulse';
}

export const Visualizer: React.FC<VisualizerProps> = ({
  analyser,
  colour,
  isPlaying,
  style = 'bars'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use ResizeObserver for responsive sizing
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(canvas);
    handleResize();

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    // Track a slow pulse value if not active to simulate breathing
    let idleAngle = 0;

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // 1. Draw sleek semi-transparent black background to create motion trail blur
      ctx.fillStyle = 'rgba(10, 10, 18, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // Get audio data
      if (analyser && isPlaying) {
        if (style === 'wave') {
          analyser.getByteTimeDomainData(dataArray);
        } else {
          analyser.getByteFrequencyData(dataArray);
        }
      } else {
        // Create nice glowing simulated waveforms or sine bars when music is paused
        idleAngle += 0.04;
        for (let i = 0; i < bufferLength; i++) {
          if (style === 'wave') {
            dataArray[i] = 128 + Math.sin(idleAngle + i * 0.15) * 20;
          } else {
            // Simulated breathing frequency peaks
            const distFromCenter = Math.abs(i - bufferLength / 2) / (bufferLength / 2);
            dataArray[i] = Math.max(0, (Math.sin(idleAngle + i * 0.1) * 30 + 35) * (1 - distFromCenter));
          }
        }
      }

      // Neon style setup
      ctx.shadowBlur = 12;
      ctx.shadowColor = colour;
      ctx.strokeStyle = colour;
      ctx.fillStyle = colour;
      ctx.lineWidth = 2.5;

      if (style === 'bars') {
        // DRAW BARS
        const barWidth = (width / bufferLength) * 1.6;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = Math.max(4, percent * (height - 15));

          // Draw a rounded-corner neon bar
          ctx.fillStyle = `rgba(${hexToRgb(colour)}, ${0.15 + percent * 0.75})`;
          ctx.strokeStyle = colour;
          ctx.shadowColor = colour;
          ctx.shadowBlur = percent > 0.4 ? 14 : 4;

          // Draw neon outline block or vertical pill
          drawRoundedRect(
            ctx,
            x,
            height - barHeight - 4,
            barWidth - 2,
            barHeight,
            3
          );
          
          x += barWidth;
          if (x > width) break;
        }
      } else if (style === 'wave') {
        // DRAW STREAMING LASER OSCILLOSCOPE WAVE
        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (style === 'pulse') {
        // DRAW ANALOG PULSE CIRCLE
        const centerX = width / 2;
        const centerY = height / 2;
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const radius = Math.min(width, height) * 0.2 + (avg / 255) * 45;

        // Draw glowing circular ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = colour;
        ctx.stroke();

        // Secondary inner glowing circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(5, radius - 15), 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${hexToRgb(colour)}, 0.15)`;
        ctx.fill();

        // Orbit particles based on audio peaks
        const numParticles = 8;
        for (let i = 0; i < numParticles; i++) {
          const angle = (i / numParticles) * Math.PI * 2 + idleAngle;
          const offset = (dataArray[i * 4] || 0) * 0.15;
          const px = centerX + Math.cos(angle) * (radius + 20 + offset);
          const py = centerY + Math.sin(angle) * (radius + 20 + offset);

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, 2 * Math.PI);
          ctx.fillStyle = colour;
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0; // Reset
      animationRef.current = requestAnimationFrame(render);
    };

    // Helper functions
    function drawRoundedRect(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
      c.fill();
      c.stroke();
    }

    function hexToRgb(hex: string) {
      let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      let fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '16, 185, 129'; // default emerald green
    }

    render();

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, colour, style, isPlaying]);

  return (
    <div className="relative w-full h-full min-h-[90px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950/60 p-1">
      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />
      <div className="absolute top-2 right-2 flex space-x-1.5 opacity-60">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" style={{ color: colour }} />
        <span className="text-[10px] font-mono text-slate-400 capitalize">{style} mode</span>
      </div>
    </div>
  );
};
