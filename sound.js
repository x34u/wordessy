/**
 * Wordyssey - Procedural Web Audio API Sound Synthesizer
 * -------------------------------------------------------------
 * Fully self-contained audio synthesis engine with zero audio files,
 * zero external dependencies, and zero 404 network errors.
 * Provides custom sound effects (SFX) and a procedural chiptune
 * background music synthesizer with mute & volume controls.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.isMuted = false;
    this.isMusicMuted = false;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.35;

    // Background music tracking
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.currentNoteIndex = 0;
    this.tempo = 140; // BPM

    // Track audio context state
    this.isInitialized = false;
  }

  /**
   * Initializes the Web Audio Context after user interaction.
   * Browsers require a user gesture (click/key) before playing sound.
   */
  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('Web Audio API is not supported in this browser.');
        return;
      }
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
    }
  }

  /** Ensure audio context is awake */
  resume() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Toggle master mute state */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 1;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  /** Toggle music mute state */
  toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.musicGain && this.ctx) {
      const targetGain = this.isMusicMuted ? 0 : this.musicVolume;
      this.musicGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMusicMuted;
  }

  /* =====================================================================
     PROCEDURAL SOUND EFFECTS (SFX)
     ===================================================================== */

  /**
   * Wordi's Bark / Star Projectile Shot:
   * A cheerful, high-energy acoustic pop and chirping laser burst.
   */
  playBark() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Frequency pitch drops fast like a bouncy dog bark
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.16);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  /**
   * Jump sound:
   * Playful rising sweep.
   */
  playJump() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  /**
   * Star / Coin Pickup:
   * Sparkly two-tone chime arpeggio (E6 -> B6).
   */
  playPickupStar() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [1318.5, 1975.5]; // E6, B6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
    });
  }

  /**
   * Power-up Pickup / Rare Treasure:
   * Victorious 4-note ascending major arpeggio.
   */
  playPowerup() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  /**
   * Enemy Defeated / Squash Sound:
   * Satisfying crunch pop and noise burst.
   */
  playEnemyDefeat() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Pop Oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);

    oscGain.gain.setValueAtTime(0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);

    // Noise burst crunch
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.Q.setValueAtTime(1.5, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);
    } catch (_) {}
  }

  /**
   * Player Hurt / Damage:
   * Low discordant thud with quick distortion.
   */
  playPlayerHurt() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.22);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Correct Word Quiz Answer:
   * Triumphant double ding (C6 -> G6) with long sustain.
   */
  playCorrectWord() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [1046.5, 1567.98]; // C6, G6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.4, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.38);
    });
  }

  /**
   * Wrong Word Quiz Answer:
   * Soft wobbling buzz.
   */
  playWrongWord() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Wave / Stage Clear Fanfare:
   * Uplifting celebratory progression.
   */
  playStageClear() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.35 }  // C6
    ];

    let offset = 0;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + offset;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, noteTime);

      gain.gain.setValueAtTime(0.01, noteTime);
      gain.gain.linearRampToValueAtTime(0.4, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + note.d + 0.05);

      offset += note.d * 0.9;
    });
  }

  /**
   * Game Over:
   * Melancholic descending sequence.
   */
  playGameOver() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const melody = [
      { f: 587.33, d: 0.25 }, // D5
      { f: 523.25, d: 0.25 }, // C5
      { f: 493.88, d: 0.25 }, // B4
      { f: 440.00, d: 0.6 }   // A4
    ];

    let offset = 0;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + offset;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, noteTime);

      gain.gain.setValueAtTime(0.01, noteTime);
      gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + note.d + 0.05);

      offset += note.d;
    });
  }

  /* =====================================================================
     PROCEDURAL CHIPTUNE BACKGROUND MUSIC ENGINE
     ===================================================================== */

  /**
   * Starts procedural background chiptune loop.
   * Plays a catchy, upbeat melody in the Pentatonic Major scale.
   */
  startMusic() {
    if (this.isPlayingMusic) return;
    this.init();
    this.isPlayingMusic = true;
    this.currentNoteIndex = 0;
    this.scheduleNextMusicBar();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  scheduleNextMusicBar() {
    if (!this.isPlayingMusic || !this.ctx) return;

    // 16-step upbeat chiptune melody (Key of C / G Major)
    // Numbers represent note frequencies
    const melodyTrack = [
      523.25, 0, 659.25, 783.99,  // C5, -, E5, G5
      880.00, 783.99, 659.25, 0,  // A5, G5, E5, -
      523.25, 587.33, 659.25, 0,  // C5, D5, E5, -
      783.99, 659.25, 587.33, 523.25 // G5, E5, D5, C5
    ];

    // Bassline (octave down root and fifth)
    const bassTrack = [
      261.63, 0, 261.63, 0,
      392.00, 0, 392.00, 0,
      329.63, 0, 329.63, 0,
      261.63, 0, 392.00, 0
    ];

    const stepDuration = 60 / this.tempo / 2; // 16th note timing
    const step = this.currentNoteIndex % melodyTrack.length;
    const now = this.ctx.currentTime;

    // Melody note
    const melFreq = melodyTrack[step];
    if (melFreq > 0 && !this.isMusicMuted && !this.isMuted) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(melFreq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + stepDuration);
    }

    // Bass note
    const bassFreq = bassTrack[step];
    if (bassFreq > 0 && !this.isMusicMuted && !this.isMuted) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq / 2, now); // Deep warm sub-bass

      bassGain.gain.setValueAtTime(0.01, now);
      bassGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + stepDuration);
    }

    this.currentNoteIndex++;

    // Schedule next beat
    const nextIntervalMs = stepDuration * 1000;
    this.musicTimer = setTimeout(() => {
      this.scheduleNextMusicBar();
    }, nextIntervalMs);
  }
}

// Global singleton instance for easy access across the game
window.sound = new SoundEngine();
