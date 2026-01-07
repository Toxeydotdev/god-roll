/**
 * Sound Effects System for Dice Roller
 *
 * Uses Web Audio API with pre-recorded dice sounds for consistent
 * quality across all devices (desktop and mobile).
 */

import diceAudioUrl from "../../../assets/audio/dice-sound-40081.mp3";

export type SoundType = "diceHit" | "wallHit" | "diceRoll" | "gameOver" | "win";

interface SoundOptions {
  volume?: number;
  pitch?: number;
  duration?: number;
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.5;
  private diceHitBuffer: AudioBuffer | null = null;
  private activeSounds: number = 0;
  private readonly MAX_CONCURRENT_SOUNDS = 1;

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  init(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);

      // Load dice hit sound
      this.loadDiceHitSound();
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
      this.enabled = false;
    }
  }

  /**
   * Load dice hit audio file
   */
  private async loadDiceHitSound(): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(diceAudioUrl);
      const arrayBuffer = await response.arrayBuffer();
      this.diceHitBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn("Failed to load dice sound:", error);
    }
  }

  /**
   * Resume audio context if suspended (required after user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  /**
   * Enable or disable all sounds
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if sound is enabled and ready
   */
  isReady(): boolean {
    return this.enabled && this.audioContext !== null;
  }

  /**
   * Play a dice hitting the floor/table sound
   * Uses pre-loaded audio file for consistent quality across all devices
   */
  playDiceHit(options: SoundOptions = {}): void {
    if (!this.isReady()) return;

    // Limit concurrent sounds to prevent audio overload
    if (this.activeSounds >= this.MAX_CONCURRENT_SOUNDS) return;

    const { volume = 0.6, pitch = 1 } = options;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Use loaded audio file if available
    if (this.diceHitBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = this.diceHitBuffer;

      // Apply pitch variation
      source.playbackRate.value = pitch;

      // Apply volume
      const gain = ctx.createGain();
      gain.gain.value = volume;

      source.connect(gain);
      gain.connect(this.masterGain!);

      // Track active sounds
      this.activeSounds++;
      source.onended = () => {
        this.activeSounds--;
      };

      // Start 0.05s into the audio to skip silence, play for 0.3s
      const offset = 0.05;
      const duration = 0.3;
      source.start(now, offset, duration);
    } else {
      // Fallback to simple procedural sound if audio file not loaded
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  /**
   * Play a dice hitting wall/rail sound
   * Uses the same audio file with higher pitch for variation
   */
  playWallHit(options: SoundOptions = {}): void {
    if (!this.isReady()) return;

    // Limit concurrent sounds
    if (this.activeSounds >= this.MAX_CONCURRENT_SOUNDS) return;

    const { volume = 0.4, pitch = 1 } = options;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Use loaded audio file with higher pitch if available
    if (this.diceHitBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = this.diceHitBuffer;

      // Higher pitch for wall hits
      source.playbackRate.value = pitch * 1.3;

      const gain = ctx.createGain();
      gain.gain.value = volume;

      source.connect(gain);
      gain.connect(this.masterGain!);

      // Track active sounds
      this.activeSounds++;
      source.onended = () => {
        this.activeSounds--;
      };

      // Start 0.05s into the audio, play for 0.2s (shorter for wall hits)
      const offset = 0.05;
      const duration = 0.2;
      source.start(now, offset, duration);
    } else {
      // Fallback to procedural sound
      const duration = 0.08;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 180 * pitch;
      osc.frequency.exponentialRampToValueAtTime(80 * pitch, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + duration);
    }
  }

  /**
   * Play dice rolling/tumbling sound
   * Series of small clicks and rattles
   */
  playDiceRoll(options: SoundOptions = {}): void {
    if (!this.isReady()) return;

    const { volume = 0.3, duration = 0.5 } = options;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Create a series of small "ticks" for rolling
    const numTicks = Math.floor(8 + Math.random() * 4);
    for (let i = 0; i < numTicks; i++) {
      const tickTime =
        now + (i / numTicks) * duration * (0.5 + Math.random() * 0.5);
      const tickVolume =
        volume * (0.3 + Math.random() * 0.7) * (1 - i / numTicks);

      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 800 + Math.random() * 400;

      const tickGain = ctx.createGain();
      tickGain.gain.setValueAtTime(tickVolume, tickTime);
      tickGain.gain.exponentialRampToValueAtTime(0.001, tickTime + 0.02);

      osc.connect(tickGain);
      tickGain.connect(this.masterGain!);

      osc.start(tickTime);
      osc.stop(tickTime + 0.02);
    }
  }

  /**
   * Play game over sound (sad trombone-ish)
   */
  playGameOver(options: SoundOptions = {}): void {
    if (!this.isReady()) return;

    const { volume = 0.5 } = options;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Descending notes
    const notes = [392, 370, 349, 294]; // G4, F#4, F4, D4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const startTime = now + i * 0.2;
      gain.gain.setValueAtTime(volume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      // Low-pass filter for softer sound
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  /**
   * Play success/win sound
   */
  playWin(options: SoundOptions = {}): void {
    if (!this.isReady()) return;

    const { volume = 0.4 } = options;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Ascending cheerful notes
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const startTime = now + i * 0.1;
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  /**
   * Play a sound based on impact velocity
   * Higher velocity = louder and higher pitched
   */
  playImpact(velocity: number, type: "floor" | "wall" = "floor"): void {
    const normalizedVelocity = Math.min(Math.abs(velocity) / 10, 1);

    if (normalizedVelocity < 0.05) return; // Too quiet to bother

    const volume = 0.2 + normalizedVelocity * 0.6;
    const pitch = 0.8 + normalizedVelocity * 0.4;

    if (type === "floor") {
      this.playDiceHit({ volume, pitch });
    } else {
      this.playWallHit({ volume, pitch });
    }
  }

  /**
   * Clean up audio context
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Export the class for testing
export { SoundManager };

// Storage key for sound preferences
export const SOUND_ENABLED_KEY = "godroll_sound_enabled_v1";
export const SOUND_VOLUME_KEY = "godroll_sound_volume_v1";

/**
 * Get saved sound enabled preference
 */
export function getSoundEnabled(): boolean {
  try {
    const saved = localStorage.getItem(SOUND_ENABLED_KEY);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

/**
 * Save sound enabled preference
 */
export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    soundManager.setEnabled(enabled);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get saved volume preference
 */
export function getSoundVolume(): number {
  try {
    const saved = localStorage.getItem(SOUND_VOLUME_KEY);
    return saved === null ? 0.5 : parseFloat(saved);
  } catch {
    return 0.5;
  }
}

/**
 * Save volume preference
 */
export function setSoundVolume(volume: number): void {
  try {
    localStorage.setItem(SOUND_VOLUME_KEY, String(volume));
    soundManager.setVolume(volume);
  } catch {
    // Ignore localStorage errors
  }
}
