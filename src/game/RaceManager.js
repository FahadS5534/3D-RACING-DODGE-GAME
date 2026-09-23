import { audioSystem } from '../utils/AudioSystem.js';

export class RaceManager {
    constructor(timer, maxLaps = 3) {
        this.timer = timer;
        this.maxLaps = maxLaps;

        this.currentLap = 1;
        this.playerCheckpointIndex = 0;
        this.playerPosition = 1;
        this.totalRacers = 3;

        this.isRaceStarted = false;
        this.isRaceFinished = false;
        this.isCountdown = false;
        this.countdownValue = 3;
        this.countdownTimer = 0;
    }

    startCountdown(onCountdownComplete) {
        this.isCountdown = true;
        this.countdownValue = 3;
        this.countdownTimer = 0;
        this.onCountdownComplete = onCountdownComplete;

        audioSystem.playCountdownBeep(false);
    }

    updateCountdown(deltaTime) {
        if (!this.isCountdown) return;

        this.countdownTimer += deltaTime;
        if (this.countdownTimer >= 1.0) {
            this.countdownTimer -= 1.0;
            this.countdownValue--;

            if (this.countdownValue > 0) {
                audioSystem.playCountdownBeep(false);
            } else if (this.countdownValue === 0) {
                audioSystem.playCountdownBeep(true); // High GO! beep
                this.isCountdown = false;
                this.isRaceStarted = true;
                this.timer.start();

                if (this.onCountdownComplete) {
                    this.onCountdownComplete();
                }
            }
        }
    }

    onPlayerLapComplete() {
        if (this.isRaceFinished) return;

        this.timer.onLapComplete();

        if (this.currentLap >= this.maxLaps) {
            // Race Finished!
            this.isRaceFinished = true;
            this.isRaceStarted = false;
            this.timer.stop();
            console.log('Player finished race in position:', this.playerPosition);
        } else {
            this.currentLap++;
        }
    }

    calculatePositions(playerCar, aiCars = []) {
        if (!playerCar) return;

        // Compute progress score for each racer
        // Player progress:
        const playerScore = (this.currentLap * 1000) + (this.playerCheckpointIndex * 100);

        const racers = [
            { id: 'player', score: playerScore }
        ];

        aiCars.forEach(ai => {
            const aiScore = (ai.currentLap * 1000) + (ai.completedCheckpoints * 100) - (ai.distanceToNextWaypoint * 0.1);
            racers.push({ id: ai.name, score: aiScore });
        });

        // Sort descending
        racers.sort((a, b) => b.score - a.score);

        // Find player rank
        const playerRank = racers.findIndex(r => r.id === 'player') + 1;
        this.playerPosition = playerRank > 0 ? playerRank : 1;
    }

    reset() {
        this.currentLap = 1;
        this.playerCheckpointIndex = 0;
        this.playerPosition = 1;
        this.isRaceStarted = false;
        this.isRaceFinished = false;
        this.isCountdown = false;
        this.countdownValue = 3;
        this.timer.reset();
    }
}
