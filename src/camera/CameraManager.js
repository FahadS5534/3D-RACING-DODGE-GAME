import * as THREE from 'three';
import { lerp } from '../utils/MathUtils.js';

export const CAMERA_MODES = {
    CHASE: 0,
    HOOD: 1,
    TOPDOWN: 2
};

export class CameraManager {
    constructor(camera, targetVehicle) {
        this.camera = camera;
        this.targetVehicle = targetVehicle;
        this.currentMode = CAMERA_MODES.CHASE;

        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();

        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyC') {
                this.cycleCameraMode();
            }
        });
    }

    cycleCameraMode() {
        this.currentMode = (this.currentMode + 1) % 3;
        const modeNames = ['Chase Cam (3rd Person)', 'Hood Cam (1st Person)', 'Top-Down Cam'];
        console.log('Switched Camera Mode to:', modeNames[this.currentMode]);
        return modeNames[this.currentMode];
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    update(deltaTime) {
        if (!this.targetVehicle) return;

        const vehiclePos = this.targetVehicle.position;
        const vehicleRotY = this.targetVehicle.rotationY;

        // Forward and backward directional vectors relative to car facing direction
        const forwardX = -Math.sin(vehicleRotY);
        const forwardZ = -Math.cos(vehicleRotY);

        let idealPos = new THREE.Vector3();
        let idealLookAt = new THREE.Vector3();

        if (this.currentMode === CAMERA_MODES.CHASE) {
            // Chase Camera: Positioned 10 units behind, 4.5 units above car
            idealPos.x = vehiclePos.x - forwardX * 10;
            idealPos.y = vehiclePos.y + 4.5;
            idealPos.z = vehiclePos.z - forwardZ * 10;

            // Looking directly at player car hood
            idealLookAt.x = vehiclePos.x + forwardX * 3;
            idealLookAt.y = vehiclePos.y + 1.2;
            idealLookAt.z = vehiclePos.z + forwardZ * 3;
        } else if (this.currentMode === CAMERA_MODES.HOOD) {
            // Hood / Cockpit Camera
            idealPos.x = vehiclePos.x + forwardX * 0.2;
            idealPos.y = vehiclePos.y + 1.5;
            idealPos.z = vehiclePos.z + forwardZ * 0.2;

            idealLookAt.x = vehiclePos.x + forwardX * 20;
            idealLookAt.y = vehiclePos.y + 1.2;
            idealLookAt.z = vehiclePos.z + forwardZ * 20;
        } else if (this.currentMode === CAMERA_MODES.TOPDOWN) {
            // Top-Down Camera
            idealPos.x = vehiclePos.x;
            idealPos.y = vehiclePos.y + 40;
            idealPos.z = vehiclePos.z + 0.1;

            idealLookAt.copy(vehiclePos);
        }

        // Smooth position and lookAt interpolation (lerp)
        const lerpFactor = this.currentMode === CAMERA_MODES.HOOD ? 0.3 : 0.12;

        this.currentPos.x = lerp(this.camera.position.x, idealPos.x, lerpFactor);
        this.currentPos.y = lerp(this.camera.position.y, idealPos.y, lerpFactor);
        this.currentPos.z = lerp(this.camera.position.z, idealPos.z, lerpFactor);

        this.camera.position.copy(this.currentPos);

        this.currentLookAt.x = lerp(this.currentLookAt.x, idealLookAt.x, lerpFactor);
        this.currentLookAt.y = lerp(this.currentLookAt.y, idealLookAt.y, lerpFactor);
        this.currentLookAt.z = lerp(this.currentLookAt.z, idealLookAt.z, lerpFactor);

        this.camera.lookAt(this.currentLookAt);
    }
}
