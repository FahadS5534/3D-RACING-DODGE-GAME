/**
 * Enhanced HUD Controller
 */
export class HUD {
    constructor() {
        this.elScore = document.getElementById('hud-score');
        this.elDistance = document.getElementById('hud-distance');
        this.elSpeed = document.getElementById('hud-speed');
        this.elCoins = document.getElementById('hud-coins');
        this.elNitroBar = document.getElementById('hud-nitro-bar');
        this.elChallenge = document.getElementById('hud-challenge-text');
        this.elFloating = document.getElementById('hud-floating-popup');
    }

    updateGameplayInfo(score, distance, speedKMH, coins, nitroPercent, challengeText) {
        if (this.elScore) this.elScore.innerText = score;
        if (this.elDistance) this.elDistance.innerText = `${distance} m`;
        if (this.elSpeed) this.elSpeed.innerText = speedKMH;
        if (this.elCoins) this.elCoins.innerText = coins;

        if (this.elNitroBar) {
            this.elNitroBar.style.width = `${Math.max(0, Math.min(100, nitroPercent))}%`;
        }

        if (this.elChallenge) {
            this.elChallenge.innerText = challengeText;
        }
    }

    showFloatingIndicator(text) {
        if (!this.elFloating) return;
        this.elFloating.innerText = text;
        this.elFloating.className = 'floating-popup show';

        clearTimeout(this.popTimeout);
        this.popTimeout = setTimeout(() => {
            this.elFloating.className = 'floating-popup';
        }, 1000);
    }
}
