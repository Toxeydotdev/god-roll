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
        // App is being hidden/backgrounded - only track if actually playing
        if (this.isPlaying && this.audio) {
          this._wasPlayingBeforeHidden = true;
          this.audio.pause();
          console.log(
            "[MusicManager] Paused for background, will resume when active"
          );
        }
      } else {
        // App is becoming visible again - only resume if we paused it
        if (
          this._wasPlayingBeforeHidden &&
          this._savedEnabledState &&
          this.audio
        ) {
          this._wasPlayingBeforeHidden = false;
          this.audio.play().catch(() => {
            // Autoplay blocked, will need user interaction
            console.log(
              "[MusicManager] Autoplay blocked after returning to tab"
            );
            this._pendingStart = true;
          });
        } else {
          // Clear the flag if user disabled music while backgrounded
          this._wasPlayingBeforeHidden = false;
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
      // Save the enabled state, not playing state (they can differ during transitions)
      localStorage.setItem(STORAGE_KEY, this._savedEnabledState.toString());
      localStorage.setItem(VOLUME_KEY, this._savedVolume.toString());
      console.log(
        "[MusicManager] Settings saved, enabled:",
        this._savedEnabledState
      );
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
    console.log("[MusicManager] Stop called, current state:", {
      isPlaying: this.isPlaying,
      isToggling: this._isToggling,
      savedEnabledState: this._savedEnabledState,
    });

    // Allow stopping even if not currently playing to clear saved state
    if (this._isToggling) {
      console.log("[MusicManager] Stop blocked - already toggling");
      return;
    }

    // Immediately mark as not playing and clear all resume flags
    this.isPlaying = false;
    this._savedEnabledState = false;
    this._wasPlayingBeforeHidden = false;
    this._pendingStart = false;

    // Save settings immediately before any async operations
    this.saveSettings();

    if (this.audio) {
      // On mobile, skip fade and stop immediately for reliability
      const isMobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        "ontouchstart" in window;

      if (isMobile) {
        // Immediate stop on mobile - more reliable
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.volume = this._savedVolume;
        console.log("[MusicManager] Music stopped immediately (mobile)");
      } else {
        // Fade out on desktop
        this._isToggling = true;
        const fadeOut = () => {
          if (this.audio && this.audio.volume > 0.05) {
            this.audio.volume = Math.max(0, this.audio.volume - 0.05);
            setTimeout(fadeOut, 50);
          } else if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.volume = this._savedVolume;
            this._isToggling = false;
            console.log("[MusicManager] Music stopped with fade (desktop)");
          }
        };
        fadeOut();
      }
    } else {
      console.log("[MusicManager] No audio element to stop");
    }
  }

  async toggle(): Promise<boolean> {
    console.log("[MusicManager] Toggle called, current state:", {
      isPlaying: this.isPlaying,
      isToggling: this._isToggling,
      savedEnabledState: this._savedEnabledState,
    });

    if (this._isToggling) {
      console.log("[MusicManager] Toggle blocked - already toggling");
      return this.isEnabled();
    }

    // Check actual desired state, not just playing state
    const shouldStop = this.isPlaying || this._savedEnabledState;
    console.log("[MusicManager] Should stop:", shouldStop);

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

  /**
   * Resume music playback if it was playing before being interrupted.
   * Called when app returns from background on mobile devices.
   * Only resumes if music was explicitly enabled and playing before backgrounding.
   */
  async resume(): Promise<void> {
    // Only resume if:
    // 1. Music was playing before being hidden, OR
    // 2. Music is supposed to be enabled (savedEnabledState) AND not currently playing
    // But never resume if the user explicitly stopped the music
    if (!this._savedEnabledState) {
      console.log("[MusicManager] Resume skipped - music is disabled");
      return;
    }

    if (this.isPlaying) {
      console.log("[MusicManager] Resume skipped - already playing");
      return;
    }

    if (this._wasPlayingBeforeHidden || this._savedEnabledState) {
      this._wasPlayingBeforeHidden = false;
      if (this.audio) {
        try {
          await this.audio.play();
          this.isPlaying = true;
          console.log("[MusicManager] Music resumed successfully");
        } catch (error) {
          console.log(
            "[MusicManager] Music resume blocked, waiting for interaction:",
            error
          );
          this._pendingStart = true;
        }
      } else if (this._savedEnabledState) {
        // Audio element doesn't exist yet, try to start fresh
        await this.start();
      }
    }
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
