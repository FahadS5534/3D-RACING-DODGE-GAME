/**
 * Web Audio API synthesizer for engine audio, countdown beeps, and collision sounds.
 */

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.engineOsc = null;
        this.engineGain = null;
        this.isMuted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // Engine sound oscillator
            this.engineOsc = this.ctx.createOscillator();
            this.engineGain = this.ctx.createGain();

            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.setValueAtTime(40, this.ctx.currentTime); // Pitch
            this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime); // Volume low initially

            // Lowpass filter for deep engine rumble
            this.filter = this.ctx.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.setValueAtTime(300, this.ctx.currentTime);

            this.engineOsc.connect(this.filter);
            this.filter.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);

            this.engineOsc.start();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    updateEngineSound(speedRatio, isAccelerating) {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const targetFreq = 40 + Math.abs(speedRatio) * 160 + (isAccelerating ? 25 : 0);
        const targetVol = Math.abs(speedRatio) > 0.01 ? Math.min(0.08 + Math.abs(speedRatio) * 0.12, 0.25) : 0.03;

        const now = this.ctx.currentTime;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
        this.engineGain.gain.setTargetAtTime(targetVol, now, 0.1);
        if (this.filter) {
            this.filter.frequency.setTargetAtTime(200 + Math.abs(speedRatio) * 600, now, 0.1);
        }
    }

    playCountdownBeep(isHigh = false) {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isHigh ? 880 : 440, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playCollisionSound() {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
}

export const audioSystem = new AudioSystem();
