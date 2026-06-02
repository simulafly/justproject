/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private filter: BiquadFilterNode | null = null;

  // Sequencing state
  private isPlaying: boolean = false;
  private currentTrackId: string = 'grid_runner';
  private currentStep: number = 0;
  private bpm: number = 115;
  private nextStepTime: number = 0;
  private schedulerTimerId: any = null;
  private stepDuration: number = 0.13; // Calculated from BPM

  // For visualizer update in React
  public onStepChange: ((step: number) => void) | null = null;

  // Scales & Tracks configuration
  // Scale in Hz: C2, G2, C3, Eb3, G3, Bb3, C4, Eb4, G4, Bb4, C5
  private scale: number[] = [
    65.41,   // C2 (0)
    98.00,   // G2 (1)
    130.81,  // C3 (2)
    155.56,  // Eb3 (3)
    196.00,  // G3 (4)
    233.08,  // Bb3 (5)
    261.63,  // C4 (6)
    311.13,  // Eb4 (7)
    392.00,  // G4 (8)
    466.16,  // Bb4 (9)
    523.25,  // C5 (10)
    587.33,  // D5 (11)
    622.25,  // Eb5 (12)
  ];

  // Sequence configurations (16 steps)
  private tracks: Record<string, {
    bpm: number;
    bass: number[];
    lead: (number | null)[];
    drums: { kick: boolean[]; snare: boolean[]; hat: boolean[] };
  }> = {
    grid_runner: {
      bpm: 118,
      bass: [2, 2, 5, 2, 4, 4, 6, 4, 3, 3, 5, 3, 2, 2, 5, 6],
      lead: [6, null, 8, null, 9, 10, 8, null, 7, null, 6, 8, 9, null, 8, null],
      drums: {
        kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:   [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
      }
    },
    neon_horizon: {
      bpm: 96,
      bass: [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 2, 2, 2, 2],
      lead: [8, 9, 10, null, 9, 8, null, 10, 11, null, 10, 8, 9, null, 8, null],
      drums: {
        kick:  [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hat:   [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, true]
      }
    },
    laser_fury: {
      bpm: 130,
      bass: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5, 5, 6, 6, 5, 4],
      lead: [10, 11, 10, 8, 10, 11, 12, null, 10, 8, 6, 8, 10, null, null, null],
      drums: {
        kick:  [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        snare: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true],
        hat:   [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
      }
    }
  };

  constructor() {
    // Left empty for lazy initialization
  }

  private initAudio() {
    if (this.ctx) return;

    try {
      // Standard constructor for AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('AudioContext is not supported in this browser.');
        return;
      }
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime); // Keep master volume decent

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      // Route: Synths -> Filter -> MasterGain -> Analyser -> Destination
      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch (error) {
      console.warn('AudioContext initialization failed or blocked by secure environment policies:', error);
      this.ctx = null;
      this.masterGain = null;
      this.analyser = null;
      this.filter = null;
    }
  }

  public setVolume(volume: number) {
    this.initAudio();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(volume * 0.4, this.ctx.currentTime);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initAudio();
    return this.analyser;
  }

  // Plays a synth note representing bass
  private playBass(noteFreq: number, time: number, duration: number) {
    if (!this.ctx || !this.filter) return;

    // Dual sawtooth oscillators for a fat neon bass line
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(noteFreq, time);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(noteFreq * 0.995, time); // detune slightly
    osc2.detune.setValueAtTime(-10, time);

    gainNode.gain.setValueAtTime(0.0, time);
    gainNode.gain.linearRampToValueAtTime(0.24, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.filter);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  // Plays a lead sound note (triangle wave with vibrato for retro wave feel)
  private playLead(noteFreq: number, time: number, duration: number) {
    if (!this.ctx || !this.filter) return;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(noteFreq, time);

    // LFO for retro vibrato feedback
    lfo.frequency.setValueAtTime(6.5, time); // 6.5Hz vibrato
    lfoGain.gain.setValueAtTime(8, time); // 8 cent vibrato depth

    gainNode.gain.setValueAtTime(0.0, time);
    gainNode.gain.linearRampToValueAtTime(0.18, time + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gainNode);
    gainNode.connect(this.filter);

    lfo.start(time);
    osc.start(time);

    lfo.stop(time + duration);
    osc.stop(time + duration);
  }

  // Synthesized Kick Drum (Sine swept frequency)
  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);

    gainNode.gain.setValueAtTime(0.4, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain); // Direct to master to bypass lowpass filter for sub punch

    osc.start(time);
    osc.stop(time + 0.16);
  }

  // Synthesized Snare Drum (White noise + short bandpass-filtered noise)
  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.15; // 150ms noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filterNode = this.ctx.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.value = 1000;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.20, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    noiseNode.start(time);
    noiseNode.stop(time + 0.15);
  }

  // Synthesized Hi-Hat (Filtered White noise, high frequency)
  private playHat(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.04; // 40ms short blip
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filterNode = this.ctx.createBiquadFilter();
    filterNode.type = 'highpass';
    filterNode.frequency.value = 8000;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.07, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    noiseNode.start(time);
    noiseNode.stop(time + 0.04);
  }

  // Action SFX scheduler: Eat food sound effect (Playful synthesizer arpeggio/chime)
  public triggerSfx(type: 'eat' | 'crash' | 'high_score') {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;

    if (type === 'eat') {
      // Rising retro coin chime
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      gainNode.gain.setValueAtTime(0.0, time);
      gainNode.gain.linearRampToValueAtTime(0.2, time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc1.frequency.setValueAtTime(523.25, time); // C5
      osc1.frequency.setValueAtTime(659.25, time + 0.05); // E5
      osc1.frequency.setValueAtTime(783.99, time + 0.10); // G5

      osc2.frequency.setValueAtTime(523.25 + 5, time); // Detuned C5
      osc2.frequency.setValueAtTime(659.25 + 5, time + 0.05);
      osc2.frequency.setValueAtTime(783.99 + 5, time + 0.10);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.16);
      osc2.stop(time + 0.16);
    } else if (type === 'crash') {
      // Distorted descending gaming noise explosion
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.4);

      gainNode.gain.setValueAtTime(0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.45);

      // Noise drum punch on top
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(180, time);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

      noise.connect(f);
      f.connect(g);
      g.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.3);
    } else if (type === 'high_score') {
      // Epic sci-fi alert rising octave chime
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, time); // A4
      osc.frequency.setValueAtTime(587.33, time + 0.08); // D5
      osc.frequency.setValueAtTime(739.99, time + 0.16); // F#5
      osc.frequency.setValueAtTime(880.00, time + 0.24); // A5

      gainNode.gain.setValueAtTime(0.0, time);
      gainNode.gain.linearRampToValueAtTime(0.18, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.42);
    }
  }

  // Sequencer loop scheduler
  private scheduler() {
    if (!this.ctx) return;
    
    while (this.nextStepTime < this.ctx.currentTime + 0.1) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    if (!this.ctx) return;
    
    const track = this.tracks[this.currentTrackId];
    this.bpm = track.bpm;
    this.stepDuration = 60.0 / this.bpm / 4.0; // 16th note step duration

    this.nextStepTime += this.stepDuration;
    
    // Callback to React to updates current active step index (0-15)
    if (this.onStepChange) {
      // Need to execute on normal tick (or post message) as scheduling runs forward
      const scheduledStep = this.currentStep;
      setTimeout(() => {
        if (this.isPlaying && this.onStepChange) {
          this.onStepChange(scheduledStep);
        }
      }, (this.nextStepTime - this.ctx!.currentTime) * 1000 - 20);
    }

    this.currentStep = (this.currentStep + 1) % 16;
  }

  // Schedules the synthesized sounds for the current beat step
  private scheduleStep(step: number, time: number) {
    const track = this.tracks[this.currentTrackId];
    if (!track) return;

    // 1. Kick Drum
    if (track.drums.kick[step]) {
      this.playKick(time);
    }

    // 2. Snare Drum
    if (track.drums.snare[step]) {
      this.playSnare(time);
    }

    // 3. Hi-Hats
    if (track.drums.hat[step]) {
      this.playHat(time);
    }

    // 4. Bass Line Synth
    const bassNoteIndex = track.bass[step];
    if (bassNoteIndex !== undefined && bassNoteIndex !== null) {
      const bassFreq = this.scale[bassNoteIndex] / 2; // Bass is 1 octave down
      this.playBass(bassFreq, time, this.stepDuration * 0.9);
    }

    // 5. Lead Melody Synth
    const leadNoteIndex = track.lead[step];
    if (leadNoteIndex !== undefined && leadNoteIndex !== null) {
      const leadFreq = this.scale[leadNoteIndex];
      this.playLead(leadFreq, time, this.stepDuration * 0.9);
    }
  }

  public async start(trackId: string) {
    this.initAudio();
    if (!this.ctx) return;

    // Resume AudioContext due to browser touch security autoplay policies 
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) {
      if (this.currentTrackId === trackId) {
        return; // Already playing this track
      } else {
        this.stopSequencer(); // Switch tracks
      }
    }

    this.currentTrackId = trackId;
    this.currentStep = 0;
    this.isPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.01;

    // Run scheduler timer loop every 35ms (high precision ahead scheduling)
    this.schedulerTimerId = setInterval(() => this.scheduler(), 35);
  }

  public pause() {
    this.stopSequencer();
  }

  private stopSequencer() {
    if (this.schedulerTimerId) {
      clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
    this.isPlaying = false;
  }

  public destroy() {
    this.stopSequencer();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrackId(): string {
    return this.currentTrackId;
  }
}

// Single active instance for our React system to prevent context overflows
export const globalSynth = new SynthEngine();
