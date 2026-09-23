/**
 * Main Menu & Modals Controller
 */
export class MainMenu {
    constructor(callbacks = {}) {
        this.callbacks = callbacks;

        this.currentColor = 0xeb3b5a;
        this.currentStripe = null;
        this.isUnderglow = false;

        this.initDOMElements();
        this.bindEvents();
    }

    initDOMElements() {
        this.screenLoading = document.getElementById('screen-loading');
        this.screenStart = document.getElementById('screen-start-menu');
        this.screenGameOver = document.getElementById('screen-game-over');
        this.modalGarage = document.getElementById('modal-garage');
        this.modalSettings = document.getElementById('modal-settings');

        this.elFinalScore = document.getElementById('final-score');
        this.elFinalDistance = document.getElementById('final-distance');
        this.elFinalCoins = document.getElementById('final-coins');
        this.elBestScore = document.getElementById('final-best-score');
        this.elNewBestBadge = document.getElementById('badge-new-best');

        this.elStartBestScore = document.getElementById('start-best-score');
    }

    bindEvents() {
        document.getElementById('btn-start-game')?.addEventListener('click', () => {
            this.hideAllScreens();
            if (this.callbacks.onStartGame) this.callbacks.onStartGame();
        });

        document.getElementById('btn-garage')?.addEventListener('click', () => {
            this.showModal(this.modalGarage);
        });

        document.getElementById('btn-settings')?.addEventListener('click', () => {
            this.showModal(this.modalSettings);
        });

        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModals();
            });
        });

        document.getElementById('btn-restart')?.addEventListener('click', () => {
            this.hideAllScreens();
            if (this.callbacks.onRestart) this.callbacks.onRestart();
        });

        document.getElementById('btn-finish-garage')?.addEventListener('click', () => {
            this.showModal(this.modalGarage);
        });

        // Car Paint Color Selectors
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.currentColor = parseInt(swatch.getAttribute('data-color'), 16);
                this.notifyCustomization();
            });
        });

        // Stripe Selectors
        document.querySelectorAll('.stripe-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                document.querySelectorAll('.stripe-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const val = opt.getAttribute('data-stripe');
                this.currentStripe = val === 'none' ? null : parseInt(val, 16);
                this.notifyCustomization();
            });
        });

        // Underglow Toggle
        document.getElementById('chk-underglow')?.addEventListener('change', (e) => {
            this.isUnderglow = e.target.checked;
            this.notifyCustomization();
        });

        // Difficulty Selectors
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const diff = btn.getAttribute('data-diff');
                if (this.callbacks.onDifficultyChange) {
                    this.callbacks.onDifficultyChange(diff);
                }
            });
        });
    }

    notifyCustomization() {
        if (this.callbacks.onCustomizationChange) {
            this.callbacks.onCustomizationChange(this.currentColor, this.currentStripe, this.isUnderglow);
        }
    }

    hideLoadingScreen() {
        if (this.screenLoading) this.screenLoading.style.display = 'none';
    }

    showStartMenu(highScores) {
        this.hideAllScreens();
        if (this.elStartBestScore && highScores) {
            this.elStartBestScore.innerText = highScores.bestScore;
        }
        if (this.screenStart) this.screenStart.style.display = 'flex';
    }

    showGameOver(score, distance, coins, bestScore, isNewBest) {
        if (this.elFinalScore) this.elFinalScore.innerText = score;
        if (this.elFinalDistance) this.elFinalDistance.innerText = `${distance} m`;
        if (this.elFinalCoins) this.elFinalCoins.innerText = coins;
        if (this.elBestScore) this.elBestScore.innerText = bestScore;

        if (this.elNewBestBadge) {
            this.elNewBestBadge.style.display = isNewBest ? 'inline-block' : 'none';
        }

        this.hideAllScreens();
        if (this.screenGameOver) this.screenGameOver.style.display = 'flex';
    }

    showModal(modalEl) {
        this.hideModals();
        if (modalEl) modalEl.style.display = 'flex';
    }

    hideModals() {
        if (this.modalGarage) this.modalGarage.style.display = 'none';
        if (this.modalSettings) this.modalSettings.style.display = 'none';
    }

    hideAllScreens() {
        if (this.screenLoading) this.screenLoading.style.display = 'none';
        if (this.screenStart) this.screenStart.style.display = 'none';
        if (this.screenGameOver) this.screenGameOver.style.display = 'none';
        this.hideModals();
    }
}
