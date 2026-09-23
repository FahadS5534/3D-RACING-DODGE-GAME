import * as THREE from 'three';
import { GameManager } from './game/GameManager.js';

let gameManager = null;
let clock = null;

function init() {
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Canvas container element not found!');
        return;
    }

    // Initialize Clock for delta time calculation
    clock = new THREE.Clock();

    // Create Game Manager
    gameManager = new GameManager(container);

    // Start Main Render & Animation Loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (gameManager && clock) {
        const deltaTime = clock.getDelta();
        gameManager.update(deltaTime);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    init();
});
