import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager.js';
import { Lighting } from '../scene/Lighting.js';
import { Environment } from '../scene/Environment.js';
import { HandbuiltCar } from '../car/HandbuiltCar.js';
import { RoadEnvironment } from '../environment/RoadEnvironment.js';
import { ObstacleManager } from '../obstacles/ObstacleManager.js';
import { CoinManager } from '../collectibles/CoinManager.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { HUD } from '../ui/HUD.js';
import { MainMenu } from '../ui/MainMenu.js';
import { audioSystem } from '../utils/AudioSystem.js';

export const GAME_STATES = {
    MENU: 0,
    PLAYING: 1,
    GAMEOVER: 2
};

export const DIFFICULTY_SETTINGS = {
    EASY: { baseSpeed: 20, maxSpeed: 45, spawnRateMult: 1.2 },
    NORMAL: { baseSpeed: 25, maxSpeed: 58, spawnRateMult: 1.0 },
    HARD: { baseSpeed: 32, maxSpeed: 70, spawnRateMult: 0.8 }
};

export class GameManager {
    constructor(canvasContainer) {
        this.container = canvasContainer;
        this.state = GAME_STATES.MENU;

        // 1. Scene & Environment
        this.sceneMgr = new SceneManager(this.container);
        this.lighting = new Lighting(this.sceneMgr.scene);
        this.env = new Environment(this.sceneMgr.scene);

        // 2. Hand-Built Low-Poly Racing Car
        this.playerCar = new HandbuiltCar();
        this.playerCar.group.position.set(0, 0, 3.5);
        this.sceneMgr.scene.add(this.playerCar.group);

        // 3. Road & Scenery
        this.roadEnv = new RoadEnvironment(this.sceneMgr.scene);

        // 4. Obstacles & Collectibles
        this.obstacleMgr = new ObstacleManager(this.sceneMgr.scene);
        this.coinMgr = new CoinManager(this.sceneMgr.scene);

        // 5. Particle System
        this.particleSys = new ParticleSystem(this.sceneMgr.scene);

        // 6. Game Progression Parameters
        this.difficulty = 'NORMAL';
        this.baseSpeed = 25.0;
        this.maxRoadSpeed = 58.0;
        this.roadSpeed = 25.0;
        this.distance = 0;
        this.score = 0;
        this.coinsCollected = 0;

        // Nitro System
        this.nitroAmount = 100; // 0 to 100%
        this.isNitroActive = false;

        // Weather & Lighting State
        this.isNight = false;
        this.isRaining = false;

        // Active Challenge System
        this.challenges = [
            { id: 1, text: 'Collect 10 Coins', target: 10, type: 'coins', progress: 0, reward: 500, done: false },
            { id: 2, text: 'Survive 500m', target: 500, type: 'distance', progress: 0, reward: 500, done: false },
            { id: 3, text: 'Reach 150 KM/H', target: 150, type: 'speed', progress: 0, reward: 500, done: false }
        ];
        this.currentChallengeIndex = 0;

        // High Scores from localStorage
        this.loadHighScores();

        // Key states
        this.keys = { left: false, right: false, nitro: false };

        // 7. UI Controller
        this.hud = new HUD();
        this.mainMenu = new MainMenu({
            onStartGame: () => this.startGame(),
            onRestart: () => this.restartGame(),
            onCustomizationChange: (color, stripe, underglow) => {
                this.playerCar.setCustomization(color, stripe, underglow);
            },
            onDifficultyChange: (diff) => {
                this.setDifficulty(diff);
            }
        });

        this.initInputListeners();

        this.mainMenu.hideLoadingScreen();
        this.mainMenu.showStartMenu(this.highScores);
    }

    loadHighScores() {
        this.highScores = {
            bestScore: parseInt(localStorage.getItem('racing_dodge_bestScore') || '0', 10),
            bestDistance: parseInt(localStorage.getItem('racing_dodge_bestDistance') || '0', 10),
            bestCoins: parseInt(localStorage.getItem('racing_dodge_bestCoins') || '0', 10)
        };
    }

