import { formatTime } from '../utils/MathUtils.js';

export class Timer {
    constructor() {
        this.reset();
    }

    reset() {
        this.isRunning = false;
        this.totalTime = 0;
        this.currentLapTime = 0;
        this.bestLapTime = null;
        this.lapTimes = [];
    }

    start() {
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        this.totalTime += deltaTime;
        this.currentLapTime += deltaTime;
    }

    onLapComplete() {
        this.lapTimes.push(this.currentLapTime);

        if (this.bestLapTime === null || this.currentLapTime < this.bestLapTime) {
            this.bestLapTime = this.currentLapTime;
        }

        const completedLapTime = this.currentLapTime;
        this.currentLapTime = 0;
        return completedLapTime;
    }

    getFormattedTotalTime() {
        return formatTime(this.totalTime);
    }

    getFormattedCurrentLapTime() {
        return formatTime(this.currentLapTime);
    }

    getFormattedBestLapTime() {
        return this.bestLapTime !== null ? formatTime(this.bestLapTime) : '--:--.--';
    }
}
