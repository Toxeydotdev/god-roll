/**
 * Music Manager - Background music player using Howler.js
 *
 * Howler.js handles all the browser quirks:
 * - Auto-unlocks audio on mobile (touch/click)
 * - Web Audio API with HTML5 fallback
 * - Visibility/focus handling
 */

import musicFile from "@/assets/audio/good-night-lofi-cozy-chill-music-160166.mp3";
import { Howl } from "howler";

const STORAGE_KEY = "godroll_music_enabled_v1";
const VOLUME_KEY = "godroll_music_volume_v1";

class MusicManager {
  private sound: Howl | null = null;
  private _enabled = false;
  private _volume = 0.15;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSettings();
    }
  }

  private loadSettings(): void {
    try {
      const enabled = localStorage.getItem(STORAGE_KEY);
      const volume = localStorage.getItem(VOLUME_KEY);

      this._enabled = enabled === "true";
      if (volume) {
        this._volume = parseFloat(volume);
      }
    } catch {
      // localStorage not available
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this._enabled.toString());
      localStorage.setItem(VOLUME_KEY, this._volume.toString());
    } catch {
      // localStorage not available
    }
  }

  private initSound(): void {
    if (this.sound) return;

    this.sound = new Howl({
      src: [musicFile],
      loop: true,
      volume: this._volume,
      html5: true, // Better for long audio files, streams without full download
      onplayerror: () => {
        // If autoplay is blocked, Howler will auto-unlock on next user interaction
        // and fire 'unlock' event - we listen for that to retry
        this.sound?.once("unlock", () => {
          if (this._enabled) {
            this.sound?.play();
          }
        });
      },
    });
  }

  /**
   * Try to start music if it was previously enabled (called on user interaction)
   */
  tryAutoStart(): void {
    if (this._enabled && !this.isActuallyPlaying()) {
      this.start();
    }
  }

  start(): void {
    this.initSound();
    if (!this.sound) return;

    this._enabled = true;
    this.saveSettings();

    if (!this.sound.playing()) {
      this.sound.play();
    }
  }

  stop(): void {
    this._enabled = false;
    this.saveSettings();

    if (this.sound) {
      this.sound.stop();
    }
  }

  toggle(): boolean {
    if (this._enabled) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  isActuallyPlaying(): boolean {
    return this.sound?.playing() ?? false;
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this.sound) {
      this.sound.volume(this._volume);
    }
    this.saveSettings();
  }

  getVolume(): number {
    return this._volume;
  }
}

// Singleton instance
export const musicManager = new MusicManager();