    saveHighScores() {
        const isNewBest = this.score > this.highScores.bestScore;
        if (isNewBest) this.highScores.bestScore = Math.floor(this.score);
        if (this.distance > this.highScores.bestDistance) this.highScores.bestDistance = Math.floor(this.distance);
        if (this.coinsCollected > this.highScores.bestCoins) this.highScores.bestCoins = this.coinsCollected;

        localStorage.setItem('racing_dodge_bestScore', this.highScores.bestScore.toString());
        localStorage.setItem('racing_dodge_bestDistance', this.highScores.bestDistance.toString());
        localStorage.setItem('racing_dodge_bestCoins', this.highScores.bestCoins.toString());

        return isNewBest;
    }

    setDifficulty(diffKey) {
        if (DIFFICULTY_SETTINGS[diffKey]) {
            this.difficulty = diffKey;
            const cfg = DIFFICULTY_SETTINGS[diffKey];
            this.baseSpeed = cfg.baseSpeed;
            this.maxRoadSpeed = cfg.maxSpeed;
            console.log('Difficulty changed to:', diffKey);
        }
    }

    initInputListeners() {
        window.addEventListener('keydown', (e) => {
            const code = e.code;
            if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
            if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
            if (code === 'Space') this.keys.nitro = true;

            // Day / Night Toggle ('N')
            if (code === 'KeyN') {
                this.isNight = !this.isNight;
                this.lighting.setNightMode(this.isNight);
                this.env.setNightMode(this.isNight);
                this.roadEnv.setNightMode(this.isNight);
            }

            // Weather Toggle ('M')
            if (code === 'KeyM') {
                this.isRaining = !this.isRaining;
                this.particleSys.setRain(this.isRaining);
                this.roadEnv.setWetRoad(this.isRaining);
            }
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code;
            if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
            if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
            if (code === 'Space') this.keys.nitro = false;
        });
    }

    startGame() {
        audioSystem.init();

        const cfg = DIFFICULTY_SETTINGS[this.difficulty];
        this.baseSpeed = cfg.baseSpeed;
        this.maxRoadSpeed = cfg.maxSpeed;
        this.roadSpeed = this.baseSpeed;

        this.distance = 0;
        this.score = 0;
        this.coinsCollected = 0;
        this.nitroAmount = 100;
        this.isNitroActive = false;

        this.playerCar.reset();
        this.obstacleMgr.reset();
        this.coinMgr.reset();

        // Reset challenges
        this.challenges.forEach(c => { c.progress = 0; c.done = false; });
        this.currentChallengeIndex = 0;

        this.state = GAME_STATES.PLAYING;
        this.mainMenu.hideAllScreens();
    }

    restartGame() {
        this.startGame();
    }

    handleCoinPickup() {
        this.coinsCollected++;
        this.score += 100;
        audioSystem.playCountdownBeep(true); // Pickup chime
        this.hud.showFloatingIndicator('+100 COIN!');

        // Challenge check
        const ch = this.challenges[this.currentChallengeIndex];
        if (ch && ch.type === 'coins' && !ch.done) {
            ch.progress++;
            if (ch.progress >= ch.target) {
                ch.done = true;
                this.score += ch.reward;
                this.hud.showFloatingIndicator('✓ CHALLENGE COMPLETE! +500');
            }
        }
    }

    handleCrash() {
        this.state = GAME_STATES.GAMEOVER;
        audioSystem.playCollisionSound();

        // Emit crash debris
        this.particleSys.emitCrashDebris(this.playerCar.group.position);

        const isNewBest = this.saveHighScores();

        const finalScore = Math.floor(this.score);
        const finalDistance = Math.floor(this.distance);

        this.mainMenu.showGameOver(finalScore, finalDistance, this.coinsCollected, this.highScores.bestScore, isNewBest);
    }

