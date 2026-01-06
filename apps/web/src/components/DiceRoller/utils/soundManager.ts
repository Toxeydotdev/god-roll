/**
 * Sound Effects System for Dice Roller
 *
 * Uses Web Audio API for low-latency, procedurally generated sounds
 * that simulate dice rolling and hitting surfaces.
 */

export type SoundType = "diceHit" | "wallHit" | "diceRoll" | "gameOver" | "win";

interface SoundOptions {
  volume?: number;
  pitch?: number;
  duration?: number;
}

interface AudioSample {
  buffer: AudioBuffer;
  name: string;
}

interface PlaySampleOptions {
  volume?: number;
  playbackRate?: number;
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.5;
  private samples: Map<string, AudioSample> = new Map();
  private lastImpactTime: number = 0;
  private minImpactInterval: number = 0.05; // Minimum interval between impact sounds (seconds)
  private maxConcurrentSounds: number = 3; // Limit to 3 concurrent impact sounds
  private soundEndTimes: number[] = []; // Track when active sounds will end
  
  // Sound durations in seconds
  private readonly floorHitDuration: number = 0.15;
  private readonly wallHitDuration: number = 0.08;

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
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
      this.enabled = false;
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
   * Simulates the thud of a die landing on felt with more realistic frequencies
   */
  playDiceHit(options: SoundOptions = {}): void {
    if (!this.isReady()) return;

    const { volume = 0.6, pitch = 1, duration = this.floorHitDuration } = options;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Create a short "thud" sound using filtered noise
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate noise with slower exponential decay for more body
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 8); // Slower decay for warmer sound
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Lower low-pass filter for realistic thud (80-200Hz range)
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180 * pitch; // Lowered from 400Hz
    filter.Q.value = 1;

    // Add low-frequency body layer for tactile feel
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = "sine"; // Sine wave for warmth
    bodyOsc.frequency.value = 100 * pitch; // Low thud frequency

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(volume * 0.3, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.5);

    // Gain for this specific sound
    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    bodyOsc.connect(bodyGain);
    gain.connect(this.masterGain!);
    bodyGain.connect(this.masterGain!);

    source.start(now);
    source.stop(now + duration);
    bodyOsc.start(now);
    bodyOsc.stop(now + duration * 1.5);
  }

  /**
   * Play a dice hitting wall/rail sound
   * Higher pitched "clack" sound with sine wave for warmth
   */
  playWallHit(options: SoundOptions = {}): void {
    if (!this.isReady()) return;

    const { volume = 0.4, pitch = 1, duration = this.wallHitDuration } = options;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Create oscillator for the "clack" using sine for warmer tone
    const osc = ctx.createOscillator();
    osc.type = "sine"; // Changed from square for warmer sound
    osc.frequency.value = 120 * pitch; // Lowered from 180Hz

    // Quick pitch drop for impact feel
    osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + duration); // Adjusted range

    // Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Add some noise for texture
    const noiseBuffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate
    );
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      const t = i / noiseBuffer.length;
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.3;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = volume * 0.5;

    // High-pass filter for the "click"
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 500;

    osc.connect(gain);
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    gain.connect(this.masterGain!);
    noiseGain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  /**
   * Play dice rolling/tumbling sound
   * Series of small clicks and rattles with warmer sine waves
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
      osc.type = "sine"; // Changed from triangle for warmer tone
      osc.frequency.value = 250 + Math.random() * 200; // Lowered from 800-1200Hz

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
   * Implements throttling to prevent audio clutter with multiple dice
   */
  playImpact(velocity: number, type: "floor" | "wall" = "floor"): void {
    if (!this.isReady()) return;

    const normalizedVelocity = Math.min(Math.abs(velocity) / 10, 1);

    // Filter out very quiet impacts
    if (normalizedVelocity < 0.05) return;

    const now = this.audioContext!.currentTime;

    // Clean up expired sounds from tracking array
    this.soundEndTimes = this.soundEndTimes.filter((endTime) => endTime > now);

    // Throttle impact sounds to prevent clutter
    // Only play if enough time has passed AND we're under the concurrent limit
    if (
      now - this.lastImpactTime < this.minImpactInterval ||
      this.soundEndTimes.length >= this.maxConcurrentSounds
    ) {
      return;
    }

    this.lastImpactTime = now;
    const soundDuration = type === "floor" ? this.floorHitDuration : this.wallHitDuration;
    this.soundEndTimes.push(now + soundDuration);

    const volume = 0.2 + normalizedVelocity * 0.6;
    const pitch = 0.8 + normalizedVelocity * 0.4;

    if (type === "floor") {
      this.playDiceHit({ volume, pitch });
    } else {
      this.playWallHit({ volume, pitch });
    }
  }

  /**
   * Load an audio sample from a URL
   * @param name - Unique identifier for this sample
   * @param url - URL to the audio file (MP3, WAV, etc.)
   * @returns Promise that resolves when sample is loaded
   */
  async loadSample(name: string, url: string): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized. Call init() first.");
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.samples.set(name, { buffer: audioBuffer, name });
    } catch (error) {
      console.error(`Failed to load audio sample "${name}":`, error);
      throw error;
    }
  }

  /**
   * Play a loaded audio sample
   * @param name - Name of the sample to play (must be loaded first)
   * @param options - Playback options (volume, playback rate)
   */
  playSample(name: string, options: PlaySampleOptions = {}): void {
    if (!this.isReady()) return;

    const sample = this.samples.get(name);
    if (!sample) {
      console.warn(`Audio sample "${name}" not found. Load it first with loadSample().`);
      return;
    }

    const { volume = 1, playbackRate = 1 } = options;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = playbackRate;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(this.masterGain!);

    source.start(now);
  }

  /**
   * Check if a sample is loaded
   * @param name - Name of the sample to check
   * @returns true if the sample is loaded
   */
  hasSample(name: string): boolean {
    return this.samples.has(name);
  }

  /**
   * Unload a sample from memory
   * @param name - Name of the sample to unload
   */
  unloadSample(name: string): void {
    this.samples.delete(name);
  }

  /**
   * Clean up audio context
   */
  dispose(): void {
    this.samples.clear();
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
