/**
 * Music Manager - Procedural lofi/zen background music generator
 *
 * Generates ambient, relaxing background music using Web Audio API
 * Features:
 * - Soft synth pads with chord progressions
 * - Subtle bass line
 * - Gentle ambient textures
 * - Random variations for organic feel
 */

const STORAGE_KEY = "godroll_music_enabled_v1";
const VOLUME_KEY = "godroll_music_volume_v1";

class MusicManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private scheduledNotes: number[] = [];
  private nextNoteTime = 0;
  private lookahead = 25.0; // ms
  private scheduleAheadTime = 0.1; // seconds
  private tempo = 70; // BPM - slow and relaxing
  private noteLength = 0.5;
  private currentChordIndex = 0;
  private animationFrameId: number | null = null;
  private _savedEnabledState = false; // Track what was saved in localStorage
  private _isToggling = false; // Prevent rapid toggle issues
  private _pendingStart = false; // Track if we're waiting to start
  private _savedVolume = 0.15; // Default volume - must be initialized before loadSettings

  // Lofi chord progression (I-V-vi-IV in C major) - transposed down one octave
  private chordProgression = [
    [130.81, 164.81, 196.0], // C major (C-E-G) - lower octave
    [196.0, 246.94, 293.66], // G major (G-B-D) - lower octave
    [220.0, 261.63, 329.63], // A minor (A-C-E) - lower octave
    [174.61, 220.0, 261.63], // F major (F-A-C) - lower octave
  ];

  // Bass notes (root notes of chords) - two octaves lower
  private bassNotes = [65.41, 98.0, 110.0, 87.31]; // C, G, A, F (two octaves lower)

  constructor() {
    // Defer loadSettings to ensure all properties are initialized
    // and to handle iOS Capacitor environment properly
    if (typeof window !== "undefined") {
      // Use setTimeout to defer localStorage access until after DOM is ready
      setTimeout(() => this.loadSettings(), 0);
    }
  }

  private loadSettings(): void {
    try {
      // Extra safety check for iOS/Capacitor
      if (typeof localStorage === "undefined") {
        return;
      }

      const enabled = localStorage.getItem(STORAGE_KEY);
      const volume = localStorage.getItem(VOLUME_KEY);

      this._savedEnabledState = enabled === "true";

      if (this._savedEnabledState) {
        // Mark as pending start - will be started on first user interaction
        this._pendingStart = true;
      }

      if (volume) {
        // Store volume for later when masterGain is created
        this._savedVolume = parseFloat(volume);
      }
    } catch {
      // localStorage not available - silently ignore
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.isPlaying.toString());
      if (this.masterGain) {
        localStorage.setItem(VOLUME_KEY, this.masterGain.gain.value.toString());
      }
    } catch {
      // localStorage not available
    }
  }

  private initAudioContext(): void {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this._savedVolume; // Use saved volume
    this.masterGain.connect(this.audioContext.destination);

    // Resume context on user interaction (browser autoplay policy)
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  private createSynthNote(
    frequency: number,
    duration: number,
    startTime: number,
    type: "pad" | "bass" = "pad"
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Soft waveforms for lofi feel
    osc.type = type === "bass" ? "sine" : "triangle";
    osc.frequency.value = frequency;

    // Soft low-pass filter for warmth
    filter.type = "lowpass";
    filter.frequency.value = type === "bass" ? 400 : 1200;
    filter.Q.value = 1;

    // Connect nodes
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Envelope (soft attack and release for smooth sound)
    const attackTime = type === "bass" ? 0.05 : 0.15;
    const releaseTime = type === "bass" ? 0.3 : 0.5;
    const peakGain = type === "bass" ? 0.2 : 0.15;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attackTime);
    gainNode.gain.setValueAtTime(peakGain, startTime + duration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private scheduler(): void {
    if (!this.audioContext) return;

    while (
      this.nextNoteTime <
      this.audioContext.currentTime + this.scheduleAheadTime
    ) {
      this.scheduleNote(this.nextNoteTime);

      // Advance time by one beat
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += secondsPerBeat;
    }

    if (this.isPlaying) {
      this.animationFrameId = requestAnimationFrame(() => this.scheduler());
    }
  }

  private scheduleNote(time: number): void {
    const chord = this.chordProgression[this.currentChordIndex];
    const bassNote = this.bassNotes[this.currentChordIndex];

    // Play chord notes with slight variation in timing for organic feel
    chord.forEach((freq, _i) => {
      const offset = Math.random() * 0.02; // Slight humanization
      this.createSynthNote(freq, this.noteLength * 4, time + offset, "pad");
    });

    // Play bass note every 2 beats
    if (Math.random() > 0.5) {
      this.createSynthNote(bassNote, this.noteLength * 2, time, "bass");
    }

    // Move to next chord every 2 beats
    if (Math.random() > 0.5) {
      this.currentChordIndex =
        (this.currentChordIndex + 1) % this.chordProgression.length;
    }
  }

  /**
   * Try to start music if it was previously enabled (called on user interaction)
   */
  tryAutoStart(): void {
    if (this._pendingStart && !this.isPlaying) {
      this._pendingStart = false;
      this.start();
    }
  }

  start(): void {
    if (this.isPlaying || this._isToggling) return;

    this._isToggling = true;
    this._pendingStart = false;

    try {
      this.initAudioContext();

      if (!this.audioContext) {
        this._isToggling = false;
        return;
      }

      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      this.isPlaying = true;
      this._savedEnabledState = true;
      this.nextNoteTime = this.audioContext.currentTime + 0.05;
      this.scheduler();
      this.saveSettings();
    } finally {
      this._isToggling = false;
    }
  }

  stop(): void {
    if (!this.isPlaying || this._isToggling) return;

    this._isToggling = true;

    try {
      this.isPlaying = false;
      this._savedEnabledState = false;

      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // Fade out
      if (this.masterGain && this.audioContext) {
        this.masterGain.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + 0.5
        );

        setTimeout(() => {
          if (this.masterGain) {
            this.masterGain.gain.value = this._savedVolume;
          }
        }, 500);
      }

      this.saveSettings();
    } finally {
      this._isToggling = false;
    }
  }

  toggle(): boolean {
    if (this._isToggling) {
      // Return current state if already toggling
      return this.isPlaying;
    }

    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  /**
   * Returns whether music is currently enabled.
   * This returns the saved preference if music hasn't started yet,
   * ensuring UI shows correct state on app load.
   */
  isEnabled(): boolean {
    return this.isPlaying || this._savedEnabledState;
  }

  /**
   * Returns actual playing state (for internal use)
   */
  isActuallyPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this._savedVolume = clampedVolume;
    if (this.masterGain) {
      this.masterGain.gain.value = clampedVolume;
      this.saveSettings();
    }
  }
}

// Singleton instance
export const musicManager = new MusicManager();