    update(deltaTime) {
        if (this.state === GAME_STATES.MENU) {
            this.roadEnv.update(deltaTime, 15.0);
            this.sceneMgr.camera.position.set(0, 4.5, 12.0);
            this.sceneMgr.camera.lookAt(0, 1.0, -3.0);
        }

        if (this.state === GAME_STATES.PLAYING) {
            // 1. Nitro Boost handling
            if (this.keys.nitro && this.nitroAmount > 0) {
                this.isNitroActive = true;
                this.nitroAmount = Math.max(0, this.nitroAmount - 30 * deltaTime);

                // Nitro exhaust flames
                const exhaust = this.playerCar.getExhaustPositions();
                this.particleSys.emitNitroFlames(exhaust.left, exhaust.right);
            } else {
                this.isNitroActive = false;
                // Recharge nitro slowly
                this.nitroAmount = Math.min(100, this.nitroAmount + 6 * deltaTime);
            }

            // 2. Road Speed progression
            let targetSpeed = this.baseSpeed + (this.distance * 0.015);
            if (this.isNitroActive) {
                targetSpeed += 25.0; // Boost speed!
            }
            this.roadSpeed = Math.min(this.maxRoadSpeed + (this.isNitroActive ? 25 : 0), targetSpeed);

            // 3. Accumulate distance & score
            this.distance += this.roadSpeed * deltaTime * 0.6;
            this.score += this.roadSpeed * deltaTime * 0.6;

            // 4. Challenge updates
            const ch = this.challenges[this.currentChallengeIndex];
            if (ch && !ch.done) {
                if (ch.type === 'distance') {
                    ch.progress = Math.floor(this.distance);
                    if (ch.progress >= ch.target) {
                        ch.done = true;
                        this.score += ch.reward;
                        this.hud.showFloatingIndicator('✓ CHALLENGE COMPLETE! +500');
                    }
                } else if (ch.type === 'speed') {
                    const kmh = Math.round(this.roadSpeed * 3.2);
                    if (kmh >= ch.target) {
                        ch.done = true;
                        this.score += ch.reward;
                        this.hud.showFloatingIndicator('✓ CHALLENGE COMPLETE! +500');
                    }
                }
            }

            // 5. Update Player Car (horizontal movement, tilt, smoke)
            this.playerCar.update(deltaTime, this.keys.left, this.keys.right, this.roadSpeed, this.particleSys);

            // 6. Update Road & Scenery Scrolling
            this.roadEnv.update(deltaTime, this.roadSpeed);

            // 7. Update Obstacles & Collectibles
            this.obstacleMgr.update(deltaTime, this.roadSpeed, true);
            this.coinMgr.update(deltaTime, this.roadSpeed, true);

            // 8. Coin Pickup Check
            this.coinMgr.checkPlayerCollection(this.playerCar.group, () => {
                this.handleCoinPickup();
            });

            // 9. Obstacle Collision Check
            if (this.obstacleMgr.checkPlayerCollision(this.playerCar.group)) {
                this.handleCrash();
            }

            // 10. Update Particle System (Rain, smoke, flames)
            this.particleSys.update(deltaTime, this.roadSpeed);

            // 11. Camera Follow & Dynamic FOV Expansion
            const targetCamX = this.playerCar.group.position.x * 0.45;
            this.sceneMgr.camera.position.x = THREE.MathUtils.lerp(this.sceneMgr.camera.position.x, targetCamX, 0.15);
            this.sceneMgr.camera.position.y = 4.5;
            this.sceneMgr.camera.position.z = 12.0;

            const targetFOV = this.isNitroActive ? 78 : 60;
            this.sceneMgr.camera.fov = THREE.MathUtils.lerp(this.sceneMgr.camera.fov, targetFOV, 0.1);
            this.sceneMgr.camera.updateProjectionMatrix();

            const lookTargetX = this.playerCar.group.position.x * 0.6;
            this.sceneMgr.camera.lookAt(lookTargetX, 1.0, -3.0);

            // 12. Audio Engine Pitch
            const speedRatio = this.roadSpeed / (this.maxRoadSpeed + 25);
            audioSystem.updateEngineSound(speedRatio, true);

            // 13. HUD Updates
            const kmh = Math.round(this.roadSpeed * 3.2);
            this.hud.updateGameplayInfo(
                Math.floor(this.score),
                Math.floor(this.distance),
                kmh,
                this.coinsCollected,
                this.nitroAmount,
                ch ? `${ch.text} (${ch.done ? 'DONE' : ch.progress + '/' + ch.target})` : ''
            );
        }

        // Render WebGL Scene
        this.sceneMgr.render();
    }
}
