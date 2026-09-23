import * as THREE from 'three';
import { audioSystem } from '../utils/AudioSystem.js';

export class CollisionSystem {
    constructor(track, playerCar, aiCars = []) {
        this.track = track;
        this.playerCar = playerCar;
        this.aiCars = aiCars;
    }

    update() {
        if (!this.playerCar) return;

        // 1. Player vs Track Boundary Walls
        if (this.track && this.track.boundaryBoxes) {
            this.track.boundaryBoxes.forEach(box => {
                if (box.intersectsBox(this.playerCar.boundingBox)) {
                    // Reduce speed and apply bounce displacement
                    this.playerCar.speed *= -0.4;
                    audioSystem.playCollisionSound();

                    // Push player car towards track center (0,0)
                    const pushDir = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), this.playerCar.position).normalize();
                    this.playerCar.position.addScaledVector(pushDir, 1.2);
                    this.playerCar.setPosition(this.playerCar.position.x, this.playerCar.position.y, this.playerCar.position.z);
                }
            });
        }

        // 2. Player vs AI Cars
        this.aiCars.forEach(ai => {
            const dist = this.playerCar.position.distanceTo(ai.position);
            const minAllowedDist = this.playerCar.boundingRadius + ai.boundingRadius;

            if (dist < minAllowedDist) {
                audioSystem.playCollisionSound();

                // Compute bounce direction vector
                const normal = new THREE.Vector3().subVectors(this.playerCar.position, ai.position).normalize();
                normal.y = 0; // Keep push horizontal

                const overlap = minAllowedDist - dist;

                // Separate positions
                this.playerCar.position.addScaledVector(normal, overlap * 0.6);
                ai.position.addScaledVector(normal, -overlap * 0.4);

                this.playerCar.setPosition(this.playerCar.position.x, this.playerCar.position.y, this.playerCar.position.z);
                ai.setPosition(ai.position.x, ai.position.y, ai.position.z);

                // Transfer velocity / momentum absorption
                this.playerCar.speed *= 0.5;
                ai.speed *= 0.6;
            }
        });
    }
}
