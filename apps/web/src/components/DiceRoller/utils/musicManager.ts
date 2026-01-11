/**
 * Music Manager - Background music player
 *
 * Plays lofi background music on loop using an MP3 file
 */

import musicFile from "@/assets/audio/good-night-lofi-cozy-chill-music-160166.mp3";

const STORAGE_KEY = "godroll_music_enabled_v1";
const VOLUME_KEY = "godroll_music_volume_v1";

class MusicManager {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private _savedEnabledState = false;
  private _isToggling = false;
  private _pendingStart = false;
  private _savedVolume = 0.15; // Default volume
  private _wasPlayingBeforeHidden = false;

  constructor() {
    if (typeof window !== "undefined") {
      setTimeout(() => this.loadSettings(), 0);
      this.setupVisibilityListener();
    }
  }

  /**
   * Setup listener for page visibility changes to pause/resume music
   */
  private setupVisibilityListener(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // App is being hidden/backgrounded
        if (this.isPlaying && this.audio) {
          this._wasPlayingBeforeHidden = true;
          this.audio.pause();
        }
      } else {
        // App is becoming visible again
        if (this._wasPlayingBeforeHidden && this.audio) {
          this._wasPlayingBeforeHidden = false;
          this.audio.play().catch(() => {
            // Autoplay blocked, will need user interaction
            console.log("Music autoplay blocked after returning to tab");
          });
        }
      }
    });
  }

  private loadSettings(): void {
    try {
      if (typeof localStorage === "undefined") {
        return;
      }

      const enabled = localStorage.getItem(STORAGE_KEY);
      const volume = localStorage.getItem(VOLUME_KEY);

      this._savedEnabledState = enabled === "true";

      if (this._savedEnabledState) {
        this._pendingStart = true;
      }

      if (volume) {
        this._savedVolume = parseFloat(volume);
      }
    } catch {
      // localStorage not available
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.isPlaying.toString());
      localStorage.setItem(VOLUME_KEY, this._savedVolume.toString());
    } catch {
      // localStorage not available
    }
  }

  private initAudio(): void {
    if (this.audio) return;

    this.audio = new Audio(musicFile);
    this.audio.loop = true;
    this.audio.volume = this._savedVolume;

    // Handle audio errors gracefully
    this.audio.addEventListener("error", (e) => {
      console.error("Music playback error:", e);
      this.isPlaying = false;
    });
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

  async start(): Promise<void> {
    if (this.isPlaying || this._isToggling) return;

    this._isToggling = true;
    this._pendingStart = false;

    try {
      this.initAudio();

      if (!this.audio) {
        this._isToggling = false;
        return;
      }

      // Set volume before playing
      this.audio.volume = this._savedVolume;

      try {
        await this.audio.play();
        this.isPlaying = true;
        this._savedEnabledState = true;
        this.saveSettings();
      } catch {
        // Autoplay was blocked - will retry on user interaction
        console.log("Music autoplay blocked, will retry on interaction");
        this._pendingStart = true;
      }
    } finally {
      this._isToggling = false;
    }
  }

  stop(): void {
    // Allow stopping even if not currently playing to clear saved state
    if (this._isToggling) return;

    this._isToggling = true;

    try {
      this.isPlaying = false;
      this._savedEnabledState = false;

      if (this.audio) {
        // Fade out
        const fadeOut = () => {
          if (this.audio && this.audio.volume > 0.05) {
            this.audio.volume = Math.max(0, this.audio.volume - 0.05);
            setTimeout(fadeOut, 50);
          } else if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.volume = this._savedVolume;
          }
        };
        fadeOut();
      }

      this.saveSettings();
    } finally {
      this._isToggling = false;
    }
  }

  async toggle(): Promise<boolean> {
    if (this._isToggling) {
      return this.isEnabled();
    }

    // Check actual desired state, not just playing state
    const shouldStop = this.isPlaying || this._savedEnabledState;

    if (shouldStop) {
      this.stop();
      return false;
    } else {
      await this.start();
      return this.isPlaying;
    }
  }

  /**
   * Returns whether music is currently enabled.
   */
  isEnabled(): boolean {
    return this.isPlaying || this._savedEnabledState;
  }

  /**
   * Returns actual playing state
   */
  isActuallyPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this._savedVolume = clampedVolume;
    if (this.audio) {
      this.audio.volume = clampedVolume;
    }
    this.saveSettings();
  }

  getVolume(): number {
    return this._savedVolume;
  }
}

// Singleton instance
export const musicManager = new MusicManager();
